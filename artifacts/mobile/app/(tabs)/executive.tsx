import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, Platform,
  RefreshControl, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '@/services/supabase';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import * as db from '@/services/db';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { AvatarDisplay } from '@/components/CartoonAvatars';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, AnnouncementCategory, UserRole, Event, Announcement } from '@/types';

type Tab = 'members' | 'events' | 'announcements';

const CATEGORY_OPTS: { label: string; value: AnnouncementCategory; emoji: string }[] = [
  { label: 'General', value: 'general', emoji: '📢' },
  { label: 'Workshop', value: 'workshop', emoji: '🛠' },
  { label: 'Hackathon', value: 'hackathon', emoji: '⚡' },
  { label: 'Meeting', value: 'meeting', emoji: '📅' },
  { label: 'Urgent', value: 'urgent', emoji: '🚨' },
];

const ROLE_OPTS: { label: string; value: UserRole; color: string }[] = [
  { label: 'Member', value: 'member', color: '#3b82f6' },
  { label: 'Executive', value: 'executive', color: '#16a34a' },
  { label: 'Admin', value: 'admin', color: '#ef4444' },
];

// ── Member Row ────────────────────────────────────────────────────────────────
function MemberRow({ member, currentUser, onAction }: {
  member: User; currentUser: User;
  onAction: (m: User, action: 'approve' | 'deactivate' | 'suspend' | 'role') => void;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = React.useState(false);
  const initials = member.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '??';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setExpanded(!expanded)}
      style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.memberRow}>
        {/* Avatar */}
        <View style={[styles.memberAvatar, { borderColor: colors.border }]}>
          <AvatarDisplay
            profilePicture={member.profilePicture}
            size={48}
            initials={initials}
            primaryColor={colors.primary}
            static
          />
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

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16} color={colors.mutedForeground}
          style={{ alignSelf: 'center', marginLeft: 4 }}
        />
      </View>

      {expanded && (
        <Animated.View entering={FadeInUp.duration(180)} style={[styles.drawer, { borderTopColor: colors.border }]}>
          {/* Academic */}
          <Text style={[styles.drawerSection, { color: colors.mutedForeground }]}>Academic</Text>
          <View style={styles.detailGrid}>
            {[
              { l: 'Faculty', v: member.faculty },
              { l: 'Department', v: member.department },
              { l: 'Programme', v: member.programme },
              { l: 'Level', v: `${member.academicLevel} · ${member.semester}` },
              { l: 'Semester', v: member.semester },
              { l: 'Laptop', v: member.hasLaptop ? '✓ Yes' : '✗ No' },
            ].filter(x => x.v).map(({ l, v }) => (
              <View key={l} style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{l}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{v}</Text>
              </View>
            ))}
          </View>

          {/* Skills */}
          {(member.technologyInterests.length > 0 || member.programmingLanguages.length > 0) && (
            <>
              <Text style={[styles.drawerSection, { color: colors.mutedForeground, marginTop: 10 }]}>Skills</Text>
              <View style={styles.tagWrap}>
                {member.technologyInterests.map(t => (
                  <View key={t} style={[styles.tag, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                    <Text style={[styles.tagText, { color: colors.primary }]}>{t}</Text>
                  </View>
                ))}
                {member.programmingLanguages.map(l => (
                  <View key={l} style={[styles.tag, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    <Text style={[styles.tagText, { color: colors.foreground }]}>{l}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Contact */}
          <Text style={[styles.drawerSection, { color: colors.mutedForeground, marginTop: 10 }]}>Contact</Text>
          <View style={styles.contactRow}>
            {!!member.email && (
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => Linking.openURL(`mailto:${member.email}`).catch(() => {})}
              >
                <Ionicons name="mail-outline" size={15} color={colors.primary} />
                <Text style={[styles.contactBtnText, { color: colors.foreground }]} numberOfLines={1}>{member.email}</Text>
              </TouchableOpacity>
            )}
            {!!member.phone && (
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => Linking.openURL(`tel:${member.phone}`).catch(() => {})}
              >
                <Ionicons name="call-outline" size={15} color={colors.primary} />
                <Text style={[styles.contactBtnText, { color: colors.foreground }]}>{member.phone}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Actions */}
          {member.id !== currentUser.id && (
            <View style={styles.actionRow}>
              {member.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#22c55e18', borderColor: '#22c55e35' }]}
                  onPress={() => onAction(member, 'approve')}
                >
                  <Ionicons name="checkmark-circle-outline" size={15} color="#22c55e" />
                  <Text style={[styles.actionBtnText, { color: '#22c55e' }]}>Approve</Text>
                </TouchableOpacity>
              )}
              {member.status === 'active' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#f59e0b15', borderColor: '#f59e0b30' }]}
                  onPress={() => onAction(member, 'deactivate')}
                >
                  <Ionicons name="pause-circle-outline" size={15} color="#f59e0b" />
                  <Text style={[styles.actionBtnText, { color: '#f59e0b' }]}>Deactivate</Text>
                </TouchableOpacity>
              )}
              {member.status !== 'suspended' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#ef444415', borderColor: '#ef444430' }]}
                  onPress={() => onAction(member, 'suspend')}
                >
                  <Ionicons name="ban-outline" size={15} color="#ef4444" />
                  <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Suspend</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#3b82f615', borderColor: '#3b82f630' }]}
                onPress={() => onAction(member, 'role')}
              >
                <Ionicons name="shield-half-outline" size={15} color="#3b82f6" />
                <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>Role</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

// ── Event Row (management) ────────────────────────────────────────────────────
function EventManageRow({ event, onDelete, onQR, onStatusChange }: {
  event: Event;
  onDelete: (id: string) => void;
  onQR: (event: Event) => void;
  onStatusChange: (event: Event) => void;
}) {
  const colors = useColors();
  const fillPct = Math.min(event.attendeeCount / Math.max(event.maxAttendees, 1), 1);
  const statusColor = event.status === 'upcoming' ? colors.primary : event.status === 'ongoing' ? '#22c55e' : colors.mutedForeground;

  return (
    <View style={[styles.evtCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={[styles.evtIconWrap, { backgroundColor: statusColor + '18' }]}>
          <Ionicons
            name={event.status === 'ongoing' ? 'radio' : event.status === 'past' ? 'archive' : 'calendar'}
            size={18} color={statusColor}
          />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.evtTitle, { color: colors.foreground }]} numberOfLines={1}>{event.title}</Text>
          <Text style={[styles.evtMeta, { color: colors.mutedForeground }]}>{event.date} · {event.venue}</Text>
          {/* Capacity bar */}
          <View style={{ gap: 3, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[styles.evtMeta, { color: colors.primary }]}>{event.attendeeCount}/{event.maxAttendees} registered</Text>
              <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
                <Text style={[styles.statusPillText, { color: statusColor }]}>{event.status}</Text>
              </View>
            </View>
            <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.barFill, { width: `${fillPct * 100}%` as any, backgroundColor: statusColor }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.evtActions}>
        <TouchableOpacity
          onPress={() => onQR(event)}
          style={[styles.evtBtn, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '30' }]}
        >
          <Ionicons name="qr-code-outline" size={14} color={colors.primary} />
          <Text style={[styles.evtBtnText, { color: colors.primary }]}>QR Code</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onStatusChange(event)}
          style={[styles.evtBtn, { backgroundColor: '#3b82f615', borderColor: '#3b82f630' }]}
        >
          <Ionicons name="swap-horizontal-outline" size={14} color="#3b82f6" />
          <Text style={[styles.evtBtnText, { color: '#3b82f6' }]}>Status</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(event.id)}
          style={[styles.evtBtn, { backgroundColor: '#ef444412', borderColor: '#ef444428' }]}
        >
          <Ionicons name="trash-outline" size={14} color="#ef4444" />
          <Text style={[styles.evtBtnText, { color: '#ef4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Announcement Row ──────────────────────────────────────────────────────────
function AnnouncementRow({ ann, onDelete, onPin }: {
  ann: Announcement;
  onDelete: (id: string) => void;
  onPin: (ann: Announcement) => void;
}) {
  const colors = useColors();
  const catColors: Record<string, string> = {
    general: colors.primary, workshop: '#0284c7', hackathon: '#7c3aed',
    meeting: '#d97706', urgent: '#ef4444',
  };
  const catColor = catColors[ann.category] ?? colors.primary;

  return (
    <View style={[styles.annCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: catColor }]}>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {ann.isPinned && <Ionicons name="pin" size={12} color={colors.primary} />}
          <Text style={[styles.annTitle, { color: colors.foreground }]} numberOfLines={1}>{ann.title}</Text>
        </View>
        <Text style={[styles.annContent, { color: colors.mutedForeground }]} numberOfLines={2}>{ann.content}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.catPill, { backgroundColor: catColor + '18', borderColor: catColor + '35' }]}>
            <Text style={[styles.catPillText, { color: catColor }]}>{ann.category}</Text>
          </View>
          <Text style={[styles.annMeta, { color: colors.mutedForeground }]}>
            {new Date(ann.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>
      <View style={styles.annActions}>
        <TouchableOpacity
          onPress={() => onPin(ann)}
          style={[styles.annBtn, { backgroundColor: ann.isPinned ? colors.primary + '18' : colors.muted }]}
        >
          <Ionicons name={ann.isPinned ? 'pin' : 'pin-outline'} size={15} color={ann.isPinned ? colors.primary : colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(ann.id)}
          style={[styles.annBtn, { backgroundColor: '#ef444412' }]}
        >
          <Ionicons name="trash-outline" size={15} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ExecutiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('members');
  const [members, setMembers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, executives: 0 });
  const [search, setSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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
  const [evtCategory, setEvtCategory] = useState('General');
  const [evtLoading, setEvtLoading] = useState(false);

  // QR modal
  const [qrModal, setQrModal] = useState(false);
  const [qrEvent, setQrEvent] = useState<Event | null>(null);

  const EVENT_CATEGORIES = ['General', 'Workshop', 'Hackathon', 'Seminar', 'Bootcamp', 'Meeting', 'Social'];
  const dateChips = [
    { label: 'Today', value: new Date().toISOString().split('T')[0] },
    { label: 'Tomorrow', value: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })() },
    { label: 'Next Fri', value: (() => { const d = new Date(); const diff = (5 + 7 - d.getDay()) % 7; const t = new Date(); t.setDate(d.getDate() + (diff === 0 ? 7 : diff)); return t.toISOString().split('T')[0]; })() },
  ];
  const timeChips = ['08:00 AM', '09:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'];
  const venueChips = ['Computer Lab 3', 'Seminar Room B', 'Main Hall', 'Library', 'Online / Zoom'];
  const maxChips = ['30', '50', '100', '150', '200'];

  const load = useCallback(async () => {
    try {
      const [mems, evts, s, anns] = await Promise.all([
        db.getAllMembers(),
        db.getEvents(),
        db.getClubStats(),
        db.getAnnouncements(),
      ]);
      setMembers(mems);
      setEvents(evts);
      setStats(s);
      setAnnouncements(anns);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Real-time: update member list and stats live
    const chan = supabase
      .channel('exec-realtime')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'profiles' }, () => {
        db.getAllMembers().then(setMembers).catch(() => {});
        db.getClubStats().then(setStats).catch(() => {});
      })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'events' }, () => {
        db.getEvents().then(setEvents).catch(() => {});
      })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'announcements' }, () => {
        db.getAnnouncements().then(setAnnouncements).catch(() => {});
      })
      .subscribe();
    channelRef.current = chan;
    return () => { chan.unsubscribe(); };
  }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);
  const topPad = Platform.OS === 'web' ? 24 : insets.top + 4;

  async function handleMemberAction(member: User, action: 'approve' | 'deactivate' | 'suspend' | 'role') {
    if (action === 'role') {
      if (Platform.OS === 'web') {
        const role = window.prompt(`New role for ${member.fullName}? (member/executive/admin)`) as UserRole | null;
        if (role && ['member', 'executive', 'admin'].includes(role)) {
          await db.updateUserRole(member.id, role as UserRole);
          showToast('success', 'Role updated');
        }
        return;
      }
      Alert.alert('Change Role', `Select role for ${member.fullName}`,
        ROLE_OPTS.map(r => ({
          text: r.label,
          onPress: async () => {
            await db.updateUserRole(member.id, r.value);
            showToast('success', 'Role updated', `${member.fullName} is now ${r.label}`);
          },
        }))
      );
      return;
    }

    const labels = { approve: 'Approve', deactivate: 'Deactivate', suspend: 'Suspend' };
    const msgs = {
      approve: `Approve ${member.fullName} as an active member?`,
      deactivate: `Deactivate ${member.fullName}'s membership?`,
      suspend: `Suspend ${member.fullName}? They won't be able to log in.`,
    };

    const doAction = async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (action === 'approve') await db.approveUser(member.id);
      else if (action === 'deactivate') await db.deactivateUser(member.id);
      else await db.suspendUser(member.id);
      showToast('success', `${labels[action]} successful`);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(msgs[action])) doAction();
    } else {
      Alert.alert('Confirm', msgs[action], [
        { text: 'Cancel', style: 'cancel' },
        { text: labels[action], style: action === 'suspend' ? 'destructive' : 'default', onPress: doAction },
      ]);
    }
  }

  async function handleDeleteEvent(id: string) {
    const doDelete = async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await db.deleteEvent(id);
      showToast('success', 'Event deleted');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this event?')) doDelete();
    } else {
      Alert.alert('Delete Event', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  async function handleEventStatusChange(event: Event) {
    const nextStatus: Record<Event['status'], Event['status']> = {
      upcoming: 'ongoing',
      ongoing: 'past',
      past: 'upcoming',
    };
    const next = nextStatus[event.status];
    if (Platform.OS === 'web') {
      if (!window.confirm(`Change status from "${event.status}" to "${next}"?`)) return;
    } else {
      await new Promise<void>(resolve => {
        Alert.alert('Change Status', `Mark as "${next}"?`, [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
          { text: 'Confirm', onPress: () => { resolve(); } },
        ]);
      });
    }
    await db.updateEvent(event.id, { status: next });
    showToast('success', 'Status updated', `Event is now "${next}"`);
  }

  async function handleDeleteAnnouncement(id: string) {
    const doDelete = async () => {
      await db.deleteAnnouncement(id);
      showToast('success', 'Announcement deleted');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this announcement?')) doDelete();
    } else {
      Alert.alert('Delete', 'Remove this announcement?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  async function handleTogglePin(ann: Announcement) {
    await db.updateAnnouncement(ann.id, { isPinned: !ann.isPinned });
    showToast('success', ann.isPinned ? 'Unpinned' : 'Pinned');
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
    } catch (err: unknown) {
      showToast('error', 'Failed to publish', err instanceof Error ? err.message : 'Unknown error');
    } finally { setAnnLoading(false); }
  }

  async function submitEvent() {
    if (!evtTitle.trim() || !evtDate.trim() || !evtVenue.trim()) {
      showToast('warning', 'Missing fields', 'Title, date and venue are required');
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
        category: evtCategory,
        status: 'upcoming',
        maxAttendees: parseInt(evtMax) || 100,
        organizerId: user!.id,
        tags: [],
      });
      showToast('success', 'Event created!');
      setEvtModal(false);
      setEvtTitle(''); setEvtDesc(''); setEvtDate(''); setEvtTime(''); setEvtVenue(''); setEvtMax('100');
    } catch (err: unknown) {
      showToast('error', 'Failed to create event', err instanceof Error ? err.message : 'Unknown error');
    } finally { setEvtLoading(false); }
  }

  const filteredMembers = members
    .filter(m => memberFilter === 'all' || m.status === memberFilter)
    .filter(m => !search.trim() || [m.fullName, m.memberId, m.studentNumber, m.email].some(v => v?.toLowerCase().includes(search.toLowerCase())));

  const pendingMembers = members.filter(m => m.status === 'pending');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Management</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setEvtModal(true)}
              style={[styles.headerBtn, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '30' }]}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAnnModal(true)}
              style={[styles.headerBtn, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '30' }]}
            >
              <Ionicons name="megaphone-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab bar */}
        <View style={[styles.tabBar, { backgroundColor: colors.muted, marginHorizontal: 16 }]}>
          {(['members', 'events', 'announcements'] as Tab[]).map(t => {
            const counts: Record<Tab, number> = {
              members: members.length,
              events: events.length,
              announcements: announcements.length,
            };
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tabBtn, tab === t && { backgroundColor: colors.card }]}
              >
                <Text style={[styles.tabText, { color: tab === t ? colors.foreground : colors.mutedForeground }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
                {counts[t] > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: tab === t ? colors.primary : 'transparent' }]}>
                    <Text style={[styles.tabBadgeText, { color: tab === t ? '#fff' : colors.mutedForeground }]}>
                      {counts[t]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* Stats */}
          <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.statsRow}>
            {[
              { v: stats.total, l: 'Total', c: colors.primary, icon: 'people' as const },
              { v: stats.active, l: 'Active', c: '#22c55e', icon: 'checkmark-circle' as const },
              { v: stats.pending, l: 'Pending', c: '#f59e0b', icon: 'time' as const },
              { v: stats.executives, l: 'Exec', c: '#3b82f6', icon: 'shield-checkmark' as const },
            ].map(s => (
              <View key={s.l} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name={s.icon} size={18} color={s.c} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>{s.v}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.l}</Text>
              </View>
            ))}
          </Animated.View>

          {/* ── MEMBERS TAB ────────────────────────────────────────── */}
          {tab === 'members' && (
            <Animated.View entering={FadeInDown.delay(40).springify()} style={{ gap: 12 }}>
              {pendingMembers.length > 0 && (
                <View style={[styles.pendingBanner, { backgroundColor: '#fef3c7', borderColor: '#f59e0b35' }]}>
                  <Ionicons name="time" size={16} color="#d97706" />
                  <Text style={styles.pendingText}>
                    {pendingMembers.length} member{pendingMembers.length > 1 ? 's' : ''} awaiting approval
                  </Text>
                </View>
              )}

              {/* Search + filter */}
              <Input
                placeholder="Search by name, ID, student number…"
                value={search}
                onChangeText={setSearch}
                leftIcon="search-outline"
              />

              {/* Status filter chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {(['all', 'pending', 'active', 'suspended'] as const).map(f => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setMemberFilter(f)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: memberFilter === f ? colors.primary : colors.muted,
                        borderColor: memberFilter === f ? colors.primary : colors.border,
                      }
                    ]}
                  >
                    <Text style={[styles.filterChipText, { color: memberFilter === f ? '#fff' : colors.mutedForeground }]}>
                      {f === 'all' ? `All (${members.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${members.filter(m => m.status === f).length})`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
                {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
              </Text>

              {filteredMembers.map((m, i) => (
                <Animated.View key={m.id} entering={FadeInDown.delay(i * 30).springify()}>
                  <MemberRow member={m} currentUser={user!} onAction={handleMemberAction} />
                </Animated.View>
              ))}

              {filteredMembers.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={36} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No members found</Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* ── EVENTS TAB ─────────────────────────────────────────── */}
          {tab === 'events' && (
            <Animated.View entering={FadeInDown.delay(40).springify()} style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setEvtModal(true)}
                style={[styles.createBtn, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}
              >
                <View style={[styles.createBtnIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="add" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.createBtnText, { color: colors.primary }]}>Create New Event</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>

              {events.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={36} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No events yet</Text>
                </View>
              ) : (
                events.map((evt, i) => (
                  <Animated.View key={evt.id} entering={FadeInDown.delay(i * 40).springify()}>
                    <EventManageRow
                      event={evt}
                      onDelete={handleDeleteEvent}
                      onQR={(e) => { setQrEvent(e); setQrModal(true); }}
                      onStatusChange={handleEventStatusChange}
                    />
                  </Animated.View>
                ))
              )}
            </Animated.View>
          )}

          {/* ── ANNOUNCEMENTS TAB ──────────────────────────────────── */}
          {tab === 'announcements' && (
            <Animated.View entering={FadeInDown.delay(40).springify()} style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setAnnModal(true)}
                style={[styles.createBtn, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}
              >
                <View style={[styles.createBtnIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="add" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.createBtnText, { color: colors.primary }]}>Post Announcement</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>

              {announcements.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="megaphone-outline" size={36} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No announcements yet</Text>
                </View>
              ) : (
                announcements.map((ann, i) => (
                  <Animated.View key={ann.id} entering={FadeInDown.delay(i * 40).springify()}>
                    <AnnouncementRow ann={ann} onDelete={handleDeleteAnnouncement} onPin={handleTogglePin} />
                  </Animated.View>
                ))
              )}
            </Animated.View>
          )}
        </ScrollView>
      )}

      {/* ── Announcement Modal ──────────────────────────────────────── */}
      <Modal visible={annModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAnnModal(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Post Announcement</Text>
            <TouchableOpacity onPress={() => setAnnModal(false)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Input label="Title *" placeholder="Announcement title" value={annTitle} onChangeText={setAnnTitle} />
            <View>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Content *</Text>
              <TextInput
                value={annContent}
                onChangeText={setAnnContent}
                placeholder="Write the announcement…"
                placeholderTextColor={colors.mutedForeground}
                multiline numberOfLines={6}
                style={[styles.textarea, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORY_OPTS.map(c => (
                <TouchableOpacity
                  key={c.value}
                  onPress={() => setAnnCat(c.value)}
                  style={[styles.chip, {
                    backgroundColor: annCat === c.value ? colors.primary : colors.muted,
                    borderColor: annCat === c.value ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={[styles.chipText, { color: annCat === c.value ? '#fff' : colors.mutedForeground }]}>
                    {c.emoji} {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setAnnPinned(p => !p)}
              style={[styles.toggleRow, {
                backgroundColor: annPinned ? colors.primary + '12' : colors.muted,
                borderColor: annPinned ? colors.primary + '35' : colors.border,
              }]}
            >
              <Ionicons name={annPinned ? 'pin' : 'pin-outline'} size={18} color={annPinned ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.toggleText, { color: colors.foreground }]}>Pin this announcement</Text>
              <View style={[styles.toggleKnob, { backgroundColor: annPinned ? colors.primary : colors.border }]}>
                {annPinned && <Ionicons name="checkmark" size={11} color="#fff" />}
              </View>
            </TouchableOpacity>

            <Button title="Publish Announcement" onPress={submitAnnouncement} loading={annLoading} />
          </ScrollView>
        </View>
      </Modal>

      {/* ── Create Event Modal ──────────────────────────────────────── */}
      <Modal visible={evtModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEvtModal(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Create Event</Text>
            <TouchableOpacity onPress={() => setEvtModal(false)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Input label="Event Title *" placeholder="e.g. Web Dev Workshop" value={evtTitle} onChangeText={setEvtTitle} leftIcon="calendar-outline" />
            <View>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Description</Text>
              <TextInput
                value={evtDesc} onChangeText={setEvtDesc}
                placeholder="What is this event about?"
                placeholderTextColor={colors.mutedForeground}
                multiline numberOfLines={4}
                style={[styles.textarea, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {EVENT_CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setEvtCategory(c)}
                  style={[styles.chip, {
                    backgroundColor: evtCategory === c ? colors.primary : colors.muted,
                    borderColor: evtCategory === c ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={[styles.chipText, { color: evtCategory === c ? '#fff' : colors.mutedForeground }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input label="Date * (YYYY-MM-DD)" placeholder="2025-12-01" value={evtDate} onChangeText={setEvtDate} leftIcon="calendar" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {dateChips.map(c => (
                <TouchableOpacity key={c.label} onPress={() => setEvtDate(c.value)}
                  style={[styles.chip, { backgroundColor: evtDate === c.value ? colors.primary : colors.muted, borderColor: evtDate === c.value ? colors.primary : colors.border }]}>
                  <Text style={[styles.chipText, { color: evtDate === c.value ? '#fff' : colors.mutedForeground }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {timeChips.map(t => (
                <TouchableOpacity key={t} onPress={() => setEvtTime(t)}
                  style={[styles.chip, { backgroundColor: evtTime === t ? colors.primary : colors.muted, borderColor: evtTime === t ? colors.primary : colors.border }]}>
                  <Text style={[styles.chipText, { color: evtTime === t ? '#fff' : colors.mutedForeground }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Venue *</Text>
            <Input placeholder="Enter venue…" value={evtVenue} onChangeText={setEvtVenue} leftIcon="location-outline" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {venueChips.map(v => (
                <TouchableOpacity key={v} onPress={() => setEvtVenue(v)}
                  style={[styles.chip, { backgroundColor: evtVenue === v ? colors.primary : colors.muted, borderColor: evtVenue === v ? colors.primary : colors.border }]}>
                  <Text style={[styles.chipText, { color: evtVenue === v ? '#fff' : colors.mutedForeground }]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Max Attendees</Text>
            <View style={styles.chipRow}>
              {maxChips.map(m => (
                <TouchableOpacity key={m} onPress={() => setEvtMax(m)}
                  style={[styles.chip, { backgroundColor: evtMax === m ? colors.primary : colors.muted, borderColor: evtMax === m ? colors.primary : colors.border }]}>
                  <Text style={[styles.chipText, { color: evtMax === m ? '#fff' : colors.mutedForeground }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Create Event" onPress={submitEvent} loading={evtLoading} />
          </ScrollView>
        </View>
      </Modal>

      {/* ── Event QR Modal ──────────────────────────────────────────── */}
      <Modal visible={qrModal} transparent animationType="fade" onRequestClose={() => setQrModal(false)}>
        <View style={styles.qrOverlay}>
          <Animated.View
            entering={FadeInDown.springify()}
            style={[styles.qrModal, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Event QR Code</Text>
              <TouchableOpacity onPress={() => setQrModal(false)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name="close" size={18} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {qrEvent && (
              <>
                <Text style={[styles.qrEventTitle, { color: colors.foreground }]}>{qrEvent.title}</Text>
                <Text style={[styles.qrEventMeta, { color: colors.mutedForeground }]}>{qrEvent.date} · {qrEvent.venue}</Text>

                <View style={[styles.qrBox, { borderColor: colors.primary + '40' }]}>
                  <QRCode
                    value={JSON.stringify({ eventId: qrEvent.id, title: qrEvent.title })}
                    size={220}
                    color="#0f172a"
                    backgroundColor="#ffffff"
                  />
                </View>

                <Text style={[styles.qrHint, { color: colors.mutedForeground }]}>
                  Members scan this QR code with the ITIC app to check in to this event.
                </Text>

                <View style={[styles.qrStats, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Ionicons name="people-outline" size={16} color={colors.primary} />
                  <Text style={[styles.qrStatsText, { color: colors.foreground }]}>
                    {qrEvent.attendeeCount} / {qrEvent.maxAttendees} registered
                  </Text>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingBottom: 10, gap: 10, borderBottomWidth: 1 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  headerBtn: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', padding: 3, borderRadius: 12 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 7, borderRadius: 10, gap: 5 },
  tabText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  scroll: { padding: 16, gap: 12 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.4 },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    borderRadius: 12, borderWidth: 1,
  },
  pendingText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#92400e' },

  // Members
  memberCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  memberRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  memberAvatar: { width: 46, height: 46, borderRadius: 13, overflow: 'hidden', borderWidth: 1 },
  // memberAvatarImg/Grad/Text removed — AvatarDisplay handles internally
  memberName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  memberId: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.4 },
  memberSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  drawer: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, gap: 0 },
  drawerSection: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: 12 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailItem: { width: '47%' },
  detailLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  detailValue: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  contactRow: { gap: 8 },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 10, borderWidth: 1,
  },
  contactBtnText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  // Events
  evtCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  evtIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  evtTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  evtMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusPillText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' },
  barTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  evtActions: { flexDirection: 'row', gap: 8 },
  evtBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, flex: 1, justifyContent: 'center' },
  evtBtnText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  // Announcements
  annCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 3, padding: 14, flexDirection: 'row', gap: 12 },
  annTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  annContent: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  catPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  catPillText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.4 },
  annMeta: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  annActions: { gap: 8 },
  annBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Search/filter
  resultCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },

  // Create btn
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  createBtnIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  // Modals
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 20, gap: 14 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  textarea: {
    borderRadius: 12, borderWidth: 1, padding: 12,
    fontSize: 14, fontFamily: 'Inter_400Regular',
    minHeight: 100, textAlignVertical: 'top',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  toggleText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // QR modal
  qrOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  qrModal: { borderRadius: 24, borderWidth: 1, padding: 24, gap: 12, width: '100%', maxWidth: 360, alignItems: 'center' },
  qrEventTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  qrEventMeta: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  qrBox: {
    padding: 16, borderRadius: 16, borderWidth: 2,
    backgroundColor: '#fff', marginVertical: 8,
  },
  qrHint: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
  qrStats: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  qrStatsText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
