import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Validates JWT access token to authenticate administrative users
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access Token Missing: Secured administrative credentials required.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      console.warn(`[Authentication Error] Invalid or expired access token: ${err.message}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid Action Check: Access token is either expired, corrupted, or voided.'
      });
    }

    req.user = decodedUser as AuthenticatedUser;
    next();
  });
}

/**
 * Validates role-based clearances (such as checking if user is an Administrator)
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Identity validation is required.'
      });
    }

    const hasAllowedRole = allowedRoles.includes(req.user.role);
    if (!hasAllowedRole) {
      console.warn(`[Security Clearance Violation] User ${req.user.id} lacks role clearance. Required: ${allowedRoles.join(',')}, Had: ${req.user.role}`);
      return res.status(403).json({
        error: 'Access Denied',
        message: 'Critical clearance violation: Your digital certificate does not permit this operational request.'
      });
    }

    next();
  };
}
