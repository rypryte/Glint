import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dbDataStore } from '../database';
import { JWT_SECRET } from '../config';

const router = express.Router();
const JWT_EXPIRES_IN = '12h';

// Helper middleware for workspace clients
function authenticateWorkspaceToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication certificate missing.' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err || !decoded || decoded.type !== 'WORKSPACE') {
      return res.status(403).json({ message: 'Authorization error: Signature mismatch.' });
    }

    const client = await dbDataStore.getWorkspaceUserById(decoded.id);
    if (!client) {
      return res.status(403).json({ message: 'Active operational client record not found.' });
    }

    req.user = client;
    next();
  });
}

/**
 * WorkspaceAccessGuard protects secure sandbox rooms from unauthorized clients
 * whose financial requirements/payment invoice milestones haven't been completed.
 */
async function WorkspaceAccessGuard(req: any, res: any, next: any) {
  const { projectId } = req.params;
  if (!projectId) {
    return next();
  }

  // Allowed to fetch and settle payment invoice even if locked!
  if (req.path.includes('/payments')) {
    return next();
  }

  try {
    let room = await dbDataStore.getWorkspaceRoomByProjectId(projectId);
    if (!room) {
      // Lazy-provision if missing
      room = await dbDataStore.createWorkspaceRoom({ projectId, state: 'LOCKED' });
    }

    if (room.state !== 'ACTIVATED') {
      const reason = room.state === 'SUSPENDED'
        ? (room.suspendedReason || 'Chamber suspended for administrative review')
        : 'Payment pending';
      return res.status(403).json({
        code: 'WORKSPACE_LOCKED',
        reason
      });
    }

    next();
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}

// --- 1. FREE ONBOARDING GATEWAY (GENERATE ONBOARDING TOKEN) ---
// Simulates an operational payment trigger resulting from internal approval.
// This supports the premium sandbox experience!
router.post('/simulate-order', async (req, res) => {
  try {
    const { name, email, organization, inquiryType, amount, description } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'Representative name and operational email required.' });
    }

    // Generate token
    const onboardingToken = `GNT-ONB-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const alias = `OPERATOR-${name.split(' ')[0].toUpperCase()}-${Math.floor(100+Math.random()*899)}`;

    // Create a dummy client account with token instantly, pre-seed password as 'password123'
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('password123', salt);

    const client = await dbDataStore.registerWorkspaceUser({
      email,
      passwordPlain: 'password123',
      name,
      alias,
      onboardingToken
    });

    // Create an isolated project chamber for this user
    const project = await dbDataStore.createProject({
      name: `${organization || 'Tactical Deploy'} - Secure Chamber`,
      description: `Targeting operational channels for ${inquiryType || 'Defense Consultation'}. Provisioned automatically upon financial handshake clear.`,
      clientId: client.id
    });

    // Create payment invoice connected to this project
    const payment = await dbDataStore.createPaymentInvoice({
      projectId: project.id,
      amount: Number(amount) || 125000,
      description: description || `Encrypted Hardware Bundle: ${inquiryType || 'Military consultation'} clearance module`,
      onboardingTokenGenerated: onboardingToken
    });

    // Create workspace room and link
    await dbDataStore.createWorkspaceRoom({ projectId: project.id, state: 'LOCKED' });

    // Add Workspace security logs
    await dbDataStore.addWorkspaceLog(`Order simulated & project room ${project.id} provisioned with Token ${onboardingToken}`);

    return res.status(200).json({
      success: true,
      onboardingToken,
      alias,
      tempPassword: 'password123',
      clientEmail: email,
      projectId: project.id,
      paymentId: payment.id,
      paymentAmount: payment.amount,
      trackingId: `GLINT-PAY-${Math.floor(1000 + Math.random() * 9000)}`
    });

  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// --- 2. AUTHENTICATION ENDPOINTS ---

// Register / Claim account via onboarding token
router.post('/auth/register', async (req, res) => {
  try {
    const { onboardingToken, password, name, email } = req.body;

    if (!onboardingToken || !password) {
      return res.status(400).json({ message: 'Onboarding certificate token and target passphrase required.' });
    }

    // Check if user already loaded (from simulation/approval)
    const existing = await dbDataStore.getWorkspaceUserByToken(onboardingToken.trim());
    if (existing) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      const updatedUser = await dbDataStore.registerWorkspaceUser({
        email: email || existing.email,
        passwordPlain: password,
        name: name || existing.name,
        alias: existing.alias,
        onboardingToken: '' // Clear onboarding token
      });

      return res.status(200).json({
        success: true,
        message: 'Workspace credentials claimed and authorized.'
      });
    }

    // Otherwise create from scratch
    const generatedAlias = `OPERATOR-ALIAS-${Math.floor(1000 + Math.random() * 9000)}`;
    const tempEmail = email || `operator-${Math.random().toString(36).substr(2, 5)}@glint.tech`;
    
    const newUser = await dbDataStore.registerWorkspaceUser({
      email: tempEmail,
      passwordPlain: password,
      name: name || 'Secure Client Platform User',
      alias: generatedAlias,
      onboardingToken
    });

    // Provision default project environment
    const prj = await dbDataStore.createProject({
      name: 'Independent Tactical Node Alpha',
      description: 'Default project chamber spun up clean via claim card.',
      clientId: newUser.id,
      status: 'PENDING'
    });

    // Setup Room
    await dbDataStore.createWorkspaceRoom({ projectId: prj.id, state: 'LOCKED' });

    await dbDataStore.addWorkspaceLog(`Independent customer registered alias [${generatedAlias}] on project [${prj.id}]`);

    return res.status(200).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        alias: newUser.alias
      }
    });

  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Onboarding registration error.' });
  }
});

// Workspace Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Passphrase and operational email required.' });
    }

    const client = await dbDataStore.getWorkspaceUserByEmail(email);
    if (!client) {
      return res.status(401).json({ message: 'Decryption key match failed for matching credentials.' });
    }

    const valid = bcrypt.compareSync(password, client.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Access denied. Incorrect security passphrase.' });
    }

    const token = jwt.sign(
      {
        id: client.id,
        email: client.email,
        alias: client.alias,
        type: 'WORKSPACE'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await dbDataStore.addWorkspaceLog(`Authorized login for agent ${client.alias} (${client.email})`);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: client.id,
        email: client.email,
        name: client.name,
        alias: client.alias
      }
    });

  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Workspace Load Profile
router.get('/auth/me', authenticateWorkspaceToken, (req: any, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      alias: req.user.alias
    }
  });
});

// --- 3. SECURE WORKSPACE API ENDPOINTS ---

// List current client projects (no guard, lists projects)
router.get('/projects', authenticateWorkspaceToken, async (req: any, res) => {
  try {
    const list = await dbDataStore.getProjectsByClientId(req.user.id);
    return res.status(200).json({ success: true, count: list.length, projects: list });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Fetch detailed single project (apply WorkspaceAccessGuard)
router.get('/projects/:projectId', authenticateWorkspaceToken, WorkspaceAccessGuard, async (req: any, res) => {
  try {
    const prj = await dbDataStore.getProjectById(req.params.projectId);
    if (!prj || prj.clientId !== req.user.id) {
      return res.status(404).json({ message: 'Compartmentalized project chamber not found.' });
    }
    return res.status(200).json({ success: true, project: prj });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Retrieve messages of a workspace project (apply WorkspaceAccessGuard)
router.get('/projects/:projectId/messages', authenticateWorkspaceToken, WorkspaceAccessGuard, async (req: any, res) => {
  try {
    const prj = await dbDataStore.getProjectById(req.params.projectId);
    if (!prj || prj.clientId !== req.user.id) {
      return res.status(404).json({ message: 'Access to target room denied.' });
    }

    const msgList = await dbDataStore.getMessages(req.params.projectId);
    return res.status(200).json({ success: true, count: msgList.length, messages: msgList });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Dispatch message to a workspace project (apply WorkspaceAccessGuard)
router.post('/projects/:projectId/messages', authenticateWorkspaceToken, WorkspaceAccessGuard, async (req: any, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Operational content cannot be empty.' });
    }

    const prj = await dbDataStore.getProjectById(req.params.projectId);
    if (!prj || prj.clientId !== req.user.id) {
      return res.status(404).json({ message: 'Security boundaries violated.' });
    }

    const message = await dbDataStore.createMessage({
      projectId: req.params.projectId,
      senderName: req.user.alias,
      senderRole: 'CLIENT',
      content
    });

    // Simulate an AI automated response for responsive feedback
    setTimeout(async () => {
      try {
        await dbDataStore.createMessage({
          projectId: req.params.projectId,
          senderName: 'AUTOMATED SECURITY COMPLIANCE',
          senderRole: 'SYSTEM',
          content: `Automated confirmation receipt loaded. Your parcel with length of ${content.length} characters has been successfully logged on the primary ledger and verified for transmission safety standards.`
        });
      } catch (err) {
        console.error(err);
      }
    }, 1500);

    return res.status(200).json({ success: true, message });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Retrieve milestones checklist (apply WorkspaceAccessGuard)
router.get('/projects/:projectId/milestones', authenticateWorkspaceToken, WorkspaceAccessGuard, async (req: any, res) => {
  try {
    const prj = await dbDataStore.getProjectById(req.params.projectId);
    if (!prj || prj.clientId !== req.user.id) {
      return res.status(404).json({ message: 'Project chamber isolation limits breached.' });
    }

    const milestones = await dbDataStore.getMilestones(req.params.projectId);
    return res.status(200).json({ success: true, milestones });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Update milestone status (apply WorkspaceAccessGuard)
router.patch('/projects/:projectId/milestones/:milestoneId', authenticateWorkspaceToken, WorkspaceAccessGuard, async (req: any, res) => {
  try {
    const { status } = req.body;
    const prj = await dbDataStore.getProjectById(req.params.projectId);
    if (!prj || prj.clientId !== req.user.id) {
      return res.status(404).json({ message: 'Action not authorized.' });
    }

    const updated = await dbDataStore.updateMilestoneStatus(req.params.milestoneId, status);
    if (!updated) {
      return res.status(404).json({ message: 'Milestone item reference not found.' });
    }

    await dbDataStore.addWorkspaceLog(`Milestone [${updated.title}] updated to ${status} on project ${req.params.projectId}`);

    return res.status(200).json({ success: true, milestone: updated });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Get invoices/payment logs (Exempt from locking guard!)
router.get('/projects/:projectId/payments', authenticateWorkspaceToken, async (req: any, res) => {
  try {
    const prj = await dbDataStore.getProjectById(req.params.projectId);
    if (!prj || prj.clientId !== req.user.id) {
      return res.status(404).json({ message: 'No payments found on compartmentalized segment.' });
    }

    const invoiceList = await dbDataStore.getPayments(req.params.projectId);
    return res.status(200).json({ success: true, payments: invoiceList });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Endpoint action to pay/settle payment secure token invoice (Exempt!)
router.post('/projects/:projectId/payments/:paymentId/settle', async (req: any, res: any) => {
  try {
    const settled = await dbDataStore.settlePaymentInvoice(req.params.paymentId);
    if (!settled) {
      return res.status(404).json({ message: 'Payment invoice reference not found.' });
    }

    // Trigger state sync when paid!
    const { WorkspaceStateService } = require('../services/WorkspaceStateService');
    await WorkspaceStateService.syncFromPayment(req.params.projectId);

    await dbDataStore.addWorkspaceLog(`Settle sandbox financial handshake. Invoice cleared: ${req.params.paymentId}`);

    return res.status(200).json({ success: true, payment: settled });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// List encrypted client files (apply WorkspaceAccessGuard)
router.get('/projects/:projectId/files', authenticateWorkspaceToken, WorkspaceAccessGuard, async (req: any, res) => {
  try {
    const prj = await dbDataStore.getProjectById(req.params.projectId);
    if (!prj || prj.clientId !== req.user.id) {
      return res.status(404).json({ message: 'Access denied.' });
    }

    const files = await dbDataStore.getProjectFiles(req.params.projectId);
    return res.status(200).json({ success: true, files });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Simulate client uploading secure blueprint document (apply WorkspaceAccessGuard)
router.post('/projects/:projectId/files', authenticateWorkspaceToken, WorkspaceAccessGuard, async (req: any, res) => {
  try {
    const { fileName, fileSize } = req.body;
    if (!fileName) {
      return res.status(400).json({ message: 'Secure file name signature required.' });
    }

    const prj = await dbDataStore.getProjectById(req.params.projectId);
    if (!prj || prj.clientId !== req.user.id) {
      return res.status(404).json({ message: 'Access denied.' });
    }

    const newFile = await dbDataStore.addProjectFile({
      projectId: req.params.projectId,
      fileName,
      fileSize: fileSize || '3.4 MB',
      uploadedBy: req.user.alias
    });

    await dbDataStore.addWorkspaceLog(`File ${fileName} uploaded and encrypted in vault by ${req.user.alias}`);

    return res.status(200).json({ success: true, file: newFile });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Delete secure blueprint file (apply WorkspaceAccessGuard)
router.delete('/projects/:projectId/files/:fileId', authenticateWorkspaceToken, WorkspaceAccessGuard, async (req: any, res) => {
  try {
    const prj = await dbDataStore.getProjectById(req.params.projectId);
    if (!prj || prj.clientId !== req.user.id) {
      return res.status(404).json({ message: 'Access denied.' });
    }

    const ok = await dbDataStore.deleteProjectFile(req.params.fileId);
    if (!ok) {
       return res.status(404).json({ message: 'Target file not located in secure chamber.' });
    }

    await dbDataStore.addWorkspaceLog(`File expunged from workspace vault on ID: ${req.params.fileId}`);

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
