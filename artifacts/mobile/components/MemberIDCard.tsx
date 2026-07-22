import React, { useState } from 'react';
import {
  StyleSheet, Text, Pressable, View, Dimensions,
} from 'react-native';
import Animated, {
  interpolate, useAnimatedStyle, useSharedValue, withSpring, Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { User } from '@/types';
import { useColors } from '@/hooks/useColors';
import { AvatarDisplay } from '@/components/CartoonAvatars';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 32, 380);
const CARD_H = CARD_W * 0.6;

interface Props {
  user: User;
}

const DOT_OPACITIES = ['ff', 'cc', '88'];

// Deterministic decorative barcode encoded from the member's own ID
function generateBarcode(seed: string, count = 34) {
  const src = seed && seed.length ? seed : '0000';
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const code = src.charCodeAt(i % src.length) + i * 7;
    bars.push(1 + (code % 3));
  }
  return bars;
}

function BackStat({
  icon, label, value, lines = 1,
}: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; lines?: number }) {
  return (
    <View style={styles.backStat}>
      <View style={styles.backStatHeader}>
        <Ionicons name={icon} size={10} color="#ffffffcc" />
        <Text style={styles.backLabel}>{label}</Text>
      </View>
      <Text style={styles.backValue} numberOfLines={lines}>{value}</Text>
    </View>
  );
}

// ── Role theming ──────────────────────────────────────────────────────────────
const ROLE_THEME = {
  admin: {
    label: 'Administrator',
    accent: '#a78bfa',
    accentAlt: '#c4b5fd',
    icon: 'shield-checkmark' as const,
    front: ['#1a0a2e', '#2d1854', '#150a24'] as const,
    back: ['#7c3aed', '#5b21b6', '#2e1065'] as const,
    shimmer: '#a78bfa22',
  },
  executive: {
    label: 'Executive',
    accent: '#38bdf8',
    accentAlt: '#7dd3fc',
    icon: 'briefcase' as const,
    front: ['#050f1c', '#0c2338', '#061420'] as const,
    back: ['#0ea5e9', '#0369a1', '#0c2b45'] as const,
    shimmer: '#38bdf822',
  },
  member: {
    label: 'Member',
    accent: '#4ade80',
    accentAlt: '#86efac',
    icon: 'hardware-chip' as const,
    front: ['#071510', '#0f2d1a', '#081a0e'] as const,
    back: ['#22c55e', '#15803d', '#0f2d1a'] as const,
    shimmer: '#4ade8022',
  },
} as const;

