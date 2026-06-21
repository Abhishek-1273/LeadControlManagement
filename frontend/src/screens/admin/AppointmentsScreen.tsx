import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, Linking, TextInput,
  KeyboardAvoidingView, Platform, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAdminStore } from '../../store/adminStore';
import { Appointment } from '../../types/lead.types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

// Builds a Date from the appointment's date/time strings using LOCAL
// calendar-field construction (new Date(y, m, d, h, min)) — this is the
// timezone-safe pattern already established elsewhere in this codebase
// (see dateRange.js). It deliberately avoids `new Date(isoString)` /
// `toISOString().split('T')[0]`-style parsing, which interprets the
// string as UTC and can shift the date across a day boundary depending
// on the device's offset from UTC.
function appointmentDateTime(appt: Appointment): Date {
  const [y, m, d] = appt.appointmentDate.split('-').map(Number);
  const [h, min] = appt.appointmentTime.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, h || 0, min || 0, 0, 0);
}

// "Overdue" is a derived UI state, not a DB field: a scheduled appointment
// whose date/time has passed shows as overdue/missed in the list without
// requiring the admin to do anything, but nothing is auto-written to the
// server. Completed/missed appointments (admin-set) are never "overdue".
function isOverdue(appt: Appointment): boolean {
  if (appt.status !== 'scheduled') return false;
  return appointmentDateTime(appt).getTime() < Date.now();
}

