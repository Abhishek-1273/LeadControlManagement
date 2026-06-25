import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useLeadStore } from '../../store/leadStore';
import { Lead } from '../../types/lead.types';


const STATUS_COLORS: Record<string, string> = {
  New: '#6B7280',
  Interested: '#EF4444',
  Contacted: '#F59E0B',
  'Not Interested': '#3B82F6',
  Pending: '#D97706',
  Booked: '#059669',
  Deleted: '#9CA3AF',
};

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'New' },
  { label: 'Interested', value: 'Interested' },
  { label: 'Contacted', value: 'Contacted' },
  { label: 'Not Interested', value: 'Not Interested' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Booked', value: 'Booked' },
  { label: 'Deleted', value: 'Deleted' },
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export default function EmployeeArchiveScreen() {
  const navigation = useNavigation<any>();
  const { archiveLeads, fetchEmployeeArchive, restoreLead, isLoading } = useLeadStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadArchive = useCallback((s = search, f = activeFilter) => {
    fetchEmployeeArchive({ status: f === 'all' ? undefined : f, search: s || undefined });
  }, [search, activeFilter]);

  useFocusEffect(
    useCallback(() => {
      loadArchive();
      return () => {};
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployeeArchive({ status: activeFilter === 'all' ? undefined : activeFilter, search: search || undefined });
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    fetchEmployeeArchive({ status: activeFilter === 'all' ? undefined : activeFilter, search: text || undefined });
  };

  const handleFilter = (value: string) => {
    setActiveFilter(value);
    fetchEmployeeArchive({ status: value === 'all' ? undefined : value, search: search || undefined });
  };

  const handleRestore = (lead: Lead) => {
    Alert.alert(
      'Restore Lead',
      `Restore "${lead.name}" back to your active leads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await restoreLead(lead._id);
              Toast.show({
                type: 'success',
                text1: 'Lead Restored ✅',
                text2: `${lead.name} is back in your leads`,
                visibilityTime: 2000,
              });
              loadArchive();
            } catch {
              Toast.show({ type: 'error', text1: 'Failed ❌', text2: 'Could not restore lead' });
            }
          },
        },
      ]
    );
  };


  const renderItem = ({ item: lead }: { item: Lead & { isDeleted?: boolean; statusBeforeDelete?: string } }) => {
    const statusColor = STATUS_COLORS[lead.status] || colors.primary;
    const isDeleted = (lead as any).isDeleted;

    return (
      <TouchableOpacity
        style={[styles.card, isDeleted && styles.deletedCard]}
        onPress={() => navigation.navigate('LeadDetail', { leadId: lead._id, hidePin: true })}
        activeOpacity={0.75}
      >
        {/* Color bar */}
        <View style={[styles.colorBar, { backgroundColor: isDeleted ? '#9CA3AF' : statusColor }]} />

        <View style={styles.cardContent}>
          {/* Top row */}
          <View style={styles.cardTop}>
            <View style={[styles.avatar, { backgroundColor: isDeleted ? '#F3F4F6' : colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: isDeleted ? '#9CA3AF' : colors.primary }]}>
                {lead.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.leadInfo}>
              <Text style={[styles.leadName, isDeleted && styles.deletedText]} numberOfLines={1}>
                {lead.name}
              </Text>
              <Text style={styles.leadPhone}>{lead.phone}</Text>
              {lead.car ? <Text style={styles.leadCar}>🚗 {lead.car}</Text> : null}
            </View>

            {/* Status badge — now reads "Deleted" directly via lead.status for deleted leads */}
            <View style={styles.badgeColumn}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {lead.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom row */}
          <View style={styles.cardBottom}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.dateText}>
                {isDeleted ? `Deleted ${formatDate((lead as any).deletedAt)}` : formatDate(lead.updatedAt)}
              </Text>
            </View>

            <View style={styles.actionRow}>
              {/* Restore (only deleted leads) */}
              {isDeleted && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.restoreBtn]}
                  onPress={() => handleRestore(lead)}
                >
                  <Ionicons name="refresh" size={15} color="#059669" />
                  <Text style={styles.restoreText}>Restore</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Archive</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter chips */}
      <View style={styles.filterRow}>
        <FlatList
          data={STATUS_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ paddingHorizontal: spacing.base, gap: spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, activeFilter === item.value && styles.chipActive]}
              onPress={() => handleFilter(item.value)}
            >
              <Text style={[styles.chipText, activeFilter === item.value && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{archiveLeads.length} leads total</Text>
        <Text style={styles.countDeleted}>
          {archiveLeads.filter((l: any) => l.isDeleted).length} deleted
        </Text>
      </View>

      {/* List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={archiveLeads}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="archive-outline" size={56} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No leads found</Text>
              <Text style={styles.emptySubtitle}>
                {search ? 'Try a different search' : 'All your leads will appear here'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: 10,
  },
  headerTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.textPrimary },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.white, marginHorizontal: spacing.base, marginTop: spacing.md,
    marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: typography.base, color: colors.textPrimary },
  filterRow: { paddingVertical: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: typography.medium },
  chipTextActive: { color: colors.white, fontWeight: typography.bold },
  countRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingBottom: spacing.xs,
  },
  countText: { fontSize: typography.xs, color: colors.textSecondary },
  countDeleted: { fontSize: typography.xs, color: '#EF4444' },
  listContent: { paddingHorizontal: spacing.base, paddingBottom: 100, gap: spacing.sm, paddingTop: spacing.xs },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.textSecondary },
  emptySubtitle: { fontSize: typography.sm, color: colors.textLight, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: colors.white, borderRadius: 14, flexDirection: 'row',
    overflow: 'hidden', elevation: 2, shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  deletedCard: { opacity: 0.75 },
  colorBar: { width: 4 },
  cardContent: { flex: 1, padding: spacing.md, gap: spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: typography.md, fontWeight: typography.bold },
  leadInfo: { flex: 1 },
  leadName: { fontSize: typography.base, fontWeight: typography.semiBold, color: colors.textPrimary },
  deletedText: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  leadPhone: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  leadCar: { fontSize: typography.xs, color: colors.primary, marginTop: 2 },
  badgeColumn: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: typography.xs, fontWeight: typography.semiBold },
  deletedBadge: {
    backgroundColor: '#FEE2E2', paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: 6,
  },
  deletedBadgeText: { fontSize: 10, color: '#EF4444', fontWeight: typography.bold },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: typography.xs, color: colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: {
    backgroundColor: colors.primaryLight, padding: spacing.xs + 2,
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  restoreBtn: {
    backgroundColor: '#ECFDF5', flexDirection: 'row', alignItems: 'center',
    gap: 4, paddingHorizontal: spacing.sm,
  },
  restoreText: { fontSize: typography.xs, color: '#059669', fontWeight: typography.semiBold },
});