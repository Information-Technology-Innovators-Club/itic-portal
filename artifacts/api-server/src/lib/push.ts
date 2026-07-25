import { logger } from './logger';

export interface PushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Sends push notifications via Expo Push API HTTP Endpoint.
 * Support single or multiple push tokens.
 */
export async function sendExpoPushNotifications(messages: PushMessage[]) {
  if (messages.length === 0) return { success: true, count: 0 };

  // Flatten and prepare payload
  const pushPayloads: Array<{
    to: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    sound?: string;
    badge?: number;
    channelId?: string;
  }> = [];

  for (const msg of messages) {
    const tokens = Array.isArray(msg.to) ? msg.to : [msg.to];
    for (const token of tokens) {
      if (token && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))) {
        pushPayloads.push({
          to: token,
          title: msg.title,
          body: msg.body,
          data: msg.data || {},
          sound: msg.sound !== undefined ? (msg.sound === null ? undefined : msg.sound) : 'default',
          badge: msg.badge,
          channelId: msg.channelId || 'default',
        });
      } else {
        logger.debug({ token }, 'Skipping invalid or empty Expo push token');
      }
    }
  }

  if (pushPayloads.length === 0) {
    logger.info('No valid Expo push tokens to send');
    return { success: true, count: 0, sent: 0 };
  }

  // Batch into chunks of 100 per Expo documentation
  const chunkSize = 100;
  const chunks: typeof pushPayloads[] = [];
  for (let i = 0; i < pushPayloads.length; i += chunkSize) {
    chunks.push(pushPayloads.slice(i, i + chunkSize));
  }

  let successCount = 0;
  const errors: unknown[] = [];

  for (const chunk of chunks) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ status: response.status, body: errorText }, 'Expo push endpoint returned error');
        errors.push(errorText);
        continue;
      }

      const resData = (await response.json()) as { data?: ExpoPushTicket[] };
      if (resData.data) {
        for (const ticket of resData.data) {
          if (ticket.status === 'ok') {
            successCount++;
          } else {
            logger.warn({ ticket }, 'Expo push ticket returned error status');
          }
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error sending Expo push notification chunk');
      errors.push(err);
    }
  }

  logger.info({ totalPayloads: pushPayloads.length, successCount }, 'Finished sending Expo push notifications');
  return {
    success: errors.length === 0,
    total: pushPayloads.length,
    sent: successCount,
    errors,
  };
}
