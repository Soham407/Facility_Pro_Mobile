import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Radius, FontSize, MIN_TOUCH_TARGET } from '../../lib/constants';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border: string }> = {
  primary: { bg: Colors.primary, text: Colors.white, border: Colors.primary },
  secondary: { bg: Colors.surface, text: Colors.textPrimary, border: Colors.border },
  danger: { bg: Colors.danger, text: Colors.white, border: Colors.danger },
  ghost: { bg: Colors.transparent, text: Colors.textPrimary, border: Colors.transparent },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const vs = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: vs.bg,
          borderColor: vs.border,
          opacity: isDisabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: vs.text }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.button,
    borderWidth: 1,
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontSize: FontSize.body,
    fontWeight: '600',
  },
});
