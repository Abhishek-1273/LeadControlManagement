import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import axiosInstance from '../../api/axiosInstance';
import { endpoints } from '../../api/endpoints';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
}

const PasswordField = ({
  label, value, onChange, placeholder, visible, onToggle,
}: FieldProps) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrap}>
      <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        secureTextEntry={!visible}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  </View>
);

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!current || !next || !confirm) {
      Toast.show({ type: 'error', text1: 'All fields are required' });
      return;
    }
    if (next.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Weak password',
        text2: 'New password must be at least 6 characters',
      });
      return;
    }
    if (next !== confirm) {
      Toast.show({
        type: 'error',
        text1: 'Passwords do not match',
        text2: 'New password and confirm password must match',
      });
      return;
    }
    setIsLoading(true);
    try {
      await axiosInstance.patch(endpoints.changePassword, {
        currentPassword: current,
        newPassword: next,
      });
      Toast.show({
        type: 'success',
        text1: 'Password changed',
        text2: 'Your password has been updated',
        visibilityTime: 2000,
      });
      navigation.goBack();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Change failed',
        text2: err?.response?.data?.message || 'Could not change password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: 350 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        
      >
        <View style={styles.iconBanner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.bannerText}>
            Choose a strong password you don&apos;t use elsewhere.
          </Text>
        </View>

        <View style={styles.card}>
          <PasswordField
            label="Current Password"
            value={current}
            onChange={setCurrent}
            placeholder="Enter current password"
            visible={showCurrent}
            onToggle={() => setShowCurrent((s) => !s)}
          />
          <PasswordField
            label="New Password"
            value={next}
            onChange={setNext}
            placeholder="Enter new password"
            visible={showNext}
            onToggle={() => setShowNext((s) => !s)}
          />
          <PasswordField
            label="Confirm New Password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Re-enter new password"
            visible={showConfirm}
            onToggle={() => setShowConfirm((s) => !s)}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, isLoading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    backgroundColor: colors.white, borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40, height: 40, justifyContent: 'center',
    alignItems: 'center', backgroundColor: colors.background,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: typography.lg, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  content: { padding: spacing.base, gap: spacing.lg },
  iconBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.primaryLight, borderRadius: 14,
    padding: spacing.base,
  },
  bannerIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
  },
  bannerText: {
    flex: 1, fontSize: typography.sm, color: colors.primaryDark,
    lineHeight: 19,
  },
  card: {
    backgroundColor: colors.white, borderRadius: 16,
    padding: spacing.base, gap: spacing.base,
  },
  fieldGroup: { gap: spacing.xs },
  label: {
    fontSize: typography.sm, fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  input: { flex: 1, fontSize: typography.base, color: colors.textPrimary },
  saveBtn: {
    backgroundColor: colors.primary, paddingVertical: spacing.base,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: {
    color: colors.white, fontSize: typography.md, fontWeight: typography.bold,
  },
});
