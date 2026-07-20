import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginScreen() {
  const colors = useColors();
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      showToast('warning', 'Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('success', 'Welcome back!');
      router.replace('/(tabs)/');
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      showToast('error', 'Login failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.hero}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
            <Ionicons name="hardware-chip" size={40} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>ITIC Portal</Text>
          <Text style={[styles.appSub, { color: colors.mutedForeground }]}>
            Information Technology Innovators Club
          </Text>
          <Text style={[styles.appSub2, { color: colors.mutedForeground }]}>
            Chinhoyi University of Technology
          </Text>
        </Animated.View>

        {/* Card */}
        <Animated.View
          entering={FadeInUp.delay(150).springify()}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Welcome back</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            Sign in to your ITIC account
          </Text>

          <View style={{ gap: 14 }}>
            <Input
              label="University Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />
          </View>

          <TouchableOpacity
            style={{ alignSelf: 'flex-end', marginTop: 4 }}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={[styles.forgot, { color: colors.primary }]}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </Animated.View>

        {/* Register */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.registerRow}>
          <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
            Not a member yet?{' '}
          </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={[styles.registerLink, { color: colors.primary }]}>Register now</Text>
            </TouchableOpacity>
          </Link>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48, gap: 24 },
  hero: { alignItems: 'center', gap: 8 },
  logoWrap: {
    width: 80, height: 80, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  appName: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  appSub: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  appSub2: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  card: {
    borderRadius: 20, borderWidth: 1, padding: 24, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
  },
  cardTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  cardSub: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: -8 },
  forgot: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  registerLink: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});
