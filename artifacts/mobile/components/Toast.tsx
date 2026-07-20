import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import Animated, {
  FadeInUp, FadeOutUp, useAnimatedStyle, useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/context/ToastContext';
import { ToastMessage, ToastType } from '@/types';

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; iconName: keyof typeof Ionicons.glyphMap }> = {
  success: { bg: '#f0fdf4', border: '#16a34a40', icon: '#16a34a', iconName: 'checkmark-circle' },
  error:   { bg: '#fef2f2', border: '#ef444440', icon: '#ef4444', iconName: 'close-circle' },
  info:    { bg: '#eff6ff', border: '#3b82f640', icon: '#3b82f6', iconName: 'information-circle' },
  warning: { bg: '#fffbeb', border: '#f59e0b40', icon: '#f59e0b', iconName: 'warning' },
};

function ToastItem({ toast }: { toast: ToastMessage }) {
  const { dismiss } = useToast();
  const c = COLORS[toast.type];
  const scale = useSharedValue(0.9);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(14)}
      exiting={FadeOutUp.duration(200)}
      style={[animStyle, styles.item, { backgroundColor: c.bg, borderColor: c.border }]}
    >
      <Ionicons name={c.iconName} size={22} color={c.icon} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: c.icon }]}>{toast.title}</Text>
        {!!toast.message && (
          <Text style={styles.msg} numberOfLines={2}>{toast.message}</Text>
        )}
      </View>
      <TouchableOpacity onPress={() => dismiss(toast.id)} hitSlop={8}>
        <Ionicons name="close" size={16} color="#64748b" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          top: Platform.OS === 'web' ? 16 : insets.top + 8,
          paddingHorizontal: 16,
        },
      ]}
      pointerEvents="box-none"
    >
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 1 },
  msg: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#475569', lineHeight: 17 },
});
