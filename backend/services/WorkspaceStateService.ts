import { dbDataStore, WorkspaceRoom } from '../database';

export class WorkspaceStateService {

  /**
   * Syncs workspace state by analyzing all payment records connected to a project
   */
  static async syncFromPayment(projectId: string): Promise<WorkspaceRoom> {
    let room = await dbDataStore.getWorkspaceRoomByProjectId(projectId);
    if (!room) {
      // Lazy provision room if it doesn't exist
      room = await dbDataStore.createWorkspaceRoom({ projectId, state: 'LOCKED' });
    }

    // Do not alter states of suspended chambers mechanically
    if (room.state === 'SUSPENDED') {
      return room;
    }

    const payments = await dbDataStore.getPayments(projectId);
    const hasVerifiedPayment = payments.some(p => p.status === 'VERIFIED' || p.status === 'PAID');

    let targetState: 'LOCKED' | 'PROVISIONING' | 'ACTIVATED' | 'SUSPENDED' = 'LOCKED';

    if (hasVerifiedPayment) {
      targetState = 'ACTIVATED';
    } else if (payments.some(p => p.status === 'PROCESSING')) {
      targetState = 'PROVISIONING';
    }

    if (room.state !== targetState) {
      const updated = await dbDataStore.updateWorkspaceRoomState(room.id, targetState, 'Payment Status Sync Triggered');
      if (updated && targetState === 'ACTIVATED') {
        await this.handleActivatedFlow(projectId);
      }
      return updated || room;
    }

    return room;
  }

  /**
   * Activate workspace and unlock associated milestones threads
   */
  static async activateWorkspace(roomId: string, actorId?: string): Promise<WorkspaceRoom> {
    const room = await dbDataStore.getWorkspaceRoomById(roomId);
    if (!room) {
      throw new Error(`Workspace room ${roomId} not found`);
    }

    const updated = await dbDataStore.updateWorkspaceRoomState(roomId, 'ACTIVATED', 'Manual Administrator Force Override');
    if (!updated) {
       throw new Error('Workspace status update failed');
    }

    await this.handleActivatedFlow(room.projectId);

    await dbDataStore.addAuditLog({
      actorId,
      action: 'WORKSPACE_MANUAL_ACTIVATED',
      targetType: 'workspace',
      targetId: roomId,
      metadata: { projectId: room.projectId },
      ipAddress: '127.0.0.1'
    });

    return updated;
  }

  /**
   * Lock workspace room manually
   */
  static async lockWorkspace(roomId: string, actorId?: string): Promise<WorkspaceRoom> {
    const room = await dbDataStore.getWorkspaceRoomById(roomId);
    if (!room) {
      throw new Error(`Workspace room ${roomId} not found`);
    }

    const updated = await dbDataStore.updateWorkspaceRoomState(roomId, 'LOCKED', 'Manual Payment Restriction Lock');
    if (!updated) {
       throw new Error('Locking operation failed');
    }

    await dbDataStore.addAuditLog({
      actorId,
      action: 'WORKSPACE_LOCKED',
      targetType: 'workspace',
      targetId: roomId,
      metadata: { projectId: room.projectId },
      ipAddress: '127.0.0.1'
    });

    return updated;
  }

  /**
   * Suspend workspace manually for admin/operational reasons input by operator
   */
  static async suspendWorkspace(roomId: string, reason: string, actorId?: string): Promise<WorkspaceRoom> {
    const room = await dbDataStore.getWorkspaceRoomById(roomId);
    if (!room) {
      throw new Error(`Workspace room ${roomId} not found`);
    }

    const updated = await dbDataStore.updateWorkspaceRoomState(roomId, 'SUSPENDED', reason);
    if (!updated) {
       throw new Error('Suspension update failed');
    }

    await dbDataStore.addAuditLog({
      actorId,
      action: 'WORKSPACE_SUSPENDED',
      targetType: 'workspace',
      targetId: roomId,
      metadata: { projectId: room.projectId, reason },
      ipAddress: '127.0.0.1'
    });

    return updated;
  }

  /**
   * When a chamber becomes activated, sync milestone unlock statuses
   */
  private static async handleActivatedFlow(projectId: string) {
    const milestones = await dbDataStore.getMilestones(projectId);
    for (const m of milestones) {
      // Automatically unlock milestone communications threads!
      await this.unlockMilestoneThread(m.id);
    }
  }

  /**
   * Unlock specified milestone comments and checklist thread
   */
  static async unlockMilestoneThread(milestoneId: string): Promise<boolean> {
    const updated = await dbDataStore.updateMilestoneThreadState(milestoneId, 'UNLOCKED');
    return !!updated;
  }
}
