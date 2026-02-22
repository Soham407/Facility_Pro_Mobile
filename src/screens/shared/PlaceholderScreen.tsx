import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../../lib/constants';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';

interface PlaceholderScreenProps {
  screenName: string;
  roleName: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

export function PlaceholderScreen({
  screenName,
  roleName,
  iconName,
}: PlaceholderScreenProps) {
  return (
    <ScreenWrapper>
      <View style={styles.center}>
        <Ionicons name={iconName} size={64} color={Colors.primary} />
        <Text style={styles.title}>{screenName}</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleName}</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: FontSize.screenTitle,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  subtitle: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
  },
  roleBadge: {
    backgroundColor: Colors.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleText: {
    fontSize: FontSize.caption,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
});
