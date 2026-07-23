/**
 * leaderboard.tsx — XP leaderboard for all active members.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, RefreshControl, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { AvatarDisplay } from '@/components/CartoonAvatars';
import { calcXP, getLevelProgress, LeaderEntry } from '@/components/Gamification';
import * as db from '@/services/db';
import { User } from '@/types';

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === 'web' ? 24 : insets.top + 8;

  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const all = await db.getAllMembers();
      const active = all.filter(m => m.status === 'active');
      const counts = await db.getMembersAttendanceCounts(active.map(m => m.id));

      const ranked: LeaderEntry[] = active
        .map(m => {
          const days = Math.max(0, Math.floor((Date.now() - new Date(m.joinedDate).getTime()) / 86400000));
          const xp = calcXP(counts[m.id] ?? 0, m.profileCompleteness, days);
          return { rank: 0, user: m, xp, attendanceCount: counts[m.id] ?? 0 };
        })
        .sort((a, b) => b.xp - a.xp)
        .map((e, i) => ({ ...e, rank: i + 1 }));

      setEntries(ranked);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const myEntry = entries.find(e => e.user.id === user?.id);
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.headerWrap}>
        <LinearGradient
          colors={[colors.primary + '25', colors.primary + '05', 'transparent']}
          style={styles.headerGrad}
        >
          <Text style={styles.headerEmoji}>🏆</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Leaderboard</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Earn XP by attending events, completing your profile, and staying active
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* My rank banner */}
      {myEntry && (
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <View style={[styles.myRankBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}>
            <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.myRankText, { color: colors.foreground }]}>
              You're ranked <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>#{myEntry.rank}</Text> with{' '}
              <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>{myEntry.xp} XP</Text>
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Podium — top 3 */}
      {top3.length >= 3 && (
        <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.podium}>
          {/* 2nd place */}
          <PodiumCard entry={top3[1]} isMe={top3[1].user.id === user?.id} height={100} />
          {/* 1st place */}
          <PodiumCard entry={top3[0]} isMe={top3[0].user.id === user?.id} height={130} />
          {/* 3rd place */}
          <PodiumCard entry={top3[2]} isMe={top3[2].user.id === user?.id} height={80} />
        </Animated.View>
      )}

      {/* Rest of list */}
      {rest.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rankings</Text>
          {rest.map((entry, i) => (
            <LeaderRow key={entry.user.id} entry={entry} isMe={entry.user.id === user?.id} delay={i * 30} />
          ))}
        </>
      )}

      {entries.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="trophy-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active members yet</Text>
        </View>
      )}
    </ScrollView>
  );
}

function PodiumCard({ entry, isMe, height }: { entry: LeaderEntry; isMe: boolean; height: number }) {
  const colors = useColors();
  const { level } = getLevelProgress(entry.xp);
  const initials = entry.user.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';
  const rankEmoji: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const podiumColors: Record<number, [string, string]> = {
    1: [colors.primary + '25', colors.primary + '08'],
    2: ['#94a3b820', '#94a3b808'],
    3: ['#b4530920', '#b4530908'],
  };

  return (
    <View style={[styles.podiumCard, { height, borderColor: isMe ? colors.primary + '50' : colors.border }]}>
      <LinearGradient colors={podiumColors[entry.rank]} style={StyleSheet.absoluteFill} />
      <Text style={styles.podiumEmoji}>{rankEmoji[entry.rank]}</Text>
      <View style={[styles.podiumAvatar, { borderColor: colors.border }]}>
        <AvatarDisplay profilePicture={entry.user.profilePicture} size={40} initials={initials} primaryColor={colors.primary} static />
      </View>
      <Text style={[styles.podiumName, { color: colors.foreground }]} numberOfLines={1}>
        {entry.user.fullName.split(' ')[0]}
      </Text>
      <View style={[styles.podiumXP, { backgroundColor: level.color + '20' }]}>
        <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: level.color }}>{entry.xp} XP</Text>
      </View>
    </View>
  );
}

function LeaderRow({ entry, isMe, delay }: { entry: LeaderEntry; isMe: boolean; delay: number }) {
  const colors = useColors();
  const { level } = getLevelProgress(entry.xp);
  const initials = entry.user.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[
        styles.row,
        {
          backgroundColor: isMe ? colors.primary + '10' : colors.card,
          borderColor: isMe ? colors.primary + '40' : colors.border,
        }
      ]}
    >
      <View style={[styles.rankWrap, { backgroundColor: colors.muted }]}>
        <Text style={[styles.rankText, { color: colors.mutedForeground }]}>#{entry.rank}</Text>
      </View>

      <View style={[styles.rowAvatar, { borderColor: colors.border }]}>
        <AvatarDisplay profilePicture={entry.user.profilePicture} size={36} initials={initials} primaryColor={colors.primary} static />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
          {entry.user.fullName}{isMe ? ' (You)' : ''}
        </Text>
        <Text style={[styles.rowLevel, { color: level.color }]}>{level.icon} {level.name} · {entry.attendanceCount} events</Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.rowXP, { color: colors.foreground }]}>{entry.xp}</Text>
        <Text style={[styles.rowXPLabel, { color: colors.mutedForeground }]}>XP</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, gap: 14 },
  headerWrap: { marginHorizontal: -16 },
  headerGrad: { alignItems: 'center', gap: 6, paddingVertical: 24, paddingHorizontal: 24 },
  headerEmoji: { fontSize: 42 },
  headerTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
  myRankBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 14, borderWidth: 1,
  },
  myRankText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 4 },
  podiumCard: {
    flex: 1, borderRadius: 16, borderWidth: 1, alignItems: 'center',
    justifyContent: 'flex-end', paddingBottom: 10, gap: 4, overflow: 'hidden',
  },
  podiumEmoji: { fontSize: 18, position: 'absolute', top: 8 },
  podiumAvatar: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  podiumName: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textAlign: 'center', paddingHorizontal: 4 },
  podiumXP: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    borderRadius: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  rankWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  rowAvatar: { width: 38, height: 38, borderRadius: 10, overflow: 'hidden', borderWidth: 1 },
  rowName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  rowLevel: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 1 },
  rowXP: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  rowXPLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
