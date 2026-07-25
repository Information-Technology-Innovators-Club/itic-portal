import { Router, Request, Response } from 'express';
import {
  sendEmail,
  sendWelcomeEmail,
  sendApprovalEmail,
  sendAnnouncementEmail,
  sendEventEmail,
  sendAttendanceConfirmationEmail,
} from '../lib/resend';
import { sendExpoPushNotifications } from '../lib/push';
import { logger } from '../lib/logger';

const router: Router = Router();

// ─── Email Endpoints ─────────────────────────────────────────────────────────

router.post('/notifications/email/welcome', async (req: Request, res: Response) => {
  try {
    const { to, fullName, memberId } = req.body;
    if (!to || !fullName || !memberId) {
      return res.status(400).json({ error: 'Missing required fields: to, fullName, memberId' });
    }
    const result = await sendWelcomeEmail(to, fullName, memberId);
    return res.json(result);
  } catch (err: any) {
    logger.error({ err }, 'Error in welcome email endpoint');
    return res.status(500).json({ error: err.message || 'Failed to send welcome email' });
  }
});

router.post('/notifications/email/approval', async (req: Request, res: Response) => {
  try {
    const { to, fullName, status, role } = req.body;
    if (!to || !fullName || !status || !role) {
      return res.status(400).json({ error: 'Missing required fields: to, fullName, status, role' });
    }
    const result = await sendApprovalEmail(to, fullName, status, role);
    return res.json(result);
  } catch (err: any) {
    logger.error({ err }, 'Error in approval email endpoint');
    return res.status(500).json({ error: err.message || 'Failed to send approval email' });
  }
});

router.post('/notifications/email/announcement', async (req: Request, res: Response) => {
  try {
    const { to, title, content, category, authorName } = req.body;
    if (!to || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields: to, title, content' });
    }
    const result = await sendAnnouncementEmail(to, title, content, category || 'general', authorName || 'ITIC Team');
    return res.json(result);
  } catch (err: any) {
    logger.error({ err }, 'Error in announcement email endpoint');
    return res.status(500).json({ error: err.message || 'Failed to send announcement email' });
  }
});

router.post('/notifications/email/event', async (req: Request, res: Response) => {
  try {
    const { to, title, date, time, venue, description } = req.body;
    if (!to || !title || !date) {
      return res.status(400).json({ error: 'Missing required fields: to, title, date' });
    }
    const result = await sendEventEmail(to, title, date, time || '', venue || '', description || '');
    return res.json(result);
  } catch (err: any) {
    logger.error({ err }, 'Error in event email endpoint');
    return res.status(500).json({ error: err.message || 'Failed to send event email' });
  }
});

router.post('/notifications/email/attendance', async (req: Request, res: Response) => {
  try {
    const { to, fullName, eventTitle, checkedInAt } = req.body;
    if (!to || !fullName || !eventTitle) {
      return res.status(400).json({ error: 'Missing required fields: to, fullName, eventTitle' });
    }
    const result = await sendAttendanceConfirmationEmail(to, fullName, eventTitle, checkedInAt || new Date().toISOString());
    return res.json(result);
  } catch (err: any) {
    logger.error({ err }, 'Error in attendance email endpoint');
    return res.status(500).json({ error: err.message || 'Failed to send attendance email' });
  }
});

// ─── Push Notification Endpoints ─────────────────────────────────────────────

router.post('/notifications/push/send', async (req: Request, res: Response) => {
  try {
    const { pushTokens, title, body, data } = req.body;
    if (!pushTokens || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields: pushTokens, title, body' });
    }
    const result = await sendExpoPushNotifications([
      {
        to: pushTokens,
        title,
        body,
        data,
      },
    ]);
    return res.json(result);
  } catch (err: any) {
    logger.error({ err }, 'Error in push notification endpoint');
    return res.status(500).json({ error: err.message || 'Failed to send push notification' });
  }
});

// ─── Test Endpoints ───────────────────────────────────────────────────────────

router.post('/notifications/test', async (req: Request, res: Response) => {
  try {
    const { email, pushToken } = req.body;
    const results: Record<string, unknown> = {};

    if (email) {
      results.email = await sendEmail({
        to: email,
        subject: '⚡ ITIC Portal Test Notification',
        html: `
          <h2 style="color: #ffffff;">Test Notification Received!</h2>
          <p>Your email notification system using <strong>Resend</strong> is configured and operating correctly.</p>
        `,
      });
    }

    if (pushToken) {
      results.push = await sendExpoPushNotifications([
        {
          to: pushToken,
          title: '⚡ ITIC Test Push Notification',
          body: 'Push notifications are working smoothly!',
          data: { test: true },
        },
      ]);
    }

    return res.json({ success: true, results });
  } catch (err: any) {
    logger.error({ err }, 'Error in notification test endpoint');
    return res.status(500).json({ error: err.message || 'Test failed' });
  }
});

export default router;
