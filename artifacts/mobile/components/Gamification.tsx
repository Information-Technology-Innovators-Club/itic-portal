/**
 * Gamification.tsx
 * Points, levels, badges, and streaks for the ITIC member portal.
 * Everything is computed client-side from attendance records + profile data.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AttendanceRecord, User } from '@/types';
import { useColors } from '@/hooks/useColors';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Level {
  name: string;
  icon: string;
  color: string;
  gradient: [string, string];
  minXP: number;
  maxXP: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  earned: boolean;
}

// ─── Levels ───────────────────────────────────────────────────────────────────

export const LEVELS: Level[] = [
  { name: 'Rookie',    icon: '🌱', color: '#94a3b8', gradient: ['#cbd5e1', '#94a3b8'], minXP: 0,    maxXP: 99   },
  { name: 'Explorer',  icon: '🔭', color: '#3b82f6', gradient: ['#60a5fa', '#3b82f6'], minXP: 100,  maxXP: 249  },
  { name: 'Builder',   icon: '⚙️', color: '#f59e0b', gradient: ['#fcd34d', '#f59e0b'], minXP: 250,  maxXP: 499  },
  { name: 'Innovator', icon: '🚀', color: '#8b5cf6', gradient: ['#a78bfa', '#8b5cf6'], minXP: 500,  maxXP: 999  },
  { name: 'Legend',    icon: '👑', color: '#ef4444', gradient: ['#f87171', '#dc2626'], minXP: 1000, maxXP: 9999 },
];

// ─── Calculations ─────────────────────────────────────────────────────────────

export function calcXP(attendanceCount: number, profileCompleteness: number, daysActive: number): number {
  const attendanceXP = attendanceCount * 15;
  const profileXP = Math.round((profileCompleteness / 100) * 50);
  const loyaltyXP = Math.min(Math.floor(daysActive / 7) * 2, 100); // 2 XP/week, cap 100
  return attendanceXP + profileXP + loyaltyXP;
}

export function getLevel(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getLevelProgress(xp: number): { level: Level; nextLevel: Level | null; progress: number } {
  const level = getLevel(xp);
  const levelIndex = LEVELS.indexOf(level);
  const nextLevel = levelIndex < LEVELS.length - 1 ? LEVELS[levelIndex + 1] : null;
  const progress = nextLevel
    ? (xp - level.minXP) / (nextLevel.minXP - level.minXP)
    : 1;
  return { level, nextLevel, progress: Math.min(Math.max(progress, 0), 1) };
}

/**
 * Calculate attendance streak in weeks.
 * A streak = consecutive ISO weeks with at least 1 attendance record.
 */
