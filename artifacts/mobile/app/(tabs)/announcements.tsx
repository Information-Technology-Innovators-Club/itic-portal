import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Platform, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import * as db from '@/services/db';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { Announcement, AnnouncementCategory } from '@/types';

const CATEGORIES: { label: string; value: AnnouncementCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: '📢 General', value: 'general' },
  { label: '🛠 Workshop', value: 'workshop' },
  { label: '⚡ Hackathon', value: 'hackathon' },
  { label: '📅 Meeting', value: 'meeting' },
  { label: '🚨 Urgent', value: 'urgent' },
];

export default function AnnouncementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cat, setCat] = useState<AnnouncementCategory | 'all'>('all');

  const load = useCallback(async () => {
    try {
      const data = await db.getAnnouncements();
      setAnnouncements(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const filtered = cat === 'all' ? announcements : announcements.filter(a => a.category === cat);
  const topPad = Platform.OS === 'web' ? 24 : insets.top + 8;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Announcements</Text>
        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.value}
              onPress={() => setCat(c.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: cat === c.value ? colors.primary : colors.muted,
                  borderColor: cat === c.value ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: cat === c.value ? '#fff' : colors.mutedForeground }]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: insets.bottom + 90 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
              <AnnouncementCard
                announcement={item}
                onPress={() => router.push(`/announcement/${item.id}` as Parameters<typeof router.push>[0])}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="megaphone-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No announcements</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                {cat === 'all' ? 'Check back soon' : `No ${cat} announcements yet`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 12, borderBottomWidth: 1 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 10, paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