export function MemberIDCard({ user }: Props) {
  const colors = useColors();
  const [flipped, setFlipped] = useState(false);
  const rotation = useSharedValue(0);
  const press = useSharedValue(1);

  const theme = ROLE_THEME[(user.role as keyof typeof ROLE_THEME)] ?? ROLE_THEME.member;

  const qrData = JSON.stringify({
    userId: user.id,
    memberId: user.memberId,
    name: user.fullName,
  });

  const daysAsMember = Math.max(
    0,
    Math.floor((Date.now() - new Date(user.joinedDate).getTime()) / 86400000),
  );

  const barcodeBars = React.useMemo(
    () => generateBarcode(user.memberId || user.id, 34),
    [user.memberId, user.id],
  );

  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'IT';

  function flip() {
    const target = flipped ? 0 : 1;
    rotation.value = withSpring(target, { damping: 16, stiffness: 110, mass: 0.9 });
    setFlipped(!flipped);
  }

  const onPressIn = () => { press.value = withSpring(0.97, { damping: 20, stiffness: 300 }); };
  const onPressOut = () => { press.value = withSpring(1, { damping: 14, stiffness: 200 }); };

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [0, 180]);
    const scale = interpolate(rotation.value, [0, 0.5, 1], [1, 1.04, 1]);
    const opacity = interpolate(rotation.value, [0, 0.5, 0.5], [1, 1, 0], Extrapolate.CLAMP);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }, { scale }],
      backfaceVisibility: 'hidden',
      opacity,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [180, 360]);
    const scale = interpolate(rotation.value, [0, 0.5, 1], [1, 1.04, 1]);
    const opacity = interpolate(rotation.value, [0.5, 0.5, 1], [0, 1, 1], Extrapolate.CLAMP);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }, { scale }],
      backfaceVisibility: 'hidden',
      opacity,
    };
  });

  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(rotation.value, [0, 0.5, 1], [0.4, 0.6, 0.4]),
    shadowRadius: interpolate(rotation.value, [0, 0.5, 1], [20, 32, 20]),
  }));

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={flip} onPressIn={onPressIn} onPressOut={onPressOut} hitSlop={8}>
        <Animated.View style={[{ width: CARD_W, height: CARD_H }, wrapperStyle, shadowStyle, styles.shadowHost]}>

          {/* ── FRONT ─────────────────────────────────────────────── */}
          <Animated.View style={[styles.card, { width: CARD_W, height: CARD_H }, frontStyle]}>
            <LinearGradient
              colors={theme.front}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Diagonal shimmer */}
            <LinearGradient
              pointerEvents="none"
              colors={['#ffffff16', 'transparent', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.65, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Corner accent glow */}
            <View
              pointerEvents="none"
              style={[styles.cornerGlow, { backgroundColor: theme.accent + '12' }]}
            />

            {/* Circuit lines overlay */}
            <View style={styles.circuitOverlay} pointerEvents="none">
              <View style={[styles.circuitLine, { top: 22, left: 110, width: 55 }]} />
              <View style={[styles.circuitLine, { top: 22, left: 110, width: 1.5, height: 36 }]} />
              <View style={[styles.circuitDot, { top: 58, left: 109, backgroundColor: theme.accent + '60' }]} />
              <View style={[styles.circuitLine, { bottom: 28, right: 90, width: 45 }]} />
              <View style={[styles.circuitLine, { bottom: 28, right: 90, width: 1.5, height: 28 }]} />
              <View style={[styles.circuitDot, { bottom: 55, right: 89, backgroundColor: theme.accent + '40' }]} />
            </View>

            {/* Header strip */}
            <View style={[styles.headerStrip, { backgroundColor: theme.accent + '1c', borderBottomColor: theme.accent + '35' }]}>
              <View style={[styles.logoMark, { backgroundColor: theme.accent + '28' }]}>
                <Ionicons name={theme.icon} size={13} color={theme.accent} />
              </View>
              <Text style={styles.orgName}>ITIC · CUT</Text>
              <View style={[styles.rolePill, { backgroundColor: theme.accent }]}>
                <Text style={styles.rolePillText}>{theme.label.toUpperCase()}</Text>
              </View>
            </View>

            {/* Body */}
            <View style={styles.cardBody}>
              <View style={styles.cardLeft}>
                {/* Avatar */}
                <View style={[styles.cardAvatar, { borderColor: theme.accent + '60' }]}>
                  <AvatarDisplay
                    profilePicture={user.profilePicture}
                    size={52}
                    initials={initials}
                    primaryColor={theme.accent}
                    static
                  />
                </View>

                <View style={{ gap: 2, flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={1}>{user.fullName}</Text>
                  <Text style={[styles.cardMemberId, { color: theme.accent }]}>{user.memberId}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{user.studentNumber}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {user.faculty.replace('Faculty of ', '')}
                  </Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, {
                      backgroundColor: user.status === 'active' ? '#22c55e' : '#f59e0b',
                      shadowColor: user.status === 'active' ? '#22c55e' : '#f59e0b',
                    }]} />
                    <Text style={styles.statusText}>{user.status.toUpperCase()}</Text>
                  </View>
                </View>
              </View>

              {/* QR code — hologram-framed */}
              <View style={styles.qrContainer}>
                <View style={[styles.qrOuter, { borderColor: theme.accent + '45' }]}>
                  <View style={[styles.qrInnerFrame, { borderColor: theme.accent + '28' }]}>
                    <View style={styles.qrInner}>
                      <QRCode value={qrData} size={64} color="#0f172a" backgroundColor="#ffffff" />
                    </View>
                  </View>
                </View>
                {/* Corner ticks */}
                <View style={[styles.qrTickTL, { borderColor: theme.accent }]} />
                <View style={[styles.qrTickTR, { borderColor: theme.accent }]} />
                <View style={[styles.qrTickBL, { borderColor: theme.accent }]} />
                <View style={[styles.qrTickBR, { borderColor: theme.accent }]} />
                <Text style={[styles.qrLabel, { color: theme.accent }]}>SCAN ME</Text>
              </View>
            </View>

            {/* Bottom bar */}
            <View style={[styles.bottomBar, { borderTopColor: theme.accent + '25' }]}>
              <Text style={styles.bottomText}>Information Technology Innovators Club</Text>
              <Text style={styles.bottomText}>Chinhoyi University of Technology</Text>
            </View>
          </Animated.View>

          {/* ── BACK ──────────────────────────────────────────────── */}
          <Animated.View style={[styles.card, { width: CARD_W, height: CARD_H }, backStyle]}>
            <LinearGradient
              colors={theme.back}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['#00000000', '#0000003a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Header strip — mirrors front */}
            <View style={styles.backHeaderStrip}>
              {/* Mini avatar on back header */}
              <View style={styles.backAvatarMini}>
                <AvatarDisplay
                  profilePicture={user.profilePicture}
                  size={28}
                  initials={initials}
                  primaryColor={theme.accent}
                  static
                />
              </View>
              <Text style={styles.backOrgName}>MEMBER PROFILE</Text>
              <View style={styles.memberSincePill}>
                <Ionicons name="time-outline" size={10} color="#fff" />
                <Text style={styles.memberSinceText}>
                  {daysAsMember}d member
                </Text>
              </View>
            </View>

            {/* Back content */}
            <View style={styles.backContent}>
              <View style={styles.backStatsRow}>
                <BackStat icon="school-outline" label="PROGRAMME" value={user.programme || '—'} lines={2} />
                <BackStat icon="layers-outline" label="LVL / SEM" value={`${user.academicLevel} · ${user.semester}`} />
                <BackStat
                  icon="options-outline"
                  label="SKILL LEVEL"
                  value={user.experienceLevel ? user.experienceLevel.charAt(0).toUpperCase() + user.experienceLevel.slice(1) : '—'}
                />
              </View>

              <View style={styles.backTagsSection}>
                <Text style={styles.backLabel}>TECH INTERESTS</Text>
                <View style={styles.tagRow}>
                  {user.technologyInterests.slice(0, 4).map((t, i) => (
                    <View key={t} style={styles.interestTag}>
                      <View style={[styles.interestDot, {
                        backgroundColor: `#ffffff${DOT_OPACITIES[i % DOT_OPACITIES.length]}`,
                      }]} />
                      <Text style={styles.interestText} numberOfLines={1}>{t}</Text>
                    </View>
                  ))}
                  {user.technologyInterests.length === 0 && (
                    <Text style={[styles.interestText, { opacity: 0.55 }]}>No interests listed</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Barcode strip */}
            <View style={styles.barcodeStrip} pointerEvents="none">
              {barcodeBars.map((w, i) => (
                <View key={i} style={[styles.barcodeBar, { width: w }]} />
              ))}
            </View>

            <View style={[styles.bottomBar, styles.backBottomBar]}>
              <Text style={styles.bottomTextLight}>Joined {user.joinedDate.split('T')[0]} · Property of ITIC</Text>
              <Text style={styles.bottomTextLight}>itic.ac.zw</Text>
            </View>
          </Animated.View>

        </Animated.View>
      </Pressable>

      {/* Flip hint */}
      <View style={styles.flipBtn}>
        <Ionicons name="swap-horizontal" size={14} color={colors.mutedForeground} />
        <Text style={[styles.flipHint, { color: colors.mutedForeground }]}>
          {flipped ? 'Tap to show front' : 'Tap card for details'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 10, paddingVertical: 4 },
  shadowHost: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  card: {
    position: 'absolute', top: 0, left: 0,
    borderRadius: 20, overflow: 'hidden',
  },

  // Decorations
  cornerGlow: {
    position: 'absolute', top: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    pointerEvents: 'none',
  },
  circuitOverlay: { ...StyleSheet.absoluteFillObject },
  circuitLine: { position: 'absolute', backgroundColor: '#ffffff0e', height: 1 },
  circuitDot: { position: 'absolute', width: 4, height: 4, borderRadius: 2 },

  // Header strip
  headerStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1,
  },
  logoMark: {
    width: 22, height: 22, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  orgName: { flex: 1, fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#94a3b8', letterSpacing: 1 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  rolePillText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#0f172a', letterSpacing: 0.5 },

  // Body
  cardBody: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, gap: 10,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },

  // Avatar on card front
  cardAvatar: {
    width: 40, height: 40, borderRadius: 11,
    borderWidth: 1.5, overflow: 'hidden', flexShrink: 0,
  },
  cardAvatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardAvatarFallback: {
    width: 40, height: 40, borderRadius: 11,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardAvatarText: { fontSize: 14, fontFamily: 'Inter_700Bold' },

  cardName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#f8fafc', letterSpacing: -0.3 },
  cardMemberId: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.6 },
  cardSub: { fontSize: 9, fontFamily: 'Inter_400Regular', color: '#94a3b8' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 4, shadowOpacity: 0.9, elevation: 2,
  },
  statusText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#cbd5e1', letterSpacing: 1 },

  // QR
  qrContainer: { alignItems: 'center', gap: 4, position: 'relative' },
  qrOuter: { padding: 2, borderRadius: 11, borderWidth: 1 },
  qrInnerFrame: { padding: 2, borderRadius: 9, borderWidth: 1 },
  qrInner: { backgroundColor: '#fff', padding: 5, borderRadius: 7 },
  qrTickTL: { position: 'absolute', top: -1, left: -1, width: 8, height: 8, borderTopWidth: 2, borderLeftWidth: 2, borderRadius: 2 },
  qrTickTR: { position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderTopWidth: 2, borderRightWidth: 2, borderRadius: 2 },
  qrTickBL: { position: 'absolute', bottom: 18, left: -1, width: 8, height: 8, borderBottomWidth: 2, borderLeftWidth: 2, borderRadius: 2 },
  qrTickBR: { position: 'absolute', bottom: 18, right: -1, width: 8, height: 8, borderBottomWidth: 2, borderRightWidth: 2, borderRadius: 2 },
  qrLabel: { fontSize: 7, fontFamily: 'Inter_700Bold', letterSpacing: 1.2 },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: 14, paddingVertical: 6, borderTopWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  bottomText: { fontSize: 7.5, fontFamily: 'Inter_400Regular', color: '#64748b' },

  // Back
  backHeaderStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#ffffff20',
  },
  backAvatarMini: {
    width: 22, height: 22, borderRadius: 7,
    overflow: 'hidden', borderWidth: 1, borderColor: '#ffffff30',
  },
  backAvatarMiniImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  backLogoMark: {
    width: 22, height: 22, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  backOrgName: { flex: 1, fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#ffffffcc', letterSpacing: 1 },
  memberSincePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#ffffff1e', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  memberSinceText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.3 },

  backContent: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 8, gap: 7, overflow: 'hidden',
  },
  backStatsRow: { flexDirection: 'row', gap: 12 },
  backStat: { flex: 1, gap: 2 },
  backStatHeader: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  backTagsSection: { gap: 3 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },

  backLabel: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#ffffffaa', letterSpacing: 1 },
  backValue: { fontSize: 10.5, fontFamily: 'Inter_500Medium', color: '#fff', marginTop: 1 },
  interestTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ffffff1e', borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2.5, alignSelf: 'flex-start',
  },
  interestDot: { width: 5, height: 5, borderRadius: 2.5 },
  interestText: { fontSize: 9.5, fontFamily: 'Inter_500Medium', color: '#fff' },

  // Barcode
  barcodeStrip: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 1.5,
    height: 13, paddingHorizontal: 14, marginBottom: 2,
  },
  barcodeBar: { height: '100%', backgroundColor: '#ffffff50', borderRadius: 1 },

  backBottomBar: { borderTopColor: '#ffffff1a' },
  bottomTextLight: { fontSize: 7.5, fontFamily: 'Inter_400Regular', color: '#ffffff88' },

  // Flip hint
  flipBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  flipHint: { fontSize: 11.5, fontFamily: 'Inter_400Regular' },
});
