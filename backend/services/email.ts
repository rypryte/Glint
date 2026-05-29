import nodemailer from 'nodemailer';

export interface EmailData {
  name: string;
  organization: string;
  email: string;
  inquiryType: string;
  message: string;
  ticketId: string;
  timestamp: string | Date;
}

/**
 * Sends a contact inquiry email to cPanel webmail inbox using secure SMTP Nodemailer.
 */
export async function sendInquiryEmail(data: EmailData): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[SMTP Service] Missing email host, user, or password in environment variables.');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // Secure connection using TLS (recommended for port 465)
    auth: {
      user,
      pass,
    },
    tls: {
      // Prevent failure on self-signed certificates or other local mailserver certificates
      rejectUnauthorized: false
    }
  });

  const recipient = process.env.CONTACT_RECIPIENT || user;

  const mailOptions = {
    from: `"Glint Tech Security Terminal" <${user}>`,
    to: recipient,
    subject: `[SECURE INQUIRY] Ref: ${data.ticketId} - ${data.organization}`,
    text: `
--- SECURE TRANSMISSION RECEIVED ---
Ticket ID: ${data.ticketId}
Date/Time: ${new Date(data.timestamp).toLocaleString()}
Sender Name: ${data.name}
Email Address: ${data.email}
Organization: ${data.organization}
Inquiry Type: ${data.inquiryType}

--- MESSAGE TRANSRIPT ---
${data.message}

------------------------------------
This email was automatically dispatched by Glint Technology's serverless pipeline.
`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="background-color: #0e1014; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; color: #ffffff;">
          <h2 style="margin: 0; color: #3b82f6; text-transform: uppercase; font-size: 20px; letter-spacing: 2px;">Glint Security Terminal</h2>
          <span style="font-family: monospace; font-size: 11px; opacity: 0.8; display: block; margin-top: 8px;">TICKET REFERENCE: ${data.ticketId}</span>
        </div>
        <div style="padding: 25px; color: #1f2937; line-height: 1.6;">
          <p style="margin-top: 0; font-size: 15px;">A new secure inquiry transmission has been completed through the Glint Contact form interface.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 25px; font-size: 14px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #4b5563; width: 35%;">Submission Date:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-family: monospace; color: #111827;">${new Date(data.timestamp).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #4b5563;">Sender Name:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #4b5563;">Email Address:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #3b82f6;"><a href="mailto:${data.email}" style="color: #3b82f6; text-decoration: none;">${data.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #4b5563;">Organization:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">${data.organization}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: 600; color: #4b5563;">Inquiry Type:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-weight: 700; color: #3b82f6; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">${data.inquiryType}</td>
            </tr>
          </table>

          <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 4px; margin-top: 15px;">
            <h4 style="margin: 0 0 12px 0; font-size: 12px; font-family: monospace; text-transform: uppercase; color: #6b7280; letter-spacing: 1px;">Message Transcript:</h4>
            <p style="margin: 0; white-space: pre-wrap; font-size: 14px; color: #111827; font-family: inherit;">${data.message}</p>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; font-size: 11px; text-align: center; color: #9ca3af; border-radius: 0 0 10px 10px; border-top: 1px solid #f3f4f6;">
          This message was safely processed under standard offline data compliance regulations.
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP Service] Mail successfully routed. MessageID: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('[SMTP Service] Detailed error submitting SMTP email:', err);
    return false;
  }
}
