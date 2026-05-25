import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbDataStore } from '../database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { JWT_SECRET } from '../config';

const router = express.Router();
const JWT_EXPIRES_IN = '12h'; // High security session lifespan

/**
 * REST: Authentication Endpoint
 */
router.post('/login', async (req: express.Request, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing Parameters',
        message: 'Email address and credential passcodes must be provided.'
      });
    }

    const admin = await dbDataStore.getAdminByEmail(email);
    if (!admin) {
      // Avoid verbose descriptive password enumeration errors for safety
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Verification failed: Credential or security certificate mismatch.'
      });
    }

    const isMatch = bcrypt.compareSync(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'Verification failed: Credential or security certificate mismatch.'
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log(`[Auth Audit] Admin successfully logged in: ${admin.email}`);

    return res.json({
      token,
      expiresIn: JWT_EXPIRES_IN,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (err: any) {
    console.error('[Auth Error] System failure in admin login chain:', err);
    return res.status(500).json({
      error: 'Internal System Error',
      message: 'Secure auth framework experienced a parsing exception.'
    });
  }
});

/**
 * REST: Verify Current Authentication State
 */
router.get('/me', authenticateToken as any, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Not Authenticated',
      message: 'Active session not found.'
    });
  }

  try {
    const admin = await dbDataStore.getAdminById(req.user.id);
    if (!admin) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'Could not resolve associated administrator ID.'
      });
    }

    return res.json({
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        createdAt: admin.createdAt
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Parsing Error' });
  }
});

export default router;
