import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/');
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Brand */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.brand}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="hardware-chip" size={36} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>ITIC Portal</Text>
          <Text style={[styles.appSub, { color: colors.mutedForeground }]}>
            Information Technology Innovators Club
          </Text>
          <Text style={[styles.appUniv, { color: colors.mutedForeground }]}>
            Chinhoyi University of Technology
          </Text>
        </Animated.View>

        {/* Card */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 4 }]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Welcome back</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            Sign in to your ITIC account
          </Text>

          <View style={styles.form}>
            <Input
              label="University Email"
              placeholder="e.g. C221456B@cut.ac.zw"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <Input
              ref={passwordRef}
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              leftIcon="lock-closed-outline"
              secure
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.destructive + '15', borderRadius: colors.radius }]}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={{ marginTop: 4 }}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotBtn}
            >
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Demo credentials hint */}
        <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.demoBox}>
          <Text style={[styles.demoTitle, { color: colors.mutedForeground }]}>Demo accounts</Text>
          <Text style={[styles.demoText, { color: colors.mutedForeground }]}>
            Executive: exec@itic.co.zw / exec123
          </Text>
          <Text style={[styles.demoText, { color: colors.mutedForeground }]}>
            Admin: admin@itic.co.zw / admin123
          </Text>
        </Animated.View>

        {/* Register link */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.registerRow}>
          <Text style={[styles.registerLabel, { color: colors.mutedForeground }]}>
            Not a member yet?
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.registerLink, { color: colors.primary }]}> Register now</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, gap: 24 },
  brand: { alignItems: 'center', gap: 8, marginBottom: 8 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  appName: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  appSub: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  appUniv: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  card: {
    padding: 24, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  cardTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  cardSub: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 2, marginBottom: 20 },
  form: { gap: 14 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  forgotBtn: { alignSelf: 'center', paddingVertical: 4 },
  forgotText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  registerLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  demoBox: { alignItems: 'center', gap: 2, opacity: 0.7 },
  demoTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  demoText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
