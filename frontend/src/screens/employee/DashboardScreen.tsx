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

const StatCard = ({
  icon, label, value, bgColor, iconColor, onPress, suffix,
}: {
  icon: string;
  label: string;
  value: number;
  bgColor: string;
  iconColor: string;
  onPress?: () => void;
  suffix?: string;
}) => (
  <TouchableOpacity
    style={[styles.statCard, { backgroundColor: bgColor }]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Ionicons name={icon as any} size={22} color={iconColor} />
    <Text style={styles.statValue}>{value}{suffix || ''}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { height } = useWindowDimensions();
  const { user } = useAuthStore();
  const {
    stats,
    fetchDashboardStats,
    followUps,
    fetchTodayFollowUps,
  } = useLeadStore();
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

  const goToTodayLeads = () => {
    navigation.navigate('Leads');
  };

  const goToPendingLeads = () => {
    navigation.navigate('PreviousPendingLeads');
  };

  const goToBookedLeads = () => {
    navigation.navigate('BookedLeads', { scope: 'today' });
  };

  const goToAllBookedLeads = () => {
    navigation.navigate('BookedLeads', { scope: 'all' });
  };

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
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name?.split(' ')[0]}
            </Text>
            <Text style={styles.subGreeting}>Here's your work for today</Text>
          </View>
        </View>

        {/* ── PRIMARY: Today's Leads + Previous Pending ── */}
        <View style={styles.primarySection}>
          <Text style={styles.sectionTitle}>Active Work</Text>

          <View style={styles.primaryRow}>
            {/* Today's Leads */}
            <TouchableOpacity
              style={[styles.primaryCard, { backgroundColor: '#E8F8F2', borderColor: colors.primary }]}
              onPress={goToTodayLeads}
              activeOpacity={0.8}
            >
              <View style={styles.primaryCardIcon}>
                <Ionicons name="today" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.primaryCardValue, { color: colors.primary }]}>
                {stats.todayLeadsCount}
              </Text>
              <Text style={styles.primaryCardLabel}>Today's Leads</Text>
              <View style={styles.goArrow}>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>

            {/* Previous Pending Leads */}
            <TouchableOpacity
              style={[styles.primaryCard, { backgroundColor: '#FEF9E7', borderColor: '#F59E0B' }]}
              onPress={goToPendingLeads}
              activeOpacity={0.8}
            >
              <View style={[styles.primaryCardIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="hourglass" size={28} color="#F59E0B" />
              </View>
              <Text style={[styles.primaryCardValue, { color: '#F59E0B' }]}>
                {stats.previousPendingCount}
              </Text>
              <Text style={styles.primaryCardLabel}>Previous Pending</Text>
              <View style={[styles.goArrow, { borderColor: '#F59E0B' }]}>
                <Ionicons name="arrow-forward" size={14} color="#F59E0B" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Booked Today */}
          <TouchableOpacity
            style={[styles.bookedCard]}
            onPress={goToBookedLeads}
            activeOpacity={0.8}
          >
            <View style={styles.bookedLeft}>
              <Ionicons name="checkmark-circle" size={24} color="#059669" />
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={styles.bookedLabel}>Booked Today</Text>
                <Text style={styles.bookedSub}>Visible until end of day</Text>
              </View>
            </View>
            <Text style={styles.bookedValue}>{stats.bookedToday}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Status breakdown ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>My Lead Status</Text>
          </View>

          <View style={styles.statsRow}>
            <StatCard
              icon="flame"
              label="Interested"
              value={stats.interested}
              bgColor="#FEF2F2"
              iconColor="#EF4444"
            />
            <StatCard
              icon="partly-sunny"
              label="Contacted"
              value={stats.contacted}
              bgColor="#FEF9E7"
              iconColor="#F59E0B"
            />
            <StatCard
              icon="snow"
              label="Not Interested"
              value={stats.notInterested}
              bgColor="#EFF6FF"
              iconColor="#3B82F6"
            />
          </View>
          <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
            <StatCard
              icon="calendar-clear"
              label="Follow Ups"
              value={stats.todayFollowUps}
              bgColor="#FEF3C7"
              iconColor="#D97706"
              onPress={() => {}}
            />
            <StatCard
              icon="trending-up"
              label="Monthly Conversion"
              value={stats.conversionRate}
              suffix="%"
              bgColor="#ECFDF5"
              iconColor="#059669"
            />
            <StatCard
              icon="calendar-number"
              label="Monthly  Leads"
              value={stats.monthLeadsCount}
              bgColor="#F0F9FF"
              iconColor={colors.primary}
            />
          </View>
        </View>

        {/* ── All-time Booked (separate from the today-scoped grid above) ── */}
        <TouchableOpacity
          style={styles.allBookedCard}
          onPress={goToAllBookedLeads}
          activeOpacity={0.85}
        >
          <View style={styles.allBookedIconWrap}>
            <Ionicons name="trophy" size={26} color="#B45309" />
          </View>
          <View style={styles.allBookedTextWrap}>
            <Text style={styles.allBookedValue}>{stats.booked}</Text>
            <Text style={styles.allBookedLabel}>All Booked Leads</Text>
            <Text style={styles.allBookedSub}>Every lead you've ever booked</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B45309" />
        </TouchableOpacity>

        {/* ── Today's Follow-ups ── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Today's Follow-ups</Text>
            {stats.todayFollowUps > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.todayFollowUps}</Text>
              </View>
            )}
          </View>

          {followUps.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={40} color={colors.textLight} />
              <Text style={styles.emptyText}>No follow-ups today</Text>
            </View>
          ) : (
            <View style={styles.followUpList}>
              {followUps.map((fu: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.followUpItem}
                  onPress={() => navigation.navigate('LeadDetail', { leadId: fu.lead?._id })}
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
  container: { backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.lg,
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
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  primarySection: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.lg,
  },
  primaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  primaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    position: 'relative',
    minHeight: 120,
    justifyContent: 'center',
  },
  primaryCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  primaryCardValue: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  primaryCardLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.medium,
    textAlign: 'center',
    marginTop: 2,
  },
  goArrow: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  bookedLeft: { flexDirection: 'row', alignItems: 'center' },
  bookedLabel: {
    fontSize: typography.base,
    fontWeight: typography.semiBold,
    color: '#065F46',
  },
  bookedSub: {
    fontSize: typography.xs,
    color: '#059669',
    marginTop: 1,
  },
  bookedValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#059669',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
    minHeight: 80,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
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
    marginVertical: spacing.sm,
    borderRadius: 16,
    padding: spacing.base,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  allBookedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    borderRadius: 16,
    padding: spacing.base,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  allBookedIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  allBookedTextWrap: { flex: 1 },
  allBookedValue: {
    fontSize: 26, fontWeight: '800', color: '#B45309', lineHeight: 30,
  },
  allBookedLabel: {
    fontSize: typography.base, fontWeight: typography.semiBold, color: '#92400E',
  },
  allBookedSub: {
    fontSize: typography.xs, color: '#B45309', marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.md,
    fontWeight: typography.semiBold,
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: typography.xs,
    color: colors.white,
    fontWeight: typography.bold,
  },
  conversionNote: {
    fontSize: typography.xs,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  followUpList: { gap: spacing.sm },
  followUpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  followUpLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followUpName: {
    fontSize: typography.sm,
    fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  followUpTime: { fontSize: typography.xs, color: colors.primary },
  followUpNote: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    maxWidth: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
});