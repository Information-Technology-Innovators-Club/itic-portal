import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { AvatarDisplay } from '@/components/CartoonAvatars';
import { RoleBadge } from '@/components/ui/Badge';
import { User } from '@/types';
import * as db from '@/services/db';

export default function LeadershipScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [leaders, setLeaders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === 'web' ? 24 : insets.top + 8;

  const load = useCallback(async () => {
    try {
      const members = await db.getAllMembers();
      setLeaders(members.filter(member => member.role === 'executive' || member.role === 'admin'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: insets.bottom + 90 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: colors.primary + '15' }]}><Ionicons name="people-circle-outline" size={25} color={colors.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Club Leadership</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Meet the team leading ITIC.</Text>
        </View>
      </View>

      {leaders.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="people-outline" size={38} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Leadership team coming soon</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {leaders.map((leader, index) => {
            const initials = leader.fullName.split(' ').map(name => name[0]).slice(0, 2).join('').toUpperCase();
            return (
              <Animated.View key={leader.id} entering={FadeInDown.delay(index * 60).springify()} style={styles.gridItem}>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.avatar, { borderColor: colors.primary + '45' }]}>
                    <AvatarDisplay profilePicture={leader.profilePicture} size={68} initials={initials} primaryColor={colors.primary} static />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.name, { color: colors.foreground }]}>{leader.fullName}</Text>
                    <RoleBadge role={leader.role} />
                    <Text style={[styles.programme, { color: colors.mutedForeground }]} numberOfLines={2}>{leader.programme || leader.faculty || 'ITIC Leadership'}</Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: 20, gap: 18 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  gridItem: { width: '48.8%' },
  card: { minHeight: 106, borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 70, height: 70, borderRadius: 35, overflow: 'hidden', borderWidth: 2 },
  name: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  programme: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  empty: { minHeight: 180, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
