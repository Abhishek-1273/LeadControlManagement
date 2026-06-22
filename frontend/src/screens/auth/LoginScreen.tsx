import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();


  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Fields Required ❌',
        text2: 'Add your email and password',
      });
      return;
    }
    

    setIsLoading(true);
    try {
      await login(email, password);
      Toast.show({
        type: 'success',
        text1: 'Welcome! 👋',
        text2: 'Login successful',
        visibilityTime: 1500,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Login failed. Try again.';
      Toast.show({
        type: 'error',
        text1: 'Login Failed ❌',
        text2: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>LM</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            style={styles.input}
            left={<TextInput.Icon icon="email" color={colors.textSecondary} />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            style={styles.input}
            left={<TextInput.Icon icon="lock" color={colors.textSecondary} />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
                color={colors.textSecondary}
              />
            }
          />

          <TouchableOpacity
            style={[styles.loginButton,
            isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    flexGrow: 1, padding: spacing.base, justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.base,
  },
  logoText: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
  },
  title: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: { fontSize: typography.base, color: colors.textSecondary },
  form: { gap: spacing.md },
  input: { backgroundColor: colors.white },

  loginButton: {
    backgroundColor: colors.primary,
    padding: spacing.base,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: {
    color: colors.white,
    fontSize: typography.md,
    fontWeight: typography.bold,
  },
});