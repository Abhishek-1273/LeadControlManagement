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

// ─── Appointment Card ─────────────────────────────────────────────────────────
function AppointmentCard({
  item,
  onWhatsApp,
  onDelete,
}: {
  item: Appointment;
  onWhatsApp: (a: Appointment) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{item.lead.name[0].toUpperCase()}</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.leadName}>{item.lead.name}</Text>
          <Text style={styles.leadPhone}>{item.lead.phone}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.lead.status}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
        <Text style={styles.detailText}>{item.appointmentDate}</Text>
        <Ionicons name="time-outline" size={15} color={colors.textSecondary} style={{ marginLeft: spacing.md }} />
        <Text style={styles.detailText}>{item.appointmentTime}</Text>
      </View>

      {item.lead.assignedTo && (
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.detailText}>Employee: {item.lead.assignedTo.name}</Text>
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
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item._id)}>
          <Ionicons name="trash-outline" size={16} color={colors.error || '#EF4444'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const { appointments, fetchAppointments, deleteAppointment, isLoading } = useAdminStore();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [waModalVisible, setWaModalVisible] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

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

  const handleDelete = (id: string) => {
    Alert.alert('Delete Appointment', 'Are you sure you want to delete this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAppointment(id);
            Toast.show({ type: 'success', text1: 'Appointment deleted' });
          } catch {
            Toast.show({ type: 'error', text1: 'Could not delete appointment' });
          }
        },
      },
    ]);
  };

  const handleWhatsApp = (appt: Appointment) => {
    setSelectedAppt(appt);
    setWaModalVisible(true);
  };

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.lead.name.toLowerCase().includes(q) ||
      a.lead.phone.includes(q) ||
      a.appointmentDate.includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Appointments</Text>
        <Text style={styles.headerSub}>{appointments.length} total</Text>
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
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <AppointmentCard
            item={item}
            onWhatsApp={handleWhatsApp}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={56} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No Appointments</Text>
            <Text style={styles.emptySubtitle}>
              Appointments appear here when employees mark leads as Booked.
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
  headerTitle: { fontSize: typography.lg, fontWeight: typography.bold as any, color: colors.text },
  headerSub: { fontSize: typography.sm, color: colors.textSecondary },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: spacing.md, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.white, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: typography.sm, color: colors.text },

  card: {
    backgroundColor: colors.white, borderRadius: 14, padding: spacing.md,
    marginBottom: spacing.sm, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: { fontSize: typography.md, fontWeight: typography.bold as any, color: colors.primary },
  cardHeaderInfo: { flex: 1 },
  leadName: { fontSize: typography.md, fontWeight: typography.semiBold as any, color: colors.text },
  leadPhone: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { backgroundColor: '#059669' + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: typography.xs, color: '#059669', fontWeight: typography.semiBold as any },

  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailText: { fontSize: typography.sm, color: colors.textSecondary },

  descBox: {
    backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, marginTop: spacing.xs,
  },
  descText: { fontSize: typography.sm, color: colors.text },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  waBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#25D366', borderRadius: 10, paddingVertical: 10,
  },
  waBtnText: { color: '#fff', fontSize: typography.sm, fontWeight: typography.semiBold as any },
  deleteBtn: {
    width: 42, height: 42, borderRadius: 10, borderWidth: 1,
    borderColor: '#EF4444' + '40', justifyContent: 'center', alignItems: 'center',
  },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: typography.lg, fontWeight: typography.bold as any, color: colors.text },
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
  modalTitle: { flex: 1, fontSize: typography.md, fontWeight: typography.bold as any, color: colors.text },

  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  recipientText: { fontSize: typography.sm, color: colors.textSecondary },

  waTextInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: 12, minHeight: 160, fontSize: typography.sm, color: colors.text,
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
