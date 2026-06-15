import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useLeadStore } from '../../store/leadStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Stat Card Component
const StatCard = ({
  icon, label, value, bgColor, iconColor
}: {
  icon: string;
  label: string;
  value: number;
  bgColor: string;
  iconColor: string;
}) => (
  <View style={[styles.statCard, { backgroundColor: bgColor }]}>
    <Ionicons name={icon as any} size={24} color={iconColor} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { height } = useWindowDimensions();
  const { user, logout } = useAuthStore();
  const { stats, fetchDashboardStats, followUps, fetchTodayFollowUps } = useLeadStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardStats();
      fetchTodayFollowUps();
      return () => { };
    }, [])
  );
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardStats(), fetchTodayFollowUps()]);
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={[styles.container, { height }]}
    edges={['top']}>
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
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name?.split(' ')[0]}
            </Text>
            <Text style={styles.subGreeting}>Here's your overview</Text>
          </View>
        </View>

        {/* Row 1 */}
        <View style={styles.statsRow}>
          <StatCard
            icon="people"
            label="Total Leads"
            value={stats.totalLeads}
            bgColor="#E8F8F2"
            iconColor={colors.primary}
          />
          <StatCard
            icon="calendar"
            label="Today's Follow-ups"
            value={stats.todayFollowUps}
            bgColor="#FEF9E7"
            iconColor="#F59E0B"
          />
          <StatCard
            icon="add-circle"
            label="New Today"
            value={stats.newToday}
            bgColor="#EEF2FF"
            iconColor="#6366F1"
          />
        </View>

        {/* Row 2 */}
        <View style={styles.statsRow}>
          <StatCard
            icon="thumbs-up"
            label="Interested"
            value={stats.interested}
            bgColor="#F0FFF4"
            iconColor="#10B981"
          />
          <StatCard
            icon="checkmark-circle"
            label="Booked"
            value={stats.booked}
            bgColor="#F0F9FF"
            iconColor="#0EA5E9"
          />
          <StatCard
            icon="time"
            label="Pending"
            value={stats.pending ?? 0}
            bgColor="#FFF7ED"
            iconColor="#F97316"
          />
        </View>

        {/* Lead Status Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lead Status Breakdown</Text>

          {stats.totalLeads === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bar-chart-outline" size={48}
                color={colors.textLight} />
              <Text style={styles.emptyText}>No data available</Text>
              <Text style={styles.emptySubText}>
                Leads will appear here once assigned
              </Text>
            </View>
          ) : (
            <View style={styles.statusGrid}>
              {[
                { label: 'New Lead', count: stats.newToday, color: '#3B82F6' },
                { label: 'Contacted', count: stats.contacted, color: '#8B5CF6' },
                { label: 'Follow Up', count: stats.followUp, color: '#F59E0B' },
                { label: 'Interested', count: stats.interested, color: '#10B981' },
                { label: 'Visitor', count: stats.visitor, color: '#06B6D4' },
                { label: 'Booked', count: stats.booked, color: '#059669' },
                { label: 'Uninterested', count: stats.uninterested, color: '#EF4444' },
                { label: 'No Response', count: stats.noResponse, color: '#9CA3AF' },
              ].map((item) => (
                <View key={item.label} style={styles.statusItem}>
                  <View style={[styles.statusDot,
                  { backgroundColor: item.color }]} />
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusLabel}>{item.label}</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: item.color,
                          width: `${stats.totalLeads > 0
                            ? Math.min((item.count / stats.totalLeads) * 100, 100)
                            : 0}%` as any,
                        }
                      ]} />
                    </View>
                  </View>
                  <Text style={[styles.statusCount,
                  { color: item.color }]}>
                    {item.count}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Today's Follow-ups */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Follow-ups</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stats.todayFollowUps}</Text>
            </View>
          </View>

          {followUps.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48}
                color={colors.textLight} />
              <Text style={styles.emptyText}>No follow-ups today</Text>
            </View>
          ) : (
            <View style={styles.followUpList}>
              {followUps.map((fu: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.followUpItem}
                  onPress={() => navigation.navigate('Leads', {
                    screen: 'LeadDetail',
                    params: { leadId: fu.lead?._id }
                  })}
                >
                  <View style={styles.followUpLeft}>
                    <View style={styles.timeCircle}>
                      <Ionicons name="time" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.followUpName}>
                        {fu.lead?.name || 'Unknown'}
                      </Text>
                      <Text style={styles.followUpTime}>{fu.time}</Text>
                    </View>
                  </View>
                  {fu.notes ? (
                    <Text style={styles.followUpNote} numberOfLines={1}>
                      {fu.notes}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  greeting: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  subGreeting: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: 10,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
    minHeight: 90,
  },
  statValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xl,
    borderRadius: 16,
    padding: spacing.base,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.md,
    fontWeight: typography.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  followUpList: { gap: spacing.sm, marginTop: spacing.sm },
  followUpItem: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md, borderRadius: 12,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  followUpLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  followUpName: {
    fontSize: typography.sm, fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  followUpTime: { fontSize: typography.xs, color: colors.primary },
  followUpNote: {
    fontSize: typography.xs, color: colors.textSecondary,
    maxWidth: 100,
  },
  statusGrid: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusDot: {
    width: 10, height: 10, borderRadius: 5,
  },
  statusInfo: { flex: 1 },
  statusLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.medium,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6, backgroundColor: colors.borderLight,
    borderRadius: 3, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', borderRadius: 3,
  },
  statusCount: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    minWidth: 24, textAlign: 'right',
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: typography.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.textSecondary,
  },
  emptySubText: {
    fontSize: typography.sm,
    color: colors.textLight,
    textAlign: 'center',
  },
});