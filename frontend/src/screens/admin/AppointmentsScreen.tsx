import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, Linking, TextInput,
  KeyboardAvoidingView, Platform, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, Clock, User } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAdminStore } from '../../store/adminStore';
import { Appointment } from '../../types/lead.types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

function appointmentDateTime(appt: Appointment): Date {
  const [y, m, d] = appt.appointmentDate.split('-').map(Number);
  const [h, min] = appt.appointmentTime.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, h || 0, min || 0, 0, 0);
}

function isOverdue(appt: Appointment): boolean {
  if (appt.status !== 'scheduled') return false;
  return appointmentDateTime(appt).getTime() < Date.now();
}

function WhatsAppModal({
  visible, appointment, onClose,
}: {
  visible: boolean; appointment: Appointment | null; onClose: () => void;
}) {
  const defaultMessage = appointment
    ? `Hello ${appointment.lead.name},\n\nYour appointment has been scheduled for ${appointment.appointmentDate} at ${appointment.appointmentTime}.\n\n${appointment.description ? appointment.description + '\n\n' : ''}Thank you!`
    : '';
  const [message, setMessage] = useState(defaultMessage);

  React.useEffect(() => {
    if (appointment) {
      setMessage(`Hello ${appointment.lead.name},\n\nYour appointment has been scheduled for ${appointment.appointmentDate} at ${appointment.appointmentTime}.\n\n${appointment.description ? appointment.description + '\n\n' : ''}Thank you!`);
    }
  }, [appointment]);

  const handleSend = () => {
    if (!appointment) return;
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/91${appointment.lead.phone}?text=${encoded}`;
    Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'Could not open WhatsApp' }));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
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
              <Text style={styles.recipientText}>{appointment.lead.name}  •  {appointment.lead.phone}</Text>
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

function StatusBadge({ appt }: { appt: Appointment }) {
  if (appt.status === 'completed') {
    return (
      <View style={[styles.badge, styles.badgeGreen]}>
        <Ionicons name="checkmark-circle" size={12} color="#fff" />
        <Text style={styles.badgeText}>Completed</Text>
      </View>
    );
  }
  if (appt.status === 'missed' || isOverdue(appt)) {
    return (
      <View style={[styles.badge, styles.badgeRed]}>
        <Ionicons name="alert-circle" size={12} color="#fff" />
        <Text style={styles.badgeText}>Missed</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeBlue]}>
      <Ionicons name="time" size={12} color="#fff" />
      <Text style={styles.badgeText}>Upcoming</Text>
    </View>
  );
}

function AppointmentCard({
  item, onWhatsApp, onToggleComplete,
}: {
  item: Appointment;
  onWhatsApp: (a: Appointment) => void;
  onToggleComplete: (a: Appointment) => void;
}) {
  const overdue = isOverdue(item);
  const completed = item.status === 'completed';

  return (
    <View style={[styles.card, completed && styles.cardCompleted]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatarCircle, completed && { opacity: 0.5 }]}>
          <Text style={styles.avatarText}>{item.lead.name[0].toUpperCase()}</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={[styles.leadName, completed && styles.textMuted]} numberOfLines={1}>{item.lead.name}</Text>
          <Text style={[styles.leadPhone, completed && styles.textMuted]}>{item.lead.phone}</Text>
        </View>
        <StatusBadge appt={item} />
      </View>

      <View style={styles.dateTimeBlock}>
        <View style={styles.dateTimeItem}>
          <Calendar size={15} color={overdue && !completed ? '#DC2626' : colors.primary} />
          <Text style={[styles.dateTimeText, overdue && !completed && styles.overdueText]}>{item.appointmentDate}</Text>
        </View>
        <View style={styles.dateTimeDivider} />
        <View style={styles.dateTimeItem}>
          <Clock size={15} color={overdue && !completed ? '#DC2626' : colors.primary} />
          <Text style={[styles.dateTimeText, overdue && !completed && styles.overdueText]}>{item.appointmentTime}</Text>
        </View>
      </View>

      {item.lead.assignedTo && (
        <View style={styles.employeeRow}>
          <User size={14} color={colors.textSecondary} />
          <Text style={[styles.employeeText, completed && styles.textMuted]}>{item.lead.assignedTo.name}</Text>
        </View>
      )}

      {item.description ? (
        <View style={styles.descBox}>
          <Text style={styles.descText}>{item.description}</Text>
        </View>
      ) : null}

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.waBtn} onPress={() => onWhatsApp(item)} activeOpacity={0.75}>
          <Ionicons name="logo-whatsapp" size={17} color="#fff" />
          <Text style={styles.waBtnText}>Send on WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.checkBtn, completed && styles.checkBtnDone]} onPress={() => onToggleComplete(item)}>
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

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { appointments, fetchAppointments, setAppointmentStatus } = useAdminStore();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [waModalVisible, setWaModalVisible] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');

  useFocusEffect(useCallback(() => { fetchAppointments(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const handleWhatsApp = (appt: Appointment) => { setSelectedAppt(appt); setWaModalVisible(true); };

  const handleToggleComplete = (appt: Appointment) => {
    const nextStatus = appt.status === 'completed' ? 'scheduled' : 'completed';
    setAppointmentStatus(appt._id, nextStatus).catch(() =>
      Toast.show({ type: 'error', text1: 'Could not update appointment' })
    );
  };

  const byTab = appointments.filter((a) => tab === 'completed' ? a.status === 'completed' : a.status !== 'completed');
  const filtered = byTab.filter((a) => {
    if (!a.lead) return false;
    const q = search.toLowerCase();
    return a.lead.name.toLowerCase().includes(q) || a.lead.phone.includes(q) || a.appointmentDate.includes(q);
  });
  const sorted = tab === 'upcoming'
    ? [...filtered].sort((a, b) => (isOverdue(b) ? 1 : 0) - (isOverdue(a) ? 1 : 0))
    : filtered;

  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const upcomingCount = appointments.length - completedCount;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header — icon instead of emoji */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Appointments</Text>
            <Text style={styles.headerSub}>{appointments.length} total</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.scheduleBtn} onPress={() => navigation.navigate('AdminSchedule')}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={styles.scheduleBtnText}>My Schedule</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs — with paddingBottom */}
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
          <AppointmentCard item={item} onWhatsApp={handleWhatsApp} onToggleComplete={handleToggleComplete} />
        )}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={56} color={colors.textLight} />
            <Text style={styles.emptyTitle}>{tab === 'completed' ? 'No Completed Appointments' : 'No Appointments'}</Text>
            <Text style={styles.emptySubtitle}>
              {tab === 'completed'
                ? 'Appointments you mark as done will show up here.'
                : 'Appointments appear here when employees mark leads as Booked.'}
            </Text>
          </View>
        }
      />

      <WhatsAppModal visible={waModalVisible} appointment={selectedAppt} onClose={() => setWaModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F8F9FA' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: typography.lg, fontWeight: typography.bold as any, color: colors.textPrimary },
  headerSub: { fontSize: typography.sm, color: colors.textSecondary },
  scheduleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10,
  },
  scheduleBtnText: { fontSize: typography.xs, fontWeight: typography.semiBold as any, color: colors.primary },

  // Tabs — paddingBottom added
  tabRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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

  // Card
  card: {
    backgroundColor: colors.white, borderRadius: 18,
    padding: spacing.md + 2, marginBottom: spacing.md,
    elevation: 4, shadowColor: '#000',
    shadowOpacity: 0.09, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  cardCompleted: { opacity: 0.65, backgroundColor: '#FAFAFA' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: { fontSize: typography.md + 2, fontWeight: typography.bold as any, color: colors.primary },
  cardHeaderInfo: { flex: 1 },
  leadName: { fontSize: typography.md, fontWeight: typography.semiBold as any, color: colors.textPrimary },
  leadPhone: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  textMuted: { color: colors.textLight },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeGreen: { backgroundColor: '#059669' },
  badgeRed: { backgroundColor: '#DC2626' },
  badgeBlue: { backgroundColor: '#2563EB' },
  badgeText: { fontSize: 11, fontWeight: '700' as any, color: '#fff' },

  dateTimeBlock: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFF', borderRadius: 12,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  dateTimeItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  dateTimeDivider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: spacing.sm },
  dateTimeText: { fontSize: typography.sm + 1, fontWeight: '600' as any, color: colors.textPrimary },

  employeeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  employeeText: { fontSize: typography.sm, color: colors.textSecondary },
  overdueText: { color: '#DC2626', fontWeight: typography.semiBold as any },

  descBox: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: spacing.sm + 2, marginTop: spacing.xs },
  descText: { fontSize: typography.sm, color: colors.textPrimary },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  waBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#1FAA59', borderRadius: 12, paddingVertical: 11,
  },
  waBtnText: { color: '#fff', fontSize: typography.sm, fontWeight: typography.semiBold as any },
  checkBtn: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, justifyContent: 'center', alignItems: 'center',
  },
  checkBtnDone: { borderColor: '#059669' + '60', backgroundColor: '#059669' + '10' },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: typography.lg, fontWeight: typography.bold as any, color: colors.textPrimary },
  emptySubtitle: { fontSize: typography.sm, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },

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