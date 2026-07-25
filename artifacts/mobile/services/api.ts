import { User, Announcement, Event } from '@/types';

// Default to localhost:3000 or EXPO_PUBLIC_API_URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Helper to call backend API server endpoints safely with fallback.
 */
async function callApi(endpoint: string, data: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`API server returned ${res.status} for ${endpoint}:`, errText);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`Could not connect to API server at ${API_URL}${endpoint}:`, err);
    return null;
  }
}

export async function apiSendWelcomeEmail(user: User) {
  if (!user.email) return;
  return callApi('/notifications/email/welcome', {
    to: user.email,
    fullName: user.fullName,
    memberId: user.memberId,
  });
}

export async function apiSendApprovalEmail(user: User, status: string, role: string) {
  if (!user.email) return;
  return callApi('/notifications/email/approval', {
    to: user.email,
    fullName: user.fullName,
    status,
    role,
  });
}

export async function apiSendAnnouncementBroadcast(
  recipients: { email?: string; pushToken?: string }[],
  announcement: Announcement
) {
  const emails = recipients
    .map(r => r.email)
    .filter((e): e is string => !!e && e.includes('@'));

  const pushTokens = recipients
    .map(r => r.pushToken)
    .filter((t): t is string => !!t && t.length > 0);

  const promises: Promise<unknown>[] = [];

  if (emails.length > 0) {
    promises.push(
      callApi('/notifications/email/announcement', {
        to: emails,
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        authorName: announcement.authorName,
      })
    );
  }

  if (pushTokens.length > 0) {
    promises.push(
      callApi('/notifications/push/send', {
        pushTokens,
        title: `📢 Announcement: ${announcement.title}`,
        body: announcement.content.substring(0, 120) + (announcement.content.length > 120 ? '...' : ''),
        data: { linkTarget: `/announcement/${announcement.id}` },
      })
    );
  }

  return Promise.allSettled(promises);
}

export async function apiSendEventNotification(
  recipients: { email?: string; pushToken?: string }[],
  event: Event
) {
  const emails = recipients.map(r => r.email).filter((e): e is string => !!e);
  const pushTokens = recipients.map(r => r.pushToken).filter((t): t is string => !!t);

  const promises: Promise<unknown>[] = [];

  if (emails.length > 0) {
    promises.push(
      callApi('/notifications/email/event', {
        to: emails,
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        description: event.description,
      })
    );
  }

  if (pushTokens.length > 0) {
    promises.push(
      callApi('/notifications/push/send', {
        pushTokens,
        title: `🗓️ New Event: ${event.title}`,
        body: `${event.date} at ${event.venue || 'ITIC'}. Tap to view details.`,
        data: { linkTarget: `/event/${event.id}` },
      })
    );
  }

  return Promise.allSettled(promises);
}

export async function apiSendAttendanceConfirmation(
  user: User,
  eventTitle: string,
  checkedInAt: string
) {
  const promises: Promise<unknown>[] = [];

  if (user.email) {
    promises.push(
      callApi('/notifications/email/attendance', {
        to: user.email,
        fullName: user.fullName,
        eventTitle,
        checkedInAt,
      })
    );
  }

  if (user.pushToken) {
    promises.push(
      callApi('/notifications/push/send', {
        pushTokens: [user.pushToken],
        title: '✅ Attendance Confirmed',
        body: `Checked into ${eventTitle} successfully!`,
        data: { type: 'attendance' },
      })
    );
  }

  return Promise.allSettled(promises);
}

export async function apiSendTestNotification(email?: string, pushToken?: string) {
  return callApi('/notifications/test', { email, pushToken });
}
