import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Lead } from '../../types/lead.types';
import { useLeadStore } from '../../store/leadStore';
import { SimpleLeadCard, formatLeadDate } from '../../components/leads/SimpleLeadCard';

export default function BookedLeadsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // 'today'  -> only leads booked today (Dashboard "Booked Today" card)
  // 'all'    -> every booked lead regardless of date (Dashboard "All Booked" card)
  const scope: 'today' | 'all' = route.params?.scope === 'all' ? 'all' : 'today';

  const { bookedLeads, fetchEmployeeBookedLeads, togglePin } = useLeadStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchEmployeeBookedLeads(scope);
    }, [scope])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployeeBookedLeads(scope);
    setRefreshing(false);
  };

  const sortedLeads = React.useMemo(() => {
    const pinned = bookedLeads.filter((l) => l.isPinned);
    const unpinned = bookedLeads.filter((l) => !l.isPinned);
    return [...pinned, ...unpinned];
  }, [bookedLeads]);

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

  const title = scope === 'all' ? 'All Booked Leads' : 'Booked Today';
  const bannerText = scope === 'all'
    ? 'Every lead you have ever booked'
    : 'Leads booked today';
  const emptyText = scope === 'all' ? 'No booked leads yet' : 'No leads booked today';

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
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.banner}>
          <Ionicons name="checkmark-circle" size={16} color="#059669" />
          <Text style={styles.bannerText}>{bannerText}</Text>
        </View>

        <Text style={styles.leadCount}>{sortedLeads.length} leads</Text>

        <FlatList
          data={sortedLeads}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <SimpleLeadCard
              lead={item}
              onPress={() => navigation.navigate('LeadDetail', { leadId: item._id })}
              onTogglePin={() => handleTogglePin(item)}
              // "All Booked" spans many dates, so show the booking date per
              // card; "Booked Today" is all the same date, so the date adds
              // no information there and is omitted.
              dateLabel={scope === 'all' ? formatLeadDate(item.updatedAt) : undefined}
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
              <Text style={styles.emptyText}>{emptyText}</Text>
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
    backgroundColor: '#ECFDF5', borderColor: '#059669',
  },
  bannerText: {
    fontSize: typography.xs, fontWeight: typography.medium, color: '#065F46', flex: 1,
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
});