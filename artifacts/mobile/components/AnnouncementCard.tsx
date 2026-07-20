import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Announcement } from '@/types';
import { CategoryBadge } from './ui/Badge';
import { GlassCard } from './GlassCard';

interface AnnouncementCardProps {
  announcement: Announcement;
  onPress?: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function AnnouncementCard({ announcement, onPress }: AnnouncementCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78}>
      <GlassCard style={announcement.isPinned ? [styles.card, { borderColor: colors.primary + '40' }] : styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <CategoryBadge category={announcement.category} />
            {announcement.isPinned && (
              <View style={styles.pinBadge}>
                <Ionicons name="pin" size={11} color={colors.primary} />
                <Text style={[styles.pinText, { color: colors.primary }]}>Pinned</Text>
              </View>
            )}
          </View>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timeAgo(announcement.createdAt)}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {announcement.title}
        </Text>
        <Text style={[styles.content, { color: colors.mutedForeground }]} numberOfLines={3}>
          {announcement.content}
        </Text>

        <View style={styles.footer}>
          <View style={styles.authorRow}>
            <Ionicons name="person-circle-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.author, { color: colors.mutedForeground }]}>
              {announcement.authorName}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pinBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pinText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  time: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  title: { fontSize: 15, fontFamily: 'Inter_600SemiBold', lineHeight: 22 },
  content: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  author: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
