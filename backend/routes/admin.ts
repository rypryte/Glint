import express from 'express';
import { ProvisioningService } from '../services/ProvisioningService';
import { authenticateToken, requireRole } from '../middleware/auth';
import { dbDataStore } from '../database';

const router = express.Router();

/**
 * POST /api/admin/projects/:id/approve
 * Converts an Inqury and provisions a separate locked client workspace chamber atomically.
 */
router.post('/projects/:id/approve', authenticateToken as any, requireRole(['SUPER_ADMIN', 'ADMIN']) as any, async (req: any, res: any) => {
  try {
    const inquiryId = req.params.id;
    const adminId = req.user?.id;

    const result = await ProvisioningService.approveProject(inquiryId, adminId);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[Admin Approve Route Error]', err);
    return res.status(500).json({ error: 'Provisioning Failed', message: err.message });
  }
});

/**
 * POST /api/admin/projects/:id/reprovision
 * Repairs or reprovisions broken, incomplete configurations safely.
 */
router.post('/projects/:id/reprovision', authenticateToken as any, requireRole(['SUPER_ADMIN', 'ADMIN']) as any, async (req: any, res: any) => {
  try {
    const projectId = req.params.id;
    const result = await ProvisioningService.reprovisionProject(projectId);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: 'Reprovisioning Failed', message: err.message });
  }
});

/**
 * GET /api/admin/system/audit-logs
 * Fetch secure system ledger audit trails.
 */
router.get('/system/audit-logs', authenticateToken as any, requireRole(['SUPER_ADMIN', 'ADMIN']) as any, async (req: any, res: any) => {
  try {
    const logs = await dbDataStore.getAuditLogs();
    return res.status(200).json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Fetch Logs Failed', message: err.message });
  }
});

/**
 * GET /api/admin/projects
 * Retrieve all registered projects with client information included.
 */
router.get('/projects', authenticateToken as any, requireRole(['SUPER_ADMIN', 'ADMIN']) as any, async (req: any, res: any) => {
  try {
    const list = await dbDataStore.getAllProjects();
    const expanded = await Promise.all(list.map(async (p) => {
      const client = await dbDataStore.getWorkspaceUserById(p.clientId);
      return {
        ...p,
        client: client ? { id: client.id, email: client.email, alias: client.alias, name: client.name } : null
      };
    }));
    return res.status(200).json({ success: true, projects: expanded });
  } catch (err: any) {
    return res.status(500).json({ error: 'Fetch Projects Failed', message: err.message });
  }
});

/**
 * PATCH /api/admin/projects/:id/status
 * Dynamically shift the operational lifecycle of a project chamber.
 */
router.patch('/projects/:id/status', authenticateToken as any, requireRole(['SUPER_ADMIN', 'ADMIN']) as any, async (req: any, res: any) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Missing Status', message: 'A project status is required.' });
    }
    const updated = await dbDataStore.updateProjectStatus(req.params.id, status);
    
    // Add audit logs
    await dbDataStore.addAuditLog({
      actorId: req.user?.id,
      action: 'PROJECT_STATUS_UPDATE',
      targetType: 'project',
      targetId: req.params.id,
      metadata: { status }
    });

    return res.status(200).json({ success: true, project: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Status Transition Failed', message: err.message });
  }
});

/**
 * GET /api/admin/payments
 * Get all payment contracts and invoices across all workspace rooms.
 */
router.get('/payments', authenticateToken as any, requireRole(['SUPER_ADMIN', 'ADMIN']) as any, async (req: any, res: any) => {
  try {
    const list = await dbDataStore.getAllPayments();
    const expanded = await Promise.all(list.map(async (pay) => {
      const project = await dbDataStore.getProjectById(pay.projectId);
      return {
        ...pay,
        project: project ? { id: project.id, projectCode: project.projectCode, name: project.name } : null
      };
    }));
    return res.status(200).json({ success: true, payments: expanded });
  } catch (err: any) {
    return res.status(500).json({ error: 'Fetch Payments Failed', message: err.message });
  }
});

export default router;
