import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { LeadStatus } from '../../types/lead.types';
import { useLeadStore } from '../../store/leadStore';
import axiosInstance from '../../api/axiosInstance';

const STATUS_COLORS: Record<string, string> = {
  'Hot': '#EF4444',
  'Warm': '#F59E0B',
  'Cold': '#3B82F6',
  'Follow Up': '#8B5CF6',
  'Booked': '#059669',
};

const ALL_STATUSES: LeadStatus[] = [
  'Hot', 'Warm', 'Cold', 'Follow Up', 'Booked']

const TimelineItem = ({ icon, title, desc, time, isLast }: {
  icon: string; title: string;
  desc: string; time: string; isLast: boolean;
}) => (
  <View style={tlStyles.container}>
    <View style={tlStyles.lineContainer}>
      <View style={tlStyles.iconCircle}>
        <Ionicons name={icon as any} size={14} color={colors.primary} />
      </View>
      {!isLast && <View style={tlStyles.line} />}
    </View>
    <View style={tlStyles.content}>
      <Text style={tlStyles.title}>{title}</Text>
      <Text style={tlStyles.desc}>{desc}</Text>
      <Text style={tlStyles.time}>{time}</Text>
    </View>
  </View>
);

const tlStyles = StyleSheet.create({
  container: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  lineContainer: { alignItems: 'center', width: 32 },
  iconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginTop: 4 },
  content: { flex: 1, paddingBottom: spacing.md },
  title: {
    fontSize: typography.sm, fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  desc: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  time: { fontSize: typography.xs, color: colors.textLight, marginTop: 4 },
});

