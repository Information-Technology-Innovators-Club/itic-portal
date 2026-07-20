import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function VerifyEmailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.iconWrap}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
          <Ionicons name="mail" size={48} color="#fff" />
        </View>
        <View style={[styles.checkBubble, { backgroundColor: colors.success, borderColor: colors.background }]}>
          <Ionicons name="checkmark" size={14} color="#fff" />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.textContent}>
        <Text style={[styles.title, { color: colors.foreground }]}>Registration Submitted!</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Welcome to ITIC, {user?.fullName?.split(' ')[0] ?? 'member'}!
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Your member ID is{' '}
          <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>
            {user?.memberId}
          </Text>
          .{'\n\n'}
          Your registration is pending executive approval. You will be notified once your account is activated.
          {'\n\n'}
          You can already explore the app while waiting for approval.
        </Text>

        <View style={[styles.infoBox, { backgroundColor: colors.accent, borderRadius: colors.radius }]}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.accentForeground }]}>
            Approval usually takes 1–2 business days
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.btnArea}>
        <Button
          title="Explore the App"
          onPress={() => router.replace('/(tabs)/')}
          fullWidth
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, alignItems: 'center' },
  iconWrap: { position: 'relative', marginBottom: 32 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  checkBubble: {
    position: 'absolute', bottom: -4, right: -4,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  textContent: { gap: 14, alignItems: 'center', maxWidth: 360 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, textAlign: 'center' },
  sub: { fontSize: 17, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  body: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, textAlign: 'center' },
  infoBox: { flexDirection: 'row', gap: 10, padding: 14, alignItems: 'center' },
  infoText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  btnArea: { width: '100%', marginTop: 32 },
});
