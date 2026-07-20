import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';

export default function VerifyEmailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { memberId } = useLocalSearchParams<{ memberId: string }>();

  return (
    <LinearGradient
      colors={['#0f172a', '#0f2d1a', '#030712']}
      style={styles.container}
    >
      {/* Animated checkmark */}
      <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.iconWrap}>
        <View style={[styles.iconOuter, { borderColor: '#16a34a40' }]}>
          <View style={[styles.iconInner, { backgroundColor: '#16a34a' }]}>
            <Ionicons name="checkmark" size={44} color="#fff" />
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.textBlock}>
        <Text style={styles.headline}>You're in! 🎉</Text>
        <Text style={styles.sub}>
          Your ITIC membership registration is complete. An executive will review and approve your account shortly.
        </Text>
      </Animated.View>

      {/* Member ID card */}
      <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.idCard, { borderColor: '#16a34a40' }]}>
        <Text style={styles.idLabel}>YOUR MEMBER ID</Text>
        <Text style={styles.idValue}>{memberId}</Text>
        <Text style={styles.idNote}>Save this — you'll need it for attendance and events</Text>
      </Animated.View>

      {/* Next steps */}
      <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.steps}>
        {[
          { icon: 'hourglass-outline' as const, text: 'Await executive approval (usually within 24 hrs)' },
          { icon: 'qr-code-outline' as const, text: 'Use your QR code on the Profile tab for event attendance' },
          { icon: 'calendar-outline' as const, text: 'Browse upcoming events and announcements' },
        ].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepIcon}>
              <Ionicons name={step.icon} size={16} color="#16a34a" />
            </View>
            <Text style={styles.stepText}>{step.text}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).springify()} style={{ width: '100%', gap: 10 }}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/')}
          style={styles.exploreBtn}
        >
          <Text style={styles.exploreBtnText}>Explore the App</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 28 },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  iconOuter: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  iconInner: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  textBlock: { alignItems: 'center', gap: 10 },
  headline: { fontSize: 30, fontFamily: 'Inter_700Bold', color: '#f8fafc', letterSpacing: -0.5, textAlign: 'center' },
  sub: { fontSize: 15, fontFamily: 'Inter_400Regular', color: '#94a3b8', textAlign: 'center', lineHeight: 22 },
  idCard: {
    width: '100%', padding: 20, borderRadius: 18,
    backgroundColor: '#ffffff08', borderWidth: 1, alignItems: 'center', gap: 6,
  },
  idLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#16a34a', letterSpacing: 1.5 },
  idValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#f8fafc', letterSpacing: 1 },
  idNote: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748b', textAlign: 'center' },
  steps: { width: '100%', gap: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepIcon: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: '#16a34a20', alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  stepText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#94a3b8', lineHeight: 19 },
  exploreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 16,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  exploreBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
});
