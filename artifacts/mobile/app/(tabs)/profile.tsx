import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated as RNAnimated, Platform, Pressable,
  ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Linking,
  Image, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import * as db from '@/services/db';
import { GlassCard } from '@/components/GlassCard';
import { MemberIDCard } from '@/components/MemberIDCard';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { AttendanceRecord } from '@/types';

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
  Python: 'language-python',
  JavaScript: 'language-javascript',
  TypeScript: 'language-typescript',
  Java: 'language-java',
  C: 'language-c',
  'C++': 'language-cpp',
  'C#': 'language-csharp',
  Go: 'language-go',
  Rust: 'language-rust',
  PHP: 'language-php',
  Ruby: 'language-ruby',
  Swift: 'language-swift',
  Kotlin: 'language-kotlin',
  SQL: 'database',
  R: 'language-r',
};

const CARTOON_AVATARS = [
  'https://api.dicebear.com/9.x/open-peeps/svg?seed=Student1&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/open-peeps/svg?seed=Student2&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/open-peeps/svg?seed=Student3&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/open-peeps/svg?seed=Student4&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Developer1&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Developer2&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Developer3&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/big-ears-neutral/svg?seed=Member1&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/big-ears-neutral/svg?seed=Member2&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/big-ears-neutral/svg?seed=Member3&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=ITIC1&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=ITIC2&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=ITIC3&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Explorer1&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Explorer2&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Person1&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Person2&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/micah/svg?seed=User1&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/micah/svg?seed=User2&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/personas/svg?seed=Persona1&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/personas/svg?seed=Persona2&backgroundColor=c0aede',
];

