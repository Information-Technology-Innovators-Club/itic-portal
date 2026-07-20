import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Event } from '@/types';
import { GlassCard } from './GlassCard';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  compact?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CATEGORY_COLORS: Record<string, string> = {
  Hackathon: '#7c3aed',
  Workshop: '#0284c7',
  Bootcamp: '#0891b2',
  Seminar: '#b45309',
  Social: '#be185d',
  Default: '#16A34A',
};

export function EventCard({ event, onPress, compact = false }: EventCardProps) {
  const colors = useColors();
  const catColor = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.Default;
  const spotsLeft = event.maxAttendees - event.attendeeCount;
  const spotsLow = spotsLeft <= 10;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78}>
      <GlassCard style={styles.card} noPadding>
        {/* Color accent bar */}
        <View style={[styles.accentBar, { backgroundColor: catColor }]} />
        <View style={styles.content}>
          {/* Header row */}
          <View style={styles.headerRow}>
            <View style={[styles.catBadge, { backgroundColor: catColor + '20' }]}>
              <Text style={[styles.catText, { color: catColor }]}>{event.category}</Text>
            </View>
            {event.status === 'past' && (
              <View style={[styles.catBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.catText, { color: colors.mutedForeground }]}>Past</Text>
              </View>
            )}
          </View>

          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {event.title}
          </Text>

          {!compact && (
            <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
              {event.description}
            </Text>
          )}

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {formatDate(event.date)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{event.time}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {event.venue}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={13} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.primary }]}>
                {event.attendeeCount}/{event.maxAttendees}
              </Text>
            </View>
            {event.status === 'upcoming' && spotsLow && (
              <Text style={[styles.spotsText, { color: colors.warning }]}>
                {spotsLeft} spots left
              </Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', overflow: 'hidden' },
  accentBar: { width: 4, minHeight: '100%' },
  content: { flex: 1, padding: 14, gap: 8 },
  headerRow: { flexDirection: 'row', gap: 6 },
  catBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  catText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.4 },
  title: { fontSize: 15, fontFamily: 'Inter_600SemiBold', lineHeight: 22 },
  desc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  spotsText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
