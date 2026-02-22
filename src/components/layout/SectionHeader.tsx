import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../../lib/constants';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    marginTop: 8,
  },
  title: {
    fontSize: FontSize.sectionTitle,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
