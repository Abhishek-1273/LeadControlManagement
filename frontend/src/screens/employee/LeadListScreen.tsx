import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, RefreshControl,
  Linking, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Lead, LeadStatus } from '../../types/lead.types';
import { useLeadStore } from '../../store/leadStore';

const STATUS_FILTERS: { label: string; value: LeadStatus | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'New Lead', value: 'New Lead' },
  { label: 'Contacted', value: 'Contacted' },
  { label: 'Follow Up', value: 'Follow Up' },
  { label: 'Interested', value: 'Interested' },
  { label: 'Visitor', value: 'Visitor' },
  { label: 'Booked', value: 'Booked' },
  { label: 'Uninterested', value: 'Uninterested' },
  { label: 'No Response', value: 'No Response' },
];

const STATUS_COLORS: Record<string, string> = {
  'New Lead': '#3B82F6',
  'Contacted': '#8B5CF6',
  'Follow Up': '#F59E0B',
  'Interested': '#10B981',
  'Visitor': '#06B6D4',
  'Booked': '#059669',
  'Closed': '#6B7280',
  'Uninterested': '#EF4444',
  'No Response': '#9CA3AF',
  'Wrong Number': '#F97316',
};

// Lead Card
const LeadCard = ({
  lead, onPress, onUninterested, showPinIndicator
}: {
  lead: Lead;
  onPress: () => void;
  onUninterested: () => void;
  showPinIndicator?: boolean;
}) => {
  const statusColor = STATUS_COLORS[lead.status] || colors.primary;

  return (
    <TouchableOpacity
      style={[styles.leadCard, lead.isPinned && styles.pinnedCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Pinned indicator */}
      {lead.isPinned && (
        <View style={styles.pinnedIndicator}>
          <Ionicons name="bookmark" size={12} color={colors.white} />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}

      <View style={[styles.colorBar, { backgroundColor: statusColor }]} />
      <View style={styles.cardContent}>

        {/* Top Row */}
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
          <View style={[styles.statusBadge,
          { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {lead.status}
            </Text>
          </View>
        </View>

        {/* Bottom Row */}
        <View style={styles.cardBottom}>
          <View style={styles.sourceChip}>
            <Ionicons name="globe-outline" size={12}
              color={colors.textSecondary} />
            <Text style={styles.sourceText}>{lead.source}</Text>
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
              onPress={() => Linking.openURL(`https://wa.me/91${lead.phone}`)}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </TouchableOpacity>
  );
};

// Advanced Filter Modal
const FilterModal = ({
  visible, onClose, onApply, currentFilters
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentFilters: any;
}) => {
  const [city, setCity] = useState(currentFilters.city || '');
  const [car, setCar] = useState(currentFilters.car || '');
  const [source, setSource] = useState(currentFilters.source || '');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={filterStyles.overlay}>
        <View style={filterStyles.container}>

          <View style={filterStyles.header}>
            <Text style={filterStyles.title}>Advanced Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={filterStyles.content}>

            {/* City Filter */}
            <Text style={filterStyles.label}>📍 City</Text>
            <TextInput
              style={filterStyles.input}
              placeholder="City enter karo..."
              placeholderTextColor={colors.textLight}
              value={city}
              onChangeText={setCity}
            />

            {/* Car Filter */}
            <Text style={filterStyles.label}>🚗 Car/Vehicle</Text>
            <TextInput
              style={filterStyles.input}
              placeholder="Car model enter karo..."
              placeholderTextColor={colors.textLight}
              value={car}
              onChangeText={setCar}
            />

            {/* Source Filter */}
            <Text style={filterStyles.label}>🌐 Source</Text>
            <View style={filterStyles.chipRow}>
              {['WhatsApp', 'Facebook', 'Instagram', 'Walk-in', 'Referral'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[filterStyles.chip,
                  source === s && filterStyles.chipActive]}
                  onPress={() => setSource(source === s ? '' : s)}
                >
                  <Text style={[filterStyles.chipText,
                  source === s && filterStyles.chipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

          </ScrollView>

          {/* Buttons */}
          <View style={filterStyles.footer}>
            <TouchableOpacity
              style={filterStyles.clearBtn}
              onPress={() => {
                setCity('');
                setCar('');
                setSource('');
                onApply({});
                onClose();
              }}
            >
              <Text style={filterStyles.clearText}>Clear All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={filterStyles.applyBtn}
              onPress={() => {
                onApply({ city, car, source });
                onClose();
              }}
            >
              <Text style={filterStyles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const filterStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.lg, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  content: { padding: spacing.base },
  label: {
    fontSize: typography.sm, fontWeight: typography.semiBold,
    color: colors.textPrimary, marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.background, borderRadius: 10,
    padding: spacing.md, fontSize: typography.base,
    color: colors.textPrimary, borderWidth: 1,
    borderColor: colors.border,
  },
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  chipText: { fontSize: typography.sm, color: colors.textSecondary },
  chipTextActive: { color: colors.white, fontWeight: typography.semiBold },
  footer: {
    flexDirection: 'row', gap: spacing.md,
    padding: spacing.base, borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearBtn: {
    flex: 1, padding: spacing.md, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  clearText: {
    fontSize: typography.base, color: colors.textSecondary,
    fontWeight: typography.semiBold,
  },
  applyBtn: {
    flex: 2, padding: spacing.md, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  applyText: {
    fontSize: typography.base, color: colors.white,
    fontWeight: typography.bold,
  },
});

// Main Screen
export default function LeadListScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { leads, fetchLeads, isLoading, updateStatus, togglePin } =
    useLeadStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<LeadStatus | 'All'>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any>({});

  useFocusEffect(
    React.useCallback(() => {
      fetchLeads();
      return () => { };
    }, [])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads({
        search: search || undefined,
        status: activeFilter !== 'All' ? activeFilter : undefined,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  };

  const handleUninterested = async (lead: Lead) => {
    try {
      await updateStatus(lead._id, 'Uninterested');
      Toast.show({
        type: 'info',
        text1: 'Marked Uninterested',
        text2: `${lead.name} ko uninterested mark kiya`,
        visibilityTime: 2000,
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Error ❌' });
    }
  };

  // Pinned aur unpinned leads alag karo
  const pinnedLeads = leads.filter((l) => l.isPinned);
  const unpinnedLeads = leads.filter((l) => !l.isPinned);

  // Advanced filter apply karo
  const applyAdvancedFilter = (lead: Lead) => {
    if (advancedFilters.city &&
      !lead.city?.toLowerCase().includes(
        advancedFilters.city.toLowerCase())) return false;
    if (advancedFilters.car &&
      !lead.car?.toLowerCase().includes(
        advancedFilters.car.toLowerCase())) return false;
    if (advancedFilters.source &&
      lead.source !== advancedFilters.source) return false;
    return true;
  };

  const filteredUnpinned = unpinnedLeads.filter(applyAdvancedFilter);
  const filteredPinned = pinnedLeads.filter(applyAdvancedFilter);

  const hasActiveFilters = Object.values(advancedFilters)
    .some((v) => v !== '');

  const renderLead = ({ item }: { item: Lead }) => (
    <LeadCard
      lead={item}
      onPress={() =>
        navigation.navigate('LeadDetail', { leadId: item._id })
      }
      onUninterested={() => handleUninterested(item)}
    />
  );

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Leads</Text>
          <View style={styles.headerRight}>
            {/* Filter Button */}
            <TouchableOpacity
              style={[styles.filterBtn,
              hasActiveFilters && styles.filterBtnActive]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons
                name="options"
                size={18}
                color={hasActiveFilters ? colors.white : colors.primary}
              />
              {hasActiveFilters && (
                <View style={styles.filterDot} />
              )}
            </TouchableOpacity>
            <Text style={styles.leadCount}>{leads.length} leads</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18}
                color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filtersContainer, { paddingBottom: insets.bottom + 80 }]}
          style={styles.filtersScroll}
        >
          {STATUS_FILTERS.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.filterChip,
                activeFilter === item.value && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(item.value)}
            >
              <Text style={[
                styles.filterText,
                activeFilter === item.value && styles.filterTextActive,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Leads List */}
        <FlatList
          data={[
            // Pinned section header
            ...(filteredPinned.length > 0
              ? [{ _id: 'pinned-header', isHeader: true, headerTitle: `📌 Pinned (${filteredPinned.length})` }]
              : []),
            ...filteredPinned.map(l => ({ ...l, _listKey: `pinned-${l._id}`, isHeader: false })),

            // Divider agar dono hain
            ...(filteredPinned.length > 0 && filteredUnpinned.length > 0
              ? [{ _id: 'divider', isDivider: true }]
              : []),

            // Unpinned section header
            ...(filteredUnpinned.length > 0
              ? [{ _id: 'unpinned-header', isHeader: true, headerTitle: `All Leads (${filteredUnpinned.length})` }]
              : []),
            ...filteredUnpinned.map(l => ({ ...l, _listKey: `unpinned-${l._id}`, isHeader: false })),
          ] as any[]}
          keyExtractor={(item) => item._listKey || item._id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64}
                color={colors.textLight} />
              <Text style={styles.emptyText}>
                {isLoading ? 'Loading...' : 'No leads found'}
              </Text>
              <Text style={styles.emptySubText}>
                {search
                  ? 'Try different search terms'
                  : 'Leads will appear here when assigned'}
              </Text>
            </View>
          }
          renderItem={({ item }: any) => {
            // Section Header
            if (item.isHeader) {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{item.headerTitle}</Text>
                </View>
              );
            }
            // Divider
            if (item.isDivider) {
              return <View style={styles.sectionDivider} />;
            }
            // Lead Card
            return (
              <LeadCard
                lead={item}
                onPress={() =>
                  navigation.navigate('LeadDetail', { leadId: item._id })
                }
                onUninterested={() => handleUninterested(item)}
              />
            );
          }}
        />

        {/* Advanced Filter Modal */}
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApply={(filters) => setAdvancedFilters(filters)}
          currentFilters={advancedFilters}
        />

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: colors.background, flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.base,
    paddingTop: spacing.sm, paddingBottom: spacing.xs,
  },
  headerRight: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  title: {
    fontSize: typography.xxl, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  filterBtn: {
    backgroundColor: colors.primaryLight,
    padding: spacing.sm, borderRadius: 10,
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
  },
  filterDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.error,
  },
  leadCount: {
    fontSize: typography.sm, color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, marginHorizontal: spacing.base,
    marginBottom: spacing.xs, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm, elevation: 1, shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3,
  },
  searchInput: { flex: 1, fontSize: typography.base, color: colors.textPrimary },
  filtersScroll: { maxHeight: 60, flexGrow: 0 },
  filtersContainer: {
    paddingHorizontal: spacing.base, paddingVertical: spacing.xl,
    gap: spacing.sm, flexDirection: 'row', alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 20, backgroundColor: colors.white, borderWidth: 1,
    borderColor: colors.border, height: 34,
    justifyContent: 'center', alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  filterText: {
    fontSize: typography.sm, color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  filterTextActive: { color: colors.white, fontWeight: typography.bold },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },

  // Section Headers
  sectionHeader: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sm, fontWeight: typography.bold,
    color: colors.textSecondary, letterSpacing: 0.5,
  },
  sectionDivider: {
    height: 1, backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  // Lead Card
  leadCard: {
    backgroundColor: colors.white, borderRadius: 14,
    flexDirection: 'row', overflow: 'hidden', elevation: 2,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  pinnedCard: {
    borderWidth: 1.5, borderColor: colors.primary,
    elevation: 4,
  },
  pinnedIndicator: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderBottomLeftRadius: 8, flexDirection: 'row',
    alignItems: 'center', gap: 4, zIndex: 1,
  },
  pinnedText: {
    fontSize: 10, color: colors.white,
    fontWeight: typography.bold,
  },
  colorBar: { width: 4 },
  cardContent: { flex: 1, padding: spacing.md, gap: spacing.xs },
  cardTop: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.md, fontWeight: typography.bold,
    color: colors.primary,
  },
  leadInfo: { flex: 1 },
  leadName: {
    fontSize: typography.base, fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  leadPhone: {
    fontSize: typography.sm, color: colors.textSecondary, marginTop: 2,
  },
  leadCar: {
    fontSize: typography.xs, color: colors.primary,
    marginTop: 2, fontWeight: typography.medium,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 8,
  },
  statusText: { fontSize: typography.xs, fontWeight: typography.semiBold },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sourceText: { fontSize: typography.xs, color: colors.textSecondary },
  actionButtons: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    backgroundColor: colors.primaryLight, padding: spacing.sm, borderRadius: 8,
  },
  whatsappBtn: { backgroundColor: '#E8FFF1' },
  emptyState: {
    alignItems: 'center', paddingTop: spacing.xxxl * 2, gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.lg, fontWeight: typography.semiBold,
    color: colors.textSecondary,
  },
  emptySubText: {
    fontSize: typography.sm, color: colors.textLight, textAlign: 'center',
  },
});