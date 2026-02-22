import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, FontSize } from '../../lib/constants';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: Colors.border, text: Colors.textPrimary },
  success: { bg: '#064E3B', text: Colors.success },
  warning: { bg: '#78350F', text: Colors.accent },
  danger: { bg: '#7F1D1D', text: Colors.danger },
  info: { bg: '#1E3A5F', text: Colors.primaryLight },
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const colors = variantColors[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.caption,
    fontWeight: '600',
  },
});
