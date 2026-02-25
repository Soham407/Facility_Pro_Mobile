import * as LocalAuthentication from 'expo-local-authentication';
import { MMKV } from 'react-native-mmkv';
import { authStorage, supabase } from './supabase';
import { SESSION_EXPIRY_HOURS } from './constants';

export const biometricStorage = new MMKV({ id: 'biometric-storage' });

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch (error) {
    console.error('Biometric availability check failed:', error);
    return false;
  }
}

export async function enableBiometric(userId: string): Promise<void> {
  try {
    const available = await isBiometricAvailable();
    if (!available) return;

    biometricStorage.set(`biometric_enabled`, 'true');
    biometricStorage.set(`last_user_id`, userId);
    biometricStorage.set('last_active', Date.now());
  } catch (error) {
    console.error('Failed to enable biometric:', error);
  }
}

export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const available = await isBiometricAvailable();
    if (!available) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify your identity to access FacilityPro',
      cancelLabel: 'Use Password Instead',
      fallbackLabel: 'Use Password Instead',
      disableDeviceFallback: true,
    });

    if (result.success) {
      biometricStorage.set('last_active', Date.now());
      return true;
    }
    return false;
  } catch (error) {
    console.error('Biometric auth failed:', error);
    return false;
  }
}

export function isSessionExpired(): boolean {
  const lastActive = (biometricStorage as any).getNumber('last_active');
  if (!lastActive) return true;
  const hoursSinceActive = (Date.now() - lastActive) / (1000 * 60 * 60);
  return hoursSinceActive >= SESSION_EXPIRY_HOURS;
}

export function updateLastActive() {
  biometricStorage.set('last_active', Date.now());
}
