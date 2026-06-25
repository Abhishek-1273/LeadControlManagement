import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, RefreshControl,
  ScrollView, Linking, ActivityIndicator,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useLeadStore } from '../../store/leadStore';
import { useAdminStore } from '../../store/adminStore';
import { LeadStatus } from '../../types/lead.types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import axiosInstance from '../../api/axiosInstance';
import Toast from 'react-native-toast-message';
import {
  LayoutList,
  Flame,
  Target,
  Snowflake,
  Clock,
  CircleCheckBig,
  LucideIcon,
} from 'lucide-react-native';

// ─────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  'New': '#6B7280',
  'Interested': '#EF4444',
  'Contacted': '#F59E0B',
  'Not Interested': '#3B82F6',
  'Pending': '#D97706',
  'Booked': '#059669',
};

type StatusFilter = {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
};

const STATUS_FILTERS: StatusFilter[] = [
  { label: 'New', value: 'New', icon: LayoutList, color: '#6B7280' },
  { label: 'Interested', value: 'Interested', icon: Flame, color: '#EF4444' },
  { label: 'Contacted', value: 'Contacted', icon: Target, color: '#F59E0B' },
  { label: 'Not Interested', value: 'Not Interested', icon: Snowflake, color: '#3B82F6' },
  { label: 'Pending', value: 'Pending', icon: Clock, color: '#D97706' },
  { label: 'Booked', value: 'Booked', icon: CircleCheckBig, color: '#059669' },
];

const PHONE_REGEX = /^\d{10}$/;
const EMPTY_FORM = {
  name: '', primaryPhone: '', secondaryPhone: '',
  email: '', city: '', car: '',
};

// ─────────────────────────────────────────────
// AddLeadModal
// ─────────────────────────────────────────────
interface Employee { _id: string; name: string; }

