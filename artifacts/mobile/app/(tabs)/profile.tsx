import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View, Alert, Linking, Image, Modal,
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
  "Web Development": "globe-outline",
  "Mobile Development": "phone-portrait-outline",
  "AI/Machine Learning": "hardware-chip-outline",
  "Data Science": "stats-chart-outline",
  "Cybersecurity": "shield-checkmark-outline",
  "Cloud Computing": "cloud-outline",
  "DevOps": "infinite-outline",
  "Blockchain": "link-outline",
  "IoT": "wifi-outline",
  "Game Development": "game-controller-outline",
  "UI/UX Design": "color-palette-outline",
  "Database Systems": "server-outline",
};

const LANGUAGE_ICONS: Record<string, string> = {
  "Python": "language-python",
  "JavaScript": "language-javascript",
  "TypeScript": "language-typescript",
  "Java": "language-java",
  "C": "language-c",
  "C++": "language-cpp",
  "C#": "language-csharp",
  "Go": "language-go",
  "Rust": "language-rust",
  "PHP": "language-php",
  "Ruby": "language-ruby",
  "Swift": "language-swift",
  "Kotlin": "language-kotlin",
  "SQL": "database",
  "R": "language-r",
};
const CARTOON_AVATARS = [
  // Student community (open-peeps)
  "https://api.dicebear.com/9.x/open-peeps/svg?seed=Student1&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/open-peeps/svg?seed=Student2&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/open-peeps/svg?seed=Student3&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/open-peeps/svg?seed=Student4&backgroundColor=ffdfbf",

  // Developers (notionists)
  "https://api.dicebear.com/9.x/notionists/svg?seed=Developer1&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Developer2&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Developer3&backgroundColor=c0aede",

  // Friendly members (big-ears-neutral)
  "https://api.dicebear.com/9.x/big-ears-neutral/svg?seed=Member1&backgroundColor=ffdfbf",
  "https://api.dicebear.com/9.x/big-ears-neutral/svg?seed=Member2&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/big-ears-neutral/svg?seed=Member3&backgroundColor=ffd5dc",

  // Classic avatars (avataaars)
  "https://api.dicebear.com/9.x/avataaars/svg?seed=ITIC1&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=ITIC2&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=ITIC3&backgroundColor=d1d4f9",

  // Adventurer style
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Explorer1&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Explorer2&backgroundColor=ffdfbf",

  // Lorelei style
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Person1&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/lorelei/svg?seed=Person2&backgroundColor=ffd5dc",

  // Micah style
  "https://api.dicebear.com/9.x/micah/svg?seed=User1&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/micah/svg?seed=User2&backgroundColor=d1d4f9",

  // Personas style
  "https://api.dicebear.com/9.x/personas/svg?seed=Persona1&backgroundColor=ffdfbf",
  "https://api.dicebear.com/9.x/personas/svg?seed=Persona2&backgroundColor=c0aede",
];

