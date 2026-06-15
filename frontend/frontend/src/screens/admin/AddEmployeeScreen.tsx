import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAdminStore } from '../../store/adminStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const Field = ({ label, value, onChange, placeholder,
  keyboard, icon, secure, toggleSecure, showPassword, setShowPassword }: any) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.fieldContainer}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        keyboardType={keyboard || 'default'}
        autoCapitalize="none"
        secureTextEntry={secure && !showPassword}
      />
      {toggleSecure && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={18} color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function AddEmployeeScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { isEdit, employee } = route.params || {};
  const { addEmployee, updateEmployee } = useAdminStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEdit && employee) {
      setName(employee.name || '');
      setEmail(employee.email || '');
      setPhone(employee.phone || '');
    }
  }, [isEdit, employee]);

  const handleSave = async () => {
    if (!name || !email) {
      Toast.show({
        type: 'error',
        text1: 'Required Fields ❌',
        text2: 'Name and email are required',
      });
      return;
    }
    setIsLoading(true);
    try {
      if (isEdit) {
        await updateEmployee(employee._id, { name, email, phone });
        Toast.show({
          type: 'success',
          text1: 'Employee Updated ✅',
          text2: `${name} updated successfully`,
        });
      } else {
        await addEmployee({ name, email, phone, password });
        Toast.show({
          type: 'success',
          text1: 'Employee Added ✅',
          text2: `${name} added successfully`,
        });
      }
      navigation.goBack();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed ❌',
        text2: err.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEdit ? 'Edit Employee' : 'Add Employee'}
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, isLoading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveBtnText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 300 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Employee Information</Text>

            <Field
              label="Full Name *"
              value={name}
              onChange={setName}
              placeholder="Enter full name"
              icon="person-outline"
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
            <Field
              label="Email *"
              value={email}
              onChange={setEmail}
              placeholder="Enter email address"
              keyboard="email-address"
              icon="mail-outline"
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
            <Field
              label="Phone"
              value={phone}
              onChange={setPhone}
              placeholder="Enter phone number"
              keyboard="phone-pad"
              icon="call-outline"
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
            {!isEdit && (
              <Field
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Default: employee123"
                icon="lock-closed-outline"
                secure
                toggleSecure
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
            )}
          </View>

          {!isEdit && (
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20}
                color={colors.primary} />
              <Text style={styles.infoText}>
                Employee will login with email and password.
                Default password is "employee123" if not set.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  title: {
    fontSize: typography.lg, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: 10,
  },
  saveBtnText: {
    color: colors.white, fontWeight: typography.bold,
    fontSize: typography.sm,
  },
  content: { padding: spacing.base, gap: spacing.md },
  section: {
    backgroundColor: colors.white, borderRadius: 16,
    padding: spacing.base, gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.md, fontWeight: typography.bold,
    color: colors.textPrimary, marginBottom: spacing.xs,
  },
  fieldGroup: { gap: spacing.xs },
  label: {
    fontSize: typography.sm, fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  fieldContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  input: { flex: 1, fontSize: typography.base, color: colors.textPrimary },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: spacing.sm, backgroundColor: colors.primaryLight,
    padding: spacing.md, borderRadius: 12,
  },
  infoText: {
    flex: 1, fontSize: typography.sm,
    color: colors.textSecondary, lineHeight: 20,
  },
});