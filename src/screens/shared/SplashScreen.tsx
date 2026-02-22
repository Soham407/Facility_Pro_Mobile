import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Colors, FontSize } from '../../lib/constants';

interface SplashScreenProps {
  onReady: () => void;
}

export function SplashScreen({ onReady }: SplashScreenProps) {
  useEffect(() => {
    // Give a short delay for branding visibility, then signal ready
    const timer = setTimeout(onReady, 1500);
    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>FacilityPro</Text>
      <Text style={styles.subtitle}>Enterprise Mobile</Text>
      <ActivityIndicator
        size="large"
        color={Colors.primary}
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  spinner: {
    marginTop: 40,
  },
});
