import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import * as db from '@/services/db';
import { Announcement, AnnouncementCategory } from '@/types';

const CAT_CONFIG: Record<AnnouncementCategory, { color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  general:   { color: '#16a34a', bg: '#f0fdf4', icon: 'megaphone' },
  workshop:  { color: '#2563eb', bg: '#eff6ff', icon: 'construct' },
  hackathon: { color: '#7c3aed', bg: '#f5f3ff', icon: 'flash' },
  meeting:   { color: '#d97706', bg: '#fffbeb', icon: 'people' },
  urgent:    { color: '#dc2626', bg: '#fef2f2', icon: 'warning' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      db.getAnnouncementById(id)
        .then(setAnn)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const topPad = Platform.OS === 'web' ? 20 : insets.top;
  const cfg = ann ? CAT_CONFIG[ann.category] : CAT_CONFIG.general;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!ann) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Announcement not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <TouchableOpacity onPress={router.back} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </Animated.View>

      {/* Category badge */}
      <Animated.View entering={FadeInDown.delay(40).springify()}>
        <View style={[styles.catBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
          <Ionicons name={cfg.icon} size={16} color={cfg.color} />
          <Text style={[styles.catText, { color: cfg.color }]}>
            {ann.category.charAt(0).toUpperCase() + ann.category.slice(1)}
          </Text>
          {ann.isPinned && (
            <>
              <View style={[styles.dot, { backgroundColor: cfg.color + '60' }]} />
              <Ionicons name="pin" size={14} color={cfg.color} />
              <Text style={[styles.catText, { color: cfg.color }]}>Pinned</Text>
            </>
          )}
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <Text style={[styles.title, { color: colors.foreground }]}>{ann.title}</Text>
      </Animated.View>

      {/* Meta */}
      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <View style={styles.meta}>
          <View style={[styles.authorDot, { backgroundColor: cfg.color }]}>
            <Text style={styles.authorDotText}>{ann.authorName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={[styles.author, { color: colors.foreground }]}>{ann.authorName}</Text>
            <Text style={[styles.time, { color: colors.mutedForeground }]}>
              {timeAgo(ann.createdAt)} · {new Date(ann.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Content */}
      <Animated.View entering={FadeInUp.delay(100).springify()}>
        <Text style={[styles.content, { color: colors.foreground }]}>{ann.content}</Text>
      </Animated.View>

      {/* Updated notice */}
      {ann.updatedAt !== ann.createdAt && (
        <Animated.View entering={FadeInUp.delay(130).springify()}>
          <View style={[styles.updatedBanner, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Ionicons name="refresh-circle-outline" size={15} color={colors.mutedForeground} />
            <Text style={[styles.updatedText, { color: colors.mutedForeground }]}>
              Last updated {timeAgo(ann.updatedAt)}
            </Text>
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 22, gap: 16 },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start',
  },
  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, alignSelf: 'flex-start',
  },
  catText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.4, lineHeight: 32 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorDot: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  authorDotText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  author: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  time: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  divider: { height: 1 },
  content: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 26 },
  updatedBanner: {
    flexDirection: 'row', gap: 7, padding: 12,
    borderRadius: 10, borderWidth: 1, alignItems: 'center',
  },
  updatedText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