function openLink(url: string) {
  if (!url) return;
  let target = url;
  if (!/^https?:\/\//i.test(target)) {
    target = 'https://' + target;
  }
  Linking.openURL(target).catch(err => console.error("Couldn't open link", err));
}

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
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const topPad = Platform.OS === 'web' ? 24 : insets.top + 8;

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
  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'IT';

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: topPad, paddingBottom: insets.bottom + 90 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.profileHeader}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setAvatarModalVisible(true)}
          style={styles.avatarWrap}
        >
          {user.profilePicture ? (
            <Image
              source={{ uri: user.profilePicture }}
              style={styles.avatarImage}
            />
          ) : (
            <LinearGradient
              colors={[colors.primary, colors.primary + '88']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
          )}
          <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={10} color="#fff" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>
            {user.fullName}
          </Text>
          <Text style={[styles.profileId, { color: colors.mutedForeground }]}>
            {user.memberId}
          </Text>
          <View style={styles.badgeRow}>
            <StatusBadge status={user.status} />
            <RoleBadge role={user.role} />
          </View>
          <Text style={[styles.joinedDateText, { color: colors.mutedForeground }]}>
            Joined {user.joinedDate.split('T')[0]}
          </Text>
        </View>
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

      {/* Tech Profile (Interests & Languages combined) */}
      {(user.technologyInterests.length > 0 || user.programmingLanguages.length > 0) && (
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <GlassCard style={{ gap: 14 }}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Tech Profile</Text>

            {user.technologyInterests.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={[styles.subSectionLabel, { color: colors.mutedForeground }]}>Interests</Text>
                <View style={styles.tagWrap}>
                  {user.technologyInterests.map((t) => (
                    <View
                      key={t}
                      style={[
                        styles.tag,
                        {
                          backgroundColor: colors.primary + "12",
                          borderColor: colors.primary + "30",
                          borderWidth: 1,
                          borderRadius: 20,
                        },
                      ]}
                    >
                      <Ionicons
                        name={TECH_INTEREST_ICONS[t] ?? "code-slash-outline"}
                        size={12}
                        color={colors.primary}
                        style={{ marginRight: 5 }}
                      />
                      <Text style={[styles.tagText, { color: colors.primary }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {user.programmingLanguages.length > 0 && (
              <View style={{ gap: 6, marginTop: 4 }}>
                <Text style={[styles.subSectionLabel, { color: colors.mutedForeground }]}>Programming Languages</Text>
                <View style={styles.tagWrap}>
                  {user.programmingLanguages.map((l) => (
                    <View
                      key={l}
                      style={[
                        styles.tag,
                        {
                          backgroundColor: colors.muted,
                          borderColor: colors.border,
                          borderWidth: 1,
                          borderRadius: 20,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={LANGUAGE_ICONS[l] ?? "code-tags"}
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
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Contact Details</Text>
          <InfoRow icon="mail-outline" label="Email Address" value={user.email} />
          <InfoRow icon="call-outline" label="Phone Number" value={user.phone} />
          <InfoRow icon="person-outline" label="Gender" value={user.gender.replace('_', ' ')} />
          <InfoRow
            icon="calendar-outline"
            label="Date of Birth"
            value={
              user.dateOfBirth
                ? new Date(user.dateOfBirth).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""
            }
          />

          {(!!user.githubUsername || !!user.linkedIn || !!user.portfolio) && (
            <View style={{ gap: 8, marginTop: 4 }}>
              <Text style={[styles.subSectionLabel, { color: colors.mutedForeground }]}>Professional Links</Text>
              <View style={styles.socialRow}>
                {!!user.githubUsername && (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() =>
                      openLink(
                        user.githubUsername.includes("/")
                          ? user.githubUsername
                          : "https://github.com/" + user.githubUsername
                      )
                    }
                    style={[
                      styles.socialButton,
                      { backgroundColor: colors.muted, borderColor: colors.border },
                    ]}
                  >
                    <Ionicons name="logo-github" size={16} color={colors.foreground} />
                    <Text style={[styles.socialButtonText, { color: colors.foreground }]}>GitHub</Text>
                  </TouchableOpacity>
                )}
                {!!user.linkedIn && (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() =>
                      openLink(
                        user.linkedIn.includes("/")
                          ? user.linkedIn
                          : "https://linkedin.com/in/" + user.linkedIn
                      )
                    }
                    style={[
                      styles.socialButton,
                      { backgroundColor: colors.muted, borderColor: colors.border },
                    ]}
                  >
                    <Ionicons name="logo-linkedin" size={16} color={colors.foreground} />
                    <Text style={[styles.socialButtonText, { color: colors.foreground }]}>LinkedIn</Text>
                  </TouchableOpacity>
                )}
                {!!user.portfolio && (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => openLink(user.portfolio)}
                    style={[
                      styles.socialButton,
                      { backgroundColor: colors.muted, borderColor: colors.border },
                    ]}
                  >
                    <Ionicons name="globe-outline" size={16} color={colors.foreground} />
                    <Text style={[styles.socialButtonText, { color: colors.foreground }]}>Website</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
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

      {/* Avatar Picker Modal */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={FadeInDown.springify()} 
            style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
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
              Select a cartoon mascot avatar to represent your profile
            </Text>

            {updatingAvatar ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Updating profile...</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.avatarGrid} showsVerticalScrollIndicator={false}>
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
                          backgroundColor: isSelected ? colors.primary + '10' : colors.background,
                          borderWidth: isSelected ? 2 : 1,
                        }
                      ]}
                    >
                      <Image source={{ uri: url }} style={styles.gridAvatar} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, gap: 16 },
  pageTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  pageSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12, marginBottom: 4 },
  avatarWrap: { width: 68, height: 68, position: 'relative' },
  avatarGradient: { width: '100%', height: '100%', borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#fff' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 22 },
  avatarEditBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  headerTextWrap: { flex: 1, gap: 3 },
  profileName: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  profileId: { fontSize: 13, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  joinedDateText: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  pendingNotice: { flexDirection: 'row', gap: 12, padding: 14, borderWidth: 1, alignItems: 'flex-start' },
  pendingTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#92400e', marginBottom: 2 },
  pendingText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#92400e', lineHeight: 19 },
  sectionLabel: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subSectionLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  attCount: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: -4, marginBottom: 4 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 },
  infoValue: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  socialRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  socialButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  socialButtonText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '75%', gap: 16, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: -4 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalLoading: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', paddingVertical: 12 },
  avatarItem: { width: '30%', aspectRatio: 1, borderRadius: 20, padding: 6, justifyContent: 'center', alignItems: 'center' },
  gridAvatar: { width: '100%', height: '100%', resizeMode: 'contain' },
});