export function calcStreak(records: AttendanceRecord[]): number {
  if (records.length === 0) return 0;

  function isoWeek(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  const weeks = new Set(
    records.map(r => isoWeek(new Date(r.checkedInAt)))
  );

  const currentWeek = isoWeek(new Date());
  let streak = 0;
  const d = new Date();

  for (let i = 0; i < 52; i++) {
    const w = isoWeek(d);
    if (weeks.has(w)) {
      streak++;
      d.setDate(d.getDate() - 7);
    } else if (i === 0 && w === currentWeek) {
      // Allow current week to not count yet
      d.setDate(d.getDate() - 7);
    } else {
      break;
    }
  }

  return streak;
}

export function calcBadges(user: User, attendance: AttendanceRecord[]): Badge[] {
  const daysActive = Math.floor((Date.now() - new Date(user.joinedDate).getTime()) / 86400000);
  const meetingAttendance = attendance.filter(a =>
    a.eventTitle.toLowerCase().includes('meeting')
  );

  return [
    {
      id: 'first_step',
      name: 'First Step',
      description: 'Attend your first event',
      icon: 'footsteps-outline',
      color: '#3b82f6',
      earned: attendance.length >= 1,
    },
    {
      id: 'team_player',
      name: 'Team Player',
      description: 'Attend 5 events',
      icon: 'people-outline',
      color: '#8b5cf6',
      earned: attendance.length >= 5,
    },
    {
      id: 'dedicated',
      name: 'Dedicated',
      description: 'Attend 10 events',
      icon: 'trophy-outline',
      color: '#f59e0b',
      earned: attendance.length >= 10,
    },
    {
      id: 'complete_profile',
      name: 'Complete',
      description: 'Fill out your full profile',
      icon: 'checkmark-circle-outline',
      color: '#22c55e',
      earned: user.profileCompleteness >= 90,
    },
    {
      id: 'meeting_regular',
      name: 'Consistent',
      description: 'Attend 3+ meetings',
      icon: 'calendar-outline',
      color: '#ec4899',
      earned: meetingAttendance.length >= 3,
    },
    {
      id: 'itic_og',
      name: 'ITIC OG',
      description: 'Member for 90+ days',
      icon: 'star-outline',
      color: '#ef4444',
      earned: daysActive >= 90,
    },
  ];
}

// ─── XP Progress Bar ──────────────────────────────────────────────────────────

export function XPBar({ xp, delay = 0 }: { xp: number; delay?: number }) {
  const colors = useColors();
  const { level, nextLevel, progress } = getLevelProgress(xp);
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withDelay(delay + 400, withTiming(progress, { duration: 900 }));
  }, [progress, delay, width]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={xpStyles.container}>
      {/* Level badge + XP */}
      <View style={xpStyles.header}>
        <View style={[xpStyles.levelBadge, { backgroundColor: level.color + '20', borderColor: level.color + '40' }]}>
          <Text style={xpStyles.levelIcon}>{level.icon}</Text>
          <Text style={[xpStyles.levelName, { color: level.color }]}>{level.name}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[xpStyles.xpValue, { color: colors.foreground }]}>{xp} XP</Text>
          {nextLevel && (
            <Text style={[xpStyles.xpNext, { color: colors.mutedForeground }]}>
              {nextLevel.minXP - xp} to {nextLevel.name}
            </Text>
          )}
        </View>
      </View>

      {/* Bar */}
      <View style={[xpStyles.track, { backgroundColor: colors.muted }]}>
        <Animated.View style={barStyle}>
          <LinearGradient
            colors={level.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={xpStyles.fill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const xpStyles = StyleSheet.create({
  container: { gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  levelIcon: { fontSize: 14 },
  levelName: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
  xpValue: { fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  xpNext: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});

// ─── Streak Widget ────────────────────────────────────────────────────────────

export function StreakWidget({ streak, delay = 0 }: { streak: number; delay?: number }) {
  const colors = useColors();
  const flames = Math.min(streak, 5);
  const color = streak === 0 ? colors.mutedForeground : streak < 3 ? '#f59e0b' : '#ef4444';

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[streakStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[streakStyles.iconWrap, { backgroundColor: color + '15' }]}>
        {streak > 0
          ? <Text style={streakStyles.fire}>{'🔥'.repeat(flames)}</Text>
          : <Ionicons name="flame-outline" size={22} color={colors.mutedForeground} />
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[streakStyles.value, { color: colors.foreground }]}>
          {streak} week{streak !== 1 ? 's' : ''}
        </Text>
        <Text style={[streakStyles.label, { color: colors.mutedForeground }]}>attendance streak</Text>
      </View>
      {streak >= 3 && (
        <View style={[streakStyles.hotBadge, { backgroundColor: '#ef444415', borderColor: '#ef444430' }]}>
          <Text style={[streakStyles.hotText, { color: '#ef4444' }]}>On fire!</Text>
        </View>
      )}
    </Animated.View>
  );
}

const streakStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fire: { fontSize: 18 },
  value: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  label: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  hotBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  hotText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
});

// ─── Badge Row ────────────────────────────────────────────────────────────────

export function BadgeRow({ badges, delay = 0 }: { badges: Badge[]; delay?: number }) {
  const colors = useColors();
  const earned = badges.filter(b => b.earned);
  const unearned = badges.filter(b => !b.earned);
  const display = [...earned, ...unearned].slice(0, 4);

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[badgeStyles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={badgeStyles.header}>
        <Text style={[badgeStyles.title, { color: colors.foreground }]}>Badges</Text>
        <View style={[badgeStyles.countChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <Text style={[badgeStyles.countText, { color: colors.primary }]}>{earned.length}/{badges.length}</Text>
        </View>
      </View>
      <View style={badgeStyles.grid}>
        {display.map((badge, i) => (
          <Animated.View
            key={badge.id}
            entering={FadeInRight.delay(delay + i * 60).springify()}
            style={[
              badgeStyles.badge,
              {
                backgroundColor: badge.earned ? badge.color + '15' : colors.muted,
                borderColor: badge.earned ? badge.color + '35' : colors.border,
                opacity: badge.earned ? 1 : 0.45,
              }
            ]}
          >
            <Ionicons name={badge.icon} size={20} color={badge.earned ? badge.color : colors.mutedForeground} />
            <Text style={[badgeStyles.badgeName, { color: badge.earned ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
              {badge.name}
            </Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    padding: 16, borderRadius: 16, borderWidth: 1, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  countChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  countText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  grid: { flexDirection: 'row', gap: 8 },
  badge: {
    flex: 1, alignItems: 'center', gap: 5, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  badgeName: { fontSize: 9, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
});

// ─── Leaderboard Row ──────────────────────────────────────────────────────────

export interface LeaderEntry {
  rank: number;
  user: User;
  xp: number;
  attendanceCount: number;
}

export function LeaderRow({ entry, isMe, delay = 0 }: { entry: LeaderEntry; isMe: boolean; delay?: number }) {
  const colors = useColors();
  const { level } = getLevelProgress(entry.xp);
  const initials = entry.user.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  const rankColors: Record<number, string> = { 1: '#f59e0b', 2: '#94a3b8', 3: '#b45309' };
  const rankColor = rankColors[entry.rank] ?? colors.mutedForeground;
  const rankEmoji: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[
        leaderStyles.row,
        {
          backgroundColor: isMe ? colors.primary + '10' : colors.card,
          borderColor: isMe ? colors.primary + '40' : colors.border,
        }
      ]}
    >
      {/* Rank */}
      <View style={[leaderStyles.rankWrap, { backgroundColor: rankColor + '15' }]}>
        {entry.rank <= 3
          ? <Text style={leaderStyles.rankEmoji}>{rankEmoji[entry.rank]}</Text>
          : <Text style={[leaderStyles.rankNum, { color: rankColor }]}>#{entry.rank}</Text>
        }
      </View>

      {/* Avatar */}
      <View style={[leaderStyles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={leaderStyles.avatarText}>{initials}</Text>
      </View>

      {/* Name + level */}
      <View style={{ flex: 1 }}>
        <Text style={[leaderStyles.name, { color: colors.foreground }]} numberOfLines={1}>
          {entry.user.fullName}{isMe ? ' (You)' : ''}
        </Text>
        <Text style={[leaderStyles.level, { color: level.color }]}>
          {level.icon} {level.name}
        </Text>
      </View>

      {/* XP */}
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[leaderStyles.xp, { color: colors.foreground }]}>{entry.xp}</Text>
        <Text style={[leaderStyles.xpLabel, { color: colors.mutedForeground }]}>XP</Text>
      </View>
    </Animated.View>
  );
}

const leaderStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    borderRadius: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  rankWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rankEmoji: { fontSize: 18 },
  rankNum: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  avatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  name: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  level: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 1 },
  xp: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  xpLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
});
