import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { WebSidebar } from '@/components/WebSidebar';

export default function TabLayout() {
  const colors = useColors();
  const { user } = useAuth();
  const isWeb = Platform.OS === 'web';
  const isPrivileged = user?.role === 'executive' || user?.role === 'admin';
  const isActive = user?.status === 'active';

  const tabBar = {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    ...(isWeb ? {
      width: 260,
      borderTopWidth: 0,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      paddingTop: 18,
    } : {}),
  };

  return (
    <Tabs
      tabBar={isWeb ? props => <WebSidebar {...props} /> : undefined}
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabBar,
        tabBarPosition: isWeb ? 'left' : 'bottom',
        tabBarLabelPosition: isWeb ? 'beside-icon' : 'below-icon',
        tabBarItemStyle: isWeb ? { display: 'none' } : undefined,
        tabBarAllowFontScaling: false,
        sceneStyle: isWeb
          ? { width: '100%', maxWidth: 1440, alignSelf: 'center' }
          : undefined,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: isWeb ? 13 : 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Members',
          // Only executives and admins see the directory
          href: isPrivileged ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leadership"
        options={{
          title: 'Leadership',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranks',
          href: isActive || isPrivileged ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'News',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          href: isPrivileged ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="executive"
        options={{
          title: 'Manage',
          href: isPrivileged ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
