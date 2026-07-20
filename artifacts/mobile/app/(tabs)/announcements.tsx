import React, { useEffect, useState } from 'react';
import {
  FlatList, RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Announcement, AnnouncementCategory } from '@/types';
import * as storage from '@/services/storage';
import { AnnouncementCard } from '@/components/AnnouncementCard';

type Filter = AnnouncementCategory | 'all';

const FILTERS: { label: string; value: Filter; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'All', value: 'all', icon: 'apps-outline' },
  { label: 'General', value: 'general', icon: 'information-circle-outline' },
  { label: 'Workshop', value: 'workshop', icon: 'construct-outline' },
  { label: 'Hackathon', value: 'hackathon', icon: 'code-slash-outline' },
  { label: 'Meeting', value: 'meeting', icon: 'people-outline' },
  { label: 'Urgent', value: 'urgent', icon: 'alert-circle-outline' },
];

export default function AnnouncementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const anns = await storage.getAnnouncements();
    setAnnouncements(anns);
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  useEffect(() => { loadData(); }, []);

  const filtered = filter === 'all'
    ? announcements
    : announcements.filter(a => a.category === filter);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Announcements</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Club news and updates
        </Text>

        {/* Filter chips */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map(f => {
            const active = filter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilter(f.value);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.primary : colors.muted,
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: 20,
                  },
                ]}
              >
                <Ionicons
                  name={f.icon}
                  size={13}
                  color={active ? '#fff' : colors.mutedForeground}
                />
                <Text style={[styles.filterChipText, { color: active ? '#fff' : colors.mutedForeground }]}>
                  {f.label}
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
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
              <AnnouncementCard announcement={item} />
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="megaphone-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No announcements</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                {filter !== 'all' ? 'No announcements in this category' : 'Check back later'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 4, backgroundColor: 'transparent' },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  sub: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 8 },
  filterRow: { paddingRight: 20, gap: 8, paddingBottom: 4 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  list: { padding: 20, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
