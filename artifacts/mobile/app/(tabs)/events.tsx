import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, StyleSheet,
  Text, TouchableOpacity, View, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Event } from '@/types';
import * as storage from '@/services/storage';
import { EventCard } from '@/components/EventCard';
import * as Haptics from 'expo-haptics';

type Tab = 'upcoming' | 'past';

export default function EventsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadEvents() {
    const all = await storage.getEvents();
    setEvents(all);
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }

  useEffect(() => { loadEvents(); }, []);

  const filtered = events.filter(e => e.status === (tab === 'upcoming' ? 'upcoming' : 'past'));
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  async function switchTab(t: Tab) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTab(t);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Events</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Workshops, hackathons &amp; more
        </Text>

        {/* Segmented control */}
        <View style={[styles.segmented, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          {(['upcoming', 'past'] as Tab[]).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => switchTab(t)}
              style={[
                styles.segTab,
                { borderRadius: colors.radius - 2 },
                tab === t && { backgroundColor: colors.card },
              ]}
            >
              <Text style={[
                styles.segTabText,
                { color: tab === t ? colors.primary : colors.mutedForeground },
              ]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {' '}({events.filter(e => e.status === t).length})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
              <EventCard event={item} />
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No {tab} events</Text>
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
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 4 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  sub: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  segmented: { flexDirection: 'row', padding: 3 },
  segTab: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  segTabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  list: { padding: 20, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
