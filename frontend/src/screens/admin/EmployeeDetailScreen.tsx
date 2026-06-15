import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute }
  from '@react-navigation/native';
import { useAdminStore } from '../../store/adminStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const STATUS_COLORS: Record<string, string> = {
  'New Lead': '#3B82F6', 'Contacted': '#8B5CF6',
  'Follow Up': '#F59E0B', 'Interested': '#10B981',
  'Visitor': '#06B6D4', 'Booked': '#059669',
  'Closed': '#6B7280', 'Uninterested': '#EF4444',
};

export default function EmployeeDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { employeeId } = route.params || {};
  const { selectedEmployee, fetchEmployeeById, isLoading } = useAdminStore();

  useFocusEffect(
    React.useCallback(() => {
      if (employeeId) fetchEmployeeById(employeeId);
    }, [employeeId])
  );

  const emp = selectedEmployee as any;

  if (isLoading || !emp) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Details</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddEmployee',
            { isEdit: true, employee: emp })}
        >
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar,
            !emp.isActive && styles.avatarInactive]}>
            <Text style={styles.avatarText}>
              {emp.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.empName}>{emp.name}</Text>
          <Text style={styles.empEmail}>{emp.email}</Text>
          <View style={[styles.statusBadge,
            { backgroundColor: emp.isActive ? '#E8F8F2' : '#FFF0F0' }]}>
            <View style={[styles.statusDot,
              { backgroundColor: emp.isActive
                ? colors.primary : colors.error }]} />
            <Text style={[styles.statusText,
              { color: emp.isActive ? colors.primary : colors.error }]}>
              {emp.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{emp.totalLeads || 0}</Text>
            <Text style={styles.statLabel}>Total Leads</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxMiddle]}>
            <Text style={styles.statValue}>{emp.todayLeads || 0}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {emp.recentLeads?.filter(
                (l: any) => l.status === 'Booked'
              ).length || 0}
            </Text>
            <Text style={styles.statLabel}>Booked</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{emp.email}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{emp.phone || '—'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16}
              color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>
                {new Date(emp.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Leads */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Recent Leads ({emp.recentLeads?.length || 0})
          </Text>
          {emp.recentLeads?.length === 0 ? (
            <Text style={styles.noLeads}>No leads assigned yet</Text>
          ) : (
            emp.recentLeads?.map((lead: any) => {
              const sColor = STATUS_COLORS[lead.status] || colors.primary;
              return (
                <View key={lead._id} style={styles.leadRow}>
                  <View style={styles.leadAvatar}>
                    <Text style={styles.leadAvatarText}>
                      {lead.name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.leadInfo}>
                    <Text style={styles.leadName}>{lead.name}</Text>
                    <Text style={styles.leadPhone}>{lead.phone}</Text>
                  </View>
                  <View style={[styles.leadStatus,
                    { backgroundColor: sColor + '20' }]}>
                    <Text style={[styles.leadStatusText,
                      { color: sColor }]}>
                      {lead.status}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: typography.base, color: colors.textSecondary },
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
  profileCard: {
    backgroundColor: colors.white, alignItems: 'center',
    padding: spacing.xl, marginBottom: spacing.sm, gap: spacing.sm,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInactive: { backgroundColor: colors.borderLight },
  avatarText: {
    fontSize: typography.xxxl, fontWeight: typography.bold,
    color: colors.primary,
  },
  empName: {
    fontSize: typography.xl, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  empEmail: { fontSize: typography.sm, color: colors.textSecondary },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: typography.sm, fontWeight: typography.semiBold },
  statsRow: {
    flexDirection: 'row', marginHorizontal: spacing.base,
    marginBottom: spacing.sm, backgroundColor: colors.white,
    borderRadius: 16, overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  statBox: {
    flex: 1, alignItems: 'center', padding: spacing.md,
  },
  statBoxMiddle: {
    borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: colors.borderLight,
  },
  statValue: {
    fontSize: typography.xxl, fontWeight: typography.bold,
    color: colors.primary,
  },
  statLabel: { fontSize: typography.xs, color: colors.textSecondary },
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
  infoContent: { flex: 1 },
  infoLabel: { fontSize: typography.xs, color: colors.textSecondary },
  infoValue: {
    fontSize: typography.sm, fontWeight: typography.medium,
    color: colors.textPrimary, marginTop: 2,
  },
  noLeads: { fontSize: typography.sm, color: colors.textSecondary,
    textAlign: 'center', paddingVertical: spacing.md },
  leadRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  leadAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  leadAvatarText: {
    fontSize: typography.sm, fontWeight: typography.bold,
    color: colors.primary,
  },
  leadInfo: { flex: 1 },
  leadName: {
    fontSize: typography.sm, fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  leadPhone: { fontSize: typography.xs, color: colors.textSecondary },
  leadStatus: {
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 8,
  },
  leadStatusText: { fontSize: typography.xs, fontWeight: typography.semiBold },
});