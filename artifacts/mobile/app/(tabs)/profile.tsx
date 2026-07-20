import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { AttendanceRecord } from '@/types';
import * as storage from '@/services/storage';
import { GlassCard } from '@/components/GlassCard';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import QRCode from 'react-native-qrcode-svg';

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const colors = useColors();
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.mutedForeground} style={{ width: 20 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

function formatDate(str: string) {
  try {
    return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return str; }
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    (async () => {
      if (user) {
        const att = await storage.getUserAttendance(user.id);
        setAttendance(att);
      }
      setLoading(false);
    })();
  }, [user?.id]);

  async function doLogout() {
    setSigningOut(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await logout();
      // AuthGuard in _layout.tsx will automatically redirect to login
    } catch {
      setSigningOut(false);
    }
  }

  function handleLogout() {
    if (Platform.OS === 'web') {
      // On web, Alert might not work reliably with async callbacks — use direct logout
      if (window.confirm('Sign out of ITIC Portal?')) {
        doLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  }

  if (!user || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const qrData = JSON.stringify({ memberId: user.memberId, name: user.fullName, id: user.id });

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: topPad + 16,
          paddingBottom: Platform.OS === 'web' ? 50 : insets.bottom + 90,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{user.fullName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.heroName, { color: colors.foreground }]}>{user.fullName}</Text>
        <Text style={[styles.heroId, { color: colors.primary }]}>{user.memberId}</Text>
        <View style={styles.badgeRow}>
          <StatusBadge status={user.status} />
          <RoleBadge role={user.role} />
        </View>
        <Text style={[styles.heroJoined, { color: colors.mutedForeground }]}>
          Joined {formatDate(user.joinedDate)}
        </Text>
      </Animated.View>

      {/* QR Code */}
      <Animated.View entering={FadeInDown.delay(150).springify()}>
        <GlassCard style={styles.qrCard}>
          <Text style={[styles.qrTitle, { color: colors.foreground }]}>Attendance QR Code</Text>
          <Text style={[styles.qrSub, { color: colors.mutedForeground }]}>
            Show this to an executive at events for attendance
          </Text>
          <View style={[styles.qrWrap, { backgroundColor: '#fff', borderRadius: colors.radius }]}>
            <QRCode
              value={qrData}
              size={180}
              color="#0f172a"
              backgroundColor="#ffffff"
            />
          </View>
          <Text style={[styles.qrId, { color: colors.primary }]}>{user.memberId}</Text>
        </GlassCard>
      </Animated.View>

      {/* Pending notice */}
      {user.status === 'pending' && (
        <Animated.View entering={FadeInUp.delay(160).springify()}>
          <View style={[styles.pendingNotice, { backgroundColor: '#fef3c7', borderColor: '#f59e0b40', borderRadius: colors.radius }]}>
            <Ionicons name="time-outline" size={18} color="#92400e" />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Approval Pending</Text>
              <Text style={styles.pendingText}>
                Your registration is under review by an executive. You can explore the app while waiting.
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Technology interests */}
      {user.technologyInterests.length > 0 && (
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <GlassCard>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Technology Interests</Text>
            <View style={styles.tagWrap}>
              {user.technologyInterests.map(t => (
                <View key={t} style={[styles.tag, { backgroundColor: colors.accent, borderRadius: colors.radius / 2 }]}>
                  <Text style={[styles.tagText, { color: colors.accentForeground }]}>{t}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* Programming languages */}
      {user.programmingLanguages.length > 0 && (
        <Animated.View entering={FadeInUp.delay(220).springify()}>
          <GlassCard>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Programming Languages</Text>
            <View style={styles.tagWrap}>
              {user.programmingLanguages.map(l => (
                <View key={l} style={[styles.tag, { backgroundColor: colors.muted, borderRadius: colors.radius / 2 }]}>
                  <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{l}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* Academic info */}
      <Animated.View entering={FadeInUp.delay(250).springify()}>
        <GlassCard style={{ gap: 14 }}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Academic Information</Text>
          <InfoRow icon="school-outline" label="Faculty" value={user.faculty} />
          <InfoRow icon="business-outline" label="Department" value={user.department} />
          <InfoRow icon="library-outline" label="Programme" value={user.programme} />
          <InfoRow icon="trending-up-outline" label="Level" value={`${user.academicLevel} · ${user.semester}`} />
          <InfoRow icon="options-outline" label="Experience" value={user.experienceLevel} />
          <InfoRow icon="laptop-outline" label="Laptop" value={user.hasLaptop ? 'Yes' : 'No'} />
        </GlassCard>
      </Animated.View>

      {/* Contact & links */}
      <Animated.View entering={FadeInUp.delay(270).springify()}>
        <GlassCard style={{ gap: 14 }}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Contact &amp; Links</Text>
          <InfoRow icon="mail-outline" label="Email" value={user.email} />
          <InfoRow icon="call-outline" label="Phone" value={user.phone} />
          <InfoRow icon="person-outline" label="Gender" value={user.gender} />
          <InfoRow icon="calendar-outline" label="Date of Birth" value={user.dateOfBirth} />
          {!!user.githubUsername && <InfoRow icon="logo-github" label="GitHub" value={user.githubUsername} />}
          {!!user.linkedIn && <InfoRow icon="logo-linkedin" label="LinkedIn" value={user.linkedIn} />}
          {!!user.portfolio && <InfoRow icon="globe-outline" label="Portfolio" value={user.portfolio} />}
        </GlassCard>
      </Animated.View>

      {/* Emergency contact */}
      {!!user.emergencyContactName && user.emergencyContactName !== 'N/A' && (
        <Animated.View entering={FadeInUp.delay(285).springify()}>
          <GlassCard style={{ gap: 14 }}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Emergency Contact</Text>
            <InfoRow icon="person-outline" label="Name" value={user.emergencyContactName} />
            <InfoRow icon="call-outline" label="Phone" value={user.emergencyContactPhone} />
            <InfoRow icon="heart-outline" label="Relationship" value={user.emergencyContactRelation} />
          </GlassCard>
        </Animated.View>
      )}

      {/* Attendance history */}
      <Animated.View entering={FadeInUp.delay(290).springify()}>
        <GlassCard>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Attendance History</Text>
          {attendance.length === 0 ? (
            <View style={styles.emptyAtt}>
              <Ionicons name="calendar-outline" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No attendance records yet</Text>
            </View>
          ) : (
            attendance.slice(0, 5).map(a => (
              <View key={a.id} style={[styles.attRow, { borderColor: colors.border }]}>
                <View style={[styles.attDot, { backgroundColor: colors.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.attEvent, { color: colors.foreground }]}>{a.eventTitle}</Text>
                  <Text style={[styles.attDate, { color: colors.mutedForeground }]}>
                    {new Date(a.checkedInAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </GlassCard>
      </Animated.View>

      {/* Sign out */}
      <Animated.View entering={FadeInUp.delay(310).springify()}>
        <TouchableOpacity
          onPress={handleLogout}
          disabled={signingOut}
          activeOpacity={0.75}
          style={[
            styles.signOutBtn,
            {
              backgroundColor: colors.destructive + '12',
              borderColor: colors.destructive + '30',
              borderRadius: colors.radius,
              opacity: signingOut ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, gap: 16 },
  hero: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  avatar: {
    width: 84, height: 84, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  avatarText: { fontSize: 34, fontFamily: 'Inter_700Bold', color: '#fff' },
  heroName: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  heroId: { fontSize: 16, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  heroJoined: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  qrCard: { alignItems: 'center', gap: 12 },
  qrTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  qrSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },
  qrWrap: { padding: 20 },
  qrId: { fontSize: 15, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  pendingNotice: {
    flexDirection: 'row', gap: 12, padding: 14, borderWidth: 1, alignItems: 'flex-start',
  },
  pendingTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#92400e', marginBottom: 2 },
  pendingText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#92400e', lineHeight: 19 },
  sectionLabel: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 },
  tag: { paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 },
  infoValue: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  emptyAtt: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  attRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: 1 },
  attDot: { width: 8, height: 8, borderRadius: 4 },
  attEvent: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  attDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14, borderWidth: 1,
  },
  signOutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
