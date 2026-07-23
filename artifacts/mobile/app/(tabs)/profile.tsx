import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated as RNAnimated, Platform, Pressable,
  ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import * as db from '@/services/db';
import { GlassCard } from '@/components/GlassCard';
import { MemberIDCard } from '@/components/MemberIDCard';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { AttendanceRecord } from '@/types';
import { AvatarDisplay, CartoonAvatar, AVATAR_SECTIONS } from '@/components/CartoonAvatars';

// ── Icon maps ─────────────────────────────────────────────────────────────────
const TECH_INTEREST_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Web Development': 'globe-outline',
  'Mobile Development': 'phone-portrait-outline',
  'AI/Machine Learning': 'hardware-chip-outline',
  'Data Science': 'stats-chart-outline',
  'Cybersecurity': 'shield-checkmark-outline',
  'Cloud Computing': 'cloud-outline',
  DevOps: 'infinite-outline',
  Blockchain: 'link-outline',
  IoT: 'wifi-outline',
  'Game Development': 'game-controller-outline',
  'UI/UX Design': 'color-palette-outline',
  'Database Systems': 'server-outline',
};

const LANGUAGE_ICONS: Record<string, string> = {
  Python: 'language-python', JavaScript: 'language-javascript',
  TypeScript: 'language-typescript', Java: 'language-java',
  C: 'language-c', 'C++': 'language-cpp', 'C#': 'language-csharp',
  Go: 'language-go', Rust: 'language-rust', PHP: 'language-php',
  Ruby: 'language-ruby', Swift: 'language-swift', Kotlin: 'language-kotlin',
  SQL: 'database', R: 'language-r',
};

// AVATAR_SECTIONS imported from CartoonAvatars

