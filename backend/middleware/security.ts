import { Request, Response, NextFunction } from 'express';

// Simple and highly performant memory store for rate limiting
interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const ipHistory = new Map<string, RateLimitInfo>();
const IP_BAN_LIST = new Set<string>();

// Dynamic Configuration
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Max requests per window

/**
 * Enterprise IP Rate Limiter
 * Guards endpoints from scraping and high-burst automated submissions
 */
export function rateLimiter(maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (IP_BAN_LIST.has(ip)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: Security compliance violation or blocklisted endpoint activity.'
      });
    }

    const now = Date.now();
    let clientInfo = ipHistory.get(ip);

    if (!clientInfo || now > clientInfo.resetTime) {
      clientInfo = {
        count: 1,
        resetTime: now + windowMs
      };
      ipHistory.set(ip, clientInfo);
    } else {
      clientInfo.count++;
    }

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - clientInfo.count));
    res.setHeader('X-RateLimit-Reset', new Date(clientInfo.resetTime).toISOString());

    if (clientInfo.count > maxRequests) {
      console.warn(`[Security Alert] Rate limit exceeded for IP: ${ip} on path ${req.originalUrl}`);
      
      // Auto-ban IP if they exceed rate limit by 3x
      if (clientInfo.count > maxRequests * 3) {
        IP_BAN_LIST.add(ip);
        console.error(`[Security Constraint] IP ${ip} permanently banned for endpoint abuse.`);
      }

      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait 15 minutes before submitting again.'
      });
    }

    next();
  };
}

/**
 * Automated Content Spam Filter
 * Inspects payloads for potential vulnerability scanners, marketing bots, or harmful code
 */
export function spamAndMaliceFilter(req: Request, res: Response, next: NextFunction) {
  const { name, organization, email, message } = req.body || {};
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  const stringsToAudit = [name, organization, email, message].filter(Boolean) as string[];

  // 1. Check for common spam keywords & SQL injecting strings in the operational form context
  const genericSpamPatterns = [
    /<script/i,
    /javascript:/i,
    /UNION SELECT/i,
    /DROP TABLE/i,
    /--/i, // SQL comments
    /\b(casino|crypto|viagra|porn|lottery|winner|bitcoin|loan|make money)\b/i
  ];

  for (const str of stringsToAudit) {
    for (const pattern of genericSpamPatterns) {
      if (pattern.test(str)) {
        console.error(`[Security Alert] Malicious text pattern match from IP: ${ip}. Blocked.`);
        return res.status(400).json({
          error: 'Security Validation Failed',
          message: 'Your inquiry contains characters or keywords restricted under Glint cyber-security compliance.'
        });
      }
    }
  }

  // 2. Extra verification against empty fields with spaces
  if (req.method === 'POST' && req.path === '/inquiries') {
    if (!name?.trim() || !organization?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: 'All fields must be completely populated with valid alphanumeric structures.'
      });
    }
  }

  next();
}

/**
 * Access Auditor
 * Logs and logs every request matching backend routes for defense logs
 */
export function accessLogMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    const authUser = (req as any).user ? `[UID: ${(req as any).user.id}]` : '[ANONYMOUS]';
    console.log(
      `[Audit Log] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ` +
      `IP: ${ip} | User: ${authUser} | Status: ${res.statusCode} | Time: ${elapsed}ms`
    );
  });
  
  next();
}
