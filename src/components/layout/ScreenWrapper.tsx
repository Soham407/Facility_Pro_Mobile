import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../lib/constants';
import { OfflineBanner } from '../../screens/shared/OfflineBanner';

interface ScreenWrapperProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export function ScreenWrapper({ children, noPadding = false }: ScreenWrapperProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfflineBanner />
      <View style={[styles.container, noPadding && styles.noPadding]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  noPadding: {
    paddingHorizontal: 0,
  },
});
