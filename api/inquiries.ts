import { dbDataStore } from '../backend/database';
import { sendInquiryEmail } from '../backend/services/email';

/**
 * Standalone Serverless API function for Vercel Deployments.
 * Maps directly to /api/inquiries.
 */
export default async function handler(req: any, res: any) {
  // 1. Enable secure CORS operations for serverless
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // CORS Preflight fallback
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only POST requests are supported under this route.'
    });
  }

  try {
    const { name, organization, email, inquiryType, message, website } = req.body || {};

    // 2. Honeypot Spam Protection Check
    if (website && website.trim().length > 0) {
      console.warn('[Vercel Serverless] Honeypot field was populated. Denying bot request silently.');
      return res.status(201).json({
        success: true,
        message: 'Inquiry safely received and queued for evaluation.',
        ticketId: `GLINT-REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Core Validation - Field Presence
    if (!name?.trim() || !organization?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: 'All fields must be completely populated.'
      });
    }

    // 4. Pattern validation for standard email structures
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide a valid, contactable email address.'
      });
    }

    // 5. Length check for body messaging
    if (message.trim().length < 15) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Submissions must include a brief details statement (minimum 15 characters).'
      });
    }

    // 6. Corporate content filtration
    const stringsToAudit = [name, organization, email, message];
    const spamPatterns = [
      /<script/i,
      /javascript:/i,
      /UNION SELECT/i,
      /DROP TABLE/i,
      /--/i,
      /\b(casino|crypto|viagra|porn|lottery|winner|bitcoin|loan|make money)\b/i
    ];

    for (const str of stringsToAudit) {
      if (str) {
        for (const pattern of spamPatterns) {
          if (pattern.test(str)) {
            console.error('[Vercel Serverless] Spam keyword match detected. Aborting.');
            return res.status(400).json({
              error: 'Security Validation Failed',
              message: 'Your inquiry contains characters or keywords restricted under cyber-security compliance.'
            });
          }
        }
      }
    }

    // 7. Track caller IP address
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1';

    // 8. DB Sync execution
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
    } catch (dbErr) {
      // Vercel deployment environment is read-only for filesystem database, which is expected. Follow normal execution flow.
      console.warn('[Vercel Serverless] Queue warning: SQLite/local store offline. Sending mail directly.', dbErr);
    }

    // 9. Dispatch SMTP outbound message
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
      return res.status(500).json({
        error: 'Transmission Failure',
        message: 'Outbound mail and local DB operations failed. Check SMTP credentials.'
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

  } catch (globalErr: any) {
    console.error('[Vercel Serverless] Global transaction error:', globalErr);
    return res.status(500).json({
      error: 'Queue Transmission Failure',
      message: 'Internal communication buffers collapsed. Please retry in some minutes.'
    });
  }
}
