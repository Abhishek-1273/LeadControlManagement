import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Lead } from '../../types/lead.types';

const STATUS_COLORS: Record<string, string> = {
  Hot: colors.statusHot,
  Warm: colors.warning,
  Cold: colors.primary,
  'Follow Up': colors.statusFollowUp,
  Booked: colors.statusBooked,
};

export const formatLeadDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Standalone, self-contained lead card used by dedicated dashboard screens
// (Previous Pending, Booked) — kept separate from LeadListScreen's internal
// LeadCard so those screens don't depend on LeadListScreen's local state/
// styles and can evolve independently.
export const SimpleLeadCard = React.memo(({
  lead,
  onPress,
  onTogglePin,
  dateLabel,
}: {
  lead: Lead;
  onPress: () => void;
  /** Omit to render this card without any pin badge/border (e.g. Pending Leads, which doesn't support pinning). */
  onTogglePin?: () => void;
  /** When provided, shown next to the source chip (e.g. created/updated date). */
  dateLabel?: string;
}) => {
  const statusColor = STATUS_COLORS[lead.status] || colors.primary;
  const showPinned = !!onTogglePin && lead.isPinned;

  return (
    <TouchableOpacity
      style={[styles.leadCard, showPinned && styles.pinnedCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {showPinned && (
        <TouchableOpacity
          style={styles.pinnedIndicator}
          onPress={onTogglePin}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="bookmark" size={12} color={colors.white} />
          <Text style={styles.pinnedText}>Pinned</Text>
        </TouchableOpacity>
      )}

      <View style={[styles.colorBar, { backgroundColor: statusColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {lead.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.leadInfo}>
            <Text style={styles.leadName} numberOfLines={1}>
              {lead.name}
            </Text>
            <Text style={styles.leadPhone}>{lead.phone}</Text>
            {lead.car ? (
              <Text style={styles.leadCar}>🚗 {lead.car}</Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {lead.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.sourceChip}>
            <Ionicons name="globe-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.sourceText}>{lead.source}</Text>
            {dateLabel ? (
              <>
                <Text style={styles.sourceText}>·</Text>
                <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.sourceText}>{dateLabel}</Text>
              </>
            ) : null}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Linking.openURL(`tel:${lead.phone}`)}
            >
              <Ionicons name="call" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.whatsappBtn]}
              onPress={() => {
                const phone = lead.phone.replace(/\D/g, '');
                Linking.openURL(`https://wa.me/91${phone}`);
              }}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  leadCard: {
    backgroundColor: colors.white, borderRadius: 14,
    flexDirection: 'row', overflow: 'hidden', elevation: 2,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  pinnedCard: { borderWidth: 1.5, borderColor: colors.primary, elevation: 4 },
  pinnedIndicator: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderBottomLeftRadius: 8, flexDirection: 'row',
    alignItems: 'center', gap: 4, zIndex: 1,
  },
  pinnedText: { fontSize: 10, color: colors.white, fontWeight: typography.bold },
  colorBar: { width: 4 },
  cardContent: { flex: 1, padding: spacing.md, gap: spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: typography.md, fontWeight: typography.bold, color: colors.primary },
  leadInfo: { flex: 1 },
  leadName: { fontSize: typography.base, fontWeight: typography.semiBold, color: colors.textPrimary },
  leadPhone: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  leadCar: { fontSize: typography.xs, color: colors.primary, marginTop: 2, fontWeight: typography.medium },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: typography.xs, fontWeight: typography.semiBold },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 2,
  },
  sourceChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sourceText: { fontSize: typography.xs, color: colors.textSecondary },
  actionButtons: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { backgroundColor: colors.primaryLight, padding: spacing.sm, borderRadius: 8 },
  whatsappBtn: { backgroundColor: '#E8FFF1' },
});