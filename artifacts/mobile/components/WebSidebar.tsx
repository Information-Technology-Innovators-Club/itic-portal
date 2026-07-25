import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { AvatarDisplay } from '@/components/CartoonAvatars';

const ROUTE_LABELS: Record<string, string> = {
  index: 'Dashboard',
  members: 'Members',
  leaderboard: 'Leaderboard',
  events: 'Events',
  announcements: 'Announcements',
  leadership: 'Leadership',
  scanner: 'Attendance',
  profile: 'My Profile',
  executive: 'Management',
};

export function WebSidebar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const isPrivileged = user?.role === 'executive' || user?.role === 'admin';
  const initials = user?.fullName
    ? user.fullName.split(' ').map(name => name[0]).slice(0, 2).join('').toUpperCase()
    : 'IT';

  const visibleRoutes = state.routes.filter(route => {
    if (route.name === 'members' && !isPrivileged) return false;
    if ((route.name === 'scanner' || route.name === 'executive') && !isPrivileged) return false;
    const options = descriptors[route.key].options as typeof descriptors[string]['options'] & { href?: unknown };
    return options.href !== null;
  });

  return (
    <View style={[
      styles.sidebar,
      collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded,
      { backgroundColor: colors.card, borderRightColor: colors.border },
    ]}>
      <LinearGradient
        colors={[colors.primary, '#14532d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.brand, collapsed && styles.brandCollapsed]}
      >
        <View style={styles.brandIcon}>
          <Image source={require('../assets/images/icon.png')} style={styles.logoImage} />
        </View>
        {!collapsed && (
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>ITIC Portal</Text>
            <Text style={styles.brandSub}>Chinhoyi University</Text>
          </View>
        )}
      </LinearGradient>

      <Pressable
        onPress={() => setCollapsed(value => !value)}
        style={[styles.collapseButton, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Ionicons name={collapsed ? 'chevron-forward' : 'chevron-back'} size={15} color={colors.mutedForeground} />
      </Pressable>

      <View style={[styles.nav, collapsed && styles.navCollapsed]}>
        {!collapsed && <Text style={[styles.navLabel, { color: colors.mutedForeground }]}>WORKSPACE</Text>}
        {visibleRoutes.map(route => {
          const { options } = descriptors[route.key];
          const focused = state.routes[state.index]?.key === route.key;
          const label = ROUTE_LABELS[route.name] ?? options.title ?? route.name;
          const color = focused ? colors.primary : colors.mutedForeground;
          const icon = options.tabBarIcon?.({ focused, color, size: 20 });

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [
                styles.navItem,
                collapsed && styles.navItemCollapsed,
                focused && { backgroundColor: colors.primary + '14' },
                pressed && { opacity: 0.76 },
              ]}
            >
              <View style={[
                styles.navIcon,
                focused && { backgroundColor: colors.primary + '18' },
              ]}>
                {icon}
              </View>
              {!collapsed && (
                <Text style={[
                  styles.navText,
                  { color: focused ? colors.foreground : colors.mutedForeground },
                  focused && { fontFamily: 'Inter_700Bold' },
                ]}>
                  {label}
                </Text>
              )}
              {focused && <View style={[styles.activeBar, { backgroundColor: colors.primary }]} />}
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }, collapsed && styles.footerCollapsed]}>
        <Pressable
          onPress={() => navigation.navigate('profile')}
          style={({ pressed }) => [styles.profileRow, pressed && { opacity: 0.76 }]}
        >
          <View style={[styles.avatar, { borderColor: colors.primary + '55' }]}>
            <AvatarDisplay
              profilePicture={user?.profilePicture}
              size={38}
              initials={initials}
              primaryColor={colors.primary}
              static
            />
          </View>
          {!collapsed && <>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.foreground }]} numberOfLines={1}>
                {user?.fullName ?? 'ITIC Member'}
              </Text>
              <Text style={[styles.profileMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                {user?.memberId ?? 'Member portal'}
              </Text>
            </View>
            <Ionicons name="settings-outline" size={17} color={colors.mutedForeground} />
          </>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { borderRightWidth: 1, paddingVertical: 18, position: 'relative' },
  sidebarExpanded: { width: 260 },
  sidebarCollapsed: { width: 82 },
  brand: { marginHorizontal: 14, padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandCollapsed: { marginHorizontal: 12, justifyContent: 'center', padding: 12 },
  brandIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: 31, height: 31, resizeMode: 'contain' },
  brandName: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
  brandSub: { color: '#dcfce7', fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 2 },
  nav: { flex: 1, paddingHorizontal: 10, paddingTop: 26, gap: 4 },
  navCollapsed: { paddingHorizontal: 10, paddingTop: 30 },
  navLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.1, marginLeft: 12, marginBottom: 7 },
  navItem: { minHeight: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, position: 'relative' },
  navItemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  navIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 },
  activeBar: { position: 'absolute', right: 0, width: 3, height: 22, borderRadius: 2 },
  footer: { marginTop: 12, borderTopWidth: 1, paddingTop: 14, paddingHorizontal: 14 },
  footerCollapsed: { paddingHorizontal: 12 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 8, borderRadius: 12 },
  avatar: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  profileName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  profileMeta: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 },
  collapseButton: { position: 'absolute', top: 90, right: -13, zIndex: 2, width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
