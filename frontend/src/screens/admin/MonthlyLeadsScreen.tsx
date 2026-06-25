import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAdminStore } from '../../store/adminStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const STATUS_COLORS: Record<string, string> = {
  new: '#6B7280',
  Interested: '#EF4444',
  Contacted: '#F59E0B',
  'Not Interested': '#3B82F6',
  Pending: '#D97706',
  Booked: '#059669',
  Deleted: '#9CA3AF',
};

// ─── Date label helper (local-calendar based, matches localDateKey below) ──────
function getDateLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) return '📅 Today';
  if (date.getTime() === yesterday.getTime()) return '📅 Yesterday';

  return '📅 ' + date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// Group by the device's local calendar date (not UTC) — same fix pattern
// used in LeadArchiveScreen, so a lead created late at night IST lands
// under the correct day instead of the previous day in UTC.
function localDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function groupLeadsByDate(leads: any[]) {
  const groups: Record<string, any[]> = {};

  leads.forEach((lead) => {
    const dateKey = localDateKey(lead.createdAt);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(lead);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => {
      const [ay, am, ad] = a.split('-').map(Number);
      const [by, bm, bd] = b.split('-').map(Number);
      return new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime();
    })
    .map(([date, data]) => ({
      title: getDateLabel(date),
      dateKey: date,
      data,
    }));
}

// ─── Lead Row ─────────────────────────────────────────────────────────────────
function LeadRow({ lead, onPress }: { lead: any; onPress: () => void }) {
  const color = STATUS_COLORS[lead.status] || colors.textSecondary;
  return (
    <TouchableOpacity style={styles.leadRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      <View style={styles.leadLeft}>
        <Text style={styles.leadName}>{lead.name}</Text>
        <Text style={styles.leadPhone}>{lead.phone}</Text>
        {lead.assignedTo?.name && (
          <Text style={styles.leadEmp}>👤 {lead.assignedTo.name}</Text>
        )}
      </View>
      <View style={styles.leadRight}>
        <View style={[styles.statusBadge, { backgroundColor: color + '18' }]}>
          <Text style={[styles.statusText, { color }]}>
            {lead.status}
          </Text>
        </View>
        <Text style={styles.leadTime}>
          {new Date(lead.createdAt).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit', hour12: true,
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCountBadge}>
        <Text style={styles.sectionCount}>{count} leads</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MonthlyLeadsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { fetchAllLeads } = useAdminStore();

  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 50;

  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const monthParam = String(now.getMonth() + 1);
  const yearParam = String(now.getFullYear());

  const loadLeads = useCallback(async (pageNum = 1, reset = true) => {
    setLoading(true);
    try {
      const result = await fetchAllLeads({
        month: monthParam,
        year: yearParam,
        page: String(pageNum),
        limit: String(LIMIT),
      });

      if (reset) {
        setAllLeads(result.leads);
      } else {
        setAllLeads((prev) => [...prev, ...result.leads]);
      }
      setTotal(result.total);
      setHasMore(result.leads.length === LIMIT);
    } catch (err) {
      console.error('Monthly leads fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [monthParam, yearParam]);

  useEffect(() => {
    setPage(1);
    loadLeads(1, true);
  }, [loadLeads]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadLeads(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const next = page + 1;
      setPage(next);
      loadLeads(next, false);
    }
  };

  const sections = groupLeadsByDate(allLeads);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Monthly Leads</Text>
          <Text style={styles.subtitle}>{monthLabel} · {total} leads</Text>
        </View>
      </View>

      {/* Date-grouped SectionList */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} count={section.data.length} />
        )}
        renderItem={({ item }) => (
          <LeadRow
            lead={item}
            onPress={() => navigation.navigate('AdminLeadDetail', { leadId: item._id })}
          />
        )}
        contentContainerStyle={{
          paddingHorizontal: spacing.base,
          paddingBottom: insets.bottom + 80,
          paddingTop: spacing.sm,
        }}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : !hasMore && allLeads.length > 0 ? (
            <View style={styles.endMessage}>
              <Ionicons name="checkmark-circle" size={20} color={colors.textLight} />
              <Text style={styles.endText}>All leads loaded</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={56} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No leads this month</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  sectionCountBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCount: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: typography.semiBold,
  },

  // Lead Row
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  colorBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  leadLeft: {
    flex: 1,
    padding: spacing.md,
  },
  leadName: {
    fontSize: typography.base,
    fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  leadPhone: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  leadEmp: {
    fontSize: typography.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  leadRight: {
    alignItems: 'flex-end',
    paddingRight: spacing.md,
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: typography.xs,
    fontWeight: typography.semiBold,
  },
  leadTime: {
    fontSize: typography.xs,
    color: colors.textLight,
  },

  // Empty / Footer
  empty: {
    alignItems: 'center',
    paddingVertical: 70,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semiBold,
    color: colors.textSecondary,
  },
  endMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  endText: {
    fontSize: typography.sm,
    color: colors.textLight,
  },
});