function AddLeadModal({
  visible, onClose, onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: (leadName: string) => void;
}) {
  const { createLead } = useLeadStore();

  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState<LeadStatus>('New');
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM & { assignedTo: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [empLoading, setEmpLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setEmpLoading(true);
    axiosInstance.get('/admin/employees')
      .then((res) => {
        const list: Employee[] = Array.isArray(res.data)
          ? res.data
          : res.data.employees ?? [];
        setEmployees(list);
      })
      .catch(() => { })
      .finally(() => setEmpLoading(false));
  }, [visible]);

  const setField = (field: keyof typeof EMPTY_FORM) => (val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setIsSubmitting(false);
    setSelectedEmployee(null);
    setStatus('New');
    onClose();
  };

  const handleSubmit = async () => {
    const errs: any = {};
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
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

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
        assignedTo: selectedEmployee?._id,
        status: status !== 'New' ? status : undefined,
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

          <View style={addStyles.sheetHeader}>
            <Text style={addStyles.sheetTitle}>Add New Lead</Text>
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

            <Text style={addStyles.label}>👤 Full Name</Text>
            <TextInput
              style={[addStyles.input, errors.name ? addStyles.inputError : null]}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={colors.textLight}
              value={form.name}
              onChangeText={setField('name')}
              autoCapitalize="words"
              maxLength={120}
            />
            {errors.name ? <Text style={addStyles.errText}>{errors.name}</Text> : null}

            <Text style={addStyles.label}>📞 Primary Phone</Text>
            <TextInput
              style={[addStyles.input, errors.primaryPhone ? addStyles.inputError : null]}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.textLight}
              value={form.primaryPhone}
              onChangeText={(v) => setField('primaryPhone')(v.replace(/\D/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {errors.primaryPhone ? <Text style={addStyles.errText}>{errors.primaryPhone}</Text> : null}

            <Text style={[addStyles.sectionLabel, { marginTop: spacing.md }]}>OPTIONAL</Text>

            <Text style={addStyles.label}>📱 Secondary Phone</Text>
            <TextInput
              style={[addStyles.input, errors.secondaryPhone ? addStyles.inputError : null]}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.textLight}
              value={form.secondaryPhone}
              onChangeText={(v) => setField('secondaryPhone')(v.replace(/\D/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {errors.secondaryPhone ? <Text style={addStyles.errText}>{errors.secondaryPhone}</Text> : null}

            <Text style={addStyles.label}>✉️ Email</Text>
            <TextInput
              style={[addStyles.input, errors.email ? addStyles.inputError : null]}
              placeholder="e.g. rahul@email.com"
              placeholderTextColor={colors.textLight}
              value={form.email}
              onChangeText={setField('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={120}
            />
            {errors.email ? <Text style={addStyles.errText}>{errors.email}</Text> : null}

            <Text style={addStyles.label}>📍 City</Text>
            <TextInput
              style={addStyles.input}
              placeholder="e.g. Pune"
              placeholderTextColor={colors.textLight}
              value={form.city}
              onChangeText={setField('city')}
              autoCapitalize="words"
              maxLength={80}
            />

            <Text style={addStyles.label}>🚗 Car / Vehicle Interest</Text>
            <TextInput
              style={addStyles.input}
              placeholder="e.g. Swift Dzire"
              placeholderTextColor={colors.textLight}
              value={form.car}
              onChangeText={setField('car')}
              autoCapitalize="words"
              maxLength={80}
            />

            <Text style={addStyles.label}>🏷️ Status</Text>
            <View style={addStyles.statusChipRow}>
              {STATUS_FILTERS.map((opt) => {
                const isActive = status === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      addStyles.statusChip,
                      isActive && { borderColor: opt.color, backgroundColor: opt.color + '15' },
                    ]}
                    onPress={() => setStatus(opt.value as LeadStatus)}
                  >
                    <View style={[addStyles.statusChipDot, { backgroundColor: opt.color }]} />
                    <Text style={[
                      addStyles.statusChipText,
                      isActive && { color: opt.color, fontWeight: '700' },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[addStyles.sectionLabel, { marginTop: spacing.md }]}>ASSIGN</Text>
            <Text style={addStyles.label}>👔 Assign to Employee</Text>

            {empLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
            ) : (
              <>
                <TouchableOpacity
                  style={[addStyles.input, addStyles.pickerBtn]}
                  onPress={() => setShowPicker(true)}
                >
                  <Text style={selectedEmployee ? addStyles.pickerValue : addStyles.pickerPlaceholder}>
                    {selectedEmployee ? selectedEmployee.name : 'Leave unassigned'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                {showPicker && (
                  <View style={addStyles.pickerList}>
                    <TouchableOpacity
                      style={addStyles.pickerItem}
                      onPress={() => { setSelectedEmployee(null); setShowPicker(false); }}
                    >
                      <Text style={addStyles.pickerItemText}>— Leave unassigned</Text>
                    </TouchableOpacity>
                    {employees.map((emp) => (
                      <TouchableOpacity
                        key={emp._id}
                        style={[
                          addStyles.pickerItem,
                          selectedEmployee?._id === emp._id && addStyles.pickerItemActive,
                        ]}
                        onPress={() => { setSelectedEmployee(emp); setShowPicker(false); }}
                      >
                        <Text style={[
                          addStyles.pickerItemText,
                          selectedEmployee?._id === emp._id && addStyles.pickerItemTextActive,
                        ]}>
                          {emp.name}
                        </Text>
                        {selectedEmployee?._id === emp._id && (
                          <Ionicons name="checkmark" size={16} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={addStyles.footer}>
            <TouchableOpacity style={addStyles.cancelBtn} onPress={resetAndClose}>
              <Text style={addStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[addStyles.saveBtn, isSubmitting && addStyles.btnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={addStyles.saveText}>Save Lead</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function AdminLeadsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  // FIX: Previously used fetchLeads from leadStore which hits /leads (getMyLeads).
  // Even though getMyLeads doesn't filter by assignedTo for admins, it shares
  // the Zustand `leads` state with the employee flow — causing stale state issues
  // and subtle scoping bugs in production. Switch to fetchAllLeads from adminStore
  // which hits /admin/leads (getAllLeads) — the purpose-built admin endpoint.
  const { fetchAllLeads } = useAdminStore();
  const { createLead } = useLeadStore(); // still needed for AddLeadModal
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('New');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Build YYYY-MM-DD from local calendar (not UTC) to avoid midnight IST shift
  const getTodayFilter = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Prevents the search/filter useEffect from firing a redundant fetch when
  // useFocusEffect resets state — those two setState calls trigger useEffect
  // with the OLD state values (async update), overwriting the correct results.
  const skipNextEffect = React.useRef(false);

  const loadLeads = React.useCallback(async (searchVal = search, filterVal = activeFilter) => {
    setIsLoading(true);
    try {
      const filters: Record<string, string> = {};
      // Only pending shows all-time leads; every other chip = today only
      if (filterVal !== 'Pending') {
        filters.dateFrom = getTodayFilter();
        filters.dateTo = getTodayFilter();
      }
      if (searchVal) filters.search = searchVal;
      filters.status = filterVal;
      const { leads: data } = await fetchAllLeads(filters);
      setLeads(data);
    } catch (err: any) {
      console.error('AdminLeadsScreen fetchAllLeads error:', err.message);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

// AFTER
const searchRef = React.useRef(search);
const activeFilterRef = React.useRef(activeFilter);
React.useEffect(() => { searchRef.current = search; }, [search]);
React.useEffect(() => { activeFilterRef.current = activeFilter; }, [activeFilter]);

useFocusEffect(
  React.useCallback(() => {
    // Refetch with current filter/search — no reset, no need to
    // skip the next effect since we're not touching search/activeFilter state.
    loadLeads(searchRef.current, activeFilterRef.current);
  }, [])
);

  useEffect(() => {
    // Skip the first fire caused by useFocusEffect's setState calls above.
    if (skipNextEffect.current) {
      skipNextEffect.current = false;
      return;
    }
    const timer = setTimeout(() => {
      loadLeads(search, activeFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeads(search, activeFilter);
    setRefreshing(false);
  };

  const handleLeadAdded = async (leadName: string) => {
    Toast.show({
      type: 'success',
      text1: 'Lead Added ✅',
      text2: `${leadName} has been added successfully`,
      visibilityTime: 2500,
    });
    await loadLeads(search, activeFilter);
  };



  const renderLead = ({ item }: { item: any }) => {
    const statusColor = STATUS_COLORS[item.status] || colors.primary;
    return (
      <TouchableOpacity
        style={styles.leadCard}
        onPress={() => navigation.navigate('AdminLeadDetail', { leadId: item._id })}
        activeOpacity={0.7}
      >
        <View style={[styles.colorBar, { backgroundColor: statusColor }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.leadInfo}>
              <Text style={styles.leadName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.leadPhone}>{item.phone}</Text>
              {item.car && <Text style={styles.leadCar}>🚗 {item.car}</Text>}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            </View>
          </View>

          <View style={styles.cardBottom}>
            <View style={styles.assignedChip}>
              <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.assignedText} numberOfLines={1}>
                {item.assignedTo?.name || 'Unassigned'}
              </Text>
            </View>
            <View style={styles.actionBtns}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                <Ionicons name="call" size={15} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.waBtn]} onPress={() => Linking.openURL(`https://wa.me/91${item.phone}`)}>
                <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
              </TouchableOpacity>

            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Today's Leads <Text style={styles.countInline}>({leads.length})</Text>
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
              <Ionicons name="person-add" size={18} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.archiveBtn}
              onPress={() => navigation.navigate('LeadArchive')}
            >
              <Ionicons name="archive-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
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

        {/* Leads List */}
        <FlatList
          data={leads}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>{isLoading ? 'Loading...' : 'No leads found'}</Text>
            </View>
          }
          renderItem={renderLead}
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
  wrapper: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.base,
    paddingTop: spacing.sm, paddingBottom: spacing.xs,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: typography.xxl, fontWeight: typography.bold, color: colors.textPrimary },
  countInline: { fontSize: typography.sm, fontWeight: typography.medium, color: colors.textSecondary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 10,
  },
  addBtnText: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.white },
  bulkDeleteBtn: {
    backgroundColor: '#FFF0F0', padding: spacing.sm,
    borderRadius: 10, borderWidth: 1, borderColor: '#FFCDD2',
  },
  archiveBtn: {
    backgroundColor: colors.primaryLight, padding: spacing.sm,
    borderRadius: 10, borderWidth: 1, borderColor: colors.primary + '40',
  },
  deleteBtn: { backgroundColor: '#FFF0F0' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, marginHorizontal: spacing.base,
    marginBottom: spacing.xs, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm, elevation: 1,
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

  listContent: {
    paddingHorizontal: spacing.base, paddingBottom: spacing.xl,
    paddingTop: spacing.xs, gap: spacing.sm,
  },
  leadCard: {
    backgroundColor: colors.white, borderRadius: 14,
    flexDirection: 'row', overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  colorBar: { width: 4 },
  cardContent: { flex: 1, padding: spacing.md, gap: spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: typography.md, fontWeight: typography.bold, color: colors.primary },
  leadInfo: { flex: 1 },
  leadName: { fontSize: typography.base, fontWeight: typography.semiBold, color: colors.textPrimary },
  leadPhone: { fontSize: typography.sm, color: colors.textSecondary },
  leadCar: { fontSize: typography.xs, color: colors.primary, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: typography.xs, fontWeight: typography.semiBold },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assignedChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assignedText: { fontSize: typography.xs, color: colors.textSecondary, maxWidth: 120 },
  actionBtns: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { backgroundColor: colors.primaryLight, padding: spacing.sm, borderRadius: 8 },
  waBtn: { backgroundColor: '#E8FFF1' },
  emptyState: { alignItems: 'center', paddingTop: 100, gap: spacing.sm },
  emptyText: { fontSize: typography.lg, color: colors.textSecondary, fontWeight: typography.semiBold },
});

const addStyles = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginTop: spacing.sm, marginBottom: 2,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.textPrimary },
  scroll: { flexGrow: 0 },
  scrollContent: { padding: spacing.base, paddingTop: 0 },
  sectionLabel: {
    fontSize: 11, fontWeight: typography.bold, color: colors.textLight,
    letterSpacing: 0.8, marginTop: spacing.md, marginBottom: 2,
  },
  label: {
    fontSize: typography.sm, fontWeight: typography.semiBold,
    color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.background, borderRadius: 10,
    padding: spacing.md, fontSize: typography.base,
    color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  inputError: { borderColor: colors.error, backgroundColor: '#FFF5F5' },
  errText: { fontSize: 12, color: colors.error, marginTop: 3, marginLeft: 2 },
  pickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pickerValue: { fontSize: typography.base, color: colors.textPrimary },
  pickerPlaceholder: { fontSize: typography.base, color: colors.textLight },
  pickerList: {
    backgroundColor: colors.white, borderRadius: 10, marginTop: 4,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  pickerItemActive: { backgroundColor: colors.primaryLight },
  pickerItemText: { fontSize: typography.base, color: colors.textPrimary },
  pickerItemTextActive: { color: colors.primary, fontWeight: typography.semiBold },
  statusChipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 2,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.background,
  },
  statusChipDot: { width: 8, height: 8, borderRadius: 4 },
  statusChipText: { fontSize: typography.sm, color: colors.textPrimary },
  footer: {
    flexDirection: 'row', gap: spacing.md,
    padding: spacing.base, borderTopWidth: 1, borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  cancelText: { fontSize: typography.base, color: colors.textSecondary, fontWeight: typography.semiBold },
  saveBtn: {
    flex: 2, padding: spacing.md, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  saveText: { fontSize: typography.base, color: colors.white, fontWeight: typography.bold },
  btnDisabled: { opacity: 0.6 },
});