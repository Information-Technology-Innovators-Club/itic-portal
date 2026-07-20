import React from 'react';
import {
  ActivityIndicator, StyleSheet, Text, TouchableOpacity,
  TouchableOpacityProps, ViewStyle,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title, variant = 'primary', size = 'md', loading = false,
  fullWidth = false, disabled, style, ...rest
}: ButtonProps) {
  const colors = useColors();

  const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
    primary: { bg: colors.primary, text: colors.primaryForeground },
    secondary: { bg: colors.secondary, text: colors.secondaryForeground },
    outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', text: colors.primary },
    destructive: { bg: colors.destructive, text: colors.destructiveForeground },
  };

  const sizeMap: Record<Size, { height: number; px: number; fontSize: number }> = {
    sm: { height: 36, px: 14, fontSize: 13 },
    md: { height: 48, px: 20, fontSize: 15 },
    lg: { height: 56, px: 24, fontSize: 16 },
  };

  const vs = variantStyles[variant];
  const ss = sizeMap[size];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: vs.bg,
          borderColor: vs.border ?? 'transparent',
          borderWidth: vs.border ? 1.5 : 0,
          height: ss.height,
          paddingHorizontal: ss.px,
          borderRadius: colors.radius,
          opacity: (disabled || loading) ? 0.55 : 1,
          alignSelf: fullWidth ? 'stretch' : 'center',
          minWidth: fullWidth ? undefined : 120,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : (
        <Text style={[styles.label, { color: vs.text, fontSize: ss.fontSize }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.1,
  },
});
