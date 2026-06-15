import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import axiosInstance from '../../api/axiosInstance';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function AddFollowUpScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { leadId } = route.params || {};

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatTime = (t: Date) => {
    return t.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await axiosInstance.post(`/leads/${leadId}/followup`, {
        date: date.toISOString().split('T')[0],
        time: formatTime(time),
        notes,
      });
      Toast.show({
        type: 'success',
        text1: 'Follow-up Scheduled ✅',
        text2: `Scheduled for ${formatDate(date)} at ${formatTime(time)}`,
        visibilityTime: 2000,
      });
      navigation.goBack();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed ❌',
        text2: 'Could not save follow-up, please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Schedule Follow-up</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 300 }]}>

        {/* Date Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>📅 Date</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={styles.pickerText}>{formatDate(date)}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {/* Time Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>⏰ Time</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time" size={20} color={colors.primary} />
            <Text style={styles.pickerText}>{formatTime(time)}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) setTime(selectedTime);
            }}
          />
        )}

        {/* Quick Time Buttons */}
        <Text style={styles.label}>⚡ Quick Select</Text>
        <View style={styles.quickRow}>
          {['9:00 AM', '11:00 AM', '2:00 PM', '5:00 PM', '7:00 PM'].map((t) => {
            const [hourMin, period] = t.split(' ');
            const [hour, min] = hourMin.split(':');
            const isSelected = formatTime(time) === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.quickBtn, isSelected && styles.quickBtnActive]}
                onPress={() => {
                  const newTime = new Date();
                  let h = parseInt(hour);
                  if (period === 'PM' && h !== 12) h += 12;
                  if (period === 'AM' && h === 12) h = 0;
                  newTime.setHours(h, parseInt(min), 0);
                  setTime(newTime);
                }}
              >
                <Text style={[
                  styles.quickBtnText,
                  isSelected && styles.quickBtnTextActive
                ]}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>📝 Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about this follow-up..."
            placeholderTextColor={colors.textLight}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 Summary</Text>
          <Text style={styles.summaryText}>
            📅 {formatDate(date)} at ⏰ {formatTime(time)}
          </Text>
          {notes ? (
            <Text style={styles.summaryNote}>📝 {notes}</Text>
          ) : null}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, isLoading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.white} />
          <Text style={styles.saveBtnText}>
            {isLoading ? 'Saving...' : 'Schedule Follow-up'}
          </Text>
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
  title: {
    fontSize: typography.lg, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  content: { padding: spacing.base, gap: spacing.md },
  inputGroup: { gap: spacing.xs },
  label: {
    fontSize: typography.sm, fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  pickerText: {
    flex: 1, fontSize: typography.base,
    color: colors.textPrimary, fontWeight: typography.medium,
  },
  quickRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  quickBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.white,
  },
  quickBtnActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  quickBtnText: { fontSize: typography.sm, color: colors.textSecondary },
  quickBtnTextActive: { color: colors.white, fontWeight: typography.semiBold },
  notesInput: {
    backgroundColor: colors.white, borderRadius: 12,
    padding: spacing.md, fontSize: typography.base,
    color: colors.textPrimary, borderWidth: 1,
    borderColor: colors.border, minHeight: 100,
  },
  summaryCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12, padding: spacing.md,
    gap: spacing.xs, borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  summaryTitle: {
    fontSize: typography.sm, fontWeight: typography.bold,
    color: colors.primary,
  },
  summaryText: {
    fontSize: typography.base, color: colors.textPrimary,
    fontWeight: typography.medium,
  },
  summaryNote: {
    fontSize: typography.sm, color: colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: colors.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    padding: spacing.base, borderRadius: 14,
    gap: spacing.sm, marginTop: spacing.sm,
  },
  saveBtnText: {
    color: colors.white, fontSize: typography.md,
    fontWeight: typography.bold,
  },
});