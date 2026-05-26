import { dbDataStore, PaymentInvoice } from '../database';
import { WorkspaceStateService } from './WorkspaceStateService';

export interface IPaymentGateway {
  name: string;
  processPayment(amount: number, currency: string, reference: string): Promise<{ success: boolean; rawResponse: any }>;
  verifyTransaction(reference: string): Promise<{ success: boolean; rawResponse: any }>;
}

/**
 * ManualPaymentGateway accepts administrative confirmations of physical bank transfers
 */
export class ManualPaymentGateway implements IPaymentGateway {
  name = 'MANUAL';

  async processPayment(amount: number, currency: string, reference: string) {
    return {
      success: true,
      rawResponse: { gateway: 'MANUAL', action: 'INITIATED', reference, amount, currency, timestamp: new Date().toISOString() }
    };
  }

  async verifyTransaction(reference: string) {
    return {
      success: true,
      rawResponse: { gateway: 'MANUAL', status: 'VERIFIED_OK', reference, timestamp: new Date().toISOString() }
    };
  }
}

export class PaymentService {
  private static gateway: IPaymentGateway = new ManualPaymentGateway();

  /**
   * Generates a payment request (invoice) for a project
   * @param projectId UUID of project
   * @param amount Numeric project invoice cost
   * @param currency NGN or international currency equivalents
   * @param details Custom invoice descriptor
   */
  static async generate(
    projectId: string,
    amount: number,
    currency: string = 'NGN',
    details: string = 'Operational Project Chamber Access Clearance'
  ): Promise<PaymentInvoice> {
    const project = await dbDataStore.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const reference = `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const invoice = await dbDataStore.createPaymentInvoice({
      projectId,
      amount,
      currency,
      description: details,
      paymentType: 'PROJECT_FEE',
      status: 'PENDING'
    });

    // Update payment reference
    await dbDataStore.updatePaymentStatus(invoice.id, 'PENDING', undefined, { reference });
    const updated = await dbDataStore.getPaymentById(invoice.id);

    await dbDataStore.addAuditLog({
      action: 'PAYMENT_GENERATED',
      targetType: 'payment',
      targetId: invoice.id,
      metadata: { projectId, amount, currency },
      ipAddress: '127.0.0.1'
    });

    return updated!;
  }

  /**
   * Verifies a client payment invoice manually or via gateway webhook
   */
  static async verify(
    paymentId: string,
    verifierId?: string,
    gatewayResponse: any = {}
  ): Promise<PaymentInvoice> {
    const payment = await dbDataStore.getPaymentById(paymentId);
    if (!payment) {
      throw new Error(`Payment reference ${paymentId} not found`);
    }

    const verification = await this.gateway.verifyTransaction(payment.paymentReference || paymentId);
    const successResponse = { ...gatewayResponse, ...verification.rawResponse };

    const updated = await dbDataStore.updatePaymentStatus(
      paymentId,
      'VERIFIED',
      verifierId,
      successResponse
    );

    if (!updated) {
      throw new Error('Could not update payment verifications statuses');
    }

    await dbDataStore.addAuditLog({
      actorId: verifierId,
      action: 'PAYMENT_VERIFIED',
      targetType: 'payment',
      targetId: paymentId,
      metadata: { projectId: updated.projectId, amount: updated.amount, reference: updated.paymentReference },
      ipAddress: '127.0.0.1'
    });

    // Automatical state machine trigger
    await WorkspaceStateService.syncFromPayment(updated.projectId);

    return updated;
  }

  /**
   * Admin updates payment status manually inside administrative dashboards
   */
  static async updateStatus(
    paymentId: string,
    status: 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'FAILED' | 'REFUNDED',
    verifierId?: string,
    reason?: string
  ): Promise<PaymentInvoice> {
    const payment = await dbDataStore.getPaymentById(paymentId);
    if (!payment) {
      throw new Error(`Payment invoice ${paymentId} not found`);
    }

    const updated = await dbDataStore.updatePaymentStatus(
      paymentId,
      status,
      verifierId,
      { reason, timestamp: new Date().toISOString() }
    );

    if (!updated) {
       throw new Error(`State machine error during manual update`);
    }

    await dbDataStore.addAuditLog({
      actorId: verifierId,
      action: 'PAYMENT_STATUS_MANUAL_TRANSITION',
      targetType: 'payment',
      targetId: paymentId,
      metadata: { status, reason },
      ipAddress: '127.0.0.1'
    });

    // Automatically trigger Workspace state synchronizer on status transition!
    await WorkspaceStateService.syncFromPayment(updated.projectId);

    return updated;
  }
}
