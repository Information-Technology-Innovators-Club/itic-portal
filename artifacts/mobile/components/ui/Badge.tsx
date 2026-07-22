import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { AnnouncementCategory, MemberStatus, UserRole } from '@/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'default', icon, size = 'sm' }: BadgeProps) {
  const colors = useColors();

  const variantMap: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
    default:  { bg: colors.muted,     text: colors.mutedForeground, border: colors.border },
    success:  { bg: '#dcfce7',         text: '#15803d',              border: '#bbf7d0' },
    warning:  { bg: '#fef3c7',         text: '#92400e',              border: '#fde68a' },
    danger:   { bg: '#fee2e2',         text: '#b91c1c',              border: '#fecaca' },
    info:     { bg: '#dbeafe',         text: '#1d4ed8',              border: '#bfdbfe' },
    outline:  { bg: 'transparent',    text: colors.mutedForeground, border: colors.border },
  };

  const vs = variantMap[variant];
  const isMd = size === 'md';

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: vs.bg,
        borderColor: vs.border,
        paddingHorizontal: isMd ? 10 : 8,
        paddingVertical: isMd ? 4 : 3,
        borderRadius: isMd ? 10 : 8,
      },
    ]}>
      {icon && (
        <Ionicons name={icon} size={isMd ? 12 : 10} color={vs.text} style={{ marginRight: 4 }} />
      )}
      <Text style={[styles.label, { color: vs.text, fontSize: isMd ? 12 : 11 }]}>
        {label}
      </Text>
    </View>
  );
}

export function CategoryBadge({ category }: { category: AnnouncementCategory }) {
  const map: Record<AnnouncementCategory, { label: string; variant: BadgeVariant; icon: keyof typeof Ionicons.glyphMap }> = {
    general:  { label: 'General',   variant: 'default', icon: 'newspaper-outline' },
    workshop: { label: 'Workshop',  variant: 'info',    icon: 'construct-outline' },
    hackathon:{ label: 'Hackathon', variant: 'success', icon: 'flash-outline' },
    meeting:  { label: 'Meeting',   variant: 'warning', icon: 'people-outline' },
    urgent:   { label: 'Urgent',    variant: 'danger',  icon: 'alert-circle-outline' },
  };
  const { label, variant, icon } = map[category];
  return <Badge label={label} variant={variant} icon={icon} />;
}

export function StatusBadge({ status }: { status: MemberStatus }) {
  const map: Record<MemberStatus, { label: string; variant: BadgeVariant; icon: keyof typeof Ionicons.glyphMap }> = {
    active:    { label: 'Active',    variant: 'success', icon: 'checkmark-circle-outline' },
    pending:   { label: 'Pending',   variant: 'warning', icon: 'time-outline' },
    inactive:  { label: 'Inactive',  variant: 'default', icon: 'remove-circle-outline' },
    suspended: { label: 'Suspended', variant: 'danger',  icon: 'ban-outline' },
  };
  const { label, variant, icon } = map[status];
  return <Badge label={label} variant={variant} icon={icon} size="md" />;
}

export function RoleBadge({ role }: { role: UserRole }) {
  const map: Record<UserRole, { label: string; variant: BadgeVariant; icon: keyof typeof Ionicons.glyphMap }> = {
    guest:     { label: 'Guest',     variant: 'default', icon: 'person-outline' },
    member:    { label: 'Member',    variant: 'info',    icon: 'hardware-chip-outline' },
    executive: { label: 'Executive', variant: 'success', icon: 'briefcase-outline' },
    admin:     { label: 'Admin',     variant: 'danger',  icon: 'shield-checkmark-outline' },
  };
  const { label, variant, icon } = map[role];
  return <Badge label={label} variant={variant} icon={icon} size="md" />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
