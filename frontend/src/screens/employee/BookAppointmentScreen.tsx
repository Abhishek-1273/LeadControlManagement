import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, Modal,
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

// ── helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;          // stored as YYYY-MM-DD
};

const displayDate = (d: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  };
  return d.toLocaleDateString('en-IN', options);
};

const formatTime = (d: Date) => {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const displayTime = (d: Date) => {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// ── Picker button ─────────────────────────────────────────────────────────────
function PickerButton({
  icon, label, value, placeholder, onPress,
}: {
  icon: string; label: string; value: string; placeholder: string; onPress: () => void;
}) {
  return (
    <View style={pickerStyles.group}>
      <Text style={pickerStyles.label}>{label}</Text>
      <TouchableOpacity style={pickerStyles.btn} onPress={onPress} activeOpacity={0.75}>
        <Ionicons name={icon as any} size={20} color={value ? colors.primary : colors.textSecondary} />
        <Text style={[pickerStyles.btnText, !value && { color: colors.textLight }]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: typography.sm, fontWeight: '600' as any, color: colors.text },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  btnText: { flex: 1, fontSize: typography.sm, color: colors.text, fontWeight: '500' as any },
});

// ── iOS modal wrapper (shows picker inside a bottom sheet) ────────────────────
function IOSPickerModal({
  visible, title, onDone, children,
}: {
  visible: boolean; title: string; onDone: () => void; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={iosStyles.overlay}>
        <View style={iosStyles.sheet}>
          <View style={iosStyles.header}>
            <Text style={iosStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onDone} style={iosStyles.doneBtn}>
              <Text style={iosStyles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const iosStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  title: { fontSize: 16, fontWeight: '600' as any, color: '#111' },
  doneBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#059669' + '15', borderRadius: 8 },
  doneText: { color: '#059669', fontWeight: '700' as any, fontSize: 15 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function BookAppointmentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { leadId, leadName, leadPhone } = route.params || {};

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Android shows inline; iOS needs modal
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  // Temp values while picker is open (iOS)
  const [tempDate, setTempDate] = useState<Date>(today);
  const [tempTime, setTempTime] = useState<Date>(today);

  const onDateChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (date) setSelectedDate(date);
    } else {
      if (date) setTempDate(date);
    }
  };

  const onTimeChange = (_: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (time) setSelectedTime(time);
    } else {
      if (time) setTempTime(time);
    }
  };

  const handleBook = async () => {
    if (!selectedDate) {
      Toast.show({ type: 'error', text1: 'Date required ❌', text2: 'Please select an appointment date' });
      return;
    }
    if (!selectedTime) {
      Toast.show({ type: 'error', text1: 'Time required ❌', text2: 'Please select an appointment time' });
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/leads/appointments', {
        leadId,
        appointmentDate: formatDate(selectedDate),
        appointmentTime: formatTime(selectedTime),
        description: description.trim(),
      });
      Toast.show({
        type: 'success',
        text1: '✅ Appointment Booked!',
        text2: `${leadName} — ${displayDate(selectedDate)} at ${displayTime(selectedTime)}`,
        visibilityTime: 3000,
      });
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not book appointment';
      Toast.show({ type: 'error', text1: 'Error ❌', text2: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* ── Lead Card ── */}
          <View style={styles.leadCard}>
            <View style={styles.leadAvatar}>
              <Text style={styles.avatarText}>{(leadName || 'L')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.leadName}>{leadName}</Text>
              <Text style={styles.leadPhone}>{leadPhone}</Text>
            </View>
            <View style={styles.bookedBadge}>
              <Text style={styles.bookedBadgeText}>Booked</Text>
            </View>
          </View>

          {/* ── Section title ── */}
          <Text style={styles.sectionTitle}>Appointment Details</Text>

          {/* ── Date picker button ── */}
          <PickerButton
            icon="calendar"
            label="Date *"
            value={selectedDate ? displayDate(selectedDate) : ''}
            placeholder="Select appointment date"
            onPress={() => {
              setTempDate(selectedDate ?? today);
              setShowDatePicker(true);
            }}
          />

          {/* Android inline date picker */}
          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={selectedDate ?? today}
              mode="date"
              minimumDate={today}
              onChange={onDateChange}
            />
          )}

          {/* iOS date picker in modal */}
          {Platform.OS === 'ios' && (
            <IOSPickerModal
              visible={showDatePicker}
              title="Select Date"
              onDone={() => { setSelectedDate(tempDate); setShowDatePicker(false); }}
            >
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                minimumDate={today}
                onChange={onDateChange}
                style={{ height: 200 }}
              />
            </IOSPickerModal>
          )}

          {/* ── Time picker button ── */}
          <PickerButton
            icon="time"
            label="Time *"
            value={selectedTime ? displayTime(selectedTime) : ''}
            placeholder="Select appointment time"
            onPress={() => {
              setTempTime(selectedTime ?? today);
              setShowTimePicker(true);
            }}
          />

          {/* Android inline time picker */}
          {Platform.OS === 'android' && showTimePicker && (
            <DateTimePicker
              value={selectedTime ?? today}
              mode="time"
              is24Hour={false}
              onChange={onTimeChange}
            />
          )}

          {/* iOS time picker in modal */}
          {Platform.OS === 'ios' && (
            <IOSPickerModal
              visible={showTimePicker}
              title="Select Time"
              onDone={() => { setSelectedTime(tempTime); setShowTimePicker(false); }}
            >
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                is24Hour={false}
                onChange={onTimeChange}
                style={{ height: 200 }}
              />
            </IOSPickerModal>
          )}

          {/* ── Summary chip (shows after both selected) ── */}
          {selectedDate && selectedTime && (
            <View style={styles.summaryChip}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.summaryText}>
                {displayDate(selectedDate)}  •  {displayTime(selectedTime)}
              </Text>
            </View>
          )}

          {/* ── Description ── */}
          <View style={{ gap: 6 }}>
            <Text style={pickerStyles.label}>Description / Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Add office address, required documents, meeting instructions..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.textLight}
            />
          </View>

          {/* ── Info box ── */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>
              Booking this appointment will set the lead status to{' '}
              <Text style={{ fontWeight: '700' }}>Booked</Text> and it will appear in Admin's Appointments section.
            </Text>
          </View>

          {/* ── Submit ── */}
          <TouchableOpacity
            style={[styles.bookBtn, loading && { opacity: 0.65 }]}
            onPress={handleBook}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.bookBtnText}>{loading ? 'Booking...' : 'Confirm Appointment'}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: typography.lg, fontWeight: '700' as any, color: colors.text },

  content: { padding: spacing.md, gap: 16, paddingBottom: 40 },

  leadCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  leadAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#05966920', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800' as any, color: '#059669' },
  leadName: { fontSize: typography.md, fontWeight: '700' as any, color: colors.text },
  leadPhone: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  bookedBadge: {
    backgroundColor: '#05966918', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  bookedBadgeText: { fontSize: typography.xs, color: '#059669', fontWeight: '700' as any },

  sectionTitle: {
    fontSize: typography.md, fontWeight: '700' as any, color: colors.text, marginTop: 4,
  },

  summaryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#05966912', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#05966930',
  },
  summaryText: { fontSize: typography.sm, fontWeight: '600' as any, color: '#059669' },

  textArea: {
    backgroundColor: colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.border,
    padding: 14, fontSize: typography.sm, color: colors.text, minHeight: 110,
  },

  infoBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: colors.primary + '10', borderRadius: 12, padding: 12,
  },
  infoText: { flex: 1, fontSize: typography.xs, color: colors.text, lineHeight: 18 },

  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#059669', borderRadius: 16, paddingVertical: 17, marginTop: 4,
    elevation: 3,
    shadowColor: '#059669', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  bookBtnText: { color: '#fff', fontSize: typography.md, fontWeight: '700' as any },
});
