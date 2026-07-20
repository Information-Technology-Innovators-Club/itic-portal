import React, { useState } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, Dimensions, Platform,
} from 'react-native';
import Animated, {
  interpolate, useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { User } from '@/types';
import { useColors } from '@/hooks/useColors';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 40, 360);
const CARD_H = CARD_W * 0.6;

interface Props {
  user: User;
}

export function MemberIDCard({ user }: Props) {
  const colors = useColors();
  const [flipped, setFlipped] = useState(false);
  const rotation = useSharedValue(0);

  const qrData = JSON.stringify({
    userId: user.id,
    memberId: user.memberId,
    name: user.fullName,
  });

  function flip() {
    const target = flipped ? 0 : 1;
    rotation.value = withSpring(target, { damping: 14, stiffness: 120 });
    setFlipped(!flipped);
  }

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const roleColor = user.role === 'admin'
    ? '#7c3aed'
    : user.role === 'executive'
    ? '#0369a1'
    : '#16a34a';

  const roleLabel = user.role === 'admin'
    ? 'Administrator'
    : user.role === 'executive'
    ? 'Executive'
    : 'Member';

  return (
    <View style={styles.wrapper}>
      {/* Card stack */}
      <View style={{ width: CARD_W, height: CARD_H }}>
        {/* FRONT */}
        <Animated.View style={[styles.card, { width: CARD_W, height: CARD_H }, frontStyle]}>
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#0f2d1a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Circuit pattern overlay */}
          <View style={styles.circuitOverlay} pointerEvents="none">
            <View style={[styles.circuitLine, { top: 20, left: 100, width: 60 }]} />
            <View style={[styles.circuitLine, { top: 20, left: 100, width: 2, height: 40 }]} />
            <View style={[styles.circuitDot, { top: 60, left: 99 }]} />
            <View style={[styles.circuitLine, { bottom: 30, right: 80, width: 50 }]} />
            <View style={[styles.circuitLine, { bottom: 30, right: 80, width: 2, height: 30 }]} />
          </View>

          {/* Header strip */}
          <View style={[styles.headerStrip, { backgroundColor: roleColor + '22', borderBottomColor: roleColor + '44' }]}>
            <View style={styles.logoMark}>
              <Ionicons name="hardware-chip" size={14} color={roleColor} />
            </View>
            <Text style={styles.orgName}>ITIC · CUT</Text>
            <View style={[styles.rolePill, { backgroundColor: roleColor }]}>
              <Text style={styles.rolePillText}>{roleLabel}</Text>
            </View>
          </View>

          {/* Main content */}
          <View style={styles.cardBody}>
            {/* Left: info */}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.cardName} numberOfLines={1}>{user.fullName}</Text>
              <Text style={styles.cardMemberId}>{user.memberId}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>{user.studentNumber}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>{user.faculty.replace('Faculty of ', '')}</Text>
              <View style={[styles.statusDot, { backgroundColor: user.status === 'active' ? '#22c55e' : '#f59e0b' }]}>
                <Text style={styles.statusText}>{user.status.toUpperCase()}</Text>
              </View>
            </View>

            {/* Right: QR */}
            <View style={styles.qrContainer}>
              <View style={styles.qrInner}>
                <QRCode
                  value={qrData}
                  size={72}
                  color="#0f172a"
                  backgroundColor="#ffffff"
                />
              </View>
              <Text style={styles.qrLabel}>SCAN ME</Text>
            </View>
          </View>

          {/* Bottom bar */}
          <View style={[styles.bottomBar, { borderTopColor: roleColor + '33' }]}>
            <Text style={styles.bottomText}>Information Technology Innovators Club</Text>
            <Text style={styles.bottomText}>Chinhoyi University of Technology</Text>
          </View>
        </Animated.View>

        {/* BACK */}
        <Animated.View style={[styles.card, { width: CARD_W, height: CARD_H, position: 'absolute', top: 0, left: 0 }, backStyle]}>
          <LinearGradient
            colors={['#16a34a', '#15803d', '#0f2d1a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.backContent}>
            {/* Left column */}
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.backLabel}>PROGRAMME</Text>
              <Text style={styles.backValue} numberOfLines={2}>{user.programme || '—'}</Text>

              <Text style={[styles.backLabel, { marginTop: 6 }]}>LEVEL & SEMESTER</Text>
              <Text style={styles.backValue}>{user.academicLevel} · {user.semester}</Text>

              <Text style={[styles.backLabel, { marginTop: 6 }]}>EXPERIENCE</Text>
              <Text style={styles.backValue}>{user.experienceLevel}</Text>

              {!!user.githubUsername && (
                <>
                  <Text style={[styles.backLabel, { marginTop: 6 }]}>GITHUB</Text>
                  <Text style={styles.backValue} numberOfLines={1}>@{user.githubUsername}</Text>
                </>
              )}
            </View>

            {/* Right column: interests */}
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.backLabel}>INTERESTS</Text>
              <View style={{ gap: 4 }}>
                {user.technologyInterests.slice(0, 3).map(t => (
                  <View key={t} style={styles.interestTag}>
                    <Text style={styles.interestText} numberOfLines={1}>{t}</Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.backLabel, { marginTop: 6 }]}>LANGUAGES</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                {user.programmingLanguages.slice(0, 3).map(l => (
                  <View key={l} style={styles.langTag}>
                    <Text style={styles.langText}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Bottom */}
          <View style={[styles.bottomBar, { borderTopColor: '#ffffff22' }]}>
            <Text style={styles.bottomText}>Joined: {user.joinedDate.split('T')[0]}</Text>
            <Text style={styles.bottomText}>itic.ac.zw</Text>
          </View>
        </Animated.View>
      </View>

      {/* Flip hint */}
      <TouchableOpacity onPress={flip} activeOpacity={0.7} style={styles.flipBtn}>
        <Ionicons name="swap-horizontal" size={14} color={colors.mutedForeground} />
        <Text style={[styles.flipHint, { color: colors.mutedForeground }]}>
          {flipped ? 'Show front' : 'Flip for details'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 10 },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  circuitOverlay: { ...StyleSheet.absoluteFillObject },
  circuitLine: { position: 'absolute', backgroundColor: '#ffffff10', height: 1 },
  circuitDot: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#16a34a66' },
  headerStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderBottomWidth: 1,
  },
  logoMark: {
    width: 20, height: 20, borderRadius: 5,
    backgroundColor: '#ffffff15', alignItems: 'center', justifyContent: 'center',
  },
  orgName: { flex: 1, fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#94a3b8', letterSpacing: 0.8 },
  rolePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  rolePillText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.5 },
  cardBody: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, gap: 12,
  },
  cardName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#f8fafc', letterSpacing: -0.3 },
  cardMemberId: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#16a34a', letterSpacing: 0.5 },
  cardSub: { fontSize: 10, fontFamily: 'Inter_400Regular', color: '#94a3b8' },
  statusDot: {
    marginTop: 4, paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 6, alignSelf: 'flex-start',
  },
  statusText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.8 },
  qrContainer: { alignItems: 'center', gap: 4 },
  qrInner: { backgroundColor: '#fff', padding: 6, borderRadius: 8 },
  qrLabel: { fontSize: 7, fontFamily: 'Inter_700Bold', color: '#64748b', letterSpacing: 1 },
  bottomBar: {
    paddingHorizontal: 14, paddingVertical: 6, borderTopWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  bottomText: { fontSize: 8, fontFamily: 'Inter_400Regular', color: '#64748b' },
  backContent: { flex: 1, flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  backLabel: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#bbf7d0', letterSpacing: 1 },
  backValue: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#f0fdf4' },
  interestTag: {
    backgroundColor: '#ffffff20', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  interestText: { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#f0fdf4' },
  langTag: {
    backgroundColor: '#ffffff15', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  langText: { fontSize: 9, fontFamily: 'Inter_400Regular', color: '#bbf7d0' },
  flipBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  flipHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
