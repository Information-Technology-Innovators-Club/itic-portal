import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface GlassCardProps extends ViewProps {
  intensity?: 'low' | 'medium' | 'high';
  noPadding?: boolean;
}

export function GlassCard({ children, intensity = 'medium', noPadding = false, style, ...rest }: GlassCardProps) {
  const colors = useColors();

  const bgOpacity = { low: 0.04, medium: 0.07, high: 0.12 }[intensity];
  const borderOpacity = { low: 0.06, medium: 0.1, high: 0.18 }[intensity];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius + 4,
          padding: noPadding ? 0 : 16,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export function StatCard({
  label, value, icon, color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colors = useColors();
  return (
    <GlassCard style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={{ marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
          <View>
            {/* value text rendered by parent */}
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
});
