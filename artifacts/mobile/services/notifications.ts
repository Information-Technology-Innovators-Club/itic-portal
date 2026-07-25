import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { savePushToken } from './db';

// Configure default notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers the device for Expo Push Notifications and returns the token string.
 * Also configures Android channels.
 */
export async function registerForPushNotificationsAsync(userId?: string): Promise<string | null> {
  let token: string | null = null;

  // The app uses native Expo push notifications. Web push requires a separate
  // VAPID/browser subscription setup, so never request an Expo token on web.
  if (Platform.OS === 'web') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ITIC Portal Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied by user.');
      return null;
    }

    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync();
      token = pushTokenData.data;
      console.log('Expo Push Token generated successfully:', token);
    } catch (err) {
      console.error('Error fetching Expo push token:', err);
    }

    if (userId && token) await savePushToken(userId, token);
  } else {
    console.log('Push notifications require a physical device or full simulator setup.');
  }

  return token;
}

/**
 * Trigger a immediate local push notification on device.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<boolean> {
  // expo-notifications does not implement local scheduling on web. Use the
  // browser Notification API instead; it needs no VAPID key for local alerts.
  if (Platform.OS === 'web') {
    if (!('Notification' in globalThis)) return false;
    const permission = globalThis.Notification.permission === 'granted'
      ? 'granted'
      : await globalThis.Notification.requestPermission();
    if (permission !== 'granted') return false;
    new globalThis.Notification(title, { body });
    return true;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: null, // trigger immediately
  });
  return true;
}

/**
 * Setup listeners for incoming notification interactions.
 */
export function setupNotificationListeners(onNotificationResponse?: (data: Record<string, unknown>) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (onNotificationResponse && data) {
      onNotificationResponse(data);
    }
  });

  return () => {
    subscription.remove();
  };
}
