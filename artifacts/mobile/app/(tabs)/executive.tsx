import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, Platform,
  RefreshControl, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import * as db from '@/services/db';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, AnnouncementCategory, UserRole, Event } from '@/types';

type Tab = 'members' | 'events' | 'announcements';

const CATEGORY_OPTS: { label: string; value: AnnouncementCategory }[] = [
  { label: '📢 General', value: 'general' },
  { label: '🛠 Workshop', value: 'workshop' },
  { label: '⚡ Hackathon', value: 'hackathon' },
  { label: '📅 Meeting', value: 'meeting' },
  { label: '🚨 Urgent', value: 'urgent' },
];

const ROLE_OPTS: { label: string; value: UserRole }[] = [
  { label: 'Member', value: 'member' },
  { label: 'Executive', value: 'executive' },
  { label: 'Admin', value: 'admin' },
];

function MemberRow({ member, currentUser, onAction }: {
  member: User; currentUser: User;
  onAction: (m: User, action: 'approve' | 'deactivate' | 'suspend' | 'role') => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.memberAvatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.memberAvatarText}>{member.fullName.charAt(0)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.memberName, { color: colors.foreground }]} numberOfLines={1}>{member.fullName}</Text>
        <Text style={[styles.memberId, { color: colors.primary }]}>{member.memberId}</Text>
        <Text style={[styles.memberSub, { color: colors.mutedForeground }]} numberOfLines={1}>
          {member.programme || member.faculty}
        </Text>
        <View style={{ flexDirection: 'row', gap: 5, marginTop: 4 }}>
          <StatusBadge status={member.status} />
          <RoleBadge role={member.role} />
        </View>
      </View>
      {member.id !== currentUser.id && (
        <View style={{ gap: 6 }}>
          {member.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#16a34a15', borderColor: '#16a34a30' }]}
              onPress={() => onAction(member, 'approve')}
            >
              <Ionicons name="checkmark" size={14} color="#16a34a" />
              <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>Approve</Text>
            </TouchableOpacity>
          )}
          {member.status === 'active' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#f59e0b15', borderColor: '#f59e0b30' }]}
              onPress={() => onAction(member, 'deactivate')}
            >
              <Ionicons name="pause" size={14} color="#f59e0b" />
              <Text style={[styles.actionBtnText, { color: '#f59e0b' }]}>Deactivate</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#3b82f615', borderColor: '#3b82f630' }]}
            onPress={() => onAction(member, 'role')}
          >
            <Ionicons name="shield-outline" size={14} color="#3b82f6" />
            <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>Role</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ExecutiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('members');
  const [members, setMembers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, executives: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Announcement modal
  const [annModal, setAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCat, setAnnCat] = useState<AnnouncementCategory>('general');
  const [annPinned, setAnnPinned] = useState(false);
  const [annLoading, setAnnLoading] = useState(false);

  // Event modal
  const [evtModal, setEvtModal] = useState(false);
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDesc, setEvtDesc] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtTime, setEvtTime] = useState('');
  const [evtVenue, setEvtVenue] = useState('');
  const [evtMax, setEvtMax] = useState('100');
  const [evtLoading, setEvtLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [mems, evts, s] = await Promise.all([
        db.getAllMembers(),
        db.getEvents(),
        db.getClubStats(),
      ]);
      setMembers(mems);
      setEvents(evts);
      setStats(s);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  async function handleMemberAction(member: User, action: 'approve' | 'deactivate' | 'suspend' | 'role') {
    if (action === 'role') {
      if (Platform.OS === 'web') {
        const role = window.prompt(`New role for ${member.fullName}? (member/executive/admin)`) as UserRole | null;
        if (role && ['member', 'executive', 'admin'].includes(role)) {
          await db.updateUserRole(member.id, role);
          showToast('success', 'Role updated');
          load();
        }
        return;
      }
      Alert.alert('Change Role', `Select role for ${member.fullName}`,
        ROLE_OPTS.map(r => ({
          text: r.label,
          onPress: async () => {
            await db.updateUserRole(member.id, r.value);
            showToast('success', 'Role updated', `${member.fullName} is now ${r.label}`);
            load();
          },
        }))
      );
      return;
    }

    const confirmMsg = action === 'approve'
      ? `Approve ${member.fullName} as an active member?`
      : action === 'deactivate'
      ? `Deactivate ${member.fullName}'s membership?`
      : `Suspend ${member.fullName}? They will not be able to log in.`;

    const doAction = async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (action === 'approve') await db.approveUser(member.id);
      else if (action === 'deactivate') await db.deactivateUser(member.id);
      else await db.suspendUser(member.id);
      showToast('success', action === 'approve' ? 'Member approved!' : action === 'deactivate' ? 'Member deactivated' : 'Member suspended');
      load();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) doAction();
    } else {
      Alert.alert('Confirm', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: action === 'suspend' ? 'destructive' : 'default', onPress: doAction },
      ]);
    }
  }

  async function submitAnnouncement() {
    if (!annTitle.trim() || !annContent.trim()) {
      showToast('warning', 'Missing fields', 'Title and content are required');
      return;
    }
    setAnnLoading(true);
    try {
      await db.addAnnouncement({
        title: annTitle.trim(),
        content: annContent.trim(),
        category: annCat,
        authorId: user!.id,
        authorName: user!.fullName,
        isPinned: annPinned,
      });
      showToast('success', 'Announcement published!');
      setAnnModal(false);
      setAnnTitle(''); setAnnContent(''); setAnnCat('general'); setAnnPinned(false);
      load();
    } catch (err: unknown) {
      showToast('error', 'Failed to publish', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAnnLoading(false);
    }
  }

  async function submitEvent() {
    if (!evtTitle.trim() || !evtDate.trim() || !evtVenue.trim()) {
      showToast('warning', 'Missing fields', 'Title, date, and venue are required');
      return;
    }
    setEvtLoading(true);
    try {
      await db.addEvent({
        title: evtTitle.trim(),
        description: evtDesc.trim(),
        date: evtDate.trim(),
        time: evtTime.trim(),
        venue: evtVenue.trim(),
        category: 'General',
        status: 'upcoming',
        maxAttendees: parseInt(evtMax) || 100,
        organizerId: user!.id,
        tags: [],
      });
      showToast('success', 'Event created!');
      setEvtModal(false);
      setEvtTitle(''); setEvtDesc(''); setEvtDate(''); setEvtTime(''); setEvtVenue(''); setEvtMax('100');
      load();
    } catch (err: unknown) {
      showToast('error', 'Failed to create event', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setEvtLoading(false);
    }
  }

  const topPad = Platform.OS === 'web' ? 24 : insets.top + 8;

  const filtered = search.trim()
    ? members.filter(m =>
        m.fullName.toLowerCase().includes(search.toLowerCase()) ||
        m.memberId.toLowerCase().includes(search.toLowerCase()) ||
        m.studentNumber.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  const pending = members.filter(m => m.status === 'pending');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Management</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
              onPress={() => setEvtModal(true)}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
              onPress={() => setAnnModal(true)}
            >
              <Ionicons name="megaphone-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
          {(['members', 'events', 'announcements'] as Tab[]).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabBtn, tab === t && { backgroundColor: colors.card }]}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.foreground : colors.mutedForeground }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* Stats */}
          <Animated.View entering={FadeInDown.delay(0).springify()}>
            <View style={styles.statsRow}>
              {[
                { v: stats.total, l: 'Total', c: colors.primary, icon: 'people' as const },
                { v: stats.active, l: 'Active', c: '#22c55e', icon: 'checkmark-circle' as const },
                { v: stats.pending, l: 'Pending', c: '#f59e0b', icon: 'time' as const },
                { v: stats.executives, l: 'Exec', c: '#3b82f6', icon: 'shield-checkmark' as const },
              ].map(s => (
                <GlassCard key={s.l} style={styles.statCard}>
                  <Ionicons name={s.icon} size={18} color={s.c} />
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{s.v}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.l}</Text>
                </GlassCard>
              ))}
            </View>
          </Animated.View>

          {/* Members tab */}
          {tab === 'members' && (
            <>
              {/* Pending approvals */}
              {pending.length > 0 && (
                <Animated.View entering={FadeInUp.delay(40).springify()}>
                  <View style={[styles.pendingBanner, { backgroundColor: '#fef3c7', borderColor: '#f59e0b40' }]}>
                    <Ionicons name="time" size={16} color="#d97706" />
                    <Text style={styles.pendingText}>
                      {pending.length} member{pending.length > 1 ? 's' : ''} awaiting approval
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Search */}
              <Input
                placeholder="Search by name, ID, student number…"
                value={search}
                onChangeText={setSearch}
                leftIcon="search-outline"
              />

              <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
                {filtered.length} member{filtered.length !== 1 ? 's' : ''}
              </Text>

              {filtered.map((m, i) => (
                <Animated.View key={m.id} entering={FadeInDown.delay(i * 40).springify()}>
                  <MemberRow member={m} currentUser={user!} onAction={handleMemberAction} />
                </Animated.View>
              ))}

              {filtered.length === 0 && search.trim() && (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={36} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No members found</Text>
                </View>
              )}
            </>
          )}

          {/* Events tab */}
          {tab === 'events' && (
            <>
              <TouchableOpacity
                onPress={() => setEvtModal(true)}
                style={[styles.createBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.createBtnText, { color: colors.primary }]}>Create New Event</Text>
              </TouchableOpacity>
              {events.map((evt, i) => (
                <Animated.View key={evt.id} entering={FadeInDown.delay(i * 40).springify()}>
                  <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.listTitle, { color: colors.foreground }]}>{evt.title}</Text>
                      <Text style={[styles.listSub, { color: colors.mutedForeground }]}>
                        {evt.date} · {evt.venue}
                      </Text>
                      <Text style={[styles.listSub, { color: colors.mutedForeground }]}>
                        {evt.attendeeCount}/{evt.maxAttendees} registered
                      </Text>
                    </View>
                    <View style={[styles.statusPill, {
                      backgroundColor: evt.status === 'upcoming' ? colors.primary + '15' : colors.muted,
                    }]}>
                      <Text style={[styles.statusPillText, {
                        color: evt.status === 'upcoming' ? colors.primary : colors.mutedForeground,
                      }]}>
                        {evt.status}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </>
          )}

          {/* Announcements tab */}
          {tab === 'announcements' && (
            <>
              <TouchableOpacity
                onPress={() => setAnnModal(true)}
                style={[styles.createBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.createBtnText, { color: colors.primary }]}>Post Announcement</Text>
              </TouchableOpacity>
              {/* Note: full announcement list rendered from db on next open */}
              <View style={[styles.emptyState, { paddingTop: 20 }]}>
                <Ionicons name="megaphone-outline" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Manage announcements from the News tab
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Announcement modal */}
      <Modal visible={annModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAnnModal(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Post Announcement</Text>
            <TouchableOpacity onPress={() => setAnnModal(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Input label="Title *" placeholder="Announcement title" value={annTitle} onChangeText={setAnnTitle} />
            <View>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Content *</Text>
              <TextInput
                value={annContent}
                onChangeText={setAnnContent}
                placeholder="Write the announcement content…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={6}
                style={[styles.textarea, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Category</Text>
            <View style={styles.pillWrap}>
              {CATEGORY_OPTS.map(c => (
                <TouchableOpacity
                  key={c.value}
                  onPress={() => setAnnCat(c.value)}
                  style={[styles.pill, {
                    backgroundColor: annCat === c.value ? colors.primary : colors.muted,
                    borderColor: annCat === c.value ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={[styles.pillText, { color: annCat === c.value ? '#fff' : colors.mutedForeground }]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setAnnPinned(p => !p)}
              style={[styles.toggleRow, { backgroundColor: colors.muted, borderColor: annPinned ? colors.primary : colors.border }]}
            >
              <Ionicons name={annPinned ? 'pin' : 'pin-outline'} size={18} color={annPinned ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.toggleText, { color: colors.foreground }]}>Pin this announcement</Text>
              <View style={[styles.toggle, { backgroundColor: annPinned ? colors.primary : colors.muted, borderColor: colors.border }]}>
                {annPinned && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
            </TouchableOpacity>

            <Button title="Publish Announcement" onPress={submitAnnouncement} loading={annLoading} />
          </ScrollView>
        </View>
      </Modal>

      {/* Event modal */}
      <Modal visible={evtModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEvtModal(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Create Event</Text>
            <TouchableOpacity onPress={() => setEvtModal(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Input label="Event Title *" placeholder="e.g. Web Dev Workshop" value={evtTitle} onChangeText={setEvtTitle} leftIcon="calendar-outline" />
            <View>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Description</Text>
              <TextInput
                value={evtDesc}
                onChangeText={setEvtDesc}
                placeholder="What is this event about?"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                style={[styles.textarea, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
            <Input label="Date *" placeholder="YYYY-MM-DD" value={evtDate} onChangeText={setEvtDate} leftIcon="calendar" />
            <Input label="Time" placeholder="e.g. 09:00" value={evtTime} onChangeText={setEvtTime} leftIcon="time-outline" />
            <Input label="Venue *" placeholder="e.g. Computer Lab 3, Block C" value={evtVenue} onChangeText={setEvtVenue} leftIcon="location-outline" />
            <Input label="Max Attendees" placeholder="100" value={evtMax} onChangeText={setEvtMax} keyboardType="numeric" leftIcon="people-outline" />
            <Button title="Create Event" onPress={submitEvent} loading={evtLoading} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 12, borderBottomWidth: 1 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  addBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  tabs: { flexDirection: 'row', padding: 3, borderRadius: 10 },
  tabBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  tabText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  scroll: { padding: 20, gap: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 12 },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  pendingBanner: {
    flexDirection: 'row', gap: 8, padding: 12,
    borderRadius: 12, borderWidth: 1, alignItems: 'center',
  },
  pendingText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#92400e' },
  resultCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  memberRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14,
    borderRadius: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  memberAvatar: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  memberName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  memberId: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  memberSub: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  actionBtnText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  createBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  listCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 14, borderWidth: 1,
  },
  listTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  listSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, paddingTop: 24, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  modalBody: { padding: 20, gap: 16, paddingBottom: 60 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  textarea: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    fontFamily: 'Inter_400Regular', fontSize: 14,
    textAlignVertical: 'top', minHeight: 100,
  },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1.5,
  },
  toggleText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  toggle: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
});
