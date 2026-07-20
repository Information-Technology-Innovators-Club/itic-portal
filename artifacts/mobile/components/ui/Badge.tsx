import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { AnnouncementCategory, MemberStatus, UserRole } from '@/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const colors = useColors();

  const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
    default: { bg: colors.muted, text: colors.mutedForeground },
    success: { bg: colors.accent, text: colors.success },
    warning: { bg: '#fef3c7', text: '#92400e' },
    danger: { bg: '#fee2e2', text: colors.destructive },
    info: { bg: '#dbeafe', text: '#1e40af' },
    outline: { bg: 'transparent', text: colors.mutedForeground },
  };

  const vs = variantMap[variant];

  return (
    <View style={[styles.badge, { backgroundColor: vs.bg, borderRadius: colors.radius / 2 }]}>
      <Text style={[styles.label, { color: vs.text }]}>{label}</Text>
    </View>
  );
}

export function CategoryBadge({ category }: { category: AnnouncementCategory }) {
  const map: Record<AnnouncementCategory, { label: string; variant: BadgeVariant }> = {
    general: { label: 'General', variant: 'default' },
    workshop: { label: 'Workshop', variant: 'info' },
    hackathon: { label: 'Hackathon', variant: 'success' },
    meeting: { label: 'Meeting', variant: 'warning' },
    urgent: { label: 'Urgent', variant: 'danger' },
  };
  const { label, variant } = map[category];
  return <Badge label={label} variant={variant} />;
}

export function StatusBadge({ status }: { status: MemberStatus }) {
  const map: Record<MemberStatus, { label: string; variant: BadgeVariant }> = {
    active: { label: 'Active', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    inactive: { label: 'Inactive', variant: 'default' },
    suspended: { label: 'Suspended', variant: 'danger' },
  };
  const { label, variant } = map[status];
  return <Badge label={label} variant={variant} />;
}

export function RoleBadge({ role }: { role: UserRole }) {
  const map: Record<UserRole, { label: string; variant: BadgeVariant }> = {
    guest: { label: 'Guest', variant: 'default' },
    member: { label: 'Member', variant: 'info' },
    executive: { label: 'Executive', variant: 'success' },
    admin: { label: 'Admin', variant: 'danger' },
  };
  const { label, variant } = map[role];
  return <Badge label={label} variant={variant} />;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
});
