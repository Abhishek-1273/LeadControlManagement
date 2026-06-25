import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-gifted-charts';
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
  icon, label, value, bgColor, iconColor, onPress, suffix, subLabel, fullWidth,
}: {
  icon: string; label: string; value: number;
  bgColor: string; iconColor: string; onPress?: () => void;
  suffix?: string; subLabel?: string; fullWidth?: boolean;
}) => (
  <TouchableOpacity
    style={[
      styles.statCard,
      { backgroundColor: bgColor },
      fullWidth && styles.statCardFullWidth,
    ]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Ionicons name={icon as any} size={24} color={iconColor} />
    {fullWidth ? (
      <View style={styles.statTextColLeft}>
        <Text style={styles.statValue}>{value}{suffix || ''}</Text>
        <Text style={[styles.statLabel, styles.statLabelLeft]}>{label}</Text>
        {subLabel ? <Text style={[styles.statSubLabel, styles.statLabelLeft]}>{subLabel}</Text> : null}
      </View>
    ) : (
      <>
        <Text style={styles.statValue}>{value}{suffix || ''}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {subLabel ? <Text style={styles.statSubLabel}>{subLabel}</Text> : null}
      </>
    )}
  </TouchableOpacity>
);

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {
    stats, performanceData, monthlyTrend,
    fetchAdminStats, fetchEmployees, fetchPerformanceDashboard, fetchMonthlyTrend,
  } = useAdminStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedBar, setSelectedBar] = React.useState<{ label: string; value: number } | null>(null);
  const [selectedPoint, setSelectedPoint] = React.useState<{ label: string; value: number } | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchAdminStats();
      fetchEmployees();
      fetchPerformanceDashboard();
      fetchMonthlyTrend();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAdminStats(), fetchEmployees(), fetchPerformanceDashboard(), fetchMonthlyTrend()]);
    setRefreshing(false);
  };

  // ── Bar chart data ───────────────────────────────────────────────────────────
  // NOTE: stats has no "pending" field for the status breakdown. The backend
  // tracks `pendingLeads` as a today-count only. We only chart the 4 statuses
  // that are actually returned by /admin/stats.
  const statusBarData = [
    { value: stats.interested || 0, label: 'Interest.', frontColor: colors.statusInterested, labelTextStyle: { color: colors.textSecondary, fontSize: 9 } },
    { value: stats.contacted || 0, label: 'Contacted', frontColor: colors.statusContacted, labelTextStyle: { color: colors.textSecondary, fontSize: 9 } },
    { value: stats.notInterested || 0, label: 'Not Int.', frontColor: colors.statusNotInterested, labelTextStyle: { color: colors.textSecondary, fontSize: 9 } },
    { value: stats.booked || 0, label: 'Booked', frontColor: colors.statusBooked, labelTextStyle: { color: colors.textSecondary, fontSize: 9 } },
  ];
  const hasBarData = statusBarData.some((d) => d.value > 0);
  const barMax = Math.max(...statusBarData.map((d) => d.value), 1);

  // ── Line chart data ──────────────────────────────────────────────────────────
  const hasTrendData = monthlyTrend.length > 0;
  const lineData = hasTrendData
    ? monthlyTrend.map((p) => ({
      value: p.count,
      label: p.label,
      labelTextStyle: { color: colors.textSecondary, fontSize: 9 },
      dataPointText: String(p.count),
    }))
    : [{ value: 0, label: '—', labelTextStyle: { color: colors.textSecondary, fontSize: 9 }, dataPointText: '0' }];
  const lineMax = Math.max(...lineData.map((d) => d.value), 1);

  // Bar spacing — distribute evenly across CHART_WIDTH
  const BAR_WIDTH = 38;
  const barSpacing = Math.max(
    (CHART_WIDTH - BAR_WIDTH * statusBarData.length - 32) / statusBarData.length,
    12,
  );

  // Line point spacing — even distribution
  const lineSpacing = Math.max(
    (CHART_WIDTH - 40) / Math.max(lineData.length - 1, 1),
    40,
  );

  const topPerformers = [...performanceData]
    .sort((a, b) => b.bookedToday - a.bookedToday || b.totalBooked - a.totalBooked)
    .slice(0, 5);

  const monthRangeLabel = React.useMemo(() => {
    const now = new Date();
    const monthShort = now.toLocaleDateString('en-IN', { month: 'short' });
    return `1–${now.getDate()} ${monthShort}`;
  }, []);

  return (
    <SafeAreaView style={[styles.container, { height }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Admin Panel</Text>
            <Text style={styles.subGreeting}>Welcome back, {user?.name?.split(' ')[0]}</Text>
          </View>
        </View>

        {/* Monthly Leads card */}
        <TouchableOpacity
          style={styles.monthlyLeadsCard}
          onPress={() => navigation.navigate('MonthlyLeads')}
          activeOpacity={0.85}
        >
          <View style={styles.monthlyLeadsIconWrap}>
            <Ionicons name="trophy" size={26} color={colors.primaryDark} />
          </View>
          <View style={styles.monthlyLeadsTextWrap}>
            <Text style={styles.monthlyLeadsValue}>{stats.monthLeads}</Text>
            <Text style={styles.monthlyLeadsLabel}>Monthly Leads</Text>
            <Text style={styles.monthlyLeadsSub}>{monthRangeLabel} · every employee combined</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
        </TouchableOpacity>

        {/* Stats rows */}
        <View style={styles.statsRow}>
          <StatCard icon="today" label="Today Leads" value={stats.todayLeads} bgColor="#FEF9E7" iconColor="#F59E0B" />
          <StatCard icon="person-circle" label="Active Employees" value={stats.activeEmployees} bgColor="#EEF2FF" iconColor="#6366F1" />
        </View>
        <View style={styles.statsRow}>
          <StatCard icon="checkmark-circle" label="Booked Today" value={stats.booked} bgColor="#F0FFF4" iconColor="#059669" />
          <StatCard icon="trophy" label="All Booked" value={stats.allBooked} bgColor="#FFFBEB" iconColor="#B45309" />
        </View>
        <View style={styles.statsRow}>
          <StatCard icon="trending-up" label="Conversion (Month)" value={stats.conversionRate} suffix="%" bgColor="#ECFDF5" iconColor="#059669" />
          <StatCard icon="hourglass" label="Total Pending Leads" value={stats.pendingLeads} bgColor="#FEF3C7" iconColor="#B45309" />
        </View>
        <View style={styles.statsRow}>
          <StatCard icon="calendar" label="Appointments Today" value={stats.appointmentsToday}
            bgColor="#F3E8FF" iconColor="#8B5CF6"
            onPress={() => navigation.navigate('AdminAppointments')}
            fullWidth />
        </View>

        {/* ── Bar Chart: Leads by Status ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Leads by Status</Text>
          </View>

          {hasBarData ? (
            <>
              {selectedBar ? (
                <View style={styles.tooltipBox}>
                  <Text style={styles.tooltipLabel}>{selectedBar.label}</Text>
                  <Text style={styles.tooltipValue}>{selectedBar.value} leads</Text>
                </View>
              ) : (
                <Text style={styles.chartHint}>Tap a bar to see the count</Text>
              )}
              <BarChart
                data={statusBarData}
                width={CHART_WIDTH}
                height={200}
                barWidth={BAR_WIDTH}
                barBorderRadius={6}
                spacing={barSpacing}
                initialSpacing={16}
                endSpacing={8}
                maxValue={barMax + Math.ceil(barMax * 0.25)}
                noOfSections={4}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={colors.border}
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
                yAxisTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
                isAnimated
                animationDuration={600}
                showGradient={false}
                onPress={(item: any) => setSelectedBar({ label: item.label, value: item.value })}
                renderTooltip={(item: any) => (
                  <View style={{ width: BAR_WIDTH, alignItems: 'center' }}>
                    <View style={styles.barTooltipBubble}>
                      <Text style={styles.barTooltipText}>{item.value}</Text>
                    </View>
                  </View>
                )}
              />
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="bar-chart-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No data yet</Text>
            </View>
          )}
        </View>

        {/* ── Line Chart: Monthly Trend ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Monthly Leads Trend</Text>
          </View>

          {selectedPoint ? (
            <View style={styles.tooltipBox}>
              <Text style={styles.tooltipLabel}>{selectedPoint.label}</Text>
              <Text style={styles.tooltipValue}>{selectedPoint.value} leads</Text>
            </View>
          ) : (
            <Text style={styles.chartHint}>Tap a point to see the month's total</Text>
          )}

          <LineChart
            data={lineData}
            width={CHART_WIDTH}
            height={200}
            spacing={lineSpacing}
            initialSpacing={8}
            maxValue={lineMax + Math.ceil(lineMax * 0.25)}
            noOfSections={4}
            color={colors.primary}
            thickness={3}
            curved={false}
            isAnimated
            animationDuration={700}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.border}
            xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
            yAxisTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
            dataPointsColor={colors.primary}
            dataPointsRadius={5}
            startFillColor={colors.primary}
            endFillColor={colors.white}
            startOpacity={0.2}
            endOpacity={0.02}
            areaChart
            focusEnabled
            showDataPointOnFocus
            showStripOnFocus
            showTextOnFocus
            stripColor={colors.primaryLight}
            stripHeight={160}
            rulesType="dashed"      
            rulesLength={CHART_WIDTH - 20}
            onFocus={(item: any) => setSelectedPoint({ label: item.label, value: item.value })}
            pointerConfig={{
              pointerStripHeight: 200,
              pointerStripColor: colors.primaryLight,
              pointerStripWidth: 2,
              pointerColor: colors.primaryDark,
              radius: 6,
              pointerLabelWidth: 100,
              pointerLabelHeight: 44,
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: true,
              pointerLabelComponent: (items: any) => (
                <View style={styles.linePointerBubble}>
                  <Text style={styles.linePointerText}>{items[0]?.label}</Text>
                  <Text style={styles.linePointerValue}>{items[0]?.value} leads</Text>
                </View>
              ),
            }}
          />
        </View>

        {/* Top Performers */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderWithAction}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={18} color="#F59E0B" />
              <Text style={styles.cardTitle}>Top Performers Today</Text>
            </View>
            <TouchableOpacity style={styles.seeAllBtn} onPress={() => navigation.navigate('AdminPerformance')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {topPerformers.length === 0 ? (
            <View style={styles.emptyChart}>
              <Ionicons name="people-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No data yet</Text>
            </View>
          ) : (
            topPerformers.map((perf, index) => {
              const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
              return (
                <View key={perf.employee._id} style={styles.empRow}>
                  <View style={[styles.rankCircle, { backgroundColor: rankColors[index] || colors.border }]}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.empInfo}>
                    <Text style={styles.empName}>{perf.employee.name}</Text>
                    <Text style={styles.empEmail}>{perf.assignedToday} assigned • {perf.previousPending} pending</Text>
                  </View>
                  <View style={styles.empStats}>
                    <Text style={[styles.empLeadCount, { color: '#059669' }]}>{perf.bookedToday}</Text>
                    <Text style={styles.empLeadLabel}>booked</Text>
                  </View>
                  <View style={[styles.conversionPill, { backgroundColor: perf.conversionRate >= 50 ? '#ECFDF5' : '#FEF9E7' }]}>
                    <Text style={[styles.conversionText, { color: perf.conversionRate >= 50 ? '#059669' : '#F59E0B' }]}>
                      {perf.conversionRate}%
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('AddEmployee')}>
              <View style={[styles.quickIcon, { backgroundColor: '#e3f5f8' }]}>
                <Ionicons name="person-add" size={22} color={colors.primary} />
              </View>
              <Text style={styles.quickLabel}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('AdminLeads')}>
              <View style={[styles.quickIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="list" size={22} color="#6366F1" />
              </View>
              <Text style={styles.quickLabel}>All Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('AdminEmployees')}>
              <View style={[styles.quickIcon, { backgroundColor: '#FEF9E7' }]}>
                <Ionicons name="people" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.quickLabel}>Employees</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('LeadArchive')}>
              <View style={[styles.quickIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="archive" size={22} color="#059669" />
              </View>
              <Text style={styles.quickLabel}>Archive</Text>
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
  greeting: { fontSize: typography.xl, fontWeight: typography.bold, color: colors.textPrimary },
  subGreeting: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: spacing.base,
    gap: spacing.sm, marginBottom: spacing.lg, marginTop: spacing.xs,
  },
  monthlyLeadsCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F8F2',
    marginHorizontal: spacing.base,
    marginTop: spacing.xs, marginBottom: spacing.lg,
    borderRadius: 16, padding: spacing.base,
    borderWidth: 1.5, borderColor: colors.primary,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  monthlyLeadsIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  monthlyLeadsTextWrap: { flex: 1 },
  monthlyLeadsValue: { fontSize: 26, fontWeight: '800', color: colors.primaryDark, lineHeight: 30 },
  monthlyLeadsLabel: { fontSize: typography.base, fontWeight: typography.semiBold, color: colors.textPrimary },
  monthlyLeadsSub: { fontSize: typography.xs, color: colors.primaryDark, marginTop: 1 },
  statCard: {
    flex: 1, borderRadius: 16, padding: spacing.sm,
    alignItems: 'center', gap: 4, minHeight: 90,
    elevation: 2, shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  statCardFullWidth: { flexDirection: 'row', justifyContent: 'flex-start', gap: spacing.md, minHeight: 64 },
  statTextColLeft: { alignItems: 'flex-start', gap: 2 },
  statLabelLeft: { textAlign: 'left' },
  statValue: { fontSize: typography.xl, fontWeight: typography.bold, color: colors.textPrimary },
  statLabel: { fontSize: typography.xs, color: colors.textSecondary, textAlign: 'center' },
  statSubLabel: { fontSize: 10, color: colors.textLight, textAlign: 'center', marginTop: -2 },
  card: {
    backgroundColor: colors.white, marginHorizontal: spacing.base,
    marginVertical: spacing.lg, borderRadius: 16, padding: spacing.base,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
    borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden'
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  sectionHeaderWithAction: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.lg, width: '100%',
  },
  cardTitle: { fontSize: 14, fontWeight: typography.bold, color: colors.textPrimary, flex: 1 },
  seeAll: { fontSize: typography.xs, color: colors.primary, fontWeight: typography.semiBold },
  seeAllBtn: { paddingLeft: spacing.md },
  chartHint: {
    fontSize: typography.xs, color: colors.textLight,
    marginTop: spacing.xs, marginBottom: spacing.sm,
  },
  tooltipBox: {
    backgroundColor: colors.primaryLight, borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginTop: spacing.xs, marginBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  tooltipLabel: { fontSize: typography.sm, fontWeight: typography.semiBold, color: colors.primaryDark },
  tooltipValue: { fontSize: typography.sm, fontWeight: typography.bold, color: colors.primaryDark },
  barTooltipBubble: {
    backgroundColor: colors.textPrimary, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4, marginBottom: 4,
    alignSelf: 'center', alignItems: 'center'
  },
  barTooltipText: { color: colors.white, fontSize: typography.xs, fontWeight: typography.bold },
  linePointerBubble: {
    backgroundColor: colors.textPrimary, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  linePointerText: { color: colors.white, fontSize: 10, opacity: 0.8 },
  linePointerValue: { color: colors.white, fontSize: typography.sm, fontWeight: typography.bold },
  emptyChart: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  emptyText: { fontSize: typography.base, color: colors.textSecondary },
  empRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    gap: spacing.sm, backgroundColor: '#FAFAFA',
    borderRadius: 12, marginBottom: spacing.sm,
  },
  rankCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  rankText: { fontSize: typography.xs, fontWeight: typography.bold, color: colors.white },
  empInfo: { flex: 1 },
  empName: { fontSize: typography.sm, fontWeight: typography.semiBold, color: colors.textPrimary },
  empEmail: { fontSize: typography.xs, color: colors.textSecondary },
  empStats: { alignItems: 'center' },
  empLeadCount: { fontSize: typography.base, fontWeight: typography.bold, color: colors.primary },
  empLeadLabel: { fontSize: typography.xs, color: colors.textSecondary },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  quickBtn: { alignItems: 'center', width: '22%' },
  quickIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 9, color: colors.textSecondary, alignContent: 'center', fontWeight: typography.medium },
  conversionPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  conversionText: { fontSize: typography.xs, fontWeight: typography.bold },
});