const InfoRow = ({ icon, label, value }: {
  icon: string; label: string; value: string;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  </View>
);

export default function LeadDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { leadId, hidePin } = route.params || {};

  const {
    selectedLead, fetchLeadById,
    updateStatus, togglePin, isLoading
  } = useLeadStore();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showVisitorDatePicker, setShowVisitorDatePicker] = useState(false);

  useEffect(() => {
    if (leadId) fetchLeadById(leadId);
  }, [leadId]);

  const lead = selectedLead;

  if (isLoading || !lead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading lead...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[lead.status] || colors.primary;

  const handleCall = () => {
    if (!lead.phone) return;
    Linking.openURL(`tel:${lead.phone}`);
  };

  const handleWhatsApp = () => {
    if (!lead.phone) return;
    const phone = lead.phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/91${phone}`);
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setShowStatusModal(false);
    // If marking as Booked, navigate to book appointment screen
    if (newStatus === 'Booked') {
      navigation.navigate('BookAppointment', {
        leadId,
        leadName: lead.name,
        leadPhone: lead.phone,
      });
      return;
    }
    try {
      await updateStatus(leadId, newStatus);
      Toast.show({
        type: 'success',
        text1: 'Status Updated ✅',
        text2: `Status changed to ${newStatus}`,
        visibilityTime: 2000,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Update Failed ❌',
        text2: 'Could not update status',
      });
    }
  };

  const handlePin = async () => {
    const wasPinned = lead.isPinned;
    try {
      await togglePin(leadId);
      Toast.show({
        type: 'success',
        text1: wasPinned ? 'Unpinned' : 'Pinned 📌',
        text2: wasPinned ? 'Lead removed from pinned' : 'Lead added to pinned',
        visibilityTime: 1500,
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed ❌', text2: 'Could not update pin status' });
    }
  };

  const handleVisitorDate = async (selectedDate: Date) => {
    try {
      const dateStr = selectedDate.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
      await axiosInstance.patch(
        `/leads/${leadId}/visitor-date`,
        { visitorDate: dateStr }
      );
      await fetchLeadById(leadId);
      Toast.show({
        type: 'success',
        text1: 'Visitor Date Set ✅',
        text2: `Scheduled for ${dateStr}`,
        visibilityTime: 2000,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed ❌',
        text2: 'Could not save visitor date',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'created': return 'add-circle';
      case 'status_changed': return 'swap-horizontal';
      case 'note_added': return 'create';
      case 'followup_added': return 'calendar';
      case 'assigned': return 'person';
      default: return 'ellipse';
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
        <Text style={styles.headerTitle}>Lead Details</Text>
        {hidePin ? (
          // Pending Leads doesn't support pinning — keep an empty spacer
          // the same size as the pin button so the title stays centered.
          <View style={styles.pinBtn} />
        ) : (
          <TouchableOpacity style={styles.pinBtn} onPress={handlePin}>
            <Ionicons
              name={lead.isPinned ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={lead.isPinned ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {lead.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.leadName}>{lead.name}</Text>
          <Text style={styles.leadPhone}>{lead.phone}</Text>
          {lead.secondaryPhone ? (
            <Text style={styles.leadPhone}>📱 {lead.secondaryPhone}</Text>
          ) : null}
          <TouchableOpacity
            style={[styles.statusBadge,
            { backgroundColor: statusColor + '20' }]}
            onPress={() => setShowStatusModal(true)}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {lead.status}
            </Text>
            <Ionicons name="chevron-down" size={14} color={statusColor} />
          </TouchableOpacity>

        </View>

        {/* Date Picker */}
        {showVisitorDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowVisitorDatePicker(false);
              if (selectedDate) handleVisitorDate(selectedDate);
            }}
          />
        )}

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="call" size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsApp}>
            <View style={[styles.actionIcon, { backgroundColor: '#E8FFF1' }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            </View>
            <Text style={styles.actionLabel}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              navigation.navigate('AddNote', { leadId: lead._id })
            }
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="create" size={22} color="#6366F1" />
            </View>
            <Text style={styles.actionLabel}>Add Note</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              navigation.navigate('AddFollowUp', { leadId: lead._id })
            }
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEF9E7' }]}>
              <Ionicons name="calendar" size={22} color="#F59E0B" />
            </View>
            <Text style={styles.actionLabel}>Follow Up</Text>
          </TouchableOpacity>
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <View style={styles.cardbox}>
            <Text style={styles.cardTitle}>Customer Information</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('EditLead', { leadId })}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
          <InfoRow icon="person" label="Full Name" value={lead.name} />
          <InfoRow icon="call" label="Primary Phone" value={lead.phone} />
          {lead.secondaryPhone ? (
            <InfoRow icon="call-outline" label="Secondary Phone" value={lead.secondaryPhone} />
          ) : null}
          <InfoRow icon="mail" label="Email" value={lead.email || ''} />
          <InfoRow icon="location" label="City" value={lead.city || ''} />
          <InfoRow
            icon="car-outline"
            label="Car / Vehicle"
            value={lead.car || ''}
          />
        </View>

        {/* Lead Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lead Information</Text>
          <InfoRow icon="globe" label="Source" value={lead.source} />
          <InfoRow
            icon="megaphone"
            label="Campaign"
            value={lead.campaign || ''}
          />
          <InfoRow
            icon="calendar-outline"
            label="Visitor Date"
            value={lead.visitorDate || 'Not scheduled'}
          />
          <InfoRow
            icon="time-outline"
            label="Created"
            value={formatDate(lead.createdAt)}
          />
          <InfoRow
            icon="person-circle-outline"
            label="Assigned To"
            value={
              typeof lead.assignedTo === 'object'
                ? (lead.assignedTo as any)?.name || '—'
                : '—'
            }
          />
        </View>

        {/* Notes */}
        {lead.notes && lead.notes.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Notes ({lead.notes.length})
            </Text>
            {lead.notes.map((note: any, index: number) => (
              <View key={index} style={styles.noteItem}>
                <View style={styles.noteHeader}>
                  <Ionicons
                    name="create-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.noteTime}>
                    {formatDate(note.createdAt)}
                  </Text>
                </View>
                <Text style={styles.noteContent}>{note.content}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Timeline */}
        {lead.timeline && lead.timeline.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activity Timeline</Text>
            <View style={{ marginTop: spacing.md }}>
              {lead.timeline.map((item: any, index: number) => (
                <TimelineItem
                  key={index}
                  icon={getTimelineIcon(item.type)}
                  title={item.type.replace(/_/g, ' ').toUpperCase()}
                  desc={item.description}
                  time={formatDate(item.createdAt)}
                  isLast={index === (lead.timeline?.length ?? 0) - 1}
                />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Status Modal */}
      {showStatusModal && (
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowStatusModal(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Status</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {ALL_STATUSES.map((status) => {
                const sColor = STATUS_COLORS[status];
                const isActive = lead.status === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      isActive && styles.statusOptionActive,
                    ]}
                    onPress={() => handleStatusChange(status)}
                  >
                    <View style={[
                      styles.statusDot, { backgroundColor: sColor }
                    ]} />
                    <Text style={[
                      styles.statusOptionText,
                      isActive && {
                        color: colors.primary,
                        fontWeight: typography.bold,
                      },
                    ]}>
                      {status}
                    </Text>
                    {isActive && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.base, color: colors.textSecondary,
  },
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
  pinBtn: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  profileCard: {
    backgroundColor: colors.white, alignItems: 'center',
    padding: spacing.xl, marginBottom: spacing.sm, gap: spacing.sm,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.xxxl, fontWeight: typography.bold,
    color: colors.primary,
  },
  leadName: {
    fontSize: typography.xl, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  leadPhone: { fontSize: typography.base, color: colors.textSecondary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.xs, paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: 20, marginTop: spacing.xs,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: typography.sm, fontWeight: typography.semiBold },
  visitorDateBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, backgroundColor: '#06B6D4',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 20, marginTop: spacing.xs,
  },
  visitorDateText: {
    fontSize: typography.sm, color: colors.white,
    fontWeight: typography.semiBold,
  },
  actionRow: {
    flexDirection: 'row', backgroundColor: colors.white,
    paddingVertical: spacing.md, paddingHorizontal: spacing.base,
    marginBottom: spacing.sm, justifyContent: 'space-around',
  },
  actionBtn: { alignItems: 'center', gap: spacing.xs },
  actionIcon: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  actionLabel: {
    fontSize: typography.xs, color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  card: {
    backgroundColor: colors.white, marginHorizontal: spacing.base,
    marginBottom: spacing.sm, borderRadius: 16, padding: spacing.base,
    elevation: 1, shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3,
  },
  cardbox: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.md, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  infoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: typography.xs, color: colors.textSecondary },
  infoValue: {
    fontSize: typography.sm, fontWeight: typography.medium,
    color: colors.textPrimary, marginTop: 2,
  },
  headerRight: {
    width: '10%',
    alignItems: 'flex-end', gap: spacing.sm,
  },
  editBtn: {
    width: 40, height: 40, justifyContent: 'center',
    alignItems: 'center', backgroundColor: colors.primaryLight,
    borderRadius: 10,
  },
  noteItem: {
    backgroundColor: colors.background, borderRadius: 10,
    padding: spacing.md, marginBottom: spacing.sm,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  noteHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.xs, marginBottom: spacing.xs,
  },
  noteTime: { fontSize: typography.xs, color: colors.textSecondary },
  noteContent: { fontSize: typography.sm, color: colors.textPrimary },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: spacing.base, maxHeight: '80%',
    paddingBottom: spacing.xxl
  },
  modalTitle: {
    fontSize: typography.lg, fontWeight: typography.bold,
    color: colors.textPrimary, marginBottom: spacing.md,
    textAlign: 'center',
  },
  statusOption: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm, borderRadius: 10, marginBottom: 4,
  },
  statusOptionActive: { backgroundColor: colors.primaryLight },
  statusOptionText: {
    flex: 1, fontSize: typography.base, color: colors.textPrimary,
  },
});