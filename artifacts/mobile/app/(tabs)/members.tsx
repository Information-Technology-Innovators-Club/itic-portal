/**
 * members.tsx — Public member directory.
 * Visible to all active members (not just executives).
 * Shows avatar, name, programme, skills, and level.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Platform, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { GlassCard } from '@/components/GlassCard';
import { AvatarDisplay } from '@/components/CartoonAvatars';
import { RoleBadge } from '@/components/ui/Badge';
import { calcXP, getLevel } from '@/components/Gamification';
import * as db from '@/services/db';
import { User } from '@/types';
import { supabase } from '@/services/supabase';

const SKILL_FILTERS = ['All', 'Web Dev', 'Mobile', 'AI/ML', 'Cybersecurity', 'UI/UX', 'Data Science'];

export default function MembersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === 'web' ? 24 : insets.top + 8;

  const [members, setMembers] = useState<User[]>([]);
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await db.getAllMembers();
      // Only show active members in the public directory
      const active = all.filter(m => m.status === 'active');
      setMembers(active);

      // Fetch attendance counts for XP calculation
      const counts = await db.getMembersAttendanceCounts(active.map(m => m.id));
      setAttendanceCounts(counts);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const chan = supabase
      .channel('members-dir')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'profiles' }, () => {
        load();
      })
      .subscribe();
    channelRef.current = chan;
    return () => { chan.unsubscribe(); };
  }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const filtered = members
    .filter(m => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        m.fullName?.toLowerCase().includes(q) ||
        m.programme?.toLowerCase().includes(q) ||
        m.faculty?.toLowerCase().includes(q) ||
        m.memberId?.toLowerCase().includes(q)
      );
    })
    .filter(m => {
      if (skillFilter === 'All') return true;
      const haystack = [
        ...m.technologyInterests,
        ...m.programmingLanguages,
      ].join(' ').toLowerCase();
      return haystack.includes(skillFilter.toLowerCase());
    })
    // Sort by XP descending
    .sort((a, b) => {
      const xpA = calcXP(attendanceCounts[a.id] ?? 0, a.profileCompleteness, daysActive(a.joinedDate));
      const xpB = calcXP(attendanceCounts[b.id] ?? 0, b.profileCompleteness, daysActive(b.joinedDate));
      return xpB - xpA;
    });

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Members</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {members.length} active member{members.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
            <Ionicons name="people" size={14} color={colors.primary} />
            <Text style={[styles.countBadgeText, { color: colors.primary }]}>{filtered.length}</Text>
          </View>
        </View>

        {/* Search */}
        <Input
          placeholder="Search by name, programme, ID…"
          value={search}
          onChangeText={setSearch}
          leftIcon="search-outline"
        />

        {/* Skill filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {SKILL_FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setSkillFilter(f)}
              style={[
                styles.chip,
                {
                  backgroundColor: skillFilter === f ? colors.primary : colors.muted,
                  borderColor: skillFilter === f ? colors.primary : colors.border,
                }
              ]}
            >
              <Text style={[styles.chipText, { color: skillFilter === f ? '#fff' : colors.mutedForeground }]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filtered.length === 0 ? (
          <GlassCard style={styles.empty}>
            <Ionicons name="search-outline" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No members found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Try a different name or clear the filter
            </Text>
          </GlassCard>
        ) : (
          filtered.map((m, i) => {
            const count = attendanceCounts[m.id] ?? 0;
            const days = daysActive(m.joinedDate);
            const xp = calcXP(count, m.profileCompleteness, days);
            const level = getLevel(xp);
            const isMe = m.id === user?.id;
            const isExpanded = expandedId === m.id;
            const initials = m.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

            return (
              <Animated.View key={m.id} entering={FadeInDown.delay(i * 30).springify()}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setExpandedId(isExpanded ? null : m.id)}
                  style={[
                    styles.card,
                    {
                      backgroundColor: isMe ? colors.primary + '08' : colors.card,
                      borderColor: isMe ? colors.primary + '40' : colors.border,
                    }
                  ]}
                >
                  {/* Main row */}
                  <View style={styles.cardRow}>
                    {/* Rank */}
                    <View style={[styles.rankBadge, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.rankText, { color: colors.mutedForeground }]}>#{i + 1}</Text>
                    </View>

                    {/* Avatar */}
                    <View style={[styles.avatarWrap, { borderColor: colors.border }]}>
                      <AvatarDisplay
                        profilePicture={m.profilePicture}
                        size={48}
                        initials={initials}
                        primaryColor={colors.primary}
                        static
                      />
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.memberName, { color: colors.foreground }]} numberOfLines={1}>
                          {m.fullName}
                        </Text>
                        {isMe && (
                          <View style={[styles.youBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                            <Text style={[styles.youText, { color: colors.primary }]}>You</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.memberSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {m.programme || m.faculty || m.memberId}
                      </Text>
                      {/* Level chip */}
                      <View style={[styles.levelChip, { backgroundColor: level.color + '15', borderColor: level.color + '30' }]}>
                        <Text style={styles.levelEmoji}>{level.icon}</Text>
                        <Text style={[styles.levelName, { color: level.color }]}>{level.name}</Text>
                        <Text style={[styles.levelXP, { color: level.color }]}>{xp} XP</Text>
                      </View>
                    </View>

                    {/* Role + chevron */}
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <RoleBadge role={m.role} />
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14} color={colors.mutedForeground}
                      />
                    </View>
                  </View>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <Animated.View entering={FadeInDown.duration(180)} style={[styles.drawer, { borderTopColor: colors.border }]}>
                      {/* Stats row */}
                      <View style={styles.statsRow}>
                        <StatPill label="Events" value={count} color={colors.primary} />
                        <StatPill label="Days Active" value={days} color="#8b5cf6" />
                        <StatPill label="Profile" value={`${m.profileCompleteness}%`} color="#22c55e" />
                      </View>

                      {/* Skills */}
                      {(m.technologyInterests.length > 0 || m.programmingLanguages.length > 0) && (
                        <>
                          <Text style={[styles.drawerSection, { color: colors.mutedForeground }]}>Skills & Interests</Text>
                          <View style={styles.tagWrap}>
                            {m.technologyInterests.slice(0, 4).map(t => (
                              <View key={t} style={[styles.tag, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                                <Text style={[styles.tagText, { color: colors.primary }]}>{t}</Text>
                              </View>
                            ))}
                            {m.programmingLanguages.slice(0, 4).map(l => (
                              <View key={l} style={[styles.tag, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                                <Text style={[styles.tagText, { color: colors.foreground }]}>{l}</Text>
                              </View>
                            ))}
                          </View>
                        </>
                      )}

                      {/* Academic info */}
                      {(m.programme || m.academicLevel) && (
                        <>
                          <Text style={[styles.drawerSection, { color: colors.mutedForeground }]}>Academic</Text>
                          <View style={styles.detailGrid}>
                            {m.programme && <DetailItem label="Programme" value={m.programme} colors={colors} />}
                            {m.academicLevel && <DetailItem label="Level" value={m.academicLevel} colors={colors} />}
                            {m.faculty && <DetailItem label="Faculty" value={m.faculty} colors={colors} />}
                            {m.experienceLevel && <DetailItem label="Experience" value={m.experienceLevel} colors={colors} />}
                          </View>
                        </>
                      )}

                      {/* Member ID */}
                      <View style={[styles.memberIdRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                        <Ionicons name="card-outline" size={14} color={colors.mutedForeground} />
                        <Text style={[styles.memberIdText, { color: colors.foreground }]}>{m.memberId}</Text>
                      </View>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function daysActive(joinedDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(joinedDate).getTime()) / 86400000));
}

function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colors = useColors();
  return (
    <View style={[statStyles.pill, { backgroundColor: color + '12', borderColor: color + '25' }]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}
const statStyles = StyleSheet.create({
  pill: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 1, gap: 2 },
  value: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  label: { fontSize: 10, fontFamily: 'Inter_400Regular' },
});

function DetailItem({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={detailStyles.item}>
      <Text style={[detailStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[detailStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}
const detailStyles = StyleSheet.create({
  item: { width: '47%' },
  label: { fontSize: 10, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  value: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { gap: 10, paddingBottom: 12, borderBottomWidth: 1, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  countBadgeText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  scroll: { padding: 16, gap: 10 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  card: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  rankBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  avatarWrap: { width: 50, height: 50, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  memberName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', flex: 1 },
  memberSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  levelChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
    alignSelf: 'flex-start', marginTop: 4,
  },
  levelEmoji: { fontSize: 10 },
  levelName: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  levelXP: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  youBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  youText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  drawer: { borderTopWidth: 1, paddingHorizontal: 14, paddingBottom: 14, gap: 10, paddingTop: 12 },
  statsRow: { flexDirection: 'row', gap: 8 },
  drawerSection: {
    fontSize: 10, fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  memberIdRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  memberIdText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
});
