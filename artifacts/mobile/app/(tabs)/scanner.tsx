import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import * as db from '@/services/db';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { User, Event, QRPayload } from '@/types';

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

type ScanResult = {
  member: User;
  event: Event | null;
  alreadyCheckedIn: boolean;
  justRecorded: boolean;
};

export default function ScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'select-event' | 'scanning' | 'result'>('select-event');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState('');
  const cooldownRef = useRef(false);

  // Camera permission (native only)
  const permHook = useCameraPermissions?.();
  const permission = permHook?.[0] ?? null;
  const requestPermission = permHook?.[1] ?? (async () => {});

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const all = await db.getEvents();
      setEvents(all.filter(e => e.status !== 'past'));
    } catch {
      showToast('error', 'Failed to load events');
    }
  }

  const handleScanned = useCallback(async (data: string) => {
    if (cooldownRef.current || !selectedEvent || !user) return;
    cooldownRef.current = true;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setMode('result');
    setLoading(true);

    try {
      let payload: QRPayload;
      try {
        payload = JSON.parse(data);
      } catch {
        showToast('error', 'Invalid QR code', 'This does not appear to be an ITIC member QR code.');
        setMode('scanning');
        setTimeout(() => { cooldownRef.current = false; }, 2000);
        setLoading(false);
        return;
      }

      const member = await db.getMemberById(payload.userId);
      if (!member) {
        showToast('error', 'Member not found', 'This QR code does not match any registered member.');
        setMode('scanning');
        setTimeout(() => { cooldownRef.current = false; }, 2000);
        setLoading(false);
        return;
      }

      let alreadyCheckedIn = false;
      let justRecorded = false;

      try {
        await db.markAttendance(member.id, selectedEvent.id, selectedEvent.title, user.id);
        justRecorded = true;
        showToast('success', 'Attendance marked!', `${member.fullName} checked in to ${selectedEvent.title}`);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('already marked')) {
          alreadyCheckedIn = true;
        } else {
          throw err;
        }
      }

      setScanResult({ member, event: selectedEvent, alreadyCheckedIn, justRecorded });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showToast('error', 'Scan failed', msg);
      setMode('scanning');
      setTimeout(() => { cooldownRef.current = false; }, 2000);
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, user, showToast]);

  async function handleManualEntry() {
    if (!manualId.trim()) return;
    setLoading(true);
    try {
      const member = await db.getMemberByMemberId(manualId.trim().toUpperCase());
      if (!member) {
        showToast('error', 'Member not found', `No member with ID ${manualId.trim()}`);
        setLoading(false);
        return;
      }
      await handleScanned(JSON.stringify({ userId: member.id, memberId: member.memberId, name: member.fullName }));
    } catch {
      showToast('error', 'Lookup failed');
    } finally {
      setLoading(false);
    }
  }

  function resetScanner() {
    setScanResult(null);
    cooldownRef.current = false;
    setManualId('');
    setMode('scanning');
  }

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  // ─── Event selection ─────────────────────────────────────────────────────────
  if (mode === 'select-event') {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="qr-code" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Attendance Scanner</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Select the event you're checking members into
          </Text>
        </Animated.View>

        {events.length === 0 ? (
          <GlassCard style={styles.empty}>
            <Ionicons name="calendar-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No upcoming events</Text>
          </GlassCard>
        ) : (
          events.map((evt, i) => (
            <Animated.View key={evt.id} entering={FadeInDown.delay(i * 60).springify()}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => { setSelectedEvent(evt); setMode('scanning'); }}
                style={[styles.eventRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.eventIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventTitle, { color: colors.foreground }]}>{evt.title}</Text>
                  <Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>
                    {evt.date} · {evt.venue}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>
    );
  }

  // ─── Result screen ────────────────────────────────────────────────────────────
  if (mode === 'result') {
    return (
      <View style={[styles.resultContainer, { backgroundColor: colors.background, paddingTop: topPad }]}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : scanResult ? (
          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
            <Animated.View entering={ZoomIn.springify()} style={{ alignItems: 'center', gap: 12 }}>
              {/* Status icon */}
              <View style={[
                styles.resultIcon,
                {
                  backgroundColor: scanResult.alreadyCheckedIn ? '#f59e0b20' : '#16a34a20',
                },
              ]}>
                <Ionicons
                  name={scanResult.alreadyCheckedIn ? 'warning' : 'checkmark-circle'}
                  size={56}
                  color={scanResult.alreadyCheckedIn ? '#f59e0b' : '#16a34a'}
                />
              </View>

              <Text style={[styles.resultStatus, {
                color: scanResult.alreadyCheckedIn ? '#f59e0b' : '#16a34a',
              }]}>
                {scanResult.alreadyCheckedIn ? 'Already Checked In' : 'Attendance Marked!'}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(100).springify()}>
              <GlassCard style={{ gap: 14 }}>
                {/* Avatar */}
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>
                      {scanResult.member.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.memberName, { color: colors.foreground }]}>
                    {scanResult.member.fullName}
                  </Text>
                  <Text style={[styles.memberIdText, { color: colors.primary }]}>
                    {scanResult.member.memberId}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <StatusBadge status={scanResult.member.status} />
                    <RoleBadge role={scanResult.member.role} />
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Details */}
                <InfoRow icon="school-outline" label="Programme" value={scanResult.member.programme} colors={colors} />
                <InfoRow icon="card-outline" label="Student ID" value={scanResult.member.studentNumber} colors={colors} />
                <InfoRow icon="calendar-outline" label="Event" value={scanResult.event?.title ?? ''} colors={colors} />
                {scanResult.alreadyCheckedIn && (
                  <View style={[styles.alreadyBanner, { backgroundColor: '#fef3c7', borderRadius: 10 }]}>
                    <Ionicons name="information-circle" size={16} color="#92400e" />
                    <Text style={styles.alreadyText}>This member was already checked in to this event.</Text>
                  </View>
                )}
              </GlassCard>
            </Animated.View>

            <View style={{ gap: 10 }}>
              <Button title="Scan Next Member" onPress={resetScanner} />
              <Button
                title="Change Event"
                variant="outline"
                onPress={() => { setScanResult(null); setMode('select-event'); }}
              />
            </View>
          </ScrollView>
        ) : null}
      </View>
    );
  }

  // ─── Scanning screen ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.scannerContainer, { backgroundColor: '#000' }]}>
      {/* Header overlay */}
      <View style={[styles.scanHeader, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => setMode('select-event')}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.scanHeaderTitle}>{selectedEvent?.title}</Text>
          <Text style={styles.scanHeaderSub}>Point camera at member's QR code</Text>
        </View>
      </View>

      {/* Camera or web fallback */}
      {Platform.OS === 'web' || !CameraView ? (
        <View style={[styles.webFallback, { backgroundColor: colors.background }]}>
          <Ionicons name="qr-code-outline" size={64} color={colors.mutedForeground} />
          <Text style={[styles.fallbackTitle, { color: colors.foreground }]}>
            QR scanning requires the Expo Go app
          </Text>
          <Text style={[styles.fallbackSub, { color: colors.mutedForeground }]}>
            Enter a member ID manually:
          </Text>
          <Input
            placeholder="ITIC-2024-0001"
            value={manualId}
            onChangeText={setManualId}
            autoCapitalize="characters"
            leftIcon="card-outline"
          />
          <Button
            title="Look Up Member"
            onPress={handleManualEntry}
            loading={loading}
          />
          <Button
            title="Change Event"
            variant="outline"
            onPress={() => setMode('select-event')}
          />
        </View>
      ) : !permission?.granted ? (
        <View style={[styles.webFallback, { backgroundColor: colors.background }]}>
          <Ionicons name="camera-outline" size={64} color={colors.mutedForeground} />
          <Text style={[styles.fallbackTitle, { color: colors.foreground }]}>Camera Permission Required</Text>
          <Text style={[styles.fallbackSub, { color: colors.mutedForeground }]}>
            Grant camera access to scan QR codes
          </Text>
          <Button title="Grant Camera Access" onPress={requestPermission} />
        </View>
      ) : (
        <>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => handleScanned(data)}
          />
          {/* Viewfinder overlay */}
          <View style={styles.overlay}>
            <View style={styles.finder}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
            </View>
            <Text style={styles.scanHint}>Align the member's QR code within the frame</Text>
          </View>

          {/* Manual fallback */}
          <View style={[styles.manualBar, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.manualLabel}>Or enter member ID manually</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="ITIC-2024-0001"
                  value={manualId}
                  onChangeText={setManualId}
                  autoCapitalize="characters"
                  leftIcon="card-outline"
                />
              </View>
              <TouchableOpacity
                style={[styles.manualBtn, { backgroundColor: '#16a34a' }]}
                onPress={handleManualEntry}
              >
                <Ionicons name="search" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

function InfoRow({ icon, label, value, colors }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string; colors: ReturnType<typeof useColors>;
}) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <Ionicons name={icon} size={16} color={colors.mutedForeground} style={{ width: 18, marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
        <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.foreground }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 16 },
  header: { alignItems: 'center', gap: 8, marginBottom: 4 },
  iconBadge: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 14, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  eventIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  eventTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  eventMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  resultContainer: { flex: 1 },
  resultIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  resultStatus: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  avatar: {
    width: 64, height: 64, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#fff' },
  memberName: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  memberIdText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  divider: { height: 1 },
  alreadyBanner: { flexDirection: 'row', gap: 8, padding: 10, alignItems: 'flex-start' },
  alreadyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#92400e', flex: 1 },
  scannerContainer: { flex: 1 },
  scanHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: '#00000088',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center',
  },
  scanHeaderTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  scanHeaderSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#ffffff99' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  finder: { width: 220, height: 220, position: 'relative' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#16a34a', borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  scanHint: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#ffffffcc', textAlign: 'center', paddingHorizontal: 40 },
  manualBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#000000cc', paddingHorizontal: 20, paddingTop: 16, gap: 8,
  },
  manualLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#ffffff99', textAlign: 'center' },
  manualBtn: {
    width: 52, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  webFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  fallbackTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  fallbackSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
