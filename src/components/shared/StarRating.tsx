import React, { useRef, useEffect } from 'react';
import { View, TouchableWithoutFeedback, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../lib/constants';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <Star
          key={star}
          filled={star <= value}
          onPress={() => onChange?.(star)}
          readonly={!onChange}
        />
      ))}
    </View>
  );
}

function Star({ filled, onPress, readonly }: { filled: boolean; onPress: () => void; readonly: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  // Animate when filled changes to true
  useEffect(() => {
    if (filled) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [filled, scale]);

  const handlePress = () => {
    if (!readonly) onPress();
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress} disabled={readonly}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={filled ? "star" : "star-outline"}
          size={40}
          color={filled ? Colors.accent : Colors.border}
          style={styles.star}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  star: {
    marginHorizontal: 4,
  },
});