function openLink(url: string) {
  if (!url) return;
  let t = url;
  if (!/^https?:\/\//i.test(t)) t = 'https://' + t;
  Linking.openURL(t).catch(() => {});
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SH({ icon, label, accent }: { icon: keyof typeof Ionicons.glyphMap; label: string; accent?: string }) {
  const colors = useColors();
  const c = accent ?? colors.primary;
  return (
    <View style={shS.row}>
      <View style={[shS.bar, { backgroundColor: c }]} />
      <View style={[shS.iconWrap, { backgroundColor: c + '18' }]}>
        <Ionicons name={icon} size={14} color={c} />
      </View>
      <Text style={[shS.label, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}
const shS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  bar: { width: 3, height: 20, borderRadius: 2 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontFamily: 'Inter_700Bold', flex: 1, letterSpacing: -0.2 },
});

// ── Info Row ──────────────────────────────────────────────────────────────────
function IR({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const colors = useColors();
  if (!value) return null;
  return (
    <View style={irS.row}>
      <View style={[irS.iconWrap, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon} size={14} color={colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[irS.label, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[irS.value, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}
const irS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  value: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  const colors = useColors();
  const anim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(anim, { toValue: pct / 100, duration: 900, useNativeDriver: false }).start();
  }, [pct]);
  if (pct >= 100) return null;
  const color = pct < 40 ? '#ef4444' : pct < 70 ? '#f59e0b' : colors.primary;
  return (
    <View style={[pbS.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={pbS.row}>
        <View style={pbS.labelRow}>
          <Ionicons name="checkmark-circle-outline" size={14} color={color} />
          <Text style={[pbS.label, { color: colors.foreground }]}>Profile Completeness</Text>
        </View>
        <Text style={[pbS.pct, { color }]}>{pct}%</Text>
      </View>
      <View style={[pbS.track, { backgroundColor: colors.muted }]}>
        <RNAnimated.View style={[pbS.fill, { backgroundColor: color, width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <Text style={[pbS.hint, { color: colors.mutedForeground }]}>Complete your profile to unlock full member features</Text>
    </View>
  );
}
const pbS = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  pct: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  track: { height: 7, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  hint: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});

// ── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[spS.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[spS.value, { color }]}>{value}</Text>
      <Text style={[spS.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}
const spS = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  value: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  label: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [avatarModal, setAvatarModal] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const topPad = Platform.OS === 'web' ? 24 : insets.top;

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    db.getUserAttendance(user.id).then(setAttendance).finally(() => setLoading(false));
  }, [user?.id]);

  // ── Avatar Actions ────────────────────────────────────────────────────────
  async function selectCartoonAvatar(id: string) {
    if (updatingAvatar || !user) return;
    setUpdatingAvatar(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await db.updateProfilePicture(user.id, id);
      await refreshUser();
      showToast('success', 'Avatar updated!');
      setAvatarModal(false);
    } catch {
      showToast('error', 'Update failed', 'Could not update profile picture.');
    } finally { setUpdatingAvatar(false); }
  }

  async function pickFromGallery() {
    if (updatingAvatar || !user) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('warning', 'Permission required', 'Allow photo library access to pick a photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false,
      });
      if (!result.canceled && result.assets[0]) {
        setUpdatingAvatar(true);
        const uri = result.assets[0].uri;
        await db.updateProfilePicture(user.id, uri);
        await refreshUser();
        showToast('success', 'Photo updated!');
        setAvatarModal(false);
      }
    } catch (err) {
      showToast('error', 'Failed to pick photo');
    } finally { setUpdatingAvatar(false); }
  }

  async function takePhoto() {
    if (updatingAvatar || !user) return;
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('warning', 'Permission required', 'Allow camera access to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setUpdatingAvatar(true);
        const uri = result.assets[0].uri;
        await db.updateProfilePicture(user.id, uri);
        await refreshUser();
        showToast('success', 'Photo updated!');
        setAvatarModal(false);
      }
    } catch {
      showToast('error', 'Camera failed');
    } finally { setUpdatingAvatar(false); }
  }

  async function removePhoto() {
    if (!user) return;
    setUpdatingAvatar(true);
    try {
      await db.updateProfilePicture(user.id, '');
      await refreshUser();
      showToast('success', 'Photo removed');
      setAvatarModal(false);
    } catch {
      showToast('error', 'Failed to remove photo');
    } finally { setUpdatingAvatar(false); }
  }

  async function doLogout() {
    setSigningOut(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await logout();
      showToast('info', 'Signed out', 'See you next time!');
    } catch { setSigningOut(false); }
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
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const initials = user.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? 'IT';
  const daysAsMember = Math.max(0, Math.floor((Date.now() - new Date(user.joinedDate).getTime()) / 86400000));
  const totalSkills = user.technologyInterests.length + user.programmingLanguages.length;
  const visible = showAll ? attendance : attendance.slice(0, 5);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <LinearGradient
          colors={[colors.primary + '28', colors.primary + '0a', 'transparent']}
          style={[styles.hero, { paddingTop: topPad + 24 }]}
        >
          <TouchableOpacity activeOpacity={0.85} onPress={() => setAvatarModal(true)} style={styles.avatarWrap}>
            <View style={[styles.avatarRing, { borderColor: colors.primary + '50' }]}>
              <AvatarDisplay
                profilePicture={user.profilePicture}
                size={90}
                initials={initials}
                primaryColor={colors.primary}
              />
            </View>
            <View style={[styles.cameraBtn, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Ionicons name="camera" size={11} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.heroName, { color: colors.foreground }]}>{user.fullName}</Text>
          <Text style={[styles.heroId, { color: colors.mutedForeground }]}>{user.memberId}</Text>
          <View style={styles.heroBadges}>
            <StatusBadge status={user.status} />
            <RoleBadge role={user.role} />
          </View>
          <Text style={[styles.heroJoined, { color: colors.mutedForeground }]}>
            Member since {new Date(user.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* ── Stats row ─────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.statsRow}>
        <StatPill value={attendance.length} label="Attended" color={colors.primary} />
        <StatPill value={daysAsMember} label="Days Active" color="#3b82f6" />
        <StatPill value={totalSkills} label="Skills" color="#8b5cf6" />
      </Animated.View>

      {/* ── Profile completeness ───────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(90).springify()} style={{ paddingHorizontal: 16 }}>
        <ProgressBar pct={user.profileCompleteness ?? 0} />
      </Animated.View>

      {/* ── Member ID Card ─────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <MemberIDCard user={user} />
      </Animated.View>

      {/* ── Pending notice ─────────────────────────────────────────── */}
      {user.status === 'pending' && (
        <Animated.View entering={FadeInUp.delay(140).springify()} style={{ paddingHorizontal: 16 }}>
          <View style={[styles.pendingNotice, { borderRadius: colors.radius }]}>
            <View style={styles.pendingIcon}>
              <Ionicons name="time-outline" size={20} color="#92400e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Approval Pending</Text>
              <Text style={styles.pendingText}>Your registration is under review by an executive.</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* ── Tech Profile ───────────────────────────────────────────── */}
      {(user.technologyInterests.length > 0 || user.programmingLanguages.length > 0) && (
        <Animated.View entering={FadeInUp.delay(160).springify()} style={{ paddingHorizontal: 16 }}>
          <GlassCard>
            <SH icon="code-slash-outline" label="Tech Profile" accent="#8b5cf6" />
            {user.technologyInterests.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Interests</Text>
                <View style={styles.tagWrap}>
                  {user.technologyInterests.map(t => (
                    <View key={t} style={[styles.tag, { backgroundColor: '#8b5cf6' + '14', borderColor: '#8b5cf6' + '35' }]}>
                      <Ionicons name={TECH_INTEREST_ICONS[t] ?? 'code-slash-outline'} size={12} color="#8b5cf6" style={{ marginRight: 5 }} />
                      <Text style={[styles.tagText, { color: '#8b5cf6' }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {user.programmingLanguages.length > 0 && (
              <View style={{ gap: 8, marginTop: 8 }}>
                <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Languages</Text>
                <View style={styles.tagWrap}>
                  {user.programmingLanguages.map(l => (
                    <View key={l} style={[styles.tag, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                      <MaterialCommunityIcons name={(LANGUAGE_ICONS[l] ?? 'code-tags') as React.ComponentProps<typeof MaterialCommunityIcons>['name']} size={13} color={colors.foreground} style={{ marginRight: 5 }} />
                      <Text style={[styles.tagText, { color: colors.foreground }]}>{l}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </GlassCard>
        </Animated.View>
      )}

      {/* ── Academic Info ──────────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.delay(180).springify()} style={{ paddingHorizontal: 16 }}>
        <GlassCard style={{ gap: 12 }}>
          <SH icon="school-outline" label="Academic Information" accent="#3b82f6" />
          <IR icon="business-outline" label="Faculty" value={user.faculty} />
          <IR icon="layers-outline" label="Department" value={user.department} />
          <IR icon="library-outline" label="Programme" value={user.programme} />
          <IR icon="trending-up-outline" label="Level & Semester" value={`${user.academicLevel} · ${user.semester}`} />
          <IR icon="options-outline" label="Experience Level" value={user.experienceLevel} />
          <IR icon="laptop-outline" label="Has Laptop" value={user.hasLaptop ? '✓ Yes' : '✗ No'} />
        </GlassCard>
      </Animated.View>

      {/* ── Contact Details ────────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.delay(195).springify()} style={{ paddingHorizontal: 16 }}>
        <GlassCard style={{ gap: 12 }}>
          <SH icon="person-circle-outline" label="Contact Details" accent="#f59e0b" />
          <IR icon="mail-outline" label="Email Address" value={user.email} />
          <IR icon="call-outline" label="Phone Number" value={user.phone} />
          <IR icon="person-outline" label="Gender" value={user.gender.replace('_', ' ')} />
          <IR
            icon="calendar-outline"
            label="Date of Birth"
            value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          />
          {(!!user.githubUsername || !!user.linkedIn || !!user.portfolio) && (
            <View style={{ gap: 8, paddingTop: 4 }}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Professional Links</Text>
              <View style={styles.socialRow}>
                {!!user.githubUsername && (
                  <TouchableOpacity activeOpacity={0.75} onPress={() => openLink(user.githubUsername.includes('/') ? user.githubUsername : 'https://github.com/' + user.githubUsername)}
                    style={[styles.socialBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    <Ionicons name="logo-github" size={15} color={colors.foreground} />
                    <Text style={[styles.socialBtnText, { color: colors.foreground }]}>GitHub</Text>
                  </TouchableOpacity>
                )}
                {!!user.linkedIn && (
                  <TouchableOpacity activeOpacity={0.75} onPress={() => openLink(user.linkedIn.includes('/') ? user.linkedIn : 'https://linkedin.com/in/' + user.linkedIn)}
                    style={[styles.socialBtn, { backgroundColor: '#0a66c215', borderColor: '#0a66c230' }]}>
                    <Ionicons name="logo-linkedin" size={15} color="#0a66c2" />
                    <Text style={[styles.socialBtnText, { color: '#0a66c2' }]}>LinkedIn</Text>
                  </TouchableOpacity>
                )}
                {!!user.portfolio && (
                  <TouchableOpacity activeOpacity={0.75} onPress={() => openLink(user.portfolio)}
                    style={[styles.socialBtn, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                    <Ionicons name="globe-outline" size={15} color={colors.primary} />
                    <Text style={[styles.socialBtnText, { color: colors.primary }]}>Portfolio</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </GlassCard>
      </Animated.View>

      {/* ── Attendance ─────────────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.delay(210).springify()} style={{ paddingHorizontal: 16 }}>
        <GlassCard style={{ gap: 0 }}>
          <View style={{ paddingBottom: 12 }}>
            <SH icon="calendar-outline" label="Attendance History" accent={colors.primary} />
            <View style={[styles.attCount, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '25' }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={[styles.attCountText, { color: colors.primary }]}>
                {attendance.length} event{attendance.length !== 1 ? 's' : ''} attended
              </Text>
            </View>
          </View>
          {attendance.length === 0 ? (
            <View style={styles.emptyAtt}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.muted }]}>
                <Ionicons name="calendar-outline" size={28} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Attendance Yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Scan an event QR code to check in.
              </Text>
            </View>
          ) : (
            <>
              {visible.map((a, i) => (
                <View key={a.id} style={[styles.attRow, { borderTopColor: colors.border }, i === 0 && { borderTopWidth: 0 }]}>
                  <View style={[styles.attDotWrap, { backgroundColor: colors.primary + '15' }]}>
                    <View style={[styles.attDot, { backgroundColor: colors.primary }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.attEvent, { color: colors.foreground }]} numberOfLines={1}>{a.eventTitle}</Text>
                    <Text style={[styles.attDate, { color: colors.mutedForeground }]}>
                      {new Date(a.checkedInAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={[styles.attBadge, { backgroundColor: colors.primary + '12' }]}>
                    <Ionicons name="checkmark" size={12} color={colors.primary} />
                  </View>
                </View>
              ))}
              {attendance.length > 5 && (
                <TouchableOpacity onPress={() => setShowAll(v => !v)} style={[styles.showMore, { borderTopColor: colors.border }]}>
                  <Text style={[styles.showMoreText, { color: colors.primary }]}>
                    {showAll ? 'Show less' : `Show ${attendance.length - 5} more`}
                  </Text>
                  <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </>
          )}
        </GlassCard>
      </Animated.View>

      {/* ── Sign Out ───────────────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.delay(225).springify()} style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <TouchableOpacity onPress={handleLogout} disabled={signingOut} activeOpacity={0.75} style={{ opacity: signingOut ? 0.6 : 1 }}>
          <LinearGradient
            colors={['#ef444418', '#ef444408']}
            style={[styles.signOut, { borderColor: '#ef444428', borderRadius: colors.radius + 4 }]}
          >
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign Out'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Avatar Picker Modal ─────────────────────────────────────── */}
      <Modal visible={avatarModal} transparent animationType="fade" onRequestClose={() => !updatingAvatar && setAvatarModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !updatingAvatar && setAvatarModal(false)}>
          <Animated.View entering={FadeInDown.springify()} style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable onPress={e => e.stopPropagation()}>
              <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Choose Avatar</Text>
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                Pick a style below, or use your own photo
              </Text>

              {/* Camera / Gallery / Remove row */}
              {!updatingAvatar && (
                <View style={styles.photoRow}>
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity onPress={takePhoto} style={[styles.photoBtnWrap, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                      <Ionicons name="camera-outline" size={22} color={colors.primary} />
                      <Text style={[styles.photoBtnLabel, { color: colors.primary }]}>Camera</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={pickFromGallery} style={[styles.photoBtnWrap, { backgroundColor: '#3b82f615', borderColor: '#3b82f630' }]}>
                    <Ionicons name="images-outline" size={22} color="#3b82f6" />
                    <Text style={[styles.photoBtnLabel, { color: '#3b82f6' }]}>Gallery</Text>
                  </TouchableOpacity>
                  {!!user.profilePicture && (
                    <TouchableOpacity onPress={removePhoto} style={[styles.photoBtnWrap, { backgroundColor: '#ef444412', borderColor: '#ef444428' }]}>
                      <Ionicons name="trash-outline" size={22} color="#ef4444" />
                      <Text style={[styles.photoBtnLabel, { color: '#ef4444' }]}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {updatingAvatar ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={colors.primary} size="large" />
                  <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Updating...</Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                  {AVATAR_SECTIONS.map(section => (
                    <View key={section.label} style={{ marginBottom: 16 }}>
                      <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{section.label}</Text>
                      <View style={styles.avatarGrid}>
                        {section.avatars.map((id, i) => {
                          const isSelected = user.profilePicture === id;
                          return (
                            <TouchableOpacity
                              key={i}
                              activeOpacity={0.75}
                              onPress={() => selectCartoonAvatar(id)}
                              style={[
                                styles.avatarItem,
                                {
                                  borderColor: isSelected ? colors.primary : colors.border,
                                  backgroundColor: isSelected ? colors.primary + '12' : colors.background,
                                  borderWidth: isSelected ? 2.5 : 1,
                                },
                              ]}
                            >
                              <CartoonAvatar id={id} size={60} static />
                              {isSelected && (
                                <View style={[styles.selectedCheck, { backgroundColor: colors.primary }]}>
                                  <Ionicons name="checkmark" size={10} color="#fff" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { gap: 14 },

  // Hero
  hero: { alignItems: 'center', gap: 6, paddingBottom: 28, paddingHorizontal: 24 },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatarRing: { width: 96, height: 96, borderRadius: 28, borderWidth: 3, overflow: 'hidden' },
  // avatarImg/Grad/Initials removed — AvatarDisplay handles internally
  cameraBtn: {
    position: 'absolute', bottom: -3, right: -3,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  heroName: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, textAlign: 'center', marginTop: 4 },
  heroId: { fontSize: 13, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, textAlign: 'center' },
  heroBadges: { flexDirection: 'row', gap: 8, marginTop: 6, justifyContent: 'center' },
  heroJoined: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2, textAlign: 'center' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },

  // Sections
  subLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  socialRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  socialBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  socialBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  // Pending
  pendingNotice: { flexDirection: 'row', gap: 12, padding: 14, backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#f59e0b35', alignItems: 'flex-start' },
  pendingIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#fde68a', alignItems: 'center', justifyContent: 'center' },
  pendingTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#92400e', marginBottom: 2 },
  pendingText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#92400e', lineHeight: 19 },

  // Attendance
  attCount: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start', marginTop: -4 },
  attCountText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  emptyAtt: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  emptyIconWrap: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },
  attRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1 },
  attDotWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  attDot: { width: 8, height: 8, borderRadius: 4 },
  attEvent: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  attDate: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  attBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  showMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 12, borderTopWidth: 1, marginTop: 4 },
  showMoreText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  // Sign out
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderWidth: 1 },
  signOutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#ef4444' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '88%', borderWidth: 1 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  modalSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16 },

  // Photo buttons
  photoRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  photoBtnWrap: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  photoBtnLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  // Avatar grid
  sectionHeader: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avatarItem: { width: '30%', aspectRatio: 1, borderRadius: 18, padding: 6, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarImg2: { width: '100%', height: '100%', resizeMode: 'contain' },
  selectedCheck: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  loadingWrap: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
