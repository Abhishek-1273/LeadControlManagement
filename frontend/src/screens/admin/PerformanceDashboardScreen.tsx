import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAdminStore, EmployeePerformance } from '../../store/adminStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const RATE_COLORS = (rate: number) => {
  if (rate >= 75) return '#059669';
  if (rate >= 50) return '#F59E0B';
  if (rate >= 25) return '#F97316';
  return '#EF4444';
};

function EmployeeCard({ item }: { item: EmployeePerformance }) {
  const rateColor = RATE_COLORS(item.conversionRate);
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {item.employee.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.empName}>{item.employee.name}</Text>
          <Text style={styles.empEmail}>{item.employee.email}</Text>
        </View>
        <View style={[styles.rateBadge, { backgroundColor: rateColor + '20', borderColor: rateColor }]}>
          <Text style={[styles.rateText, { color: rateColor }]}>
            {item.conversionRate}%
          </Text>
        </View>
      </View>

      {/* Today's Stats */}
      <View style={styles.todayRow}>
        <View style={[styles.todayStat, { backgroundColor: '#E8F8F2' }]}>
          <Text style={styles.todayStatValue}>{item.assignedToday}</Text>
          <Text style={styles.todayStatLabel}>Assigned Today</Text>
        </View>
        <View style={[styles.todayStat, { backgroundColor: '#ECFDF5' }]}>
          <Text style={[styles.todayStatValue, { color: '#059669' }]}>{item.bookedToday}</Text>
          <Text style={styles.todayStatLabel}>Booked Today</Text>
        </View>
        <View style={[styles.todayStat, { backgroundColor: '#FEF9E7' }]}>
          <Text style={[styles.todayStatValue, { color: '#F59E0B' }]}>{item.previousPending}</Text>
          <Text style={styles.todayStatLabel}>Pending</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Lifetime Stats */}
      <View style={styles.lifetimeRow}>
        <View style={styles.lifetimeStat}>
          <Text style={styles.lifetimeValue}>{item.totalBooked}</Text>
          <Text style={styles.lifetimeLabel}>Total Booked</Text>
        </View>
        <View style={styles.lifetimeStat}>
          <Text style={styles.lifetimeValue}>{item.weeklyBooked}</Text>
          <Text style={styles.lifetimeLabel}>This Week</Text>
        </View>
        <View style={styles.lifetimeStat}>
          <Text style={styles.lifetimeValue}>{item.monthlyBooked}</Text>
          <Text style={styles.lifetimeLabel}>This Month</Text>
        </View>
        <View style={styles.lifetimeStat}>
          <Text style={styles.lifetimeValue}>{item.totalAssigned}</Text>
          <Text style={styles.lifetimeLabel}>Total Assigned</Text>
        </View>
      </View>

      {/* Conversion bar */}
      <View style={styles.conversionBar}>
        <View style={styles.conversionBg}>
          <View
            style={[
              styles.conversionFill,
              {
                width: `${Math.min(item.conversionRate, 100)}%`,
                backgroundColor: rateColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.conversionLabel, { color: rateColor }]}>
          {item.conversionRate}% Booking Rate
        </Text>
      </View>
    </View>
  );
}

export default function PerformanceDashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { performanceData, fetchPerformanceDashboard, isLoading } = useAdminStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchPerformanceDashboard();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPerformanceDashboard();
    setRefreshing(false);
  };
  

  // Sort by bookedToday desc, then conversionRate desc
  const sorted = [...performanceData].sort(
    (a, b) => b.bookedToday - a.bookedToday || b.conversionRate - a.conversionRate
  );

  const totalBookedToday = performanceData.reduce((s, p) => s + p.bookedToday, 0);
  const totalAssignedToday = performanceData.reduce((s, p) => s + p.assignedToday, 0);
  const totalPending = performanceData.reduce((s, p) => s + p.previousPending, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
        <Text style={styles.title}>Team Performance</Text>
      </View>
      <View style={styles.header}>
        <Text style={styles.subtitle}>Today's booking overview</Text>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F8F2' }]}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalAssignedToday}</Text>
          <Text style={styles.summaryLabel}>Assigned Today</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>{totalBookedToday}</Text>
          <Text style={styles.summaryLabel}>Booked Today</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FEF9E7' }]}>
          <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{totalPending}</Text>
          <Text style={styles.summaryLabel}>Total Pending</Text>
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.employee._id}
        renderItem={({ item }) => <EmployeeCard item={item} />}
        contentContainerStyle={{ padding: spacing.base, paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No employees found</Text>
          </View>
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
  subheader:{
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
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
  },
  summaryLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  empName: {
    fontSize: typography.base,
    fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  empEmail: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  rateBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  rateText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  todayRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  todayStat: {
    flex: 1,
    borderRadius: 10,
    padding: spacing.sm,
    alignItems: 'center',
  },
  todayStatValue: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  todayStatLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: spacing.sm,
  },
  lifetimeRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  lifetimeStat: {
    flex: 1,
    alignItems: 'center',
  },
  lifetimeValue: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  lifetimeLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  conversionBar: {
    marginTop: spacing.xs,
  },
  conversionBg: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  conversionFill: {
    height: '100%',
    borderRadius: 3,
  },
  conversionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
});