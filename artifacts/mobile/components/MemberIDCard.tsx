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

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 40, 360);
const CARD_H = CARD_W * 0.62;

interface Props {
  user: User;
}

const DOT_OPACITIES = ['ff', 'c0', '80'];

// Deterministic decorative barcode derived from the member's own ID, so the
// back genuinely reads as "this specific card" rather than generic filler.
function generateBarcode(seed: string, count = 30) {
  const src = seed && seed.length ? seed : '0000';
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const code = src.charCodeAt(i % src.length) + i * 7;
    bars.push(1 + (code % 3)); // widths of 1–3px
  }
  return bars;
}

// Compact stat block for the back face — icon + label on one line, value
// below. Used in a 3-across row so the back never has to stack more than
// a couple of lines of content per item.
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

// ---- Role theming --------------------------------------------------------
// Each role gets its own accent, gradient pair, and icon so the card reads
// differently at a glance, not just a recolored pill.
const ROLE_THEME = {
  admin: {
    label: 'Administrator',
    accent: '#a78bfa',
    icon: 'shield-checkmark' as const,
    front: ['#1e1033', '#2e1a47', '#150a24'],
    back: ['#7c3aed', '#5b21b6', '#2e1065'],
  },
  executive: {
    label: 'Executive',
    accent: '#38bdf8',
    icon: 'briefcase' as const,
    front: ['#08111f', '#0c2338', '#061420'],
    back: ['#0ea5e9', '#0369a1', '#0c2b45'],
  },
  member: {
    label: 'Member',
    accent: '#4ade80',
    icon: 'hardware-chip' as const,
    front: ['#0a1a10', '#0f2d1a', '#081a10'],
    back: ['#22c55e', '#15803d', '#0f2d1a'],
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
    () => generateBarcode(user.memberId || user.id, 32),
    [user.memberId, user.id],
  );

  function flip() {
    const target = flipped ? 0 : 1;
    rotation.value = withSpring(target, { damping: 16, stiffness: 110, mass: 0.9 });
    setFlipped(!flipped);
  }

  // Subtle "lift" on press so the tap feels physical, not just a hitbox.
  const onPressIn = () => { press.value = withSpring(0.97, { damping: 20, stiffness: 300 }); };
  const onPressOut = () => { press.value = withSpring(1, { damping: 14, stiffness: 200 }); };

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  // Both faces animate rotateY together, but each also fades out through the
  // midpoint. backfaceVisibility alone is unreliable on Android, so the
  // opacity crossfade guarantees no mirrored-text bleed-through there too.
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
    shadowOpacity: interpolate(rotation.value, [0, 0.5, 1], [0.35, 0.55, 0.35]),
    shadowRadius: interpolate(rotation.value, [0, 0.5, 1], [18, 28, 18]),
  }));

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={flip} onPressIn={onPressIn} onPressOut={onPressOut} hitSlop={8}>
        <Animated.View style={[{ width: CARD_W, height: CARD_H }, wrapperStyle, shadowStyle, styles.shadowHost]}>

          {/* FRONT */}
          <Animated.View style={[styles.card, { width: CARD_W, height: CARD_H }, frontStyle]}>
            <LinearGradient
              colors={theme.front}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Circuit pattern overlay */}
            <View style={styles.circuitOverlay} pointerEvents="none">
              <View style={[styles.circuitLine, { top: 20, left: 100, width: 60 }]} />
              <View style={[styles.circuitLine, { top: 20, left: 100, width: 2, height: 40 }]} />
              <View style={[styles.circuitDot, { top: 60, left: 99, backgroundColor: theme.accent + '55' }]} />
              <View style={[styles.circuitLine, { bottom: 30, right: 80, width: 50 }]} />
              <View style={[styles.circuitLine, { bottom: 30, right: 80, width: 2, height: 30 }]} />
            </View>
            {/* Faint diagonal sheen for a "laminated card" feel */}
            <LinearGradient
              pointerEvents="none"
              colors={['#ffffff14', 'transparent', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.6, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Header strip */}
            <View style={[styles.headerStrip, { backgroundColor: theme.accent + '1a', borderBottomColor: theme.accent + '40' }]}>
              <View style={[styles.logoMark, { backgroundColor: theme.accent + '22' }]}>
                <Ionicons name={theme.icon} size={13} color={theme.accent} />
              </View>
              <Text style={styles.orgName}>ITIC · CUT</Text>
              <View style={[styles.rolePill, { backgroundColor: theme.accent }]}>
                <Text style={styles.rolePillText}>{theme.label}</Text>
              </View>
            </View>

            {/* Main content */}
            <View style={styles.cardBody}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.cardName} numberOfLines={1}>{user.fullName}</Text>
                <Text style={[styles.cardMemberId, { color: theme.accent }]}>{user.memberId}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>{user.studentNumber}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>{user.faculty.replace('Faculty of ', '')}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDotIcon, { backgroundColor: user.status === 'active' ? '#22c55e' : '#f59e0b' }]} />
                  <Text style={styles.statusText}>{user.status.toUpperCase()}</Text>
                </View>
              </View>

              {/* Right: QR with a bordered "hologram" frame */}
              <View style={styles.qrContainer}>
                <View style={[styles.qrFrame, { borderColor: theme.accent + '55' }]}>
                  <View style={styles.qrInner}>
                    <QRCode value={qrData} size={68} color="#0f172a" backgroundColor="#ffffff" />
                  </View>
                </View>
                <Text style={[styles.qrLabel, { color: theme.accent }]}>SCAN ME</Text>
              </View>
            </View>

            {/* Bottom bar */}
            <View style={[styles.bottomBar, { borderTopColor: theme.accent + '30' }]}>
              <Text style={styles.bottomText}>Information Technology Innovators Club</Text>
              <Text style={styles.bottomText}>Chinhoyi University of Technology</Text>
            </View>
          </Animated.View>

          {/* BACK */}
          <Animated.View style={[styles.card, styles.cardBack, { width: CARD_W, height: CARD_H }, backStyle]}>
            <LinearGradient
              colors={theme.back}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Gentle top-to-bottom scrim keeps white text legible over any accent */}
            <LinearGradient
              pointerEvents="none"
              colors={['#00000000', '#00000038']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Header strip — echoes the front so the flip reads as one object */}
            <View style={styles.backHeaderStrip}>
              <View style={styles.backLogoMark}>
                <Ionicons name={theme.icon} size={12} color="#fff" />
              </View>
              <Text style={styles.backOrgName}>MEMBER PROFILE</Text>
              <View style={styles.memberSincePill}>
                <Ionicons name="time-outline" size={10} color="#fff" />
                <Text style={styles.memberSinceText}>{daysAsMember}d</Text>
              </View>
            </View>

            {/* Content — trimmed to the essentials: Programme, Level/Semester,
                and Interests. Bounded height (overflow: hidden) so long values
                or many tags clip cleanly instead of bleeding into the
                barcode/footer. */}
            <View style={styles.backContent}>
              <View style={styles.backStatsRow}>
                <BackStat icon="school-outline" label="PROGRAMME" value={user.programme || '—'} lines={2} />
                <BackStat icon="layers-outline" label="LVL/SEM" value={`${user.academicLevel} · ${user.semester}`} />
              </View>

              <View style={styles.backTagsSection}>
                <Text style={styles.backLabel}>INTERESTS</Text>
                <View style={styles.tagRow}>
                  {user.technologyInterests.slice(0, 4).map((t, i) => (
                    <View key={t} style={styles.interestTag}>
                      <View style={[styles.interestDot, { backgroundColor: `#ffffff${DOT_OPACITIES[i % DOT_OPACITIES.length]}` }]} />
                      <Text style={styles.interestText} numberOfLines={1}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Decorative barcode, encoded from the member's own ID — a real
                "flip the card over" detail rather than filler texture. */}
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
  wrapper: { alignItems: 'center', gap: 10 },
  shadowHost: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    // shadowOpacity / shadowRadius are animated above
    elevation: 12,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 18,
    overflow: 'hidden',
  },
  cardBack: {},
  circuitOverlay: { ...StyleSheet.absoluteFillObject },
  circuitLine: { position: 'absolute', backgroundColor: '#ffffff10', height: 1 },
  circuitDot: { position: 'absolute', width: 4, height: 4, borderRadius: 2 },
  headerStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderBottomWidth: 1,
  },
  logoMark: {
    width: 20, height: 20, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  orgName: { flex: 1, fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#94a3b8', letterSpacing: 0.8 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  rolePillText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#0f172a', letterSpacing: 0.4 },
  cardBody: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, gap: 12,
  },
  cardName: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#f8fafc', letterSpacing: -0.3 },
  cardMemberId: { fontSize: 13, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  cardSub: { fontSize: 10, fontFamily: 'Inter_400Regular', color: '#94a3b8' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  statusDotIcon: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#cbd5e1', letterSpacing: 0.8 },
  qrContainer: { alignItems: 'center', gap: 4 },
  qrFrame: { padding: 3, borderRadius: 10, borderWidth: 1 },
  qrInner: { backgroundColor: '#fff', padding: 5, borderRadius: 7 },
  qrLabel: { fontSize: 7, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  bottomBar: {
    paddingHorizontal: 14, paddingVertical: 6, borderTopWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  bottomText: { fontSize: 8, fontFamily: 'Inter_400Regular', color: '#64748b' },
  backHeaderStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: '#ffffff22',
  },
  backLogoMark: {
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center',
  },
  backOrgName: { flex: 1, fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#ffffffcc', letterSpacing: 1 },
  memberSincePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#ffffff22', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20,
  },
  memberSinceText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.3 },

  // ---- Back content (fixed layout) ----
  backContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    overflow: 'hidden', // safety net: clip instead of bleeding into barcode/footer
  },
  backStatsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  backStat: {
    flex: 1,
    gap: 2,
  },
  backStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  backTagsSection: {
    gap: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },

  backLabel: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#ffffffb0', letterSpacing: 1 },
  backValue: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#ffffff', marginTop: 1 },
  interestTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ffffff22', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start',
  },
  interestDot: { width: 5, height: 5, borderRadius: 2.5 },
  interestText: { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#ffffff' },
  barcodeStrip: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 1.5,
    height: 12, paddingHorizontal: 14, marginBottom: 1,
  },
  barcodeBar: { height: '100%', backgroundColor: '#ffffff55', borderRadius: 1 },
  backBottomBar: { borderTopColor: '#ffffff22' },
  bottomTextLight: { fontSize: 8, fontFamily: 'Inter_400Regular', color: '#ffffff99' },
  flipBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  flipHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});