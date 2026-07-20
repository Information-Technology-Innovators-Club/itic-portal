import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types';
import * as storage from '@/services/storage';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

function StatTile({ label, value, icon, color }: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  const colors = useColors();
  return (
    <GlassCard style={styles.statTile}>
      <View style={[styles.statIcon, { backgroundColor: color + '18', borderRadius: 10 }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statVal, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>{label}</Text>
    </GlassCard>
  );
}

export default function ExecutiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState<'general' | 'workshop' | 'hackathon' | 'meeting' | 'urgent'>('general');
  const [submitting, setSubmitting] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  async function loadMembers() {
    const all = await storage.getUsers();
    setMembers(all.filter(u => u.id !== user?.id));
    setLoading(false);
  }

  useEffect(() => { loadMembers(); }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'executive';
  if (!isAdmin) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.noAccess, { color: colors.mutedForeground }]}>Executive access only</Text>
      </View>
    );
  }

  const filtered = members.filter(m =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    m.studentNumber.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const pending = members.filter(m => m.status === 'pending');
  const active = members.filter(m => m.status === 'active');
  const faculties = [...new Set(members.map(m => m.faculty).filter(Boolean))].length;
  const departments = [...new Set(members.map(m => m.department).filter(Boolean))].length;

  async function handleApprove(id: string) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await storage.approveUser(id);
    await loadMembers();
  }

  async function handleDeactivate(id: string) {
    Alert.alert('Deactivate Member', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate', style: 'destructive', onPress: async () => {
          await storage.deactivateUser(id);
          await loadMembers();
        },
      },
    ]);
  }

  async function handleCreateAnnouncement() {
    if (!annTitle.trim() || !annContent.trim()) return;
    setSubmitting(true);
    try {
      await storage.addAnnouncement({
        title: annTitle, content: annContent, category: annCategory,
        authorId: user!.id, authorName: user!.fullName, isPinned: false,
      });
      setAnnTitle(''); setAnnContent('');
      setShowAnnModal(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Announcement created successfully');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Title */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.foreground }]}>Executive</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>Club management dashboard</Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsGrid}>
          <StatTile label="Total Members" value={members.length} icon="people-outline" color={colors.primary} />
          <StatTile label="Active" value={active.length} icon="checkmark-circle-outline" color="#0284c7" />
          <StatTile label="Pending" value={pending.length} icon="time-outline" color="#f59e0b" />
          <StatTile label="Faculties" value={faculties} icon="school-outline" color="#7c3aed" />
          <StatTile label="Departments" value={departments} icon="business-outline" color="#be185d" />
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.actions}>
          <TouchableOpacity
            onPress={() => setShowAnnModal(true)}
            style={[styles.actionBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
          >
            <Ionicons name="megaphone-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>New Announcement</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Pending approvals */}
        {pending.length > 0 && (
          <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Pending Approvals ({pending.length})
            </Text>
            {pending.map(m => (
              <GlassCard key={m.id} style={[styles.memberRow, { borderColor: '#f59e0b30', borderWidth: 1.5 }]}>
                <View style={[styles.memberAvatar, { backgroundColor: '#f59e0b' }]}>
                  <Text style={styles.memberAvatarText}>{m.fullName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: colors.foreground }]}>{m.fullName}</Text>
                  <Text style={[styles.memberMeta, { color: colors.mutedForeground }]}>
                    {m.studentNumber} · {m.department}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleApprove(m.id)}
                  style={[styles.approveBtn, { backgroundColor: colors.primary + '15', borderRadius: colors.radius / 2 }]}
                >
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                </TouchableOpacity>
              </GlassCard>
            ))}
          </Animated.View>
        )}

        {/* Member search + list */}
        <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All Members</Text>

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search members..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No members found</Text>
            </View>
          ) : (
            filtered.map((m, idx) => (
              <Animated.View key={m.id} entering={FadeInDown.delay(idx * 40).springify()}>
                <GlassCard style={styles.memberRow}>
                  <View style={[styles.memberAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.memberAvatarText}>{m.fullName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.memberName, { color: colors.foreground }]}>{m.fullName}</Text>
                    <Text style={[styles.memberMeta, { color: colors.mutedForeground }]}>
                      {m.studentNumber} · {m.memberId}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      <StatusBadge status={m.status} />
                      <RoleBadge role={m.role} />
                    </View>
                  </View>
                  {m.status === 'pending' && (
                    <TouchableOpacity onPress={() => handleApprove(m.id)} style={[styles.approveBtn, { backgroundColor: colors.primary + '15', borderRadius: colors.radius / 2 }]}>
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  {m.status === 'active' && user?.role === 'admin' && (
                    <TouchableOpacity onPress={() => handleDeactivate(m.id)} style={[styles.approveBtn, { backgroundColor: colors.destructive + '12', borderRadius: colors.radius / 2 }]}>
                      <Ionicons name="ban-outline" size={16} color={colors.destructive} />
                    </TouchableOpacity>
                  )}
                </GlassCard>
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* Announcement Modal */}
      <Modal visible={showAnnModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background, paddingTop: 24 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Announcement</Text>
            <TouchableOpacity onPress={() => setShowAnnModal(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 16, padding: 20 }}>
            <View style={[styles.searchBox, { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}>
              <TextInput
                value={annTitle}
                onChangeText={setAnnTitle}
                placeholder="Announcement title..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}
              />
            </View>

            <View style={[styles.textareaWrap, { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}>
              <TextInput
                value={annContent}
                onChangeText={setAnnContent}
                placeholder="Announcement content..."
                placeholderTextColor={colors.mutedForeground}
                multiline numberOfLines={6}
                textAlignVertical="top"
                style={[styles.textarea, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              />
            </View>

            <Text style={[styles.catLabel, { color: colors.mutedForeground }]}>Category</Text>
            <View style={styles.catRow}>
              {(['general', 'workshop', 'hackathon', 'meeting', 'urgent'] as const).map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setAnnCategory(cat)}
                  style={[styles.catChip, {
                    backgroundColor: annCategory === cat ? colors.primary : colors.muted,
                    borderRadius: 20,
                  }]}
                >
                  <Text style={[styles.catChipText, { color: annCategory === cat ? '#fff' : colors.mutedForeground }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Publish Announcement"
              onPress={handleCreateAnnouncement}
              loading={submitting}
              fullWidth
              disabled={!annTitle.trim() || !annContent.trim()}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  noAccess: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  scroll: { paddingHorizontal: 20, gap: 16 },
  titleBlock: { gap: 2 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  sub: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statTile: { width: '47%', gap: 6 },
  statIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  statLbl: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', letterSpacing: -0.2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  memberName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  memberMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  approveBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  textareaWrap: { borderWidth: 1, padding: 14, minHeight: 140 },
  textarea: { fontSize: 14, minHeight: 120 },
  catLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 7 },
  catChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
