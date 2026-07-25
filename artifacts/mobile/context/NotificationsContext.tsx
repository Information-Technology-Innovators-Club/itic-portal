import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppNotification, NotificationType } from '@/types';
import { useAuth } from './AuthContext';
import {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  savePushToken,
} from '@/services/db';
import {
  registerForPushNotificationsAsync,
  scheduleLocalNotification,
  setupNotificationListeners,
} from '@/services/notifications';
import { apiSendTestNotification, apiSendWelcomeEmail, apiSendApprovalEmail } from '@/services/api';
import { useRouter } from 'expo-router';

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  pushToken: string | null;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotif: (id: string) => Promise<void>;
  sendTestPushNotification: () => Promise<void>;
  sendTestEmailNotification: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pushToken, setPushToken] = useState<string | null>(user?.pushToken || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      setIsLoading(true);
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Register push token when logged in
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    registerForPushNotificationsAsync(user.id).then(token => {
      if (token && isMounted) {
        setPushToken(token);
      }
    });

    refreshNotifications();

    // Listen for notification taps/interactions
    const cleanup = setupNotificationListeners(data => {
      if (data?.linkTarget && typeof data.linkTarget === 'string') {
        router.push(data.linkTarget as any);
      }
    });

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [user, refreshNotifications, router]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const sendTestPushNotification = async () => {
    if (!user) return;

    // Trigger local push notification immediately
    await scheduleLocalNotification(
      '⚡ ITIC Portal Test Push',
      'Push notification system is working perfectly!',
      { test: true }
    );

    // Also record in database
    const newNotif = await createNotification({
      userId: user.id,
      type: 'system',
      title: '⚡ Test Push Received',
      body: 'Your device push notification connection is active.',
      linkTarget: '/profile',
    });

    setNotifications(prev => [newNotif, ...prev]);

    // Send via backend API if push token exists
    if (pushToken) {
      await apiSendTestNotification(undefined, pushToken);
    }
  };

  const sendTestEmailNotification = async () => {
    if (!user || !user.email) return;

    // Send email test via API
    await apiSendTestNotification(user.email, undefined);

    // Add to in-app notification list
    const newNotif = await createNotification({
      userId: user.id,
      type: 'system',
      title: '📧 Test Email Sent',
      body: `A test email has been dispatched via Resend to ${user.email}.`,
      linkTarget: '/profile',
    });

    setNotifications(prev => [newNotif, ...prev]);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        pushToken,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotif,
        sendTestPushNotification,
        sendTestEmailNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
