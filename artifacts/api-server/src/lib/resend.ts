import { Resend } from 'resend';
import { logger } from './logger';

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'ITIC Portal <onboarding@resend.dev>';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

if (!resendApiKey) {
  logger.warn('RESEND_API_KEY is not set. Email notifications will be logged to console in dev mode.');
}

/**
 * Base email layout wrapper with modern ITIC Portal branding.
 */
function wrapEmailHtml(title: string, bodyContent: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #0d1117;
          color: #e6edf3;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }
        .header {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          padding: 24px 32px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 32px;
          line-height: 1.6;
          font-size: 15px;
        }
        .button {
          display: inline-block;
          background: #6366f1;
          color: #ffffff !important;
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin-top: 20px;
        }
        .footer {
          border-top: 1px solid #21262d;
          padding: 20px 32px;
          text-align: center;
          font-size: 12px;
          color: #8b949e;
          background: #0d1117;
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          margin-bottom: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ Information Technology Innovators Club</h1>
        </div>
        <div class="content">
          ${bodyContent}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ITIC Portal — Information Technology Innovators Club.</p>
          <p>You are receiving this notification as a member of ITIC.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Generic email dispatcher via Resend with fallback console logging.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const recipients = Array.isArray(to) ? to : [to];

  if (!resend) {
    logger.info({ to: recipients, subject }, '[Resend Mock] Email would be sent (no API key configured)');
    return { success: true, mock: true, id: `mock-${Date.now()}` };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ''),
    });

    if (error) {
      logger.error({ error, to: recipients, subject }, 'Failed to send email via Resend');
      throw error;
    }

    logger.info({ id: data?.id, to: recipients, subject }, 'Email sent successfully via Resend');
    return { success: true, id: data?.id };
  } catch (err) {
    logger.error({ err, to: recipients, subject }, 'Resend email error');
    throw err;
  }
}

/**
 * Send Welcome Email to newly registered member.
 */
export async function sendWelcomeEmail(to: string, fullName: string, memberId: string) {
  const subject = `Welcome to ITIC! Your Member ID is ${memberId}`;
  const content = `
    <div class="badge">Welcome to ITIC</div>
    <h2 style="color: #ffffff; margin-top: 0;">Hello ${fullName},</h2>
    <p>Welcome to the <strong>Information Technology Innovators Club (ITIC)</strong>!</p>
    <p>Your membership application has been received. Your assigned Member ID is:</p>
    <div style="background: #21262d; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; border: 1px border-slate-700;">
      <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #818cf8; letter-spacing: 2px;">${memberId}</span>
    </div>
    <p>Your account is currently under review by our executive team. Once approved, you will get full access to exclusive workshops, hackathons, and digital credentials.</p>
    <p>Best regards,<br>The ITIC Team</p>
  `;

  return sendEmail({
    to,
    subject,
    html: wrapEmailHtml(subject, content),
  });
}

/**
 * Send Approval status update email.
 */
export async function sendApprovalEmail(to: string, fullName: string, status: string, role: string) {
  const approved = status === 'active';
  const subject = approved ? `🎉 Your ITIC Membership is Approved!` : `ITIC Account Update: ${status}`;

  const content = approved
    ? `
      <div class="badge" style="background: rgba(34, 197, 94, 0.15); color: #4ade80;">Approved</div>
      <h2 style="color: #ffffff; margin-top: 0;">Congratulations ${fullName}!</h2>
      <p>Your membership application for the Information Technology Innovators Club has been officially <strong>Approved</strong>!</p>
      <p>Your member role is set to <strong>${role.toUpperCase()}</strong>.</p>
      <p>You can now open the ITIC Mobile app to view your digital Member Pass QR code, check into upcoming events, and participate in club activities.</p>
    `
    : `
      <div class="badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171;">Account Status Updated</div>
      <h2 style="color: #ffffff; margin-top: 0;">Hello ${fullName},</h2>
      <p>Your ITIC account status has been updated to: <strong>${status.toUpperCase()}</strong>.</p>
      <p>If you have any questions, please contact the executive team or reply to this message.</p>
    `;

  return sendEmail({
    to,
    subject,
    html: wrapEmailHtml(subject, content),
  });
}

/**
 * Send Announcement Email broadcast.
 */
export async function sendAnnouncementEmail(
  to: string | string[],
  title: string,
  contentBody: string,
  category: string,
  authorName: string
) {
  const subject = `📢 ITIC Announcement: ${title}`;
  const content = `
    <div class="badge">Announcement • ${category.toUpperCase()}</div>
    <h2 style="color: #ffffff; margin-top: 0;">${title}</h2>
    <p style="white-space: pre-line;">${contentBody}</p>
    <hr style="border: 0; border-top: 1px solid #30363d; margin: 24px 0;">
    <p style="font-size: 13px; color: #8b949e;">Posted by <strong>${authorName}</strong></p>
  `;

  return sendEmail({
    to,
    subject,
    html: wrapEmailHtml(subject, content),
  });
}

/**
 * Send Event Email notification.
 */
export async function sendEventEmail(
  to: string | string[],
  title: string,
  date: string,
  time: string,
  venue: string,
  description: string
) {
  const subject = `🗓️ Upcoming ITIC Event: ${title}`;
  const content = `
    <div class="badge">Upcoming Event</div>
    <h2 style="color: #ffffff; margin-top: 0;">${title}</h2>
    <div style="background: #21262d; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;">📅 <strong>Date:</strong> ${date}</p>
      <p style="margin: 4px 0;">⏰ <strong>Time:</strong> ${time || 'TBA'}</p>
      <p style="margin: 4px 0;">📍 <strong>Venue:</strong> ${venue || 'TBA'}</p>
    </div>
    <p style="white-space: pre-line;">${description}</p>
  `;

  return sendEmail({
    to,
    subject,
    html: wrapEmailHtml(subject, content),
  });
}

/**
 * Send Attendance confirmation email when member checks into an event.
 */
export async function sendAttendanceConfirmationEmail(
  to: string,
  fullName: string,
  eventTitle: string,
  checkedInAt: string
) {
  const subject = `✅ Check-in Confirmed: ${eventTitle}`;
  const formattedTime = new Date(checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const content = `
    <div class="badge" style="background: rgba(34, 197, 94, 0.15); color: #4ade80;">Check-in Confirmed</div>
    <h2 style="color: #ffffff; margin-top: 0;">Great to see you, ${fullName}!</h2>
    <p>Your attendance for <strong>${eventTitle}</strong> has been successfully recorded on ${new Date(checkedInAt).toLocaleDateString()} at ${formattedTime}.</p>
    <p>Thank you for participating in ITIC activities. Keep building and innovating!</p>
  `;

  return sendEmail({
    to,
    subject,
    html: wrapEmailHtml(subject, content),
  });
}
