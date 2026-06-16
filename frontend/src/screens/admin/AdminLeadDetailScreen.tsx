import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useLeadStore } from '../../store/leadStore';
import { LeadStatus } from '../../types/lead.types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const STATUS_COLORS: Record<string, string> = {
  'New Lead': '#3B82F6', 'Contacted': '#8B5CF6',
  'Follow Up': '#F59E0B', 'Interested': '#10B981',
  'Visitor': '#06B6D4', 'Booked': '#059669',
  'Closed': '#6B7280', 'Uninterested': '#EF4444',
  'No Response': '#9CA3AF', 'Wrong Number': '#F97316',
};

const ALL_STATUSES: LeadStatus[] = [
  'New Lead', 'Contacted', 'Follow Up', 'Interested',
  'Visitor', 'Booked','Uninterested',
  'No Response',
];

const InfoRow = ({ icon, label, value }: any) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={16} color={colors.primary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  </View>
);

export default function AdminLeadDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { leadId } = route.params || {};
  const { selectedLead, fetchLeadById, updateStatus, isLoading } =
    useLeadStore();
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    if (leadId) fetchLeadById(leadId);
  }, [leadId]);

  const lead = selectedLead;

  if (isLoading || !lead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[lead.status] || colors.primary;

  const handleStatusChange = async (status: LeadStatus) => {
    setShowStatusModal(false);
    try {
      await updateStatus(leadId, status);
      Toast.show({
        type: 'success',
        text1: 'Status Updated ✅',
        text2: `Changed to ${status}`,
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Update Failed ❌' });
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
        <Text style={styles.headerTitle}>Lead Details</Text>
        <TouchableOpacity
          style={styles.assignHeaderBtn}
          onPress={() => navigation.navigate('AssignLead', {
            leadId: lead._id,
            currentEmployee: lead.assignedTo,
          })}
        >
          <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {lead.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.leadName}>{lead.name}</Text>
          <Text style={styles.leadPhone}>{lead.phone}</Text>
          <TouchableOpacity
            style={[styles.statusBadge,
              { backgroundColor: statusColor + '20' }]}
            onPress={() => setShowStatusModal(true)}
          >
            <View style={[styles.statusDot,
              { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {lead.status}
            </Text>
            <Ionicons name="chevron-down" size={14} color={statusColor} />
          </TouchableOpacity>

          {/* Assigned To */}
          <View style={styles.assignedBadge}>
            <Ionicons name="person-outline" size={14}
              color={colors.textSecondary} />
            <Text style={styles.assignedText}>
              {typeof lead.assignedTo === 'object'
                ? (lead.assignedTo as any)?.name || 'Unassigned'
                : 'Unassigned'}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Linking.openURL(`tel:${lead.phone}`)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="call" size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Linking.openURL(
              `https://wa.me/91${lead.phone}`)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8FFF1' }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            </View>
            <Text style={styles.actionLabel}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('AssignLead', {
              leadId: lead._id,
              currentEmployee: lead.assignedTo,
            })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="swap-horizontal" size={22} color="#6366F1" />
            </View>
            <Text style={styles.actionLabel}>Reassign</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowStatusModal(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEF9E7' }]}>
              <Ionicons name="flag" size={22} color="#F59E0B" />
            </View>
            <Text style={styles.actionLabel}>Status</Text>
          </TouchableOpacity>
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Information</Text>
          <InfoRow icon="person" label="Name" value={lead.name} />
          <InfoRow icon="call" label="Phone" value={lead.phone} />
          <InfoRow icon="mail" label="Email" value={lead.email} />
          <InfoRow icon="location" label="City" value={lead.city} />
          <InfoRow icon="car-outline" label="Car" value={lead.car} />
        </View>

        {/* Lead Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lead Information</Text>
          <InfoRow icon="globe" label="Source" value={lead.source} />
          <InfoRow icon="megaphone" label="Campaign" value={lead.campaign} />
          <InfoRow icon="calendar-outline" label="Visitor Date"
            value={lead.visitorDate} />
          <InfoRow icon="time-outline" label="Created"
            value={new Date(lead.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            })} />
        </View>

        {/* Notes */}
        {lead.notes && lead.notes.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Notes ({lead.notes.length})
            </Text>
            {(lead.notes as any[]).map((note, index) => (
              <View key={index} style={styles.noteItem}>
                <Text style={styles.noteContent}>{note.content}</Text>
                <Text style={styles.noteTime}>
                  {new Date(note.createdAt).toLocaleDateString('en-IN')}
                </Text>
              </View>
            ))}
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
                    style={[styles.statusOption,
                      isActive && styles.statusOptionActive]}
                    onPress={() => handleStatusChange(status)}
                  >
                    <View style={[styles.statusDot,
                      { backgroundColor: sColor }]} />
                    <Text style={[styles.statusOptionText,
                      isActive && { color: colors.primary,
                        fontWeight: typography.bold }]}>
                      {status}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark" size={18}
                        color={colors.primary} />
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  assignHeaderBtn: {
    width: 40, height: 40, justifyContent: 'center',
    alignItems: 'center', backgroundColor: colors.primaryLight,
    borderRadius: 10,
  },
  profileCard: {
    backgroundColor: colors.white, alignItems: 'center',
    padding: spacing.xl, marginBottom: spacing.sm, gap: spacing.sm,
  },
  avatar: {
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
    paddingVertical: spacing.xs, borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: typography.sm, fontWeight: typography.semiBold },
  assignedBadge: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.xs, backgroundColor: colors.background,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  assignedText: { fontSize: typography.sm, color: colors.textSecondary },
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
    elevation: 1,
  },
  cardTitle: {
    fontSize: typography.md, fontWeight: typography.bold,
    color: colors.textPrimary, marginBottom: spacing.md,
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
  noteItem: {
    backgroundColor: colors.background, borderRadius: 10,
    padding: spacing.md, marginBottom: spacing.sm,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  noteContent: { fontSize: typography.sm, color: colors.textPrimary },
  noteTime: {
    fontSize: typography.xs, color: colors.textSecondary, marginTop: 4,
  },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: spacing.base, maxHeight: '70%',
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