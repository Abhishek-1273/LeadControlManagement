import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, RefreshControl,
  Linking, ScrollView, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform,
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

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
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

const PHONE_REGEX = /^\d{10}$/;

// ─────────────────────────────────────────────
// Types for FlatList items
// ─────────────────────────────────────────────
type HeaderItem = {
  _id: string;
  isHeader: true;
  isDivider?: false;
  headerTitle: string;
};
type DividerItem = {
  _id: string;
  isHeader?: false;
  isDivider: true;
};
type LeadItem = Lead & {
  isHeader: false;
  isDivider?: false;
};
type ListItem = HeaderItem | DividerItem | LeadItem;

// ─────────────────────────────────────────────
// LeadCard Component
// ─────────────────────────────────────────────
const LeadCard = React.memo(({
  lead,
  onPress,
  onUninterested,
  onTogglePin,
}: {
  lead: Lead;
  onPress: () => void;
  onUninterested: () => void;
  onTogglePin: () => void;
}) => {
  const statusColor = STATUS_COLORS[lead.status] || colors.primary;

  return (
    <TouchableOpacity
      style={[styles.leadCard, lead.isPinned && styles.pinnedCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {lead.isPinned && (
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

// ─────────────────────────────────────────────
// FilterModal Component  (unchanged)
// ─────────────────────────────────────────────
const FilterModal = ({
  visible, onClose, onApply, currentFilters,
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
            <Text style={filterStyles.label}>📍 City</Text>
            <TextInput
              style={filterStyles.input}
              placeholder="Enter city..."
              placeholderTextColor={colors.textLight}
              value={city}
              onChangeText={setCity}
            />

            <Text style={filterStyles.label}>🚗 Car/Vehicle</Text>
            <TextInput
              style={filterStyles.input}
              placeholder="Enter car model..."
              placeholderTextColor={colors.textLight}
              value={car}
              onChangeText={setCar}
            />

            <Text style={filterStyles.label}>🌐 Source</Text>
            <View style={filterStyles.chipRow}>
              {['WhatsApp', 'Facebook', 'Instagram', 'Walk-in', 'Referral'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[filterStyles.chip, source === s && filterStyles.chipActive]}
                  onPress={() => setSource(source === s ? '' : s)}
                >
                  <Text style={[filterStyles.chipText, source === s && filterStyles.chipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={filterStyles.footer}>
            <TouchableOpacity
              style={filterStyles.clearBtn}
              onPress={() => { setCity(''); setCar(''); setSource(''); onApply({}); onClose(); }}
            >
              <Text style={filterStyles.clearText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={filterStyles.applyBtn}
              onPress={() => { onApply({ city, car, source }); onClose(); }}
            >
              <Text style={filterStyles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// AddLeadModal Component
// ─────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', primaryPhone: '', secondaryPhone: '',
  email: '', city: '', car: '',
};

const AddLeadModal = ({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: (leadName: string) => void;
}) => {
  const { createLead } = useLeadStore();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (field: keyof typeof EMPTY_FORM) => (val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    // ── Client-side validation ──
    const errs: Partial<typeof EMPTY_FORM> = {};
    if (!form.name.trim())                        errs.name = 'Name is required';
    if (!form.primaryPhone.trim())                errs.primaryPhone = 'Primary phone is required';
    else if (!PHONE_REGEX.test(form.primaryPhone)) errs.primaryPhone = 'Must be a valid 10-digit number';

    if (form.secondaryPhone.trim()) {
      if (!PHONE_REGEX.test(form.secondaryPhone)) errs.secondaryPhone = 'Must be a valid 10-digit number';
      else if (form.secondaryPhone === form.primaryPhone) errs.secondaryPhone = 'Cannot match primary phone';
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errs.email = 'Invalid email';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      await createLead({
        name: form.name.trim(),
        primaryPhone: form.primaryPhone.trim(),
        secondaryPhone: form.secondaryPhone.trim() || undefined,
        email: form.email.trim() || undefined,
        city: form.city.trim() || undefined,
        car: form.car.trim() || undefined,
        source: 'Manual',
      });
      onSuccess(form.name.trim());
      resetAndClose();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg: string = err?.response?.data?.message || 'Something went wrong';
      if (status === 409) {
        setErrors({
          primaryPhone: 'Lead already exists with this number.',
          secondaryPhone: form.secondaryPhone.trim() ? 'Lead already exists with this number.' : '',
        });
        Toast.show({ type: 'error', text1: 'Duplicate Lead ⚠️', text2: msg, visibilityTime: 3000 });
      } else {
        Toast.show({ type: 'error', text1: 'Error ❌', text2: msg, visibilityTime: 3000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
      <KeyboardAvoidingView
        style={addStyles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={addStyles.overlay} activeOpacity={1} onPress={resetAndClose} />

        <View style={addStyles.sheet}>
          {/* ── Handle bar ── */}
          <View style={addStyles.handle} />

          {/* ── Header ── */}
          <View style={filterStyles.header}>
            <Text style={filterStyles.title}>Add New Lead</Text>
            <TouchableOpacity onPress={resetAndClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* ── Scrollable fields ── */}
          <ScrollView
            style={addStyles.scroll}
            contentContainerStyle={addStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Required fields */}
            <Text style={addStyles.sectionLabel}>REQUIRED</Text>

            <Text style={filterStyles.label}>👤 Full Name</Text>
            <TextInput
              style={[filterStyles.input, errors.name ? addStyles.inputError : null]}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={colors.textLight}
              value={form.name}
              onChangeText={set('name')}
              autoCapitalize="words"
              maxLength={120}
            />
            {errors.name ? <Text style={addStyles.errText}>{errors.name}</Text> : null}

            <Text style={filterStyles.label}>📞 Primary Phone</Text>
            <TextInput
              style={[filterStyles.input, errors.primaryPhone ? addStyles.inputError : null]}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.textLight}
              value={form.primaryPhone}
              onChangeText={(v) => set('primaryPhone')(v.replace(/\D/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {errors.primaryPhone ? <Text style={addStyles.errText}>{errors.primaryPhone}</Text> : null}

            {/* Optional fields */}
            <Text style={[addStyles.sectionLabel, { marginTop: spacing.md }]}>OPTIONAL</Text>

            <Text style={filterStyles.label}>📱 Secondary Phone</Text>
            <TextInput
              style={[filterStyles.input, errors.secondaryPhone ? addStyles.inputError : null]}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.textLight}
              value={form.secondaryPhone}
              onChangeText={(v) => set('secondaryPhone')(v.replace(/\D/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {errors.secondaryPhone ? <Text style={addStyles.errText}>{errors.secondaryPhone}</Text> : null}

            <Text style={filterStyles.label}>✉️ Email</Text>
            <TextInput
              style={[filterStyles.input, errors.email ? addStyles.inputError : null]}
              placeholder="e.g. rahul@email.com"
              placeholderTextColor={colors.textLight}
              value={form.email}
              onChangeText={set('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={120}
            />
            {errors.email ? <Text style={addStyles.errText}>{errors.email}</Text> : null}

            <Text style={filterStyles.label}>📍 City</Text>
            <TextInput
              style={filterStyles.input}
              placeholder="e.g. Pune"
              placeholderTextColor={colors.textLight}
              value={form.city}
              onChangeText={set('city')}
              autoCapitalize="words"
              maxLength={80}
            />

            <Text style={filterStyles.label}>🚗 Car / Vehicle Interest</Text>
            <TextInput
              style={filterStyles.input}
              placeholder="e.g. Swift Dzire"
              placeholderTextColor={colors.textLight}
              value={form.car}
              onChangeText={set('car')}
              autoCapitalize="words"
              maxLength={80}
            />
          </ScrollView>

          {/* ── Footer: Cancel + Save ── */}
          <View style={filterStyles.footer}>
            <TouchableOpacity style={filterStyles.clearBtn} onPress={resetAndClose}>
              <Text style={filterStyles.clearText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[filterStyles.applyBtn, isSubmitting && addStyles.btnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={filterStyles.applyText}>Save Lead</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function LeadListScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { leads, fetchLeads, isLoading, updateStatus, togglePin } = useLeadStore();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<LeadStatus | 'All'>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any>({});

  // ── Fetch on focus ──────────────────────────
  useFocusEffect(
    useCallback(() => {
      fetchLeads();
    }, [])
  );

  // ── Search / filter debounce ─────────────────
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads({
        search: search || undefined,
        status: activeFilter !== 'All' ? activeFilter : undefined,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, activeFilter]);

  // ── Handlers ────────────────────────────────
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  };

  const handleLeadAdded = async (leadName: string) => {
    Toast.show({
      type: 'success',
      text1: 'Lead Added ✅',
      text2: `${leadName} has been added successfully`,
      visibilityTime: 2500,
    });
    await fetchLeads();   // refresh list so new lead appears immediately
  };

  const handleUninterested = async (lead: Lead) => {
    try {
      await updateStatus(lead._id, 'Uninterested');
      Toast.show({
        type: 'info',
        text1: 'Marked Uninterested',
        text2: `${lead.name} marked as uninterested`,
        visibilityTime: 2000,
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Error ❌' });
    }
  };

  const handleTogglePin = async (lead: Lead) => {
    const wasPinned = lead.isPinned;
    try {
      await togglePin(lead._id);
      Toast.show({
        type: 'success',
        text1: wasPinned ? 'Unpinned' : 'Pinned 📌',
        text2: wasPinned ? `${lead.name} removed from pinned` : `${lead.name} pinned`,
        visibilityTime: 1500,
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed ❌', text2: 'Could not update pin' });
    }
  };

  // ── Advanced filter function ─────────────────
  const applyAdvancedFilter = useCallback((lead: Lead) => {
    if (advancedFilters.city &&
      !lead.city?.toLowerCase().includes(advancedFilters.city.toLowerCase())) return false;
    if (advancedFilters.car &&
      !lead.car?.toLowerCase().includes(advancedFilters.car.toLowerCase())) return false;
    if (advancedFilters.source && lead.source !== advancedFilters.source) return false;
    return true;
  }, [advancedFilters]);

  // ── Build typed list data ────────────────────
  const listData = React.useMemo((): ListItem[] => {
    const pinnedLeads   = leads.filter((l) => l.isPinned);
    const unpinnedLeads = leads.filter((l) => !l.isPinned);
    const filteredPinned   = pinnedLeads.filter(applyAdvancedFilter);
    const filteredUnpinned = unpinnedLeads.filter(applyAdvancedFilter);

    const items: ListItem[] = [];

    if (filteredPinned.length > 0) {
      items.push({ _id: 'pinned-header', isHeader: true, headerTitle: `📌 Pinned (${filteredPinned.length})` });
      filteredPinned.forEach((l) => items.push({ ...l, isHeader: false }));
    }

    if (filteredPinned.length > 0 && filteredUnpinned.length > 0) {
      items.push({ _id: 'divider', isDivider: true });
    }

    if (filteredUnpinned.length > 0) {
      items.push({ _id: 'unpinned-header', isHeader: true, headerTitle: `All Leads (${filteredUnpinned.length})` });
      filteredUnpinned.forEach((l) => items.push({ ...l, isHeader: false }));
    }

    return items;
  }, [leads, applyAdvancedFilter]);

  const keyExtractor = useCallback((item: ListItem) => {
    if (item.isDivider) return 'divider';
    if (item.isHeader)  return `header-${item._id}`;
    const lead = item as LeadItem;
    return `lead-${lead._id}-${lead.isPinned ? 'p' : 'u'}`;
  }, []);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.isDivider) return <View style={styles.sectionDivider} />;
    if (item.isHeader) {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.headerTitle}</Text>
        </View>
      );
    }
    const lead = item as LeadItem;
    return (
      <LeadCard
        lead={lead}
        onPress={() => navigation.navigate('LeadDetail', { leadId: lead._id })}
        onUninterested={() => handleUninterested(lead)}
        onTogglePin={() => handleTogglePin(lead)}
      />
    );
  }, [leads]);

  const hasActiveFilters = Object.values(advancedFilters).some((v) => v !== '');

  // ─────────────────────────────────────────────
  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>My Leads</Text>
          <View style={styles.headerRight}>
            {/* Add Lead button — lives right in the header */}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={16} color={colors.white} />
              <Text style={styles.addBtnText}>Add Lead</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons
                name="options"
                size={18}
                color={hasActiveFilters ? colors.white : colors.primary}
              />
              {hasActiveFilters && <View style={styles.filterDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Lead count row ── */}
        <Text style={styles.leadCount}>{leads.length} leads</Text>

        {/* ── Search Bar ── */}
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
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Status Filter Chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          style={styles.filtersScroll}
        >
          {STATUS_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[styles.filterChip, activeFilter === filter.value && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter.value)}
            >
              <Text style={[styles.filterText, activeFilter === filter.value && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Leads FlatList ── */}
        <FlatList<ListItem>
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          extraData={leads}
          removeClippedSubviews={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>
                {isLoading ? 'Loading...' : 'No leads found'}
              </Text>
              <Text style={styles.emptySubText}>
                {search ? 'Try different search terms' : 'Tap "Add Lead" to create your first lead'}
              </Text>
            </View>
          }
        />

        {/* ── Advanced Filter Modal ── */}
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApply={(filters) => setAdvancedFilters(filters)}
          currentFilters={advancedFilters}
        />

        {/* ── Add Lead Modal (bottom sheet) ── */}
        <AddLeadModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleLeadAdded}
        />

      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: { backgroundColor: colors.background, flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.base,
    paddingTop: spacing.sm, paddingBottom: spacing.xs,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: {
    fontSize: typography.xxl, fontWeight: typography.bold,
    color: colors.textPrimary,
  },

  // Add Lead button (header)
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: typography.sm, fontWeight: typography.bold, color: colors.white,
  },

  filterBtn: {
    backgroundColor: colors.primaryLight, padding: spacing.sm,
    borderRadius: 10, position: 'relative',
  },
  filterBtnActive: { backgroundColor: colors.primary },
  filterDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.error,
  },
  leadCount: {
    fontSize: typography.sm, color: colors.textSecondary,
    fontWeight: typography.medium,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xs,
  },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, marginHorizontal: spacing.base,
    marginBottom: spacing.xs, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm, elevation: 1, shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  searchInput: { flex: 1, fontSize: typography.base, color: colors.textPrimary },

  // Filter chips
  filtersScroll: { maxHeight: 50, flexGrow: 0 },
  filtersContainer: {
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    gap: spacing.sm, flexDirection: 'row', alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 20, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border,
    height: 34, justifyContent: 'center', alignItems: 'center',
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: typography.medium },
  filterTextActive: { color: colors.white, fontWeight: typography.bold },

  // List
  listContent: { paddingHorizontal: spacing.base, paddingTop: spacing.xs, gap: spacing.sm },

  // Section
  sectionHeader: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  sectionTitle: {
    fontSize: typography.sm, fontWeight: typography.bold,
    color: colors.textSecondary, letterSpacing: 0.5,
  },
  sectionDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

  // Lead Card
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
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sourceChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sourceText: { fontSize: typography.xs, color: colors.textSecondary },
  actionButtons: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { backgroundColor: colors.primaryLight, padding: spacing.sm, borderRadius: 8 },
  whatsappBtn: { backgroundColor: '#E8FFF1' },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: spacing.xxxl * 2, gap: spacing.sm },
  emptyText: { fontSize: typography.lg, fontWeight: typography.semiBold, color: colors.textSecondary },
  emptySubText: { fontSize: typography.sm, color: colors.textLight, textAlign: 'center' },
});

// ─────────────────────────────────────────────
// Filter Modal Styles  (shared with AddLeadModal)
// ─────────────────────────────────────────────
const filterStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.textPrimary },
  content: { padding: spacing.base },
  label: {
    fontSize: typography.sm, fontWeight: typography.semiBold,
    color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.background, borderRadius: 10,
    padding: spacing.md, fontSize: typography.base,
    color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.sm, color: colors.textSecondary },
  chipTextActive: { color: colors.white, fontWeight: typography.semiBold },
  footer: {
    flexDirection: 'row', gap: spacing.md,
    padding: spacing.base, borderTopWidth: 1, borderTopColor: colors.border,
  },
  clearBtn: {
    flex: 1, padding: spacing.md, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  clearText: { fontSize: typography.base, color: colors.textSecondary, fontWeight: typography.semiBold },
  applyBtn: {
    flex: 2, padding: spacing.md, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  applyText: { fontSize: typography.base, color: colors.white, fontWeight: typography.bold },
});

// ─────────────────────────────────────────────
// Add Lead Modal Styles
// ─────────────────────────────────────────────
const addStyles = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginTop: spacing.sm, marginBottom: 2,
  },
  scroll: { flexGrow: 0 },
  scrollContent: { padding: spacing.base, paddingTop: 0 },
  sectionLabel: {
    fontSize: 11, fontWeight: typography.bold,
    color: colors.textLight, letterSpacing: 0.8,
    marginTop: spacing.md, marginBottom: 2,
  },
  inputError: {
    borderColor: colors.error, backgroundColor: '#FFF5F5',
  },
  errText: {
    fontSize: 12, color: colors.error, marginTop: 3, marginLeft: 2,
  },
  btnDisabled: { opacity: 0.6 },
});
