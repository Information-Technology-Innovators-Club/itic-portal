import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Event, Announcement } from '@/types';
import * as storage from '@/services/storage';
import { EventCard } from '@/components/EventCard';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge } from '@/components/ui/Badge';
import { Platform } from 'react-native';

function QuickAction({ icon, label, color, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.qaItem}>
      <View style={[styles.qaIcon, { backgroundColor: color + '18', borderRadius: colors.radius }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.qaLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const [evts, anns] = await Promise.all([storage.getEvents(), storage.getAnnouncements()]);
    setEvents(evts.filter(e => e.status === 'upcoming').slice(0, 2));
    setAnnouncements(anns.slice(0, 3));
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  useEffect(() => { loadData(); }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.fullName?.split(' ')[0] ?? 'Member';
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

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
      contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting()},</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{firstName}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Member card */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <GlassCard style={[styles.memberCard, { borderColor: colors.primary + '30' }]}>
          <View style={styles.memberCardRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.memberCardLabel, { color: colors.mutedForeground }]}>Member ID</Text>
              <Text style={[styles.memberCardId, { color: colors.primary }]}>{user?.memberId}</Text>
              <View style={styles.memberCardStatus}>
                <StatusBadge status={user?.status ?? 'pending'} />
                {user?.role !== 'member' && (
                  <View style={{ marginLeft: 6 }}>
                    <Text style={[styles.roleTag, { color: colors.primary, backgroundColor: colors.accent, borderRadius: 6 }]}>
                      {user?.role?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={[styles.memberIcon, { backgroundColor: colors.primary + '15', borderRadius: colors.radius }]}>
              <Ionicons name="id-card-outline" size={28} color={colors.primary} />
            </View>
          </View>

          {/* Profile completeness */}
          <View style={{ marginTop: 12, gap: 6 }}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>Profile Completeness</Text>
              <Text style={[styles.progressPct, { color: colors.primary }]}>{user?.profileCompleteness ?? 0}%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[styles.progressFill, { backgroundColor: colors.primary, width: `${user?.profileCompleteness ?? 0}%` }]}
              />
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Stats row */}
      <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statsRow}>
        {[
          { label: 'Events', value: '5', icon: 'calendar-outline' as const, color: '#7c3aed' },
          { label: 'Upcoming', value: events.length.toString(), icon: 'time-outline' as const, color: colors.primary },
          { label: 'Announcements', value: announcements.length.toString(), icon: 'megaphone-outline' as const, color: '#0284c7' },
        ].map(stat => (
          <GlassCard key={stat.label} style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: stat.color + '15', borderRadius: colors.radius }]}>
              <Ionicons name={stat.icon} size={20} color={stat.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
          </GlassCard>
        ))}
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <GlassCard style={styles.qaGrid}>
          <QuickAction icon="qr-code-outline" label="My QR" color={colors.primary}
            onPress={() => router.push('/(tabs)/profile')} />
          <QuickAction icon="calendar-outline" label="Events" color="#7c3aed"
            onPress={() => router.push('/(tabs)/events')} />
          <QuickAction icon="megaphone-outline" label="News" color="#0284c7"
            onPress={() => router.push('/(tabs)/announcements')} />
          <QuickAction icon="person-outline" label="Profile" color="#be185d"
            onPress={() => router.push('/(tabs)/profile')} />
        </GlassCard>
      </Animated.View>

      {/* Upcoming Events */}
      {events.length > 0 && (
        <Animated.View entering={FadeInUp.delay(250).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {events.map(e => (
            <EventCard key={e.id} event={e} compact />
          ))}
        </Animated.View>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <Animated.View entering={FadeInUp.delay(300).springify()} style={[styles.section, { paddingBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Latest Announcements</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {announcements.map(a => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, gap: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  greeting: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  name: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  memberCard: { borderWidth: 1.5 },
  memberCardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  memberCardLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  memberCardId: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, marginBottom: 6 },
  memberCardStatus: { flexDirection: 'row', alignItems: 'center' },
  roleTag: { fontSize: 10, fontFamily: 'Inter_700Bold', paddingHorizontal: 6, paddingVertical: 2 },
  memberIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  progressPct: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  progressTrack: { height: 6, borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, gap: 6, padding: 14 },
  statIconWrap: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  seeAll: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  qaGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 18 },
  qaItem: { alignItems: 'center', gap: 8 },
  qaIcon: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
