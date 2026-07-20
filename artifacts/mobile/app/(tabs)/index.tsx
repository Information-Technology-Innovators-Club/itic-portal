import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import * as db from '@/services/db';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { EventCard } from '@/components/EventCard';
import { Announcement, Event } from '@/types';

const QUICK_ACTIONS = [
  { icon: 'calendar-outline' as const, label: 'Events', route: '/(tabs)/events' },
  { icon: 'megaphone-outline' as const, label: 'News', route: '/(tabs)/announcements' },
  { icon: 'qr-code-outline' as const, label: 'My Card', route: '/(tabs)/profile' },
  { icon: 'people-outline' as const, label: 'Members', route: '/(tabs)/executive' },
];

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, executives: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isPrivileged = user?.role === 'executive' || user?.role === 'admin';

  const load = useCallback(async () => {
    try {
      const [ann, evts, s] = await Promise.all([
        db.getAnnouncements(),
        db.getEvents(),
        isPrivileged ? db.getClubStats() : Promise.resolve({ total: 0, active: 0, pending: 0, executives: 0 }),
      ]);
      setAnnouncements(ann.slice(0, 3));
      setEvents(evts.filter(e => e.status === 'upcoming').slice(0, 3));
      if (isPrivileged) setStats(s);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isPrivileged]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const topPad = Platform.OS === 'web' ? 24 : insets.top + 8;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Greeting */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
          {timeGreeting()} 👋
        </Text>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {user?.fullName.split(' ')[0] ?? 'Member'}
        </Text>
      </Animated.View>

      {/* Member card */}
      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <GlassCard style={styles.memberCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{user?.fullName?.charAt(0) ?? 'M'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.memberName, { color: colors.foreground }]} numberOfLines={1}>
                {user?.fullName}
              </Text>
              <Text style={[styles.memberId, { color: colors.primary }]}>{user?.memberId}</Text>
              <View style={{ flexDirection: 'row', gap: 5, marginTop: 4 }}>
                <StatusBadge status={user?.status ?? 'pending'} />
                <RoleBadge role={user?.role ?? 'member'} />
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              style={[styles.viewCardBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.viewCardText, { color: colors.primary }]}>My Card</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Profile completeness */}
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[styles.progLabel, { color: colors.mutedForeground }]}>Profile completeness</Text>
              <Text style={[styles.progPct, { color: colors.primary }]}>{user?.profileCompleteness ?? 0}%</Text>
            </View>
            <View style={[styles.progBg, { backgroundColor: colors.muted }]}>
              <View
                style={[styles.progFill, {
                  backgroundColor: colors.primary,
                  width: `${user?.profileCompleteness ?? 0}%`,
                }]}
              />
            </View>
          </View>

          {user?.status === 'pending' && (
            <View style={[styles.pendingBanner, { backgroundColor: '#fef3c720', borderColor: '#f59e0b30' }]}>
              <Ionicons name="time-outline" size={14} color="#f59e0b" />
              <Text style={styles.pendingText}>Your membership is pending executive approval</Text>
            </View>
          )}
        </GlassCard>
      </Animated.View>

      {/* Stats (exec/admin only) */}
      {isPrivileged && (
        <Animated.View entering={FadeInDown.delay(90).springify()}>
          <View style={styles.statsGrid}>
            {[
              { label: 'Total', value: stats.total, icon: 'people', color: colors.primary },
              { label: 'Active', value: stats.active, icon: 'checkmark-circle', color: '#22c55e' },
              { label: 'Pending', value: stats.pending, icon: 'time', color: '#f59e0b' },
              { label: 'Exec', value: stats.executives, icon: 'shield-checkmark', color: '#3b82f6' },
            ].map(s => (
              <GlassCard key={s.label} style={styles.statCard}>
                <Ionicons name={s.icon as React.ComponentProps<typeof Ionicons>['name']} size={20} color={s.color} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </GlassCard>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Quick actions */}
      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.filter(a => a.label !== 'Members' || isPrivileged).map((action, i) => (
            <TouchableOpacity
              key={action.label}
              activeOpacity={0.7}
              onPress={() => router.push(action.route as Parameters<typeof router.push>[0])}
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={action.icon} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Upcoming events */}
      {events.length > 0 && (
        <Animated.View entering={FadeInUp.delay(150).springify()} style={{ gap: 12 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {events.map((evt, i) => (
            <Animated.View key={evt.id} entering={FadeInUp.delay(160 + i * 50).springify()}>
              <EventCard event={evt} onPress={() => router.push(`/event/${evt.id}` as Parameters<typeof router.push>[0])} />
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {/* Latest announcements */}
      {announcements.length > 0 && (
        <Animated.View entering={FadeInUp.delay(220).springify()} style={{ gap: 12 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Latest News</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {announcements.map((ann, i) => (
            <Animated.View key={ann.id} entering={FadeInUp.delay(230 + i * 50).springify()}>
              <AnnouncementCard
                announcement={ann}
                onPress={() => router.push(`/announcement/${ann.id}` as Parameters<typeof router.push>[0])}
              />
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, gap: 20 },
  greeting: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  name: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  memberCard: { gap: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  memberName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  memberId: { fontSize: 13, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  viewCardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  viewCardText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  progLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  progPct: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  progBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3 },
  pendingBanner: {
    flexDirection: 'row', gap: 7, padding: 10,
    borderRadius: 10, borderWidth: 1, alignItems: 'center',
  },
  pendingText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#f59e0b' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14 },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  actionCard: {
    width: '47%', padding: 16, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