function openLink(url: string) {
  if (!url) return;
  let target = url;
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
  Linking.openURL(target).catch(err => console.error("Couldn't open link", err));
}

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  label,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accent?: string;
}) {
  const colors = useColors();
  const color = accent ?? colors.primary;
  return (
    <View style={sectionHeaderStyles.row}>
      <View style={[sectionHeaderStyles.accent, { backgroundColor: color }]} />
      <View style={[sectionHeaderStyles.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={[sectionHeaderStyles.label, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  accent: { width: 3, height: 20, borderRadius: 2 },
  iconWrap: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 15, fontFamily: 'Inter_700Bold', flex: 1, letterSpacing: -0.2 },
});

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon, label, value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const colors = useColors();
  if (!value) return null;
  return (
    <View style={infoRowStyles.row}>
      <View style={[infoRowStyles.iconWrap, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon} size={14} color={colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[infoRowStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[infoRowStyles.value, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: 10, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  value: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({
  value, label, color,
}: {
  value: string | number;
  label: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[statPillStyles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[statPillStyles.value, { color }]}>{value}</Text>
      <Text style={[statPillStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const statPillStyles = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  value: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  label: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
});

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProfileCompleteness({ pct }: { pct: number }) {
  const colors = useColors();
  const anim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(anim, {
      toValue: pct / 100,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  if (pct >= 100) return null;

  const color =
    pct < 40 ? '#ef4444' :
    pct < 70 ? '#f59e0b' :
    colors.primary;

  return (
    <View style={[progressStyles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={progressStyles.headerRow}>
        <View style={progressStyles.labelRow}>
          <Ionicons name="checkmark-circle-outline" size={14} color={color} />
          <Text style={[progressStyles.label, { color: colors.foreground }]}>Profile Completeness</Text>
        </View>
        <Text style={[progressStyles.pct, { color }]}>{pct}%</Text>
      </View>
      <View style={[progressStyles.track, { backgroundColor: colors.muted }]}>
        <RNAnimated.View
          style={[
            progressStyles.fill,
            {
              backgroundColor: color,
              width: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={[progressStyles.hint, { color: colors.mutedForeground }]}>
        Complete your profile to unlock full member features
      </Text>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  wrap: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  pct: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  track: { height: 7, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  hint: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [showAllAttendance, setShowAllAttendance] = useState(false);
  const topPad = Platform.OS === 'web' ? 24 : insets.top;

  async function selectAvatar(url: string) {
    if (updatingAvatar || !user) return;
    setUpdatingAvatar(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await db.updateProfilePicture(user.id, url);
      await refreshUser();
      showToast('success', 'Avatar updated', 'Your profile picture has been updated!');
      setAvatarModalVisible(false);
    } catch (err) {
      console.error(err);
      showToast('error', 'Update failed', 'Could not update profile picture.');
    } finally {
      setUpdatingAvatar(false);
    }
  }

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
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
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

  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'IT';

  const daysAsMember = Math.max(
    0,
    Math.floor((Date.now() - new Date(user.joinedDate).getTime()) / 86400000),
  );

  const totalSkills = user.technologyInterests.length + user.programmingLanguages.length;
  const visibleAttendance = showAllAttendance ? attendance : attendance.slice(0, 5);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Banner ────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <LinearGradient
          colors={[colors.primary + '28', colors.primary + '0a', 'transparent']}
          style={[styles.heroBanner, { paddingTop: topPad + 24 }]}
        >
          {/* Avatar */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setAvatarModalVisible(true)}
            style={styles.heroAvatarWrap}
          >
            <View style={[styles.heroAvatarRing, { borderColor: colors.primary + '50' }]}>
              {user.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.heroAvatarImage} />
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.primary + '99']}
                  style={styles.heroAvatarGradient}
                >
                  <Text style={styles.heroAvatarText}>{initials}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={[styles.heroEditBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Ionicons name="camera" size={10} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Name + ID */}
          <Text style={[styles.heroName, { color: colors.foreground }]}>{user.fullName}</Text>
          <Text style={[styles.heroMemberId, { color: colors.mutedForeground }]}>{user.memberId}</Text>

          {/* Badges */}
          <View style={styles.heroBadgeRow}>
            <StatusBadge status={user.status} />
            <RoleBadge role={user.role} />
          </View>

          <Text style={[styles.heroJoined, { color: colors.mutedForeground }]}>
            Member since {new Date(user.joinedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* ── Stats Row ─────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.statsRow}>
        <StatPill value={attendance.length} label="Attended" color={colors.primary} />
        <StatPill value={daysAsMember} label="Days Active" color="#3b82f6" />
        <StatPill value={totalSkills} label="Skills" color="#8b5cf6" />
      </Animated.View>

      {/* ── Profile Completeness ────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(90).springify()}>
        <ProfileCompleteness pct={user.profileCompleteness ?? 0} />
      </Animated.View>

      {/* ── Member ID Card (flip) ───────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <MemberIDCard user={user} />
      </Animated.View>

      {/* ── Pending notice ─────────────────────────────────────────── */}
      {user.status === 'pending' && (
        <Animated.View entering={FadeInUp.delay(140).springify()}>
          <View style={[styles.pendingNotice, { borderRadius: colors.radius }]}>
            <View style={styles.pendingIconWrap}>
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
        <Animated.View entering={FadeInUp.delay(160).springify()}>
          <GlassCard>
            <SectionHeader icon="code-slash-outline" label="Tech Profile" accent="#8b5cf6" />

            {user.technologyInterests.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Interests</Text>
                <View style={styles.tagWrap}>
                  {user.technologyInterests.map(t => (
                    <View
                      key={t}
                      style={[styles.tag, { backgroundColor: '#8b5cf6' + '14', borderColor: '#8b5cf6' + '35' }]}
                    >
                      <Ionicons
                        name={TECH_INTEREST_ICONS[t] ?? 'code-slash-outline'}
                        size={12}
                        color="#8b5cf6"
                        style={{ marginRight: 5 }}
                      />
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
                    <View
                      key={l}
                      style={[styles.tag, { backgroundColor: colors.muted, borderColor: colors.border }]}
                    >
                      <MaterialCommunityIcons
                        name={LANGUAGE_ICONS[l] ?? 'code-tags'}
                        size={13}
                        color={colors.foreground}
                        style={{ marginRight: 5 }}
                      />
                      <Text style={[styles.tagText, { color: colors.foreground }]}>{l}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </GlassCard>
        </Animated.View>
      )}

      {/* ── Academic Information ────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.delay(180).springify()}>
        <GlassCard style={{ gap: 12 }}>
          <SectionHeader icon="school-outline" label="Academic Information" accent="#3b82f6" />
          <InfoRow icon="business-outline" label="Faculty" value={user.faculty} />
          <InfoRow icon="layers-outline" label="Department" value={user.department} />
          <InfoRow icon="library-outline" label="Programme" value={user.programme} />
          <InfoRow icon="trending-up-outline" label="Level & Semester" value={`${user.academicLevel} · ${user.semester}`} />
          <InfoRow icon="options-outline" label="Experience Level" value={user.experienceLevel} />
          <InfoRow icon="laptop-outline" label="Has Laptop" value={user.hasLaptop ? '✓ Yes' : '✗ No'} />
        </GlassCard>
      </Animated.View>

      {/* ── Contact Details ─────────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.delay(195).springify()}>
        <GlassCard style={{ gap: 12 }}>
          <SectionHeader icon="person-circle-outline" label="Contact Details" accent="#f59e0b" />
          <InfoRow icon="mail-outline" label="Email Address" value={user.email} />
          <InfoRow icon="call-outline" label="Phone Number" value={user.phone} />
          <InfoRow icon="person-outline" label="Gender" value={user.gender.replace('_', ' ')} />
          <InfoRow
            icon="calendar-outline"
            label="Date of Birth"
            value={
              user.dateOfBirth
                ? new Date(user.dateOfBirth).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })
                : ''
            }
          />

          {(!!user.githubUsername || !!user.linkedIn || !!user.portfolio) && (
            <View style={{ gap: 8, paddingTop: 4 }}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Professional Links</Text>
              <View style={styles.socialRow}>
                {!!user.githubUsername && (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() =>
                      openLink(
                        user.githubUsername.includes('/')
                          ? user.githubUsername
                          : 'https://github.com/' + user.githubUsername,
                      )
                    }
                    style={[styles.socialBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  >
                    <Ionicons name="logo-github" size={15} color={colors.foreground} />
                    <Text style={[styles.socialBtnText, { color: colors.foreground }]}>GitHub</Text>
                  </TouchableOpacity>
                )}
                {!!user.linkedIn && (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() =>
                      openLink(
                        user.linkedIn.includes('/')
                          ? user.linkedIn
                          : 'https://linkedin.com/in/' + user.linkedIn,
                      )
                    }
                    style={[styles.socialBtn, { backgroundColor: '#0a66c215', borderColor: '#0a66c230' }]}
                  >
                    <Ionicons name="logo-linkedin" size={15} color="#0a66c2" />
                    <Text style={[styles.socialBtnText, { color: '#0a66c2' }]}>LinkedIn</Text>
                  </TouchableOpacity>
                )}
                {!!user.portfolio && (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => openLink(user.portfolio)}
                    style={[styles.socialBtn, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}
                  >
                    <Ionicons name="globe-outline" size={15} color={colors.primary} />
                    <Text style={[styles.socialBtnText, { color: colors.primary }]}>Portfolio</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </GlassCard>
      </Animated.View>

      {/* ── Attendance History ──────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.delay(210).springify()}>
        <GlassCard style={{ gap: 0 }}>
          <View style={{ paddingBottom: 12 }}>
            <SectionHeader icon="calendar-outline" label="Attendance History" accent={colors.primary} />
            <View style={[styles.attCountRow, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '25' }]}>
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
                Scan an event QR code to check in and start building your attendance record.
              </Text>
            </View>
          ) : (
            <>
              {visibleAttendance.map((a, i) => (
                <View
                  key={a.id}
                  style={[
                    styles.attRow,
                    { borderTopColor: colors.border },
                    i === 0 && { borderTopWidth: 0 },
                  ]}
                >
                  <View style={[styles.attDotWrap, { backgroundColor: colors.primary + '15' }]}>
                    <View style={[styles.attDot, { backgroundColor: colors.primary }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.attEvent, { color: colors.foreground }]} numberOfLines={1}>
                      {a.eventTitle}
                    </Text>
                    <Text style={[styles.attDate, { color: colors.mutedForeground }]}>
                      {new Date(a.checkedInAt).toLocaleString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={[styles.attBadge, { backgroundColor: colors.primary + '12' }]}>
                    <Ionicons name="checkmark" size={12} color={colors.primary} />
                  </View>
                </View>
              ))}

              {attendance.length > 5 && (
                <TouchableOpacity
                  onPress={() => setShowAllAttendance(v => !v)}
                  activeOpacity={0.75}
                  style={[styles.showMoreBtn, { borderTopColor: colors.border }]}
                >
                  <Text style={[styles.showMoreText, { color: colors.primary }]}>
                    {showAllAttendance
                      ? 'Show less'
                      : `Show ${attendance.length - 5} more`}
                  </Text>
                  <Ionicons
                    name={showAllAttendance ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </GlassCard>
      </Animated.View>

      {/* ── Sign Out ─────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.delay(225).springify()} style={styles.signOutWrap}>
        <TouchableOpacity
          onPress={handleLogout}
          disabled={signingOut}
          activeOpacity={0.75}
          style={[styles.signOutBtn, { opacity: signingOut ? 0.6 : 1 }]}
        >
          <LinearGradient
            colors={['#ef444418', '#ef444408']}
            style={[styles.signOutGrad, { borderColor: '#ef444428', borderRadius: colors.radius + 4 }]}
          >
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text style={styles.signOutText}>
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Avatar Picker Modal ─────────────────────────────────────── */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !updatingAvatar && setAvatarModalVisible(false)}
        >
          <Animated.View
            entering={FadeInDown.springify()}
            style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Pressable onPress={e => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Choose Avatar</Text>
                <TouchableOpacity
                  onPress={() => setAvatarModalVisible(false)}
                  style={[styles.closeBtn, { backgroundColor: colors.muted }]}
                >
                  <Ionicons name="close" size={18} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                Pick a cartoon avatar to represent your profile
              </Text>

              {updatingAvatar ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator color={colors.primary} size="large" />
                  <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Updating profile...</Text>
                </View>
              ) : (
                <ScrollView
                  contentContainerStyle={styles.avatarGrid}
                  showsVerticalScrollIndicator={false}
                >
                  {CARTOON_AVATARS.map((url, index) => {
                    const isSelected = user.profilePicture === url;
                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.75}
                        onPress={() => selectAvatar(url)}
                        style={[
                          styles.avatarItem,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected ? colors.primary + '12' : colors.background,
                            borderWidth: isSelected ? 2.5 : 1,
                          },
                        ]}
                      >
                        <Image source={{ uri: url }} style={styles.gridAvatar} />
                        {isSelected && (
                          <View style={[styles.selectedCheck, { backgroundColor: colors.primary }]}>
                            <Ionicons name="checkmark" size={10} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
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
  heroBanner: {
    alignItems: 'center', gap: 6,
    paddingBottom: 28, paddingHorizontal: 24,
  },
  heroAvatarWrap: { position: 'relative', marginBottom: 8 },
  heroAvatarRing: {
    width: 96, height: 96, borderRadius: 28,
    borderWidth: 3, overflow: 'hidden',
  },
  heroAvatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroAvatarGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  heroAvatarText: { fontSize: 34, fontFamily: 'Inter_700Bold', color: '#fff' },
  heroEditBadge: {
    position: 'absolute', bottom: -3, right: -3,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  heroName: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, textAlign: 'center', marginTop: 4 },
  heroMemberId: { fontSize: 13, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, textAlign: 'center' },
  heroBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 6, justifyContent: 'center' },
  heroJoined: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2, textAlign: 'center' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },

  // Shared section
  subLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  tagText: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  // Social
  socialRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1,
  },
  socialBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  // Pending
  pendingNotice: {
    flexDirection: 'row', gap: 12, padding: 14,
    backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#f59e0b35',
    marginHorizontal: 16, alignItems: 'flex-start',
  },
  pendingIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: '#fde68a', alignItems: 'center', justifyContent: 'center',
  },
  pendingTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#92400e', marginBottom: 2 },
  pendingText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#92400e', lineHeight: 19 },

  // Attendance
  attCountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start', marginTop: -4,
  },
  attCountText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  emptyAtt: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  emptyIconWrap: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19, maxWidth: 260 },
  attRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderTopWidth: 1,
  },
  attDotWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  attDot: { width: 8, height: 8, borderRadius: 4 },
  attEvent: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  attDate: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  attBadge: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingTop: 12, borderTopWidth: 1, marginTop: 4,
  },
  showMoreText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  // Sign out
  signOutWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  signOutBtn: {},
  signOutGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 15, borderWidth: 1,
  },
  signOutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#ef4444' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '78%', borderWidth: 1,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#94a3b840', alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modalLoading: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  avatarGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    justifyContent: 'space-between', paddingVertical: 4,
  },
  avatarItem: {
    width: '30%', aspectRatio: 1, borderRadius: 20,
    padding: 7, justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  gridAvatar: { width: '100%', height: '100%', resizeMode: 'contain' },
  selectedCheck: {
    position: 'absolute', top: 5, right: 5,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
});
