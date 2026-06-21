import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useScheduleStore, DaySchedule } from '../../store/scheduleStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// ─── Time text field ────────────────────────────────────────────────────────
function TimeField({
  label, value, onChange, error,
}: {
  label: string; value: string; onChange: (v: string) => void; error?: boolean;
}) {
  return (
    <View style={styles.timeFieldWrap}>
      <Text style={styles.timeFieldLabel}>{label}</Text>
      <TextInput
        style={[styles.timeInput, error && styles.timeInputError]}
        value={value}
        onChangeText={onChange}
        placeholder="HH:MM"
        placeholderTextColor={colors.textLight}
        maxLength={5}
        keyboardType="numbers-and-punctuation"
      />
    </View>
  );
}

// ─── Day Card ───────────────────────────────────────────────────────────────
function DayCard({
  day, onChange,
}: {
  day: DaySchedule; onChange: (updated: DaySchedule) => void;
}) {
  const errors = {
    startTime: day.isWorking && !TIME_RE.test(day.startTime),
    endTime: day.isWorking && !TIME_RE.test(day.endTime),
    range: day.isWorking && TIME_RE.test(day.startTime) && TIME_RE.test(day.endTime)
      && toMinutes(day.startTime) >= toMinutes(day.endTime),
    breakStart: day.isWorking && !!day.breakStart && !TIME_RE.test(day.breakStart),
    breakEnd: day.isWorking && !!day.breakEnd && !TIME_RE.test(day.breakEnd),
    breakRange: day.isWorking && !!day.breakStart && !!day.breakEnd
      && TIME_RE.test(day.breakStart) && TIME_RE.test(day.breakEnd)
      && toMinutes(day.breakStart) >= toMinutes(day.breakEnd),
    breakOutOfRange: day.isWorking && !!day.breakStart && !!day.breakEnd
      && TIME_RE.test(day.breakStart) && TIME_RE.test(day.breakEnd)
      && TIME_RE.test(day.startTime) && TIME_RE.test(day.endTime)
      && toMinutes(day.breakStart) < toMinutes(day.breakEnd)
      && (toMinutes(day.breakStart) < toMinutes(day.startTime) || toMinutes(day.breakEnd) > toMinutes(day.endTime)),
  };

  return (
    <View style={[styles.dayCard, day.isWorking && styles.dayCardActive]}>
      <View style={styles.dayHeader}>
        <View>
          <Text style={styles.dayName}>{DAY_LABELS[day.dayOfWeek]}</Text>
          <Text style={styles.dayStatus}>{day.isWorking ? 'Working day' : 'Day off'}</Text>
        </View>
        <Switch
          value={day.isWorking}
          onValueChange={(v) => onChange({ ...day, isWorking: v })}
          trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
          thumbColor={day.isWorking ? colors.primary : '#fff'}
        />
      </View>

      {day.isWorking && (
        <View style={styles.dayBody}>
          <Text style={styles.sectionLabel}>Working hours</Text>
          <View style={styles.timeRow}>
            <TimeField
              label="Start"
              value={day.startTime}
              onChange={(v) => onChange({ ...day, startTime: v })}
              error={errors.startTime || errors.range}
            />
            <TimeField
              label="End"
              value={day.endTime}
              onChange={(v) => onChange({ ...day, endTime: v })}
              error={errors.endTime || errors.range}
            />
          </View>
          {errors.range && <Text style={styles.errorText}>Start must be before end</Text>}

          <Text style={styles.sectionLabel}>Break (optional)</Text>
          <View style={styles.timeRow}>
            <TimeField
              label="Break start"
              value={day.breakStart}
              onChange={(v) => onChange({ ...day, breakStart: v })}
              error={errors.breakStart || errors.breakRange || errors.breakOutOfRange}
            />
            <TimeField
              label="Break end"
              value={day.breakEnd}
              onChange={(v) => onChange({ ...day, breakEnd: v })}
              error={errors.breakEnd || errors.breakRange || errors.breakOutOfRange}
            />
          </View>
          {errors.breakRange && <Text style={styles.errorText}>Break start must be before break end</Text>}
          {errors.breakOutOfRange && <Text style={styles.errorText}>Break must fall within working hours</Text>}

          <Text style={styles.sectionLabel}>Slot duration (minutes)</Text>
          <View style={styles.slotChipRow}>
            {[15, 20, 30, 45, 60].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[styles.slotChip, day.slotDuration === mins && styles.slotChipActive]}
                onPress={() => onChange({ ...day, slotDuration: mins })}
              >
                <Text style={[styles.slotChipText, day.slotDuration === mins && styles.slotChipTextActive]}>
                  {mins}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminScheduleScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { days: storedDays, fetchSchedule, updateSchedule, isLoading } = useScheduleStore();

  const [days, setDays] = useState<DaySchedule[]>(storedDays);
  const [saving, setSaving] = useState(false);
  // True only while the screen's own fetchSchedule() call (below) is in
  // flight. Used to gate the storedDays -> days sync so that a refetch
  // triggered by something else (e.g. focus re-fire) never overwrites
  // edits the admin has already started making on this screen.
  const [hydrating, setHydrating] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setHydrating(true);
      fetchSchedule().finally(() => setHydrating(false));
    }, [])
  );

  useEffect(() => {
    // BUG FIX: this used to run on every `storedDays` change with no
    // guard, which raced with the admin's in-progress edits — if they
    // toggled a day while the focus-triggered fetchSchedule() was still
    // resolving, the fetch result would land afterward and silently wipe
    // their just-made changes back to whatever the server had (often all
    // days off, on first-ever load). Now this only seeds local state
    // immediately after OUR OWN fetch completes, never mid-edit.
    if (hydrating) {
      setDays(storedDays);
    }
  }, [storedDays, hydrating]);

  const updateDay = (index: number, updated: DaySchedule) => {
    setDays((prev) => prev.map((d, i) => (i === index ? updated : d)));
  };

  const hasErrors = days.some((day) => {
    if (!day.isWorking) return false;
    if (!TIME_RE.test(day.startTime) || !TIME_RE.test(day.endTime)) return true;
    if (toMinutes(day.startTime) >= toMinutes(day.endTime)) return true;
    if (day.breakStart || day.breakEnd) {
      if (!TIME_RE.test(day.breakStart) || !TIME_RE.test(day.breakEnd)) return true;
      if (toMinutes(day.breakStart) >= toMinutes(day.breakEnd)) return true;
      // Must match server-side validateDay() in schedule.controller.js —
      // break has to fall within the working hours window, otherwise the
      // PUT silently passes client validation but gets 400'd by the server.
      if (toMinutes(day.breakStart) < toMinutes(day.startTime) || toMinutes(day.breakEnd) > toMinutes(day.endTime)) {
        return true;
      }
    }
    return false;
  });

  const handleSave = async () => {
    if (hasErrors) {
      Toast.show({ type: 'error', text1: 'Fix errors first ❌', text2: 'Check highlighted time fields' });
      return;
    }
    setSaving(true);
    try {
      await updateSchedule(days);
      Toast.show({
        type: 'success',
        text1: 'Schedule Saved ✅',
        text2: 'Employees will see your updated availability',
        visibilityTime: 2500,
      });
      navigation.goBack();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not save ❌',
        text2: err.response?.data?.message || 'Please try again',
      });
    } finally {
      setSaving(false);
    }
  };

  const workingDaysCount = days.filter((d) => d.isWorking).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>My Schedule</Text>
            <Text style={styles.subtitle}>{workingDaysCount} working days · employees see this</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                Set the days and hours you're available. Employees will see this when booking
                appointments — already-booked slots are automatically blocked.
              </Text>
            </View>

            {days.map((day, index) => (
              <DayCard
                key={day.dayOfWeek}
                day={day}
                onChange={(updated) => updateDay(index, updated)}
              />
            ))}
          </ScrollView>
        )}

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TouchableOpacity
            style={[styles.saveBtn, (saving || hasErrors) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving || hasErrors}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save Schedule</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center',
    elevation: 1, borderWidth: 1, borderColor: colors.borderLight,
  },
  headerText: { flex: 1 },
  title: { fontSize: typography.xl, fontWeight: typography.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 1 },

  content: { paddingHorizontal: spacing.base, gap: spacing.sm },

  infoBox: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.primaryLight, borderRadius: 12, padding: spacing.md,
    marginBottom: spacing.sm,
  },
  infoText: { flex: 1, fontSize: typography.xs, color: colors.textPrimary, lineHeight: 17 },

  dayCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: spacing.md,
    borderWidth: 1, borderColor: colors.borderLight,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  dayCardActive: { borderColor: colors.primary, borderWidth: 1.5 },

  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { fontSize: typography.base, fontWeight: typography.semiBold, color: colors.textPrimary },
  dayStatus: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 1 },

  dayBody: { marginTop: spacing.md, gap: spacing.sm },
  sectionLabel: {
    fontSize: typography.xs, fontWeight: typography.semiBold,
    color: colors.textSecondary, marginTop: spacing.xs,
  },

  timeRow: { flexDirection: 'row', gap: spacing.sm },
  timeFieldWrap: { flex: 1, gap: 4 },
  timeFieldLabel: { fontSize: typography.xs, color: colors.textLight },
  timeInput: {
    backgroundColor: colors.background, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    fontSize: typography.base, color: colors.textPrimary,
    textAlign: 'center',
  },
  timeInputError: { borderColor: colors.error, backgroundColor: '#FFF5F5' },
  errorText: { fontSize: typography.xs, color: colors.error, marginTop: -4 },

  slotChipRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  slotChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.white,
  },
  slotChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotChipText: { fontSize: typography.sm, color: colors.textSecondary },
  slotChipTextActive: { color: colors.white, fontWeight: typography.semiBold },

  footer: {
    paddingHorizontal: spacing.base, paddingTop: spacing.sm,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: typography.base, fontWeight: typography.bold },
});