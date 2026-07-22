import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Modal, Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/services/supabase';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import * as db from '@/services/db';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { EventCard } from '@/components/EventCard';
import { MemberIDCard } from '@/components/MemberIDCard';
import { Announcement, Event } from '@/types';

// Lazy camera import for self-check-in
let CameraView: React.ComponentType<{
  style?: object;
  facing?: 'front' | 'back';
  barcodeScannerSettings?: { barcodeTypes: string[] };
  onBarcodeScanned?: (result: { data: string }) => void;
}> | null = null;
let useCameraPermissions: (() => [{ granted: boolean } | null, () => Promise<void>]) | null = null;
if (Platform.OS !== 'web') {
  try { const cam = require('expo-camera'); CameraView = cam.CameraView; useCameraPermissions = cam.useCameraPermissions; } catch {}
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diff = Math.floor((d.getTime() - now.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff <= 7) return `In ${diff} days`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ── Stat Card for Exec dashboard ──────────────────────────────────────────────
function DashStatCard({ value, label, icon, color }: { value: number; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  const colors = useColors();
  return (
    <View style={[dashStyles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[dashStyles.statIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[dashStyles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[dashStyles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const dashStyles = StyleSheet.create({
  statCard: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14,
    borderRadius: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.4 },
});

// ── Quick Action card ─────────────────────────────────────────────────────────
function QuickAction({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[qaStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[qaStyles.icon, { backgroundColor: color + '14' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[qaStyles.label, { color: colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const qaStyles = StyleSheet.create({
  card: {
    width: '47%', padding: 16, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const isPrivileged = user?.role === 'executive' || user?.role === 'admin';
  const topPad = Platform.OS === 'web' ? 24 : insets.top + 8;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, executives: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const permHook = useCameraPermissions?.();
  const permission = permHook?.[0] ?? null;
  const requestPermission = permHook?.[1] ?? (async () => {});

  const load = useCallback(async () => {
    try {
      const [ann, evts, s] = await Promise.all([
        db.getAnnouncements(),
        db.getEvents(),
        isPrivileged ? db.getClubStats() : Promise.resolve({ total: 0, active: 0, pending: 0, executives: 0 }),
        refreshUser().catch(() => {}),
      ]);
      setAnnouncements(ann.slice(0, 3));
      setEvents(evts);
      if (isPrivileged) {
        setStats(s);
        setPendingCount(s.pending);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isPrivileged, refreshUser]);

  useEffect(() => {
    load();
    // Real-time: re-fetch stats when member profiles change
    const chan = supabase
      .channel('home-realtime')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'profiles' }, () => {
        if (isPrivileged) {
          db.getClubStats().then(s => { setStats(s); setPendingCount(s.pending); }).catch(() => {});
        }
      })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'events' }, () => {
        db.getEvents().then(setEvents).catch(() => {});
      })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'announcements' }, () => {
        db.getAnnouncements().then(a => setAnnouncements(a.slice(0, 3))).catch(() => {});
      })
      .subscribe();
    channelRef.current = chan;
    return () => { chan.unsubscribe(); };
  }, [load, isPrivileged]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const handleSelfCheckinScanned = async (data: string) => {
    if (checkingIn || !user) return;
    setCheckingIn(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      let qrData: { eventId?: string } | null = null;
      try { qrData = JSON.parse(data); } catch {
        if (/^[0-9a-f-]{36}$/i.test(data)) qrData = { eventId: data };
      }
      if (!qrData?.eventId) {
        showToast('error', 'Invalid Code', 'This QR code is not a valid ITIC event code.');
        setCheckingIn(false); return;
      }
      const event = await db.getEventById(qrData.eventId);
      if (!event) { showToast('error', 'Event not found'); setCheckingIn(false); return; }
      if (event.status === 'past') { showToast('warning', 'Event Closed', 'This event has ended.'); setCheckingIn(false); return; }
      try {
        await db.markAttendance(user.id, event.id, event.title, user.id);
        showToast('success', 'Checked In!', `You're in for ${event.title}`);
        setScannerVisible(false);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('already marked')) {
          showToast('info', 'Already Checked In', `You're already registered for ${event.title}`);
          setScannerVisible(false);
        } else throw err;
      }
    } catch (err: unknown) {
      showToast('error', 'Check-in failed', err instanceof Error ? err.message : 'Unknown error');
    } finally { setCheckingIn(false); }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const upcomingEvents = events.filter(e => e.status === 'upcoming' || e.status === 'ongoing').slice(0, 3);
  const todayEvents = events.filter(e => {
    const today = new Date().toISOString().split('T')[0];
    return e.date === today && e.status !== 'past';
  });

  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? 'IT';

  // ─── MEMBER HOME ─────────────────────────────────────────────────────────────
  if (!isPrivileged) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Greeting */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.greetRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{timeGreeting()} 👋</Text>
            <Text style={[styles.greetName, { color: colors.foreground }]}>{user?.fullName?.split(' ')[0] ?? 'Member'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.greetAvatar}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.greetAvatarImg} />
            ) : (
              <LinearGradient colors={[colors.primary, colors.primary + '99']} style={styles.greetAvatarGrad}>
                <Text style={styles.greetAvatarText}>{initials}</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Pending notice */}
        {user?.status === 'pending' && (
          <Animated.View entering={FadeInDown.delay(30).springify()}>
            <View style={[styles.pendingBanner, { backgroundColor: '#fef3c720', borderColor: '#f59e0b35' }]}>
              <View style={styles.pendingIconWrap}>
                <Ionicons name="time-outline" size={18} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f59e0b', fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>Approval Pending</Text>
                <Text style={{ color: '#f59e0b', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 18 }}>
                  Your membership is awaiting executive approval. You'll be notified soon.
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Member ID Card */}
        {user && (
          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <MemberIDCard user={user} />
          </Animated.View>
        )}

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.qaGrid}>
            <QuickAction icon="calendar-outline" label="Events" color="#3b82f6" onPress={() => router.push('/(tabs)/events')} />
            <QuickAction icon="megaphone-outline" label="News" color="#f59e0b" onPress={() => router.push('/(tabs)/announcements')} />
            <QuickAction icon="card-outline" label="My Card" color="#16a34a" onPress={() => router.push('/(tabs)/profile')} />
            <QuickAction icon="scan-outline" label="Check In" color="#ec4899" onPress={() => setScannerVisible(true)} />
          </View>
        </Animated.View>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <Animated.View entering={FadeInUp.delay(140).springify()} style={{ gap: 12 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Events</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all →</Text>
              </TouchableOpacity>
            </View>
            {upcomingEvents.map((evt, i) => (
              <Animated.View key={evt.id} entering={FadeInUp.delay(150 + i * 50).springify()}>
                <EventCard event={evt} onPress={() => router.push(`/event/${evt.id}` as Parameters<typeof router.push>[0])} />
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* Latest News */}
        {announcements.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200).springify()} style={{ gap: 12 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Latest News</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all →</Text>
              </TouchableOpacity>
            </View>
            {announcements.map((ann, i) => (
              <Animated.View key={ann.id} entering={FadeInUp.delay(210 + i * 50).springify()}>
                <AnnouncementCard
                  announcement={ann}
                  onPress={() => router.push(`/announcement/${ann.id}` as Parameters<typeof router.push>[0])}
                />
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {upcomingEvents.length === 0 && announcements.length === 0 && (
          <Animated.View entering={FadeInUp.delay(160).springify()}>
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="sparkles-outline" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All caught up!</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No upcoming events or news right now. Check back soon!
              </Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* Self check-in scanner modal */}
        <Modal visible={scannerVisible} transparent animationType="fade" onRequestClose={() => setScannerVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => !checkingIn && setScannerVisible(false)}>
            <Animated.View
              entering={FadeInDown.springify()}
              style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Pressable onPress={e => e.stopPropagation()}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.foreground }]}>Scan to Check In</Text>
                  <TouchableOpacity onPress={() => setScannerVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                    <Ionicons name="close" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                  Point your camera at an event QR code
                </Text>

                {checkingIn ? (
                  <View style={styles.modalLoading}>
                    <ActivityIndicator color={colors.primary} size="large" />
                    <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Verifying check-in...</Text>
                  </View>
                ) : Platform.OS === 'web' || !CameraView ? (
                  <View style={styles.webFallback}>
                    <Ionicons name="camera-off-outline" size={40} color={colors.mutedForeground} />
                    <Text style={[styles.webFallbackText, { color: colors.mutedForeground }]}>
                      Camera scanning requires the Expo Go app on your phone.
                    </Text>
                  </View>
                ) : permission && !permission.granted ? (
                  <View style={styles.webFallback}>
                    <Ionicons name="camera-outline" size={40} color={colors.mutedForeground} />
                    <Text style={[styles.webFallbackText, { color: colors.foreground }]}>Camera permission required</Text>
                    <TouchableOpacity onPress={requestPermission} style={[styles.grantBtn, { backgroundColor: colors.primary }]}>
                      <Text style={styles.grantBtnText}>Grant Access</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.cameraBox}>
                    <CameraView
                      style={StyleSheet.absoluteFill}
                      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      onBarcodeScanned={({ data }) => handleSelfCheckinScanned(data)}
                    />
                    <View style={styles.scanTarget}>
                      {(['tl', 'tr', 'bl', 'br'] as const).map(c => (
                        <View key={c} style={[styles.corner, styles[c], { borderColor: colors.primary }]} />
                      ))}
                    </View>
                    <Text style={styles.scanHint}>Align the QR code within the frame</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      </ScrollView>
    );
  }

  // ─── EXECUTIVE / ADMIN HOME ───────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Exec greeting + avatar */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <LinearGradient
          colors={[colors.primary + '20', colors.primary + '06', 'transparent']}
          style={[styles.execHero, { paddingTop: 16 }]}
        >
          <View style={styles.greetRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{timeGreeting()}</Text>
              <Text style={[styles.greetName, { color: colors.foreground }]}>{user?.fullName?.split(' ')[0]}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                <StatusBadge status={user!.status} />
                <RoleBadge role={user!.role} />
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.greetAvatar}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.greetAvatarImg} />
              ) : (
                <LinearGradient colors={[colors.primary, colors.primary + '99']} style={styles.greetAvatarGrad}>
                  <Text style={styles.greetAvatarText}>{initials}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Stats grid */}
      <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.statsRow}>
        <DashStatCard value={stats.total} label="Total" icon="people" color={colors.primary} />
        <DashStatCard value={stats.active} label="Active" icon="checkmark-circle" color="#22c55e" />
        <DashStatCard value={stats.pending} label="Pending" icon="time" color="#f59e0b" />
        <DashStatCard value={stats.executives} label="Exec" icon="shield-checkmark" color="#3b82f6" />
      </Animated.View>

      {/* Pending approvals alert */}
      {pendingCount > 0 && (
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/executive')}
            style={[styles.pendingAlert, { backgroundColor: '#fef3c7', borderColor: '#f59e0b40' }]}
          >
            <View style={styles.pendingAlertIcon}>
              <Ionicons name="time" size={22} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingAlertTitle}>
                {pendingCount} member{pendingCount > 1 ? 's' : ''} awaiting approval
              </Text>
              <Text style={styles.pendingAlertSub}>Tap to review and approve</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#d97706" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Today's events */}
      {todayEvents.length > 0 && (
        <Animated.View entering={FadeInDown.delay(80).springify()} style={{ gap: 10 }}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.liveDot2, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today</Text>
            </View>
          </View>
          {todayEvents.map((evt, i) => (
            <Animated.View key={evt.id} entering={FadeInDown.delay(90 + i * 40).springify()}>
              <EventCard event={evt} onPress={() => router.push(`/event/${evt.id}` as Parameters<typeof router.push>[0])} compact />
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {/* Quick actions for exec */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.qaGrid}>
          <QuickAction icon="calendar-outline" label="Events" color="#3b82f6" onPress={() => router.push('/(tabs)/executive')} />
          <QuickAction icon="megaphone-outline" label="Post News" color="#f59e0b" onPress={() => router.push('/(tabs)/executive')} />
          <QuickAction icon="qr-code-outline" label="Scanner" color="#16a34a" onPress={() => router.push('/(tabs)/scanner')} />
          <QuickAction icon="people-outline" label="Members" color="#8b5cf6" onPress={() => router.push('/(tabs)/executive')} />
        </View>
      </Animated.View>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <Animated.View entering={FadeInUp.delay(140).springify()} style={{ gap: 12 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all →</Text>
            </TouchableOpacity>
          </View>
          {upcomingEvents.map((evt, i) => (
            <Animated.View key={evt.id} entering={FadeInUp.delay(150 + i * 50).springify()}>
              <EventCard event={evt} onPress={() => router.push(`/event/${evt.id}` as Parameters<typeof router.push>[0])} />
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {/* Latest announcements */}
      {announcements.length > 0 && (
        <Animated.View entering={FadeInUp.delay(200).springify()} style={{ gap: 12 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Latest News</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all →</Text>
            </TouchableOpacity>
          </View>
          {announcements.map((ann, i) => (
            <Animated.View key={ann.id} entering={FadeInUp.delay(210 + i * 50).springify()}>
              <AnnouncementCard
                announcement={ann}
                onPress={() => router.push(`/announcement/${ann.id}` as Parameters<typeof router.push>[0])}
              />
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, gap: 18 },
  greetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  greetName: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  greetAvatar: { width: 52, height: 52, borderRadius: 16, overflow: 'hidden' },
  greetAvatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  greetAvatarGrad: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  greetAvatarText: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  execHero: { borderRadius: 20, padding: 16, paddingBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 8 },
  pendingAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 16, borderWidth: 1,
  },
  pendingAlertIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#fde68a', alignItems: 'center', justifyContent: 'center',
  },
  pendingAlertTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#92400e' },
  pendingAlertSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#b45309', marginTop: 2 },
  pendingBanner: {
    flexDirection: 'row', gap: 10, padding: 14,
    borderRadius: 14, borderWidth: 1, alignItems: 'flex-start',
  },
  pendingIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#fde68a', alignItems: 'center', justifyContent: 'center',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot2: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  seeAll: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%', borderWidth: 1 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#94a3b840', alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modalLoading: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  webFallback: { alignItems: 'center', gap: 12, paddingVertical: 32, paddingHorizontal: 16 },
  webFallbackText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  grantBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 4 },
  grantBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  cameraBox: { height: 280, borderRadius: 16, overflow: 'hidden', position: 'relative', backgroundColor: '#000', marginBottom: 8 },
  scanTarget: { position: 'absolute', top: '15%', left: '15%', width: '70%', height: '70%' },
  corner: { position: 'absolute', width: 26, height: 26, borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  scanHint: { position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular', color: '#ffffffcc' },
});
