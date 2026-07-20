import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Platform, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import * as db from '@/services/db';
import { EventCard } from '@/components/EventCard';
import { Event } from '@/types';

type Segment = 'upcoming' | 'past';

export default function EventsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [segment, setSegment] = useState<Segment>('upcoming');

  const load = useCallback(async () => {
    try {
      const all = await db.getEvents();
      setEvents(all);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const filtered = events.filter(e =>
    segment === 'upcoming'
      ? e.status === 'upcoming' || e.status === 'ongoing'
      : e.status === 'past'
  );

  const topPad = Platform.OS === 'web' ? 24 : insets.top + 8;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Events</Text>
        {/* Segment */}
        <View style={[styles.seg, { backgroundColor: colors.muted }]}>
          {(['upcoming', 'past'] as Segment[]).map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => setSegment(s)}
              style={[styles.segBtn, segment === s && { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }]}
            >
              <Text style={[styles.segText, { color: segment === s ? colors.foreground : colors.mutedForeground }]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: insets.bottom + 90 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
              <EventCard event={item} onPress={() => router.push(`/event/${item.id}` as Parameters<typeof router.push>[0])} />
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No {segment} events
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Check back soon for new events
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20, paddingBottom: 12, gap: 12, borderBottomWidth: 1,
  },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  seg: { flexDirection: 'row', padding: 3, borderRadius: 10 },
  segBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  segText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 10, paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
