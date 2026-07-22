import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { Event } from '@/types';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  compact?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getCountdown(dateStr: string, timeStr: string): string {
  const target = new Date(`${dateStr}T${timeStr || '00:00'}:00`);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Starting now';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export const CATEGORY_COLORS: Record<string, string> = {
  Hackathon: '#7c3aed',
  Workshop: '#0284c7',
  Bootcamp: '#0891b2',
  Seminar: '#b45309',
  Social: '#be185d',
  Meeting: '#d97706',
  General: '#16A34A',
  Default: '#16A34A',
};

export const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Hackathon: 'flash',
  Workshop: 'construct',
  Bootcamp: 'school',
  Seminar: 'mic',
  Social: 'people',
  Meeting: 'business',
  General: 'calendar',
  Default: 'calendar',
};

export function EventCard({ event, onPress, compact = false }: EventCardProps) {
  const colors = useColors();
  const catColor = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.Default;
  const catIcon = CATEGORY_ICONS[event.category] ?? CATEGORY_ICONS.Default;
  const spotsLeft = event.maxAttendees - event.attendeeCount;
  const fillPct = Math.min(event.attendeeCount / Math.max(event.maxAttendees, 1), 1);
  const spotsLow = spotsLeft <= 10 && event.maxAttendees > 0;
  const isFull = spotsLeft <= 0;

  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (event.status !== 'upcoming') return;
    setCountdown(getCountdown(event.date, event.time));
    const interval = setInterval(() => {
      setCountdown(getCountdown(event.date, event.time));
    }, 60000);
    return () => clearInterval(interval);
  }, [event.date, event.time, event.status]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Left accent */}
        <View style={[styles.accentBar, { backgroundColor: catColor }]} />

        <View style={styles.content}>
          {/* Top row: category + status badges */}
          <View style={styles.topRow}>
            <View style={[styles.catBadge, { backgroundColor: catColor + '18', borderColor: catColor + '35' }]}>
              <Ionicons name={catIcon} size={10} color={catColor} style={{ marginRight: 4 }} />
              <Text style={[styles.catText, { color: catColor }]}>{event.category}</Text>
            </View>

            {event.status === 'ongoing' && (
              <View style={[styles.livePill, { backgroundColor: '#ef444415', borderColor: '#ef444430' }]}>
                <View style={styles.liveDot} />
                <Text style={[styles.liveText, { color: '#ef4444' }]}>LIVE</Text>
              </View>
            )}
            {event.status === 'past' && (
              <View style={[styles.catBadge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.catText, { color: colors.mutedForeground }]}>Past</Text>
              </View>
            )}
            {event.status === 'upcoming' && countdown ? (
              <View style={[styles.catBadge, { backgroundColor: catColor + '12', borderColor: catColor + '28' }]}>
                <Ionicons name="time-outline" size={10} color={catColor} style={{ marginRight: 3 }} />
                <Text style={[styles.catText, { color: catColor }]}>{countdown}</Text>
              </View>
            ) : null}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={compact ? 1 : 2}>
            {event.title}
          </Text>

          {/* Description (non-compact) */}
          {!compact && event.description ? (
            <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
              {event.description}
            </Text>
          ) : null}

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatDate(event.date)}</Text>
            </View>
            {!!event.time && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{event.time}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>{event.venue}</Text>
            </View>
          </View>

          {/* Capacity bar */}
          {!compact && (
            <View style={styles.capacitySection}>
              <View style={styles.capacityHeader}>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={12} color={isFull ? '#ef4444' : spotsLow ? '#f59e0b' : catColor} />
                  <Text style={[styles.metaText, {
                    color: isFull ? '#ef4444' : spotsLow ? '#f59e0b' : catColor,
                    fontFamily: 'Inter_600SemiBold',
                  }]}>
                    {event.attendeeCount}/{event.maxAttendees}
                  </Text>
                </View>
                {isFull ? (
                  <Text style={[styles.spotsText, { color: '#ef4444' }]}>Full</Text>
                ) : spotsLow ? (
                  <Text style={[styles.spotsText, { color: '#f59e0b' }]}>{spotsLeft} spots left!</Text>
                ) : null}
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                <View style={[
                  styles.barFill,
                  {
                    width: `${fillPct * 100}%` as `${number}%`,
                    backgroundColor: isFull ? '#ef4444' : spotsLow ? '#f59e0b' : catColor,
                  },
                ]} />
              </View>
            </View>
          )}

          {/* Tags (non-compact) */}
          {!compact && event.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {event.tags.slice(0, 3).map(tag => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.tagText, { color: colors.mutedForeground }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Chevron */}
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  accentBar: { width: 4 },
  content: { flex: 1, padding: 14, gap: 7 },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  catBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
  },
  catText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  liveText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  title: { fontSize: 15, fontFamily: 'Inter_600SemiBold', lineHeight: 22, letterSpacing: -0.2 },
  desc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  capacitySection: { gap: 4 },
  capacityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  spotsText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  chevronWrap: { paddingRight: 12, justifyContent: 'center' },
});
