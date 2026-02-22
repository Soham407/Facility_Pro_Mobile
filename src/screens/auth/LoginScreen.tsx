import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, Radius } from '../../lib/constants';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    const result = await signIn(email.trim(), password);

    if (!result.success) {
      setErrorMsg(result.error ?? 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <View style={styles.brandBlock}>
          <Text style={styles.logo}>FacilityPro</Text>
          <Text style={styles.subtitle}>ENTERPRISE MOBILE</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>
            Access your enterprise mobile dashboard
          </Text>

          {/* Error Banner */}
          {errorMsg && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="you@company.com"
                placeholderTextColor={Colors.border}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={Colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={Colors.border}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            style={{ marginTop: 8 }}
          />
        </View>

        <Text style={styles.footer}>
          © 2026 FacilityPro · Enterprise Cloud Suite
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 4,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: FontSize.screenTitle,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7F1D1D',
    borderRadius: Radius.button,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.caption,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.body,
  },
  footer: {
    textAlign: 'center',
    color: Colors.border,
    fontSize: 11,
    marginTop: 32,
  },
});
