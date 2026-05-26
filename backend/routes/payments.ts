import express from 'express';
import { PaymentService } from '../services/PaymentService';
import { authenticateToken, requireRole } from '../middleware/auth';
import { dbDataStore } from '../database';

const router = express.Router();

/**
 * POST /api/payments/generate
 * Admin generates a secure payment invoice for a project.
 */
router.post('/generate', authenticateToken as any, requireRole(['SUPER_ADMIN', 'ADMIN']) as any, async (req: any, res: any) => {
  try {
    const { projectId, amount, currency, description } = req.body;
    if (!projectId || !amount) {
      return res.status(400).json({ error: 'Missing Fields', message: 'Project ID and invoice amount must be specified.' });
    }

    const payment = await PaymentService.generate(projectId, Number(amount), currency || 'NGN', description);
    return res.status(200).json({ success: true, payment });
  } catch (err: any) {
    console.error('[Payments Route Error]', err);
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

/**
 * POST /api/payments/verify
 * Public mock gateway webhook or admin manually executing manual checkout clearing.
 */
router.post('/verify', async (req: any, res: any) => {
  try {
    const { paymentId, gatewayResponse } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: 'Missing Fields', message: 'Payment ID is required.' });
    }

    const verified = await PaymentService.verify(paymentId, undefined, gatewayResponse);
    return res.status(200).json({ success: true, payment: verified });
  } catch (err: any) {
    return res.status(500).json({ error: 'Verification Error', message: err.message });
  }
});

/**
 * GET /api/payments/:projectId
 * Get payment records associated with a project.
 */
router.get('/:projectId', async (req: any, res: any) => {
  try {
    const list = await dbDataStore.getPayments(req.params.projectId);
    return res.status(200).json({ success: true, payments: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Fetch Error', message: err.message });
  }
});

/**
 * PATCH /api/payments/:id/status
 * Administrative forced manual update of transaction status.
 */
router.patch('/:id/status', authenticateToken as any, requireRole(['SUPER_ADMIN', 'ADMIN']) as any, async (req: any, res: any) => {
  try {
    const { status, reason } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Missing Status', message: 'A targeted status transition must be provided.' });
    }

    const verifierId = req.user?.id;
    const updated = await PaymentService.updateStatus(req.params.id, status, verifierId, reason);
    return res.status(200).json({ success: true, payment: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Status Transition Failed', message: err.message });
  }
});

export default router;
