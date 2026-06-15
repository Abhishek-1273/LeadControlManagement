import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAdminStore } from '../../store/adminStore';
import { useNotificationStore } from '../../store/notificationStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const TYPES: { key: 'info' | 'success' | 'warning' | 'alert'; label: string; icon: any; color: string }[] = [
  { key: 'info', label: 'Info', icon: 'information-circle', color: colors.statusNew },
  { key: 'success', label: 'Success', icon: 'checkmark-circle', color: colors.success },
  { key: 'warning', label: 'Warning', icon: 'warning', color: colors.warning },
  { key: 'alert', label: 'Alert', icon: 'alert-circle', color: colors.error },
];

export default function SendNotificationScreen() {
  const navigation = useNavigation<any>();
  const { employees, fetchEmployees } = useAdminStore();
  const { sendNotification } = useNotificationStore();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'alert'>('info');
  const [target, setTarget] = useState<string>('all'); // 'all' or employee _id
  const [search, setSearch] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing fields',
        text2: 'Title and message are required',
      });
      return;
    }
    setIsSending(true);
    try {
      const { count } = await sendNotification({
        title: title.trim(),
        message: message.trim(),
        type,
        target,
      });
      Toast.show({
        type: 'success',
        text1: 'Notification sent',
        text2:
          target === 'all'
            ? `Delivered to ${count} user(s)`
            : 'Delivered successfully',
        visibilityTime: 2000,
      });
      navigation.goBack();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Send failed',
        text2: err?.response?.data?.message || 'Could not send notification',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Notification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Title *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. New policy update"
              placeholderTextColor={colors.textLight}
              maxLength={80}
            />
          </View>
        </View>

        {/* Message */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Message *</Text>
          <View style={[styles.inputWrap, styles.textareaWrap]}>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Write your message..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>
        </View>

        {/* Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {TYPES.map((t) => {
              const active = type === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeChip,
                    active && { backgroundColor: t.color + '15', borderColor: t.color },
                  ]}
                  onPress={() => setType(t.key)}
                >
                  <Ionicons
                    name={t.icon}
                    size={16}
                    color={active ? t.color : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      active && { color: t.color, fontWeight: typography.bold },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recipient */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Send To</Text>

          {/* All users option */}
          <TouchableOpacity
            style={[styles.recipientRow, target === 'all' && styles.recipientActive]}
            onPress={() => setTarget('all')}
          >
            <View style={[styles.recipientAvatar, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="megaphone-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recipientName}>All Users</Text>
              <Text style={styles.recipientSub}>Broadcast to every employee</Text>
            </View>
            <Ionicons
              name={target === 'all' ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={target === 'all' ? colors.primary : colors.textLight}
            />
          </TouchableOpacity>

          {/* Search employees */}
          <View style={[styles.inputWrap, { marginTop: spacing.sm }]}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={search}
              onChangeText={setSearch}
              placeholder="Search employee..."
              placeholderTextColor={colors.textLight}
            />
          </View>

          {/* Employee list */}
          <View style={styles.empList}>
            {filteredEmployees.map((emp) => {
              const active = target === emp._id;
              return (
                <TouchableOpacity
                  key={emp._id}
                  style={[styles.recipientRow, active && styles.recipientActive]}
                  onPress={() => setTarget(emp._id)}
                >
                  <View style={styles.recipientAvatar}>
                    <Text style={styles.recipientAvatarText}>
                      {emp.name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recipientName} numberOfLines={1}>
                      {emp.name}
                    </Text>
                    <Text style={styles.recipientSub} numberOfLines={1}>
                      {emp.email}
                    </Text>
                  </View>
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={active ? colors.primary : colors.textLight}
                  />
                </TouchableOpacity>
              );
            })}
            {filteredEmployees.length === 0 && (
              <Text style={styles.noEmp}>No employees found</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Send button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.sendBtn, isSending && { opacity: 0.6 }]}
          onPress={handleSend}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={18} color={colors.white} />
              <Text style={styles.sendBtnText}>Send Notification</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  content: { padding: spacing.base, gap: spacing.lg, paddingBottom: spacing.xxl },
  fieldGroup: { gap: spacing.sm },
  label: {
    fontSize: typography.sm, fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  textareaWrap: { alignItems: 'flex-start', paddingVertical: spacing.md },
  input: { flex: 1, fontSize: typography.base, color: colors.textPrimary },
  textarea: { height: 90, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.white,
  },
  typeChipText: {
    fontSize: typography.sm, color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  recipientRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white, borderRadius: 12,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  recipientActive: {
    borderColor: colors.primary, backgroundColor: colors.primaryLight,
  },
  recipientAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  recipientAvatarText: {
    fontSize: typography.base, fontWeight: typography.bold,
    color: colors.primary,
  },
  recipientName: {
    fontSize: typography.base, fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  recipientSub: { fontSize: typography.xs, color: colors.textSecondary },
  empList: { gap: spacing.sm, marginTop: spacing.sm },
  noEmp: {
    fontSize: typography.sm, color: colors.textLight,
    textAlign: 'center', padding: spacing.base,
  },
  footer: {
    padding: spacing.base, backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    paddingVertical: spacing.base, borderRadius: 14,
  },
  sendBtnText: {
    color: colors.white, fontSize: typography.md, fontWeight: typography.bold,
  },
});
