import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!email.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>

        {!sent ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.content}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="lock-open-outline" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Forgot Password?</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              Enter your university email address and we'll send you a reset link.
            </Text>
            <Input
              label="University Email"
              placeholder="e.g. C221456B@cut.ac.zw"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />
            <Button title="Send Reset Link" onPress={handleSend} loading={loading} fullWidth />
            <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
              <Text style={[styles.backLinkText, { color: colors.mutedForeground }]}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.springify()} style={styles.content}>
            <View style={[styles.iconCircle, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Email Sent!</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              If {email} is registered, you'll receive a password reset link shortly. Check your inbox.
            </Text>
            <Button title="Back to Sign In" onPress={() => router.replace('/(auth)/login')} fullWidth />
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  content: { flex: 1, gap: 20, maxWidth: 400, alignSelf: 'center', width: '100%' },
  iconCircle: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, textAlign: 'center' },
  sub: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 23, textAlign: 'center' },
  backLink: { alignSelf: 'center', paddingVertical: 4 },
  backLinkText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
