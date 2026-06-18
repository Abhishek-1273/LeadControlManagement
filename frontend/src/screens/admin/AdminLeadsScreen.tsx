import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, RefreshControl,
  ScrollView, Linking, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useLeadStore } from '../../store/leadStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import axiosInstance from '../../api/axiosInstance';
import Toast from 'react-native-toast-message';

const STATUS_COLORS: Record<string, string> = {
  'New Lead': '#3B82F6',
  'Contacted': '#8B5CF6',
  'Follow Up': '#F59E0B',
  'Interested': '#10B981',
  'Visitor': '#06B6D4',
  'Booked': '#059669',
  'Uninterested': '#EF4444',
  'No Response': '#9CA3AF',
};

const STATUS_FILTERS = [
  { label: 'All', value: 'All' },
  { label: 'New', value: 'New Lead' },
  { label: 'Contacted', value: 'Contacted' },
  { label: 'Follow Up', value: 'Follow Up' },
  { label: 'Interested', value: 'Interested' },
  { label: 'Visitor', value: 'Visitor' },
  { label: 'Booked', value: 'Booked' },
  { label: 'Uninterested', value: 'Uninterested' },
];

export default function AdminLeadsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { leads, fetchLeads, isLoading } = useLeadStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchLeads();
    }, [])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads({
        search: search || undefined,
        status: activeFilter !== 'All' ? activeFilter as any : undefined,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  };

  const confirmBulkDelete = (days: number) => {
    const label = days === 1 ? '1 day' : days === 30 ? '1 month' : '6 months';
    Alert.alert(
      'Are you sure?',
      `All leads older than ${label} will be permanently deleted. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setBulkDeleting(true);
            try {
              const res = await axiosInstance.delete(`/leads/bulk?days=${days}`);
              fetchLeads();
              Toast.show({
                type: 'success',
                text1: 'Deleted ✅',
                text2: `${res.data.deletedCount} leads older than ${label} deleted`,
              });
            } catch {
              Toast.show({ type: 'error', text1: 'Failed ❌', text2: 'Could not delete leads' });
            } finally {
              setBulkDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Bulk Delete Leads',
      'Delete leads older than...',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '1 Day', onPress: () => confirmBulkDelete(1) },
        { text: '1 Month', onPress: () => confirmBulkDelete(30) },
        { text: '6 Months', onPress: () => confirmBulkDelete(180) },
      ]
    );
  };

  const handleDeleteLead = (item: any) => {
    Alert.alert(
      'Delete Lead',
      `Delete "${item.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await axiosInstance.delete(`/leads/${item._id}`);
              fetchLeads();
              Toast.show({ type: 'success', text1: 'Lead deleted ✅' });
            } catch {
              Toast.show({ type: 'error', text1: 'Failed ❌', text2: 'Could not delete lead' });
            }
          },
        },
      ]
    );
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

          {/* Top Row */}
          <View style={styles.cardTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name?.charAt(0).toUpperCase()}
              </Text>
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

          {/* Bottom Row */}
          <View style={styles.cardBottom}>
            <View style={styles.assignedChip}>
              <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.assignedText} numberOfLines={1}>
                {item.assignedTo?.name || 'Unassigned'}
              </Text>
            </View>
            <View style={styles.actionBtns}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
              >
                <Ionicons name="call" size={15} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.waBtn]}
                onPress={() => Linking.openURL(`https://wa.me/91${item.phone}`)}
              >
                <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => handleDeleteLead(item)}
              >
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
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
            All Leads{' '}
            <Text style={styles.countInline}>({leads.length})</Text>
          </Text>
          <TouchableOpacity
            style={[styles.bulkDeleteBtn, bulkDeleting && { opacity: 0.5 }]}
            onPress={handleBulkDelete}
            disabled={bulkDeleting}
          >
            {bulkDeleting
              ? <ActivityIndicator size={15} color="#EF4444" />
              : <Ionicons name="trash-outline" size={18} color="#EF4444" />
            }
          </TouchableOpacity>
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

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          style={styles.filtersScroll}
        >
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterChip, activeFilter === f.value && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.value)}
            >
              <Text style={[styles.filterText, activeFilter === f.value && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Leads List */}
        <FlatList
          data={leads}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
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
            </View>
          }
          renderItem={renderLead}
        />

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.base,
    paddingTop: spacing.sm, paddingBottom: spacing.xs,
  },
  title: {
    fontSize: typography.xxl, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  countInline: {
    fontSize: typography.sm, fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  bulkDeleteBtn: {
    backgroundColor: '#FFF0F0', padding: spacing.sm,
    borderRadius: 10, borderWidth: 1, borderColor: '#FFCDD2',
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
    paddingHorizontal: spacing.base, paddingVertical: spacing.xl,
    gap: spacing.sm, flexDirection: 'row', alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 20, backgroundColor: colors.white, borderWidth: 1,
    borderColor: colors.border, height: 34,
    justifyContent: 'center', alignItems: 'center',
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: typography.sm, color: colors.textSecondary },
  filterTextActive: { color: colors.white, fontWeight: typography.bold },
  listContent: {
    paddingHorizontal: spacing.base, paddingBottom: spacing.xl,
    paddingTop: spacing.xs, gap: spacing.sm,
  },
  leadCard: {
    backgroundColor: colors.white, borderRadius: 14,
    flexDirection: 'row', overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  colorBar: { width: 4 },
  cardContent: { flex: 1, padding: spacing.md, gap: spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
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