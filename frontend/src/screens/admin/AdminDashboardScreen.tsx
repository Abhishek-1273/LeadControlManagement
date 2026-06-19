import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import { useWindowDimensions } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.base * 2 - 32;

const StatCard = ({
  icon, label, value, bgColor, iconColor, onPress
}: {
  icon: string; label: string; value: number;
  bgColor: string; iconColor: string; onPress?: () => void;
}) => (
  <TouchableOpacity
    style={[styles.statCard, { backgroundColor: bgColor }]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Ionicons name={icon as any} size={24} color={iconColor} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const chartConfig = {
  backgroundGradientFrom: colors.white,
  backgroundGradientTo: colors.white,
  color: (opacity = 1) => `rgba(0, 168, 107, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.6,
  labelColor: () => colors.textSecondary,
  style: { borderRadius: 16 },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: colors.primary,
  },
};

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { stats, employees, fetchAdminStats, fetchEmployees } = useAdminStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchAdminStats();
      fetchEmployees();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAdminStats(), fetchEmployees()]);
    setRefreshing(false);
  };

  const statusChartData = {
    labels: ['Hot', 'Warm', 'Cold', 'Follow Up', 'Booked'],
    datasets: [{
      data: [
        stats.hot || 0,
        stats.warm || 0,
        stats.cold || 0,
        stats.followUp || 0,
        stats.booked || 0,
      ]
    }]
  };

  const monthlyChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [20, 35, 28, 45, 32, stats.totalLeads || 0],
      color: (opacity = 1) => `rgba(0, 168, 107, ${opacity})`,
      strokeWidth: 2,
    }]
  };

  const topEmployees = [...employees]
    .sort((a, b) => (b.totalLeads || 0) - (a.totalLeads || 0))
    .slice(0, 5);

  return (
    <SafeAreaView style={[styles.container, { height }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Admin Panel</Text>
            <Text style={styles.subGreeting}>
              Welcome back, {user?.name?.split(' ')[0]}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats Row 1 */}
        <View style={styles.statsRow}>
          <StatCard icon="people" label="Total Leads" value={stats.totalLeads}
            bgColor="#E8F8F2" iconColor={colors.primary}
            onPress={() => navigation.navigate('AdminLeads')} />
          <StatCard icon="today" label="Today Leads" value={stats.todayLeads}
            bgColor="#FEF9E7" iconColor="#F59E0B" />
          <StatCard icon="person-circle" label="Employees" value={stats.totalEmployees}
            bgColor="#EEF2FF" iconColor="#6366F1"
            onPress={() => navigation.navigate('AdminEmployees')} />
        </View>

        {/* Stats Row 2 */}
        <View style={styles.statsRow}>
          <StatCard icon="flame" label="Hot" value={stats.hot}
            bgColor="#FEF2F2" iconColor="#EF4444" />
          <StatCard icon="sunny" label="Warm" value={stats.warm}
            bgColor="#FFFBEB" iconColor="#F59E0B" />
          <StatCard icon="checkmark-circle" label="Booked" value={stats.booked}
            bgColor="#F0FFF4" iconColor="#059669" />
        </View>

        {/* Bar Chart */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Leads by Status</Text>
          </View>
          {stats.totalLeads > 0 ? (
            <BarChart
              data={statusChartData}
              width={CHART_WIDTH}
              height={200}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
              yAxisLabel=""
              yAxisSuffix=""
            />
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No data yet</Text>
            </View>
          )}
        </View>

        {/* Line Chart */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Monthly Leads Trend</Text>
          </View>
          <LineChart
            data={monthlyChartData}
            width={CHART_WIDTH}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
            bezier
          />
        </View>

        {/* Employee Performance */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderWithAction}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Top Performers</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => navigation.navigate('AdminEmployees')}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {topEmployees.length === 0 ? (
            <View style={styles.emptyChart}>
              <Ionicons name="people-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No employees yet</Text>
            </View>
          ) : (
            topEmployees.map((emp, index) => (
              <TouchableOpacity
                key={emp._id}
                style={styles.empRow}
                onPress={() => navigation.navigate('EmployeeDetail', { employeeId: emp._id })}
              >
                <View style={[styles.rankCircle,
                index === 0 && { backgroundColor: '#FFD700' },
                index === 1 && { backgroundColor: '#C0C0C0' },
                index === 2 && { backgroundColor: '#CD7F32' },
                ]}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.empInfo}>
                  <Text style={styles.empName}>{emp.name}</Text>
                  <Text style={styles.empEmail}>{emp.email}</Text>
                </View>
                <View style={styles.empStats}>
                  <Text style={styles.empLeadCount}>{emp.totalLeads || 0}</Text>
                  <Text style={styles.empLeadLabel}>leads</Text>
                </View>
                <View style={[styles.statusDot,
                { backgroundColor: emp.isActive ? colors.primary : colors.error }
                ]} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickBtn}
              onPress={() => navigation.navigate('AddEmployee')}>
              <View style={[styles.quickIcon, { backgroundColor: '#E8F8F2' }]}>
                <Ionicons name="person-add" size={22} color={colors.primary} />
              </View>
              <Text style={styles.quickLabel}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickBtn}
              onPress={() => navigation.navigate('AdminLeads')}>
              <View style={[styles.quickIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="list" size={22} color="#6366F1" />
              </View>
              <Text style={styles.quickLabel}>All Leads</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickBtn}
              onPress={() => navigation.navigate('AdminEmployees')}>
              <View style={[styles.quickIcon, { backgroundColor: '#FEF9E7' }]}>
                <Ionicons name="people" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.quickLabel}>Employees</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickBtn} onPress={logout}>
              <View style={[styles.quickIcon, { backgroundColor: '#FFF0F0' }]}>
                <Ionicons name="log-out" size={22} color={colors.error} />
              </View>
              <Text style={styles.quickLabel}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.base,
    paddingTop: spacing.base, paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.xl, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  subGreeting: {
    fontSize: typography.sm, color: colors.textSecondary, marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: colors.white, padding: spacing.sm,
    borderRadius: 10, elevation: 2,
  },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: spacing.base,
    gap: spacing.sm, marginBottom: spacing.lg, marginTop: spacing.xs,
  },
  statCard: {
    flex: 1, borderRadius: 16, padding: spacing.sm,
    alignItems: 'center', gap: 4, minHeight: 90,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  statValue: {
    fontSize: typography.xl, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.xs, color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white, marginHorizontal: spacing.base,
    marginVertical: spacing.lg, borderRadius: 16, padding: spacing.base,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '100%',
  },
  cardTitle: {
    fontSize: 14, fontWeight: typography.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  seeAll: {
    fontSize: typography.xs, color: colors.primary,
    fontWeight: typography.semiBold,
  },
  seeAllBtn: {
    paddingLeft: spacing.md,
  },
  chart: { borderRadius: 16, marginTop: spacing.sm },
  emptyChart: {
    alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md,
  },
  emptyText: { fontSize: typography.base, color: colors.textSecondary },
  empRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    gap: spacing.sm,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  rankCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  rankText: {
    fontSize: typography.xs, fontWeight: typography.bold, color: colors.white,
  },
  empInfo: { flex: 1 },
  empName: {
    fontSize: typography.sm, fontWeight: typography.semiBold, color: colors.textPrimary,
  },
  empEmail: { fontSize: typography.xs, color: colors.textSecondary },
  empStats: { alignItems: 'center' },
  empLeadCount: {
    fontSize: typography.base, fontWeight: typography.bold, color: colors.primary,
  },
  empLeadLabel: { fontSize: typography.xs, color: colors.textSecondary },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  quickActions: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm,
  },
  quickBtn: { alignItems: 'center', width: '22%'},
  quickIcon: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  quickLabel: {
    fontSize: 9, color: colors.textSecondary, alignContent: 'center', fontWeight: typography.medium,
  },
});
