import express, { Response } from 'express';
import { dbDataStore } from '../database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { spamAndMaliceFilter, rateLimiter } from '../middleware/security';
import { sendInquiryEmail } from '../services/email';

const router = express.Router();

/**
 * PUBLIC REST ENDPOINT: Submit secure inquiry
 * Handled with Rate Limiting and Spam Filtering
 */
router.post(
  '/',
  rateLimiter(15, 5 * 60 * 1000) as any, // Strict Rate Limiter: Max 15 submissions per 5 minutes per IP
  spamAndMaliceFilter as any,
  async (req: express.Request, res: Response) => {
    try {
      const { name, organization, email, inquiryType, message, website } = req.body || {};

      // 1. Honeypot Spam Protection check
      if (website && website.trim().length > 0) {
        console.warn('[Security Handshake] Honeypot field was populated. Denying bot request silently.');
        // Return a mock success response to confuse the spam bot without executing logic
        return res.status(201).json({
          success: true,
          message: 'Inquiry safely received and queued for evaluation.',
          ticketId: `GLINT-REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString()
        });
      }

      // Standard sanitization/pattern validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Please provide a valid, contactable email address.'
        });
      }

      if (!message || message.length < 15) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Submissions must include a brief details statement (minimum 15 characters).'
        });
      }

      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      // 2. Insert into resilient operational database queue
      let ticketId = `GLINT-REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      let timestamp = new Date();
      let dbSuccess = false;

      try {
        const inquiry = await dbDataStore.createInquiry({
          name: name.trim(),
          organization: organization.trim(),
          email: email.toLowerCase().trim(),
          inquiryType: inquiryType || 'General Info',
          message: message.trim(),
          ipAddress: clientIp.split(',')[0].trim()
        });
        ticketId = inquiry.ticketId;
        timestamp = inquiry.timestamp;
        dbSuccess = true;
        console.log(`[Queue Audit] New security request filed in DB. Ref ID: ${ticketId} from IP: ${inquiry.ipAddress}`);
      } catch (dbErr) {
        // Fallback for Vercel serverless environment (read-only file system or DB connection issues)
        console.warn('[Queue Warning] Database write collapsed, falling back to serverless SMTP-direct delivery:', dbErr);
      }

      // 3. Dispatch secure email using SMTP mail server
      const emailPayload = {
        name: name.trim(),
        organization: organization.trim(),
        email: email.toLowerCase().trim(),
        inquiryType: inquiryType || 'General Info',
        message: message.trim(),
        ticketId,
        timestamp
      };

      const mailSuccess = await sendInquiryEmail(emailPayload);
      if (!mailSuccess && !dbSuccess) {
        // If BOTH database logging and SMTP sending failed, return a 500 error
        return res.status(500).json({
          error: 'Transmission Failure',
          message: 'Secure communication buffers collapsed. Please retry in some minutes.'
        });
      }

      return res.status(201).json({
        success: true,
        message: mailSuccess 
          ? 'Inquiry safely received and forwarded via secure webmail channels.'
          : 'Inquiry safely cached but offline delivery pending.',
        ticketId,
        timestamp
      });

    } catch (err: any) {
      console.error('[Queue Error] Error processing operational request:', err);
      return res.status(500).json({
        error: 'Queue Transmission Failure',
        message: 'Internal communication buffers collapsed. Please retry in some minutes.'
      });
    }
  }
);

/**
 * PROTECTED ADMIN ENDPOINT: Query and Filter Received Inquiries
 */
router.get(
  '/',
  authenticateToken as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, type, query } = req.query || {};

      const inquiries = await dbDataStore.getInquiries({
        status: status as string,
        type: type as string,
        searchTerm: query as string
      });

      return res.json({
        count: inquiries.length,
        inquiries
      });
    } catch (err) {
      console.error('[Admin Audit] Failed to retrieve inquiries:', err);
      return res.status(500).json({
        error: 'System Retrieval Failure',
        message: 'Could not fetch database records.'
      });
    }
  }
);

/**
 * PROTECTED ADMIN ENDPOINT: Update Status & Write Review Logs
 */
router.patch(
  '/:id/status',
  authenticateToken as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, reviewNotes } = req.body || {};

      if (!status || !['PENDING', 'REVIEWED', 'ARCHIVED'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid Parameter',
          message: 'Requested status is unrecognized.'
        });
      }

      const adminId = req.user?.id || 'system';

      const updated = await dbDataStore.updateInquiryStatus(
        id,
        status as 'PENDING' | 'REVIEWED' | 'ARCHIVED',
        adminId,
        reviewNotes
      );

      if (!updated) {
        return res.status(404).json({
          error: 'Record Not Found',
          message: 'No inquiry with the provided tracking ID exists.'
        });
      }

      console.log(`[Admin Audit] Inquiry ${updated.ticketId} was updated to status [${status}] by admin [${adminId}]`);

      return res.json({
        success: true,
        message: 'operational database sync completed.',
        inquiry: updated
      });

    } catch (err) {
      console.error('[Admin Action Error] Failed to update inquiry state:', err);
      return res.status(500).json({
        error: 'Server Lock Failure',
        message: 'Synchronized database state transaction failed.'
      });
    }
  }
);

/**
 * PROTECTED ADMIN ENDPOINT: Delete Inquiry permanently
 */
router.delete(
  '/:id',
  authenticateToken as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await dbDataStore.deleteInquiry(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Record Not Found',
          message: 'No inquiry found with the specified identifier.'
        });
      }

      console.log(`[Admin Audit] Inquiry ${id} permanently expunged from local database logs.`);

      return res.json({
        success: true,
        message: 'Inquiry record expunged from the database.'
      });
    } catch (err) {
      return res.status(500).json({ error: 'Server Delete Error' });
    }
  }
);

/**
 * PROTECTED ADMIN ENDPOINT: Export Logs File (Neutral JSON format)
 */
router.get(
  '/export',
  authenticateToken as any,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const inquiries = await dbDataStore.getInquiries();
      
      // Send raw dump in header for secure backup systems
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=glint-inquiries-export.json');
      return res.send(JSON.stringify(inquiries, null, 2));
    } catch (err) {
      return res.status(500).json({ error: 'Exporter Exception' });
    }
  }
);

export default router;
