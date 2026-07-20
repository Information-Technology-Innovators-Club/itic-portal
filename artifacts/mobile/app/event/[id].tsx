import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import * as db from '@/services/db';
import { Event } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  Hackathon: '#7c3aed', Workshop: '#2563eb', Bootcamp: '#0891b2',
  Seminar: '#d97706', Social: '#db2777', General: '#16a34a',
};

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      db.getEventById(id)
        .then(setEvent)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const topPad = Platform.OS === 'web' ? 20 : insets.top;
  const accent = event ? (CATEGORY_COLORS[event.category] ?? '#16a34a') : '#16a34a';
  const spotsLeft = event ? event.maxAttendees - event.attendeeCount : 0;
  const pct = event ? Math.round((event.attendeeCount / event.maxAttendees) * 100) : 0;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Event not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Hero */}
      <LinearGradient
        colors={[accent + 'cc', accent + '44', colors.background]}
        style={[styles.hero, { paddingTop: topPad + 8 }]}
      >
        <TouchableOpacity
          onPress={router.back}
          style={[styles.backBtn, { backgroundColor: '#ffffff20' }]}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.heroContent}>
          <View style={[styles.categoryPill, { backgroundColor: accent }]}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
          <Text style={styles.heroTitle}>{event.title}</Text>
          <Text style={styles.heroCountdown}>{daysUntil(event.date)}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick info */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={[styles.infoGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: 'calendar-outline' as const, label: 'Date', value: event.date },
            { icon: 'time-outline' as const, label: 'Time', value: event.time },
            { icon: 'location-outline' as const, label: 'Venue', value: event.venue },
            { icon: 'people-outline' as const, label: 'Registered', value: `${event.attendeeCount} / ${event.maxAttendees}` },
          ].map(row => (
            <View key={row.label} style={styles.infoCell}>
              <Ionicons name={row.icon} size={18} color={accent} />
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              <Text style={[styles.infoVal, { color: colors.foreground }]} numberOfLines={2}>{row.value}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Capacity bar */}
        {event.status === 'upcoming' && (
          <Animated.View entering={FadeInDown.delay(80).springify()} style={[styles.capacityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[styles.capLabel, { color: colors.foreground }]}>Capacity</Text>
              <Text style={[styles.capPct, { color: pct > 80 ? '#ef4444' : accent }]}>{pct}% full</Text>
            </View>
            <View style={[styles.capBg, { backgroundColor: colors.muted }]}>
              <View style={[styles.capFill, { backgroundColor: pct > 80 ? '#ef4444' : accent, width: `${pct}%` }]} />
            </View>
            <Text style={[styles.capSub, { color: spotsLeft < 20 ? '#ef4444' : colors.mutedForeground }]}>
              {spotsLeft <= 0 ? 'Fully booked' : `${spotsLeft} spots remaining`}
            </Text>
          </Animated.View>
        )}

        {/* Description */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.descTitle, { color: colors.foreground }]}>About this Event</Text>
          <Text style={[styles.descText, { color: colors.mutedForeground }]}>{event.description}</Text>
        </Animated.View>

        {/* Tags */}
        {event.tags.length > 0 && (
          <Animated.View entering={FadeInUp.delay(130).springify()} style={[styles.tagsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.descTitle, { color: colors.foreground }]}>Tags</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {event.tags.map(t => (
                <View key={t} style={[styles.tag, { backgroundColor: accent + '15', borderColor: accent + '40' }]}>
                  <Text style={[styles.tagText, { color: accent }]}>#{t}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Status badge */}
        <Animated.View entering={FadeInUp.delay(150).springify()}>
          <View style={[styles.statusBanner, {
            backgroundColor: event.status === 'past' ? colors.muted : accent + '15',
            borderColor: event.status === 'past' ? colors.border : accent + '40',
          }]}>
            <Ionicons
              name={event.status === 'past' ? 'checkmark-circle' : event.status === 'ongoing' ? 'radio' : 'hourglass'}
              size={18}
              color={event.status === 'past' ? colors.mutedForeground : accent}
            />
            <Text style={[styles.statusText, { color: event.status === 'past' ? colors.mutedForeground : accent }]}>
              {event.status === 'past'
                ? 'This event has ended'
                : event.status === 'ongoing'
                ? 'Event is happening now!'
                : `Coming up: ${daysUntil(event.date)}`}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start',
  },
  heroContent: { gap: 8 },
  categoryPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  categoryText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.5 },
  heroTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.3, lineHeight: 30 },
  heroCountdown: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#ffffffcc' },
  scroll: { padding: 20, gap: 14 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  infoCell: { width: '50%', padding: 14, gap: 4 },
  infoLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoVal: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  capacityCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 8 },
  capLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  capPct: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  capBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  capFill: { height: '100%', borderRadius: 4 },
  capSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  descCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  descTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  descText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  tagsCard: { padding: 16, borderRadius: 14, borderWidth: 1 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  statusBanner: {
    flexDirection: 'row', gap: 10, padding: 14,
    borderRadius: 12, borderWidth: 1, alignItems: 'center',
  },
  statusText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
