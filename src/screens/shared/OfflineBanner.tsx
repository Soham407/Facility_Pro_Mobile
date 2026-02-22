import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useNetworkStore } from '../../stores/networkStore';
import { Colors, FontSize } from '../../lib/constants';

export function OfflineBanner() {
  const isOnline = useNetworkStore((s) => s.isOnline);
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isOnline ? 0 : 36,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOnline, heightAnim]);

  return (
    <Animated.View style={[styles.banner, { height: heightAnim }]}>
      <Text style={styles.text} numberOfLines={1}>
        Working offline — changes will sync when connected
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.accent,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  text: {
    color: '#000',
    fontSize: FontSize.caption,
    fontWeight: '600',
  },
});
