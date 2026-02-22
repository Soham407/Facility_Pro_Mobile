import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors, FontSize } from '../../lib/constants';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color={Colors.primary} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  box: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    minWidth: 160,
  },
  message: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
  },
});
