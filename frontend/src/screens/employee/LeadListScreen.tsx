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
import {
  LayoutList,
  Flame,
  Target,
  Snowflake,
  PhoneCall,
  CircleCheckBig,
  LucideIcon,
} from 'lucide-react-native';

// ─────────────────────────────────────────────
type StatusFilter = {
  label: string;
  value: LeadStatus | 'All';
  icon: LucideIcon;
  color: string;
};

const STATUS_FILTERS: StatusFilter[] = [
  { label: 'All', value: 'All', icon: LayoutList, color: colors.textSecondary },
  { label: 'Hot', value: 'Hot', icon: Flame, color: colors.statusHot },            // red
  { label: 'Warm', value: 'Warm', icon: Target, color: colors.warning },             // amber
  { label: 'Cold', value: 'Cold', icon: Snowflake, color: colors.primary },             // blue
  { label: 'Follow Up', value: 'Follow Up', icon: PhoneCall, color: colors.statusFollowUp },      // purple
  { label: 'Booked', value: 'Booked', icon: CircleCheckBig, color: colors.statusBooked },         // green
];

const STATUS_COLORS: Record<string, string> = {
  Hot: colors.statusHot,
  Warm: colors.warning,
  Cold: colors.primary,
  'Follow Up': colors.statusFollowUp,
  Booked: colors.statusBooked,
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
const formatLeadDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const LeadCard = React.memo(({
  lead,
  onPress,
  onUninterested,
  onTogglePin,
  showDate = false,
}: {
  lead: Lead;
  onPress: () => void;
  onUninterested: () => void;
  onTogglePin: () => void;
  showDate?: boolean;
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
            {showDate && (
              <>
                <Text style={styles.sourceText}>·</Text>
                <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.sourceText}>{formatLeadDate(lead.createdAt)}</Text>
              </>
            )}
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
// FilterModal Component
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
    const errs: Partial<typeof EMPTY_FORM> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.primaryPhone.trim()) errs.primaryPhone = 'Primary phone is required';
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
          <View style={addStyles.handle} />

          <View style={filterStyles.header}>
            <Text style={filterStyles.title}>Add New Lead</Text>
            <TouchableOpacity onPress={resetAndClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={addStyles.scroll}
            contentContainerStyle={addStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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

  const {
    leads,
    fetchLeads,
    isLoading, updateStatus, togglePin,
  } = useLeadStore();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<LeadStatus | 'All'>('All');

  // Determine which lead list to show. `leads` is already scoped to
  // today's window for employees by the backend (getMyLeads), so this is
  // simply "My Leads" — Today's Leads from the dashboard now points here
  // too (same screen, no special param needed). Previous Pending and
  // Booked have their own dedicated screens (PreviousPendingScreen /
  // BookedLeadsScreen) and never render through this component.
  const displayLeads = React.useMemo(() => {
    if (activeFilter !== 'All') {
      return leads.filter((l) => l.status === activeFilter);
    }
    return leads;
  }, [leads, activeFilter]);

  const screenTitle = 'My Leads';

  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any>({});

  // Keep a ref mirror of the current filter/search so the focus effect
  // always reads the *latest* selection instead of a stale closure value.
  const activeFilterRef = React.useRef(activeFilter);
  const searchRef = React.useRef(search);
  React.useEffect(() => {
    activeFilterRef.current = activeFilter;
  }, [activeFilter]);
  React.useEffect(() => {
    searchRef.current = search;
  }, [search]);

  // Re-fetch on focus (e.g. when returning from Lead Details) WITHOUT
  // resetting the currently selected filter/search. Previously this called
  // fetchLeads() with no arguments, which replaced the store's `leads` with
  // the full unfiltered list every time the screen regained focus — wiping
  // out whatever status filter (Hot/Warm/Cold/Follow Up/etc.) was active,
  // even though the chip itself stayed visually selected. We now read the
  // latest filter/search from refs and pass them through to fetchLeads so
  // the result set always matches the active filter.
  useFocusEffect(
    useCallback(() => {
      fetchLeads({
        search: searchRef.current || undefined,
        status: activeFilterRef.current !== 'All' ? activeFilterRef.current : undefined,
      });
    }, [])
  );

  // Debounced fetch whenever the user explicitly changes search or filter.
  React.useEffect(() => {
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
    await fetchLeads({
      search: search || undefined,
      status: activeFilter !== 'All' ? activeFilter : undefined,
    });
    setRefreshing(false);
  };

  const handleLeadAdded = async (leadName: string) => {
    Toast.show({
      type: 'success',
      text1: 'Lead Added ✅',
      text2: `${leadName} has been added successfully`,
      visibilityTime: 2500,
    });
    await fetchLeads();
  };

  // FIX: 'Uninterested' is not one of the 5 valid statuses
  // (Hot / Warm / Cold / Follow Up / Booked). Using it here would get
  // rejected by the backend's status enum validator. Swapped to 'Cold',
  // which is this app's equivalent of a deprioritised lead.
  const handleUninterested = async (lead: Lead) => {
    try {
      await updateStatus(lead._id, 'Cold');
      Toast.show({
        type: 'info',
        text1: 'Marked Cold',
        text2: `${lead.name} marked as cold`,
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

  const applyAdvancedFilter = useCallback((lead: Lead) => {
    if (advancedFilters.city &&
      !lead.city?.toLowerCase().includes(advancedFilters.city.toLowerCase())) return false;
    if (advancedFilters.car &&
      !lead.car?.toLowerCase().includes(advancedFilters.car.toLowerCase())) return false;
    if (advancedFilters.source && lead.source !== advancedFilters.source) return false;
    return true;
  }, [advancedFilters]);

  const listData = React.useMemo((): ListItem[] => {
    const sourceLeads = displayLeads;
    const pinnedLeads = sourceLeads.filter((l) => l.isPinned);
    const unpinnedLeads = sourceLeads.filter((l) => !l.isPinned);
    const filteredPinned = pinnedLeads.filter(applyAdvancedFilter);
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
    // FIX: this previously depended on [leads, applyAdvancedFilter] while
    // actually reading `displayLeads` inside the memo body. `displayLeads`
    // can change (e.g. switching between todayLeads/leads/pendingLeads, or
    // the activeFilter changing) without the raw `leads` reference changing,
    // so listData silently kept stale data in those cases. Depending on
    // displayLeads directly fixes that.
  }, [displayLeads, applyAdvancedFilter]);

  // The header count must always match what's actually rendered in the
  // FlatList below — i.e. the same pinned + unpinned leads from listData,
  // counting only real lead items (headers/dividers excluded). Previously
  // this text always read `leads.length` (the raw, full store list) no
  // matter which dataset displayLeads/listData were actually showing,
  // which caused the header to read "28 leads" while the list itself
  // (built from todayLeads, pendingLeads, or a filtered subset) rendered
  // zero items and showed "No leads found".
  const visibleLeadCount = React.useMemo(
    () => listData.filter((item) => !item.isHeader && !item.isDivider).length,
    [listData]
  );

  const keyExtractor = useCallback((item: ListItem) => {
    if (item.isDivider) return 'divider';
    if (item.isHeader) return `header-${item._id}`;
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
  }, []);

  const hasActiveFilters = Object.values(advancedFilters).some((v) => v !== '');

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        <View style={styles.header}>
          <Text style={styles.title}>{screenTitle}</Text>
          <View style={styles.headerRight}>
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

        <Text style={styles.leadCount}>{visibleLeadCount} leads</Text>

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

        {/* Status Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          style={styles.filtersScroll}
        >
          {STATUS_FILTERS.map((f) => {
            const Icon = f.icon;
            const isActive = activeFilter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[
                  styles.filterChip,
                  isActive && {
                    backgroundColor: `${f.color}15`,
                    borderColor: f.color,
                  },
                ]}
                onPress={() => setActiveFilter(f.value)}
              >
                <Icon size={15} color={f.color} />
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isActive ? f.color : colors.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <FlatList<ListItem>
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          extraData={listData}
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

        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApply={(filters) => setAdvancedFilters(filters)}
          currentFilters={advancedFilters}
        />

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

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.base,
    paddingTop: spacing.sm, paddingBottom: spacing.xs, gap: spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  routeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.base, marginBottom: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 10, borderWidth: 1,
  },
  routeBannerText: {
    fontSize: typography.xs, fontWeight: typography.medium, flex: 1,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: {
    fontSize: typography.xxl, fontWeight: typography.bold,
    color: colors.textPrimary, flex: 1,
  },

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

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, marginHorizontal: spacing.base,
    marginBottom: spacing.xs, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm, elevation: 1, shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  searchInput: { flex: 1, fontSize: typography.base, color: colors.textPrimary },

  filtersScroll: { maxHeight: 60, flexGrow: 0 },
  filtersContainer: {
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    gap: spacing.sm, flexDirection: 'row', alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border,
    height: 36, justifyContent: 'center',
  },
  filterText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: typography.medium },

  listContent: { paddingHorizontal: spacing.base, paddingTop: spacing.xs, gap: spacing.sm },

  sectionHeader: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  sectionTitle: {
    fontSize: typography.sm, fontWeight: typography.bold,
    color: colors.textSecondary, letterSpacing: 0.5,
  },
  sectionDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

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
  // FIX: cardBottom previously had no top spacing from cardTop other than
  // the parent's `gap: spacing.xs`, which felt cramped under the avatar
  // row on smaller screens. Added explicit marginTop for breathing room.
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 2,
  },
  sourceChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sourceText: { fontSize: typography.xs, color: colors.textSecondary },
  actionButtons: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { backgroundColor: colors.primaryLight, padding: spacing.sm, borderRadius: 8 },
  whatsappBtn: { backgroundColor: '#E8FFF1' },

  emptyState: { alignItems: 'center', paddingTop: spacing.xxxl * 2, gap: spacing.sm },
  emptyText: { fontSize: typography.lg, fontWeight: typography.semiBold, color: colors.textSecondary },
  emptySubText: { fontSize: typography.sm, color: colors.textLight, textAlign: 'center' },
});

// ─────────────────────────────────────────────
// Filter Modal Styles (shared with AddLeadModal)
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