import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Colors, Radius, FontSize, MIN_TOUCH_TARGET } from '../../lib/constants';

interface BottomSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function BottomSheet({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: BottomSheetProps) {
  const confirmBg =
    confirmVariant === 'danger' ? Colors.danger : Colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <View />
      </Pressable>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.button, styles.cancelButton]}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            style={[styles.button, { backgroundColor: confirmBg }]}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: FontSize.sectionTitle,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    marginBottom: 24,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cancelButton: {
    backgroundColor: Colors.border,
  },
  cancelText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: FontSize.body,
  },
  confirmText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: FontSize.body,
  },
});
