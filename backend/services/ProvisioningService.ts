import { dbDataStore } from '../database';
import bcrypt from 'bcryptjs';

export class ProvisioningService {

  /**
   * Automatically and atomically approves an inquiry, converts it to a project chamber,
   * registers the workspace user, seeds 4 milestones, provisions the locked room, and generates an invoice.
   */
  static async approveProject(inquiryId: string, verifierId?: string): Promise<any> {
    return await dbDataStore.txn(async () => {
      // 1. Fetch and update inquiry to 'CONVERTED'
      const inquiry = await dbDataStore.getInquiryById(inquiryId);
      if (!inquiry) {
        throw new Error(`Operational Inquiry ${inquiryId} check failure: ticket not found`);
      }
      
      if (inquiry.status === 'CONVERTED') {
        throw new Error(`Operational Inquiry ${inquiryId} is already converted into an active workspace`);
      }

      await dbDataStore.updateInquiryStatus(inquiryId, 'CONVERTED', verifierId || 'adm-sys', 'Project Approved & Chamber Provisioned');

      // 2. Register Workspace Client User (using email & name from inquiry)
      const claimToken = `GNT-ONB-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      const firstWord = inquiry.name.split(' ')[0].toUpperCase();
      const clientAlias = `OPERATOR-${firstWord}-${Math.floor(100 + Math.random() * 899)}`;
      
      // Seed temporary password
      const tempPass = 'password123';
      const clientUser = await dbDataStore.registerWorkspaceUser({
        email: inquiry.email,
        passwordPlain: tempPass,
        name: inquiry.name,
        alias: clientAlias,
        onboardingToken: claimToken,
        onboardingTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 Hours
        role: 'CLIENT',
        organization: inquiry.organization
      });

      // 3. Create the Project
      const projectCode = `GLT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const project = await dbDataStore.createProject({
        name: `${inquiry.organization || 'Tactical Deploy'} - Secure Chamber`,
        title: `${inquiry.organization || 'Tactical Deploy'} - Secure Chamber`,
        description: `Project setup for ${inquiry.inquiryType || 'Custom Consult'}. Details: ${inquiry.message}`,
        clientId: clientUser.id,
        inquiryId: inquiryId,
        projectCode,
        status: 'PENDING'
      });

      // 4. Create the Workspace Room state machine
      const room = await dbDataStore.createWorkspaceRoom({
        projectId: project.id,
        state: 'LOCKED' // Locked until initial financial payment contract verifies
      });

      // 5. Generate Project Fee standard payment contract (Invoice)
      // Estimate NGN amount (default 125,000 NGN)
      const chargeAmount = 125000;
      const invoice = await dbDataStore.createPaymentInvoice({
        projectId: project.id,
        inquiryId,
        amount: chargeAmount,
        currency: 'NGN',
        description: `Provisioning Hardware Allocation Charge for: ${inquiry.inquiryType || 'Strategic Tech Deployment'}`,
        onboardingTokenGenerated: claimToken,
        status: 'PENDING',
        paymentType: 'PROJECT_FEE'
      });

      // 6. Delete default seeded milestones in project and override with explicitly detailed 4 milestones
      // (database.ts creates them for projects created without status, so we ensure they are fully set here)
      // Let's explicitly seed the 4 milestones specified by architectural requirements:
      const existingMilestones = await dbDataStore.getMilestones(project.id);
      // Clean them up to avoid duplicates
      existingMilestones.forEach(m => {
        // Simple internal delete
        const id = m.id;
        const list = (dbDataStore as any).milestones;
        if (list) {
          (dbDataStore as any).milestones = list.filter((item: any) => item.id !== id);
        }
      });

      const milestoneItems = [
        { title: 'Chamber Configuration Setup', orderIndex: 0, status: 'COMPLETED', threadState: 'UNLOCKED' },
        { title: 'Quantum Encryption Link Realized', orderIndex: 1, status: 'PENDING', threadState: 'LOCKED' },
        { title: 'Tactical Hardware Delivery Clearance', orderIndex: 2, status: 'PENDING', threadState: 'LOCKED' },
        { title: 'Final Handover of Operation Node', orderIndex: 3, status: 'PENDING', threadState: 'LOCKED' }
      ];

      for (const item of milestoneItems) {
        await dbDataStore.createMilestone({
          projectId: project.id,
          title: item.title,
          orderIndex: item.orderIndex,
          status: item.status as any,
          threadState: item.threadState as any
        });
      }

      // Add audit logging records
      await dbDataStore.addAuditLog({
        actorId: verifierId,
        action: 'PROJECT_PROVISION_SUCCESS',
        targetType: 'project',
        targetId: project.id,
        metadata: { clientId: clientUser.id, roomState: 'LOCKED', paymentId: invoice.id, claimToken }
      });

      return {
        success: true,
        projectCode,
        claimToken,
        clientUser: {
          id: clientUser.id,
          email: clientUser.email,
          alias: clientUser.alias,
          tempPassword: 'password123'
        },
        project: {
          id: project.id,
          title: project.title,
          status: project.status
        },
        invoice: {
          id: invoice.id,
          amount: invoice.amount
        }
      };
    });
  }

  /**
   * Idempotent failed provisioning checker / restorer. Reconfigures rooms or invoices.
   */
  static async reprovisionProject(projectId: string): Promise<any> {
    const project = await dbDataStore.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    let room = await dbDataStore.getWorkspaceRoomByProjectId(projectId);
    if (!room) {
      room = await dbDataStore.createWorkspaceRoom({ projectId, state: 'LOCKED' });
    }

    const milestones = await dbDataStore.getMilestones(projectId);
    if (milestones.length === 0) {
      const milestoneItems = [
        { title: 'Chamber Configuration Setup', orderIndex: 0, status: 'COMPLETED', threadState: 'UNLOCKED' },
        { title: 'Quantum Encryption Link Realized', orderIndex: 1, status: 'PENDING', threadState: 'LOCKED' },
        { title: 'Tactical Hardware Delivery Clearance', orderIndex: 2, status: 'PENDING', threadState: 'LOCKED' },
        { title: 'Final Handover of Operation Node', orderIndex: 3, status: 'PENDING', threadState: 'LOCKED' }
      ];

      for (const item of milestoneItems) {
        await dbDataStore.createMilestone({
          projectId,
          title: item.title,
          orderIndex: item.orderIndex,
          status: item.status as any,
          threadState: item.threadState as any
        });
      }
    }

    const payments = await dbDataStore.getPayments(projectId);
    if (payments.length === 0) {
      await dbDataStore.createPaymentInvoice({
        projectId,
        amount: 125000,
        currency: 'NGN',
        description: 'Reprovisioned Project Access Fee',
        status: 'PENDING',
        paymentType: 'PROJECT_FEE'
      });
    }

    await dbDataStore.addAuditLog({
      action: 'PROJECT_REPROVISIONED',
      targetType: 'project',
      targetId: projectId,
      metadata: { timestamp: new Date() }
    });

    return {
      success: true,
      projectId,
      roomState: room.state,
      milestoneCount: milestones.length || 4,
      paymentGenerated: payments.length > 0 ? false : true
    };
  }
}
