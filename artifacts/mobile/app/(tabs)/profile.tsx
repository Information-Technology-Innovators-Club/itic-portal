import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, Alert,
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
import { MemberIDCard } from '@/components/MemberIDCard';
import { AttendanceRecord } from '@/types';

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

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const topPad = Platform.OS === 'web' ? 24 : insets.top + 8;

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    db.getUserAttendance(user.id)
      .then(setAttendance)
      .finally(() => setLoading(false));
  }, [user?.id]);

  async function doLogout() {
    setSigningOut(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await logout();
      showToast('info', 'Signed out', 'See you next time!');
    } catch {
      setSigningOut(false);
    }
  }

  function handleLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out of ITIC Portal?')) doLogout();
    } else {
      Alert.alert('Sign Out', 'Are you sure?', [
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

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: topPad, paddingBottom: insets.bottom + 90 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Page title */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>My Profile</Text>
        <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>Member since {user.joinedDate.split('T')[0]}</Text>
      </Animated.View>

      {/* Member ID Card (flip) */}
      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <MemberIDCard user={user} />
      </Animated.View>

      {/* Pending notice */}
      {user.status === 'pending' && (
        <Animated.View entering={FadeInUp.delay(80).springify()}>
          <View style={[styles.pendingNotice, { backgroundColor: '#fef3c7', borderColor: '#f59e0b40', borderRadius: colors.radius }]}>
            <Ionicons name="time-outline" size={18} color="#92400e" />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Approval Pending</Text>
              <Text style={styles.pendingText}>Your registration is under review by an executive.</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Tech interests */}
      {user.technologyInterests.length > 0 && (
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <GlassCard>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Technology Interests</Text>
            <View style={styles.tagWrap}>
              {user.technologyInterests.map(t => (
                <View key={t} style={[styles.tag, { backgroundColor: colors.primary + '15', borderRadius: 8 }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{t}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* Languages */}
      {user.programmingLanguages.length > 0 && (
        <Animated.View entering={FadeInUp.delay(120).springify()}>
          <GlassCard>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Programming Languages</Text>
            <View style={styles.tagWrap}>
              {user.programmingLanguages.map(l => (
                <View key={l} style={[styles.tag, { backgroundColor: colors.muted, borderRadius: 8 }]}>
                  <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{l}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* Academic info */}
      <Animated.View entering={FadeInUp.delay(140).springify()}>
        <GlassCard style={{ gap: 14 }}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Academic Information</Text>
          <InfoRow icon="school-outline" label="Faculty" value={user.faculty} />
          <InfoRow icon="business-outline" label="Department" value={user.department} />
          <InfoRow icon="library-outline" label="Programme" value={user.programme} />
          <InfoRow icon="trending-up-outline" label="Level" value={`${user.academicLevel} · ${user.semester}`} />
          <InfoRow icon="options-outline" label="Experience Level" value={user.experienceLevel} />
          <InfoRow icon="laptop-outline" label="Has Laptop" value={user.hasLaptop ? 'Yes' : 'No'} />
        </GlassCard>
      </Animated.View>

      {/* Contact & Links */}
      <Animated.View entering={FadeInUp.delay(155).springify()}>
        <GlassCard style={{ gap: 14 }}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Contact &amp; Links</Text>
          <InfoRow icon="mail-outline" label="Email" value={user.email} />
          <InfoRow icon="call-outline" label="Phone" value={user.phone} />
          <InfoRow icon="person-outline" label="Gender" value={user.gender.replace('_', ' ')} />
          <InfoRow icon="calendar-outline" label="Date of Birth" value={user.dateOfBirth} />
          {!!user.githubUsername && <InfoRow icon="logo-github" label="GitHub" value={`@${user.githubUsername}`} />}
          {!!user.linkedIn && <InfoRow icon="logo-linkedin" label="LinkedIn" value={user.linkedIn} />}
          {!!user.portfolio && <InfoRow icon="globe-outline" label="Portfolio" value={user.portfolio} />}
        </GlassCard>
      </Animated.View>

      {/* Attendance history */}
      <Animated.View entering={FadeInUp.delay(170).springify()}>
        <GlassCard>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Attendance History</Text>
          <Text style={[styles.attCount, { color: colors.mutedForeground }]}>
            {attendance.length} event{attendance.length !== 1 ? 's' : ''} attended
          </Text>
          {attendance.length === 0 ? (
            <View style={styles.emptyAtt}>
              <Ionicons name="calendar-outline" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No attendance records yet</Text>
            </View>
          ) : (
            attendance.slice(0, 6).map(a => (
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
      <Animated.View entering={FadeInUp.delay(190).springify()}>
        <TouchableOpacity
          onPress={handleLogout}
          disabled={signingOut}
          activeOpacity={0.75}
          style={[
            styles.signOutBtn,
            {
              backgroundColor: '#ef444415',
              borderColor: '#ef444430',
              borderRadius: colors.radius,
              opacity: signingOut ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={[styles.signOutText, { color: '#ef4444' }]}>
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, gap: 16 },
  pageTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  pageSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  pendingNotice: { flexDirection: 'row', gap: 12, padding: 14, borderWidth: 1, alignItems: 'flex-start' },
  pendingTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#92400e', marginBottom: 2 },
  pendingText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#92400e', lineHeight: 19 },
  sectionLabel: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  attCount: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: -4, marginBottom: 4 },
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
