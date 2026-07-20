import React, { forwardRef, useState } from 'react';
import {
  StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  secure?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, leftIcon, rightIcon, onRightIconPress, secure = false, style, ...rest },
  ref,
) {
  const colors = useColors();
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const isSecure = secure && !showPassword;

  const borderColor = error
    ? colors.destructive
    : focused
    ? colors.primary
    : colors.border;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      )}
      <View
        style={[
          styles.container,
          {
            borderColor,
            backgroundColor: colors.input,
            borderRadius: colors.radius,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? colors.primary : colors.mutedForeground}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          ref={ref}
          secureTextEntry={isSecure}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              color: colors.foreground,
              fontFamily: 'Inter_400Regular',
              flex: 1,
            },
            style,
          ]}
          {...rest}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.rightIcon}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        )}
        {!secure && rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', marginLeft: 2 },
  container: {
    flexDirection: 'row', alignItems: 'center',
    height: 50, borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 8, padding: 2 },
  input: { fontSize: 15, height: '100%' },
  error: { fontSize: 12, fontFamily: 'Inter_400Regular', marginLeft: 2 },
});
