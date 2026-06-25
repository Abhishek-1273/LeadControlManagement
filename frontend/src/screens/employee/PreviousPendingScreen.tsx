import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useLeadStore } from '../../store/leadStore';
import { SimpleLeadCard, formatLeadDate } from '../../components/leads/SimpleLeadCard';

export default function PreviousPendingScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { pendingLeads, fetchEmployeePendingLeads } = useLeadStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchEmployeePendingLeads();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployeePendingLeads();
    setRefreshing(false);
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Previous Pending</Text>
        </View>

        <View style={styles.banner}>
          <Ionicons name="hourglass" size={16} color="#F59E0B" />
          <Text style={styles.bannerText}>
            Leads that moved to pending status
          </Text>
        </View>

        <Text style={styles.leadCount}>{pendingLeads.length} leads</Text>

        <FlatList
          data={pendingLeads}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <SimpleLeadCard
              lead={item}
              onPress={() => navigation.navigate('LeadDetail', { leadId: item._id, hidePin: true })}
              dateLabel={formatLeadDate(item.createdAt)}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>No pending leads</Text>
              <Text style={styles.emptySubText}>
                You're all caught up on previous days' leads
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: colors.background, flex: 1 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm, paddingBottom: spacing.xs,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    fontSize: typography.xxl, fontWeight: typography.bold,
    color: colors.textPrimary,
  },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.base, marginTop: spacing.sm, marginBottom: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 10, borderWidth: 1,
    backgroundColor: '#FEF9E7', borderColor: '#F59E0B',
  },
  bannerText: {
    fontSize: typography.xs, fontWeight: typography.medium, color: '#92600A', flex: 1,
  },

  leadCount: {
    fontSize: typography.sm, color: colors.textSecondary,
    fontWeight: typography.medium,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xs,
  },

  listContent: { paddingHorizontal: spacing.base, paddingTop: spacing.xs },

  emptyState: { alignItems: 'center', paddingTop: spacing.xxxl * 2, gap: spacing.sm },
  emptyText: { fontSize: typography.lg, fontWeight: typography.semiBold, color: colors.textSecondary },
  emptySubText: { fontSize: typography.sm, color: colors.textLight, textAlign: 'center' },
});