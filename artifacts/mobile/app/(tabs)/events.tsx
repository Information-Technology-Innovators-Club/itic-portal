import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Platform, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import * as db from '@/services/db';
import { EventCard, CATEGORY_COLORS } from '@/components/EventCard';
import { Event } from '@/types';

type Segment = 'upcoming' | 'ongoing' | 'past';

const CATEGORIES = ['All', 'Hackathon', 'Workshop', 'Bootcamp', 'Seminar', 'Meeting', 'General'] as const;

export default function EventsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [segment, setSegment] = useState<Segment>('upcoming');
  const [category, setCategory] = useState<string>('All');
  const [searchVisible, setSearchVisible] = useState(false);
  const [search, setSearch] = useState('');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await db.getEvents();
      setEvents(all);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Real-time: update attendee counts live
  useEffect(() => {
    load();

    const chan = supabase
      .channel('events-realtime')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'events' },
        (payload: any) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setEvents(prev => prev.map(e =>
              e.id === payload.new.id
                ? { ...e, attendeeCount: payload.new.attendee_count ?? e.attendeeCount, status: payload.new.status ?? e.status }
                : e
            ));
          } else if (payload.eventType === 'INSERT' && payload.new) {
            load();
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setEvents(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    channelRef.current = chan;
    return () => { chan.unsubscribe(); };
  }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);
  const topPad = Platform.OS === 'web' ? 24 : insets.top + 4;

  const filtered = events
    .filter(e => {
      if (segment === 'upcoming') return e.status === 'upcoming';
      if (segment === 'ongoing') return e.status === 'ongoing';
      return e.status === 'past';
    })
    .filter(e => category === 'All' || e.category === category)
    .filter(e => !search.trim() || e.title.toLowerCase().includes(search.toLowerCase()) || e.venue.toLowerCase().includes(search.toLowerCase()));

  const segCounts = {
    upcoming: events.filter(e => e.status === 'upcoming').length,
    ongoing: events.filter(e => e.status === 'ongoing').length,
    past: events.filter(e => e.status === 'past').length,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          {searchVisible ? (
            <Animated.View entering={FadeInDown.duration(200)} style={{ flex: 1 }}>
              <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Ionicons name="search" size={16} color={colors.mutedForeground} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search events…"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.searchInput, { color: colors.foreground }]}
                  autoFocus
                />
                {!!search && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          ) : (
            <Text style={[styles.title, { color: colors.foreground }]}>Events</Text>
          )}
          <TouchableOpacity
            onPress={() => { setSearchVisible(v => !v); if (searchVisible) setSearch(''); }}
            style={[styles.iconBtn, { backgroundColor: searchVisible ? colors.primary + '18' : colors.muted, borderColor: searchVisible ? colors.primary + '35' : colors.border }]}
          >
            <Ionicons name={searchVisible ? 'close' : 'search-outline'} size={18} color={searchVisible ? colors.primary : colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Segment tabs */}
        <View style={[styles.segContainer, { backgroundColor: colors.muted }]}>
          {(['upcoming', 'ongoing', 'past'] as Segment[]).map(s => {
            const isActive = segment === s;
            const count = segCounts[s];
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setSegment(s)}
                style={[
                  styles.segBtn,
                  isActive && { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
                ]}
              >
                <Text style={[styles.segText, { color: isActive ? colors.foreground : colors.mutedForeground }]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
                {count > 0 && (
                  <View style={[styles.segBadge, { backgroundColor: isActive ? colors.primary : colors.mutedForeground + '40' }]}>
                    <Text style={[styles.segBadgeText, { color: isActive ? '#fff' : colors.mutedForeground }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {CATEGORIES.map(cat => {
            const isActive = category === cat;
            const catColor = cat === 'All' ? colors.primary : (CATEGORY_COLORS[cat] ?? colors.primary);
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: isActive ? catColor : colors.muted,
                    borderColor: isActive ? catColor : colors.border,
                  },
                ]}
              >
                <Text style={[styles.catChipText, { color: isActive ? '#fff' : colors.mutedForeground }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 90 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
              <EventCard
                event={item}
                onPress={() => router.push(`/event/${item.id}` as Parameters<typeof router.push>[0])}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            <Animated.View entering={FadeInUp.springify()} style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                <Ionicons
                  name={segment === 'ongoing' ? 'radio-outline' : segment === 'past' ? 'archive-outline' : 'calendar-outline'}
                  size={36}
                  color={colors.mutedForeground}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {search ? 'No results found' : `No ${segment} events`}
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                {search ? 'Try a different search term or category' : 'Check back soon for new events'}
              </Text>
              {category !== 'All' && (
                <TouchableOpacity onPress={() => setCategory('All')} style={[styles.resetBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.resetBtnText, { color: colors.primary }]}>Clear filter</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 10, gap: 10, borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, gap: 10,
  },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, flex: 1 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, height: 38, borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  segContainer: { flexDirection: 'row', marginHorizontal: 16, padding: 3, borderRadius: 12 },
  segBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 7, borderRadius: 10, gap: 5,
  },
  segText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  segBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  segBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  catScroll: { paddingHorizontal: 16, gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  catChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 10, paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  resetBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  resetBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
