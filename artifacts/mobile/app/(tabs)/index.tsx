import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, Image, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
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

// Lazy-import camera only on native (avoids web crash)
let CameraView: React.ComponentType<{
  style?: object;
  facing?: 'front' | 'back';
  barcodeScannerSettings?: { barcodeTypes: string[] };
  onBarcodeScanned?: (result: { data: string }) => void;
}> | null = null;

let useCameraPermissions: (() => [{ granted: boolean } | null, () => Promise<void>]) | null = null;

if (Platform.OS !== 'web') {
  try {
    const cam = require('expo-camera');
    CameraView = cam.CameraView;
    useCameraPermissions = cam.useCameraPermissions;
  } catch {}
}

const QUICK_ACTIONS = [
  { icon: 'calendar-outline' as const, label: 'Events', route: '/(tabs)/events', color: '#3b82f6' },
  { icon: 'megaphone-outline' as const, label: 'News', route: '/(tabs)/announcements', color: '#f59e0b' },
  { icon: 'qr-code-outline' as const, label: 'My Card', route: '/(tabs)/profile', color: '#10b981' },
  { icon: 'scan-outline' as const, label: 'Check In', route: 'self-checkin', color: '#ec4899' },
  { icon: 'people-outline' as const, label: 'Members', route: '/(tabs)/executive', color: '#8b5cf6' },
];

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, executives: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const isPrivileged = user?.role === 'executive' || user?.role === 'admin';

  // Camera permission (native only)
  const permHook = useCameraPermissions?.();
  const permission = permHook?.[0] ?? null;
  const requestPermission = permHook?.[1] ?? (async () => {});

  const handleSelfCheckinScanned = async (data: string) => {
    if (checkingIn || !user) return;
    setCheckingIn(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      let qrData: { eventId?: string } | null = null;
      try {
        qrData = JSON.parse(data);
      } catch {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data)) {
          qrData = { eventId: data };
        }
      }

      if (!qrData || !qrData.eventId) {
        showToast('error', 'Invalid Code', 'This QR code is not a valid ITIC check-in code.');
        setCheckingIn(false);
        return;
      }

      const event = await db.getEventById(qrData.eventId);
      if (!event) {
        showToast('error', 'Event not found', 'This event does not exist in the database.');
        setCheckingIn(false);
        return;
      }

      if (event.status === 'past') {
        showToast('warning', 'Event Closed', 'This event has already ended.');
        setCheckingIn(false);
        return;
      }

      try {
        await db.markAttendance(user.id, event.id, event.title, user.id);
        showToast('success', 'Checked In!', `Successfully checked in to ${event.title}`);
        setScannerVisible(false);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('already marked')) {
          showToast('info', 'Already Checked In', `You are already checked in to ${event.title}`);
          setScannerVisible(false);
        } else {
          throw err;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check-in failed';
      showToast('error', 'Check-in failed', msg);
    } finally {
      setCheckingIn(false);
    }
  };

  const load = useCallback(async () => {
    try {
      const [ann, evts, s] = await Promise.all([
        db.getAnnouncements(),
        db.getEvents(),
        isPrivileged ? db.getClubStats() : Promise.resolve({ total: 0, active: 0, pending: 0, executives: 0 }),
        refreshUser().catch(() => {}),
      ]);
      setAnnouncements(ann.slice(0, 3));
      setEvents(evts.filter(e => e.status === 'upcoming').slice(0, 3));
      if (isPrivileged) setStats(s);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isPrivileged, refreshUser]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const topPad = Platform.OS === 'web' ? 24 : insets.top + 8;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Greeting Row */}
      <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {timeGreeting()} 👋
          </Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {user?.fullName.split(' ')[0] ?? 'Member'}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.headerAvatarWrap}
        >
          {user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.headerAvatarImage} />
          ) : (
            <LinearGradient
              colors={[colors.primary, colors.primary + '88']}
              style={styles.headerAvatarGradient}
            >
              <Text style={styles.headerAvatarText}>
                {user?.fullName?.charAt(0) ?? 'M'}
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Member ID Card (flip) */}
      {user && (
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <MemberIDCard user={user} />
        </Animated.View>
      )}

      {/* Pending notice banner */}
      {user?.status === 'pending' && (
        <Animated.View entering={FadeInUp.delay(80).springify()}>
          <View style={[styles.pendingBanner, { backgroundColor: '#fef3c720', borderColor: '#f59e0b30', marginTop: 4 }]}>
            <Ionicons name="time-outline" size={14} color="#f59e0b" style={{ marginRight: 4 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f59e0b', fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 }}>Approval Pending</Text>
              <Text style={{ color: '#f59e0b', fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 }}>
                Your membership is pending executive approval.
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Stats (exec/admin only) */}
      {isPrivileged && (
        <Animated.View entering={FadeInDown.delay(90).springify()}>
          <View style={styles.statsGrid}>
            {[
              { label: 'Total', value: stats.total, icon: 'people', color: colors.primary },
              { label: 'Active', value: stats.active, icon: 'checkmark-circle', color: '#22c55e' },
              { label: 'Pending', value: stats.pending, icon: 'time', color: '#f59e0b' },
              { label: 'Exec', value: stats.executives, icon: 'shield-checkmark', color: '#3b82f6' },
            ].map(s => (
              <GlassCard key={s.label} style={styles.statCard}>
                <Ionicons name={s.icon as React.ComponentProps<typeof Ionicons>['name']} size={20} color={s.color} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </GlassCard>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Quick actions */}
      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.filter(a => 
            (a.label !== 'Members' || isPrivileged) && 
            (a.label !== 'Check In' || !isPrivileged)
          ).map((action, i) => (
            <TouchableOpacity
              key={action.label}
              activeOpacity={0.75}
              onPress={() => {
                if (action.route === 'self-checkin') {
                  setScannerVisible(true);
                } else {
                  router.push(action.route as Parameters<typeof router.push>[0]);
                }
              }}
              style={[
                styles.actionCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }
              ]}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '12' }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Upcoming events */}
      {events.length > 0 && (
        <Animated.View entering={FadeInUp.delay(150).springify()} style={{ gap: 12 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {events.map((evt, i) => (
            <Animated.View key={evt.id} entering={FadeInUp.delay(160 + i * 50).springify()}>
              <EventCard event={evt} onPress={() => router.push(`/event/${evt.id}` as Parameters<typeof router.push>[0])} />
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {/* Latest announcements */}
      {announcements.length > 0 && (
        <Animated.View entering={FadeInUp.delay(220).springify()} style={{ gap: 12 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Latest News</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {announcements.map((ann, i) => (
            <Animated.View key={ann.id} entering={FadeInUp.delay(230 + i * 50).springify()}>
              <AnnouncementCard
                announcement={ann}
                onPress={() => router.push(`/announcement/${ann.id}` as Parameters<typeof router.push>[0])}
              />
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {/* Self Check-In Scanner Modal */}
      <Modal
        visible={scannerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setScannerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeInDown.springify()}
            style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Scan to Check In</Text>
              <TouchableOpacity
                onPress={() => setScannerVisible(false)}
                style={[styles.closeBtn, { backgroundColor: colors.muted }]}
              >
                <Ionicons name="close" size={18} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Point your camera at the meeting or event QR code
            </Text>

            {checkingIn ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Verifying check-in...</Text>
              </View>
            ) : Platform.OS === 'web' ? (
              <View style={styles.webFallback}>
                <Ionicons name="camera-off-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.webFallbackText, { color: colors.mutedForeground }]}>
                  Camera scanner is not supported on web. Use the mobile app to scan.
                </Text>
              </View>
            ) : !CameraView ? (
              <View style={styles.webFallback}>
                <Ionicons name="warning-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.webFallbackText, { color: colors.mutedForeground }]}>
                  Camera module failed to load.
                </Text>
              </View>
            ) : permission && !permission.granted ? (
              <View style={styles.permContainer}>
                <Ionicons name="camera-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.permText, { color: colors.foreground }]}>Camera Permission Required</Text>
                <Text style={[styles.permDesc, { color: colors.mutedForeground }]}>
                  We need camera access so you can scan the meeting QR code to check in.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={requestPermission}
                  style={[styles.permBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.permBtnText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={({ data }) => handleSelfCheckinScanned(data)}
                />
                <View style={styles.scanTarget}>
                  <View style={[styles.targetCorner, styles.topLeft, { borderColor: colors.primary }]} />
                  <View style={[styles.targetCorner, styles.topRight, { borderColor: colors.primary }]} />
                  <View style={[styles.targetCorner, styles.bottomLeft, { borderColor: colors.primary }]} />
                  <View style={[styles.targetCorner, styles.bottomRight, { borderColor: colors.primary }]} />
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, gap: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  greeting: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  name: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  headerAvatarWrap: { width: 48, height: 48, borderRadius: 16, overflow: 'hidden' },
  headerAvatarImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  headerAvatarGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  memberCard: { gap: 14 },
  pendingBanner: {
    flexDirection: 'row', gap: 7, padding: 10,
    borderRadius: 10, borderWidth: 1, alignItems: 'center',
  },
  pendingText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#f59e0b' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14 },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  actionCard: {
    width: '47%', padding: 16, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%', gap: 16, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: -4 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalLoading: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  webFallback: { alignItems: 'center', gap: 12, paddingVertical: 60, paddingHorizontal: 20 },
  webFallbackText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  permContainer: { alignItems: 'center', gap: 16, paddingVertical: 32, paddingHorizontal: 16 },
  permText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  permDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  permBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  permBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  cameraContainer: { flex: 1, borderRadius: 20, overflow: 'hidden', minHeight: 280, position: 'relative' },
  camera: { flex: 1 },
  scanTarget: { position: 'absolute', top: '15%', left: '15%', width: '70%', height: '70%' },
  targetCorner: { position: 'absolute', width: 24, height: 24, borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
});