// ─── WhatsApp Message Modal ───────────────────────────────────────────────────
function WhatsAppModal({
  visible,
  appointment,
  onClose,
}: {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const defaultMessage = appointment
    ? `Hello ${appointment.lead.name},\n\nYour appointment has been scheduled for ${appointment.appointmentDate} at ${appointment.appointmentTime}.\n\n${appointment.description ? appointment.description + '\n\n' : ''}Thank you!`
    : '';

  const [message, setMessage] = useState(defaultMessage);

  React.useEffect(() => {
    if (appointment) {
      setMessage(
        `Hello ${appointment.lead.name},\n\nYour appointment has been scheduled for ${appointment.appointmentDate} at ${appointment.appointmentTime}.\n\n${appointment.description ? appointment.description + '\n\n' : ''}Thank you!`
      );
    }
  }, [appointment]);

  const handleSend = () => {
    if (!appointment) return;
    const phone = appointment.lead.phone;
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/91${phone}?text=${encoded}`;
    Linking.openURL(url).catch(() => {
      Toast.show({ type: 'error', text1: 'Could not open WhatsApp' });
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.whatsappModal}>
          <View style={styles.modalHeader}>
            <View style={styles.waIconWrap}>
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            </View>
            <Text style={styles.modalTitle}>Send WhatsApp Message</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {appointment && (
            <View style={styles.recipientRow}>
              <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.recipientText}>
                {appointment.lead.name}  •  {appointment.lead.phone}
              </Text>
            </View>
          )}

          <TextInput
            style={styles.waTextInput}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={10}
            placeholder="Type your message here..."
            textAlignVertical="top"
          />

          <View style={styles.waActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.sendBtnText}>Open WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────
function StatusBadge({ appt }: { appt: Appointment }) {
  if (appt.status === 'completed') {
    return (
      <View style={[styles.miniBadge, { backgroundColor: '#059669' + '18' }]}>
        <Ionicons name="checkmark-circle" size={13} color="#059669" />
        <Text style={[styles.miniBadgeText, { color: '#059669' }]}>Done</Text>
      </View>
    );
  }
  if (appt.status === 'missed' || isOverdue(appt)) {
    return (
      <View style={[styles.miniBadge, { backgroundColor: '#DC2626' + '18' }]}>
        <Ionicons name="alert-circle" size={13} color="#DC2626" />
        <Text style={[styles.miniBadgeText, { color: '#DC2626' }]}>Missed</Text>
      </View>
    );
  }
  return (
    <View style={[styles.miniBadge, { backgroundColor: colors.primary + '18' }]}>
      <Ionicons name="time" size={13} color={colors.primary} />
      <Text style={[styles.miniBadgeText, { color: colors.primary }]}>Upcoming</Text>
    </View>
  );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────
function AppointmentCard({
  item,
  onWhatsApp,
  onToggleComplete,
}: {
  item: Appointment;
  onWhatsApp: (a: Appointment) => void;
  onToggleComplete: (a: Appointment) => void;
}) {
  const overdue = isOverdue(item);
  const completed = item.status === 'completed';

  return (
    <View style={[styles.card, completed && styles.cardCompleted]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.avatarCircle, completed && { opacity: 0.5 }]}>
          <Text style={styles.avatarText}>{item.lead.name[0].toUpperCase()}</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={[styles.leadName, completed && styles.textMuted]}>{item.lead.name}</Text>
          <Text style={[styles.leadPhone, completed && styles.textMuted]}>{item.lead.phone}</Text>
        </View>
        <StatusBadge appt={item} />
      </View>

      {/* Details */}
      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
        <Text style={[styles.detailText, completed && styles.textMuted]}>{item.appointmentDate}</Text>
        <Ionicons name="time-outline" size={15} color={colors.textSecondary} style={{ marginLeft: spacing.md }} />
        <Text style={[styles.detailText, completed && styles.textMuted, overdue && !completed && styles.overdueText]}>
          {item.appointmentTime}
        </Text>
      </View>

      {item.lead.assignedTo && (
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={15} color={colors.textSecondary} />
          <Text style={[styles.detailText, completed && styles.textMuted]}>Employee: {item.lead.assignedTo.name}</Text>
        </View>
      )}

      {item.description ? (
        <View style={styles.descBox}>
          <Text style={styles.descText}>{item.description}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.waBtn} onPress={() => onWhatsApp(item)}>
          <Ionicons name="logo-whatsapp" size={16} color="#fff" />
          <Text style={styles.waBtnText}>Send on WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.checkBtn, completed && styles.checkBtnDone]}
          onPress={() => onToggleComplete(item)}
        >
          <Ionicons
            name={completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={22}
            color={completed ? '#059669' : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { appointments, fetchAppointments, setAppointmentStatus, isLoading } = useAdminStore();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [waModalVisible, setWaModalVisible] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };


  const handleWhatsApp = (appt: Appointment) => {
    setSelectedAppt(appt);
    setWaModalVisible(true);
  };

  const handleToggleComplete = (appt: Appointment) => {
    const nextStatus = appt.status === 'completed' ? 'scheduled' : 'completed';
    setAppointmentStatus(appt._id, nextStatus).catch(() => {
      Toast.show({ type: 'error', text1: 'Could not update appointment' });
    });
  };

  const byTab = appointments.filter((a) =>
    tab === 'completed' ? a.status === 'completed' : a.status !== 'completed'
  );

  const filtered = byTab.filter((a) => {
    // Defensive guard: an appointment whose lead was deleted would have
    // a.lead === null, which crashes every .lead.* access below (and in
    // AppointmentCard). The backend now filters these out, but this stays
    // as a safety net for any appointment fetched before that fix deploys.
    if (!a.lead) return false;
    const q = search.toLowerCase();
    return (
      a.lead.name.toLowerCase().includes(q) ||
      a.lead.phone.includes(q) ||
      a.appointmentDate.includes(q)
    );
  });

  // Upcoming tab: overdue-but-unmarked first, then chronological (list is
  // already sorted by date/time from the API for the rest).
  const sorted = tab === 'upcoming'
    ? [...filtered].sort((a, b) => (isOverdue(b) ? 1 : 0) - (isOverdue(a) ? 1 : 0))
    : filtered;

  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const upcomingCount = appointments.length - completedCount;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📅 Appointments</Text>
          <Text style={styles.headerSub}>{appointments.length} total</Text>
        </View>
        <TouchableOpacity
          style={styles.scheduleBtn}
          onPress={() => navigation.navigate('AdminSchedule')}
        >
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={styles.scheduleBtnText}>My Schedule</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'upcoming' && styles.tabBtnActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabBtnText, tab === 'upcoming' && styles.tabBtnTextActive]}>
            Upcoming ({upcomingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'completed' && styles.tabBtnActive]}
          onPress={() => setTab('completed')}
        >
          <Text style={[styles.tabBtnText, tab === 'completed' && styles.tabBtnTextActive]}>
            Completed ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, date..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.textLight}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <AppointmentCard
            item={item}
            onWhatsApp={handleWhatsApp}
            onToggleComplete={handleToggleComplete}
          />
        )}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={56} color={colors.textLight} />
            <Text style={styles.emptyTitle}>
              {tab === 'completed' ? 'No Completed Appointments' : 'No Appointments'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tab === 'completed'
                ? 'Appointments you mark as done will show up here.'
                : 'Appointments appear here when employees mark leads as Booked.'}
            </Text>
          </View>
        }
      />

      <WhatsAppModal
        visible={waModalVisible}
        appointment={selectedAppt}
        onClose={() => setWaModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F8F9FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: typography.lg, fontWeight: typography.bold as any, color: colors.textPrimary },
  headerSub: { fontSize: typography.sm, color: colors.textSecondary },
  scheduleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10,
  },
  scheduleBtnText: { fontSize: typography.xs, fontWeight: typography.semiBold as any, color: colors.primary },

  tabRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
    backgroundColor: colors.white,
  },
  tabBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  tabBtnActive: { backgroundColor: colors.primary },
  tabBtnText: { fontSize: typography.sm, fontWeight: typography.semiBold as any, color: colors.textSecondary },
  tabBtnTextActive: { color: '#fff' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: spacing.md, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.white, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: typography.sm, color: colors.textPrimary },

  card: {
    backgroundColor: colors.white, borderRadius: 14, padding: spacing.md,
    marginBottom: spacing.sm, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardCompleted: { opacity: 0.7, backgroundColor: '#FAFAFA' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: { fontSize: typography.md, fontWeight: typography.bold as any, color: colors.primary },
  cardHeaderInfo: { flex: 1 },
  leadName: { fontSize: typography.md, fontWeight: typography.semiBold as any, color: colors.textPrimary },
  leadPhone: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  textMuted: { color: colors.textLight },
  miniBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  miniBadgeText: { fontSize: typography.xs, fontWeight: typography.semiBold as any },

  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailText: { fontSize: typography.sm, color: colors.textSecondary },
  overdueText: { color: '#DC2626', fontWeight: typography.semiBold as any },

  descBox: {
    backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, marginTop: spacing.xs,
  },
  descText: { fontSize: typography.sm, color: colors.textPrimary },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  waBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#25D366', borderRadius: 10, paddingVertical: 10,
  },
  waBtnText: { color: '#fff', fontSize: typography.sm, fontWeight: typography.semiBold as any },
  checkBtn: {
    width: 42, height: 42, borderRadius: 10, borderWidth: 1,
    borderColor: colors.border, justifyContent: 'center', alignItems: 'center',
  },
  checkBtnDone: { borderColor: '#059669' + '60', backgroundColor: '#059669' + '10' },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: typography.lg, fontWeight: typography.bold as any, color: colors.textPrimary },
  emptySubtitle: { fontSize: typography.sm, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },

  // WhatsApp Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  whatsappModal: {
    backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.md, paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  waIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#25D366' + '20', justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { flex: 1, fontSize: typography.md, fontWeight: typography.bold as any, color: colors.textPrimary },

  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  recipientText: { fontSize: typography.sm, color: colors.textSecondary },

  waTextInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: 12, minHeight: 160, fontSize: typography.sm, color: colors.textPrimary,
    backgroundColor: '#F9FAFB', marginBottom: spacing.md,
  },
  waActions: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingVertical: 12, alignItems: 'center',
  },
  cancelBtnText: { fontSize: typography.sm, color: colors.textSecondary },
  sendBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 12,
  },
  sendBtnText: { color: '#fff', fontSize: typography.sm, fontWeight: typography.bold as any },
});