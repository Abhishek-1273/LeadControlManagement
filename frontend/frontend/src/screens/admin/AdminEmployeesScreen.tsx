import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, RefreshControl, Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAdminStore } from '../../store/adminStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function AdminEmployeesScreen() {
  const navigation = useNavigation<any>();
  const { employees, fetchEmployees, toggleEmployeeStatus, isLoading } =
    useAdminStore();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useFocusEffect(
    React.useCallback(() => {
      fetchEmployees();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
  };

  const handleToggle = (emp: any) => {
    if (Platform.OS === 'web') {
      toggleEmployeeStatus(emp._id).then(() => {
        Toast.show({
          type: 'success',
          text1: emp.isActive ? 'Employee Deactivated' : 'Employee Activated ✅',
          text2: `${emp.name} status updated`,
          visibilityTime: 2000,
        });
      }).catch(() => {
        Toast.show({ type: 'error', text1: 'Failed ❌' });
      });
      return;
    }
    Alert.alert(
      emp.isActive ? 'Deactivate Employee' : 'Activate Employee',
      `Are you sure? ${emp.name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: emp.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await toggleEmployeeStatus(emp._id);
              Toast.show({
                type: 'success',
                text1: emp.isActive ? 'Deactivated' : 'Activated ✅',
                text2: `${emp.name} status updated`,
                visibilityTime: 2000,
              });
            } catch {
              Toast.show({ type: 'error', text1: 'Failed ❌' });
            }
          },
        },
      ]
    );
  };

  // Filter + Search
  const filtered = employees.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true
        : filter === 'active' ? emp.isActive
          : !emp.isActive;
    return matchSearch && matchFilter;
  });

  const renderEmployee = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.empCard}
      onPress={() => navigation.navigate('EmployeeDetail',
        { employeeId: item._id })}
      activeOpacity={0.7}
    >
      {/* Left */}
      <View style={styles.empLeft}>
        <View style={[styles.avatar,
        !item.isActive && styles.avatarInactive]}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.empInfo}>
          <View style={styles.empNameRow}>
            <Text style={styles.empName}>{item.name}</Text>
          </View>
          <Text style={styles.empEmail}>{item.email}</Text>
          {item.phone && (
            <Text style={styles.empPhone}>{item.phone}</Text>
          )}

          {/* Stats Row */}
          <View style={styles.empStatsRow}>
            <View style={styles.empStat}>
              <Ionicons name="people-outline" size={12}
                color={colors.textSecondary} />
              <Text style={styles.empStatText}>
                {item.totalLeads || 0} leads
              </Text>
            </View>
            <View style={styles.empStat}>
              <Ionicons name="today-outline" size={12}
                color={colors.textSecondary} />
              <Text style={styles.empStatText}>
                {item.todayLeads || 0} today
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Right Actions */}
{/* Right Actions */}
<View style={styles.empActions}>
  {/* Row 1: Status badge + Edit btn */}
  <View style={styles.empActionsTop}>
    <View style={[styles.statusBadge,
      { backgroundColor: item.isActive ? '#E8F8F2' : '#FFF0F0' }]}>
      <View style={[styles.statusDot,
        { backgroundColor: item.isActive ? colors.primary : colors.error }]} />
      <Text style={[styles.statusText,
        { color: item.isActive ? colors.primary : colors.error }]}>
        {item.isActive ? 'Active' : 'Inactive'}
      </Text>
    </View>
    <TouchableOpacity
      style={styles.editBtn}
      onPress={() => navigation.navigate('AddEmployee',
        { employee: item, isEdit: true })}
    >
      <Ionicons name="create-outline" size={18} color={colors.primary} />
    </TouchableOpacity>
  </View>

  {/* Row 2: Toggle Switch centered */}
  <View style={styles.empActionsBottom}>
    <TouchableOpacity
      style={[styles.toggleSwitch,
        { backgroundColor: item.isActive ? colors.primary : colors.borderLight }]}
      onPress={() => handleToggle(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.toggleThumb,
        { transform: [{ translateX: item.isActive ? 18 : 2 }] }]}
      />
    </TouchableOpacity>
  </View>
</View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Employees</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddEmployee',
              { isEdit: false })}
          >
            <Ionicons name="person-add" size={18} color={colors.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18}
                color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab,
              filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText,
              filter === f && styles.filterTabTextActive]}>
                {f === 'all' ? `All (${employees.length})`
                  : f === 'active'
                    ? `Active (${employees.filter(e => e.isActive).length})`
                    : `Inactive (${employees.filter(e => !e.isActive).length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Employee List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64}
                color={colors.textLight} />
              <Text style={styles.emptyText}>
                {isLoading ? 'Loading...' : 'No employees found'}
              </Text>
            </View>
          }
          renderItem={renderEmployee}
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
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: 10, gap: spacing.xs,
  },
  addBtnText: {
    color: colors.white, fontWeight: typography.bold,
    fontSize: typography.sm,
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, marginHorizontal: spacing.base,
    marginBottom: spacing.xs, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm, elevation: 1,
  },
  searchInput: {
    flex: 1, fontSize: typography.base, color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: spacing.base,
    gap: spacing.sm, marginBottom: spacing.sm,
  },
  filterTab: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: 10,
    backgroundColor: colors.white, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: typography.xs, color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  filterTabTextActive: { color: colors.white, fontWeight: typography.bold },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl, gap: spacing.sm,
  },
  empCard: {
    backgroundColor: colors.white, borderRadius: 14,
    padding: spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  empLeft: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, flex: 1
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInactive: { backgroundColor: colors.borderLight },
  avatarText: {
    fontSize: typography.lg, fontWeight: typography.bold,
    color: colors.primary,
  },
  empInfo: { flex: 1 },
  empNameRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: 2,
    flexWrap: 'nowrap'
  },
  empName: {
    fontSize: typography.base, fontWeight: typography.semiBold,
    color: colors.textPrimary, flex: 1,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, paddingHorizontal: spacing.sm,
    paddingVertical: 4, borderRadius: 10,
    marginHorizontal: 5
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: typography.semiBold },
  empEmail: { fontSize: typography.xs, color: colors.textSecondary },
  empPhone: { fontSize: typography.xs, color: colors.textSecondary },
  empStatsRow: {
    flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs,
  },
  empStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  empStatText: { fontSize: typography.xs, color: colors.textSecondary },
empActions: {
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: spacing.xs
},
empActionsTop: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
},
empActionsBottom: {
  alignItems: 'flex-end',
  width: '100%',
},
  editBtn: {
    backgroundColor: colors.primaryLight,
    padding: spacing.sm, borderRadius: 8,
  },
  toggleSwitch: {
    width: 44, height: 26, borderRadius: 13,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  emptyState: {
    alignItems: 'center', paddingTop: 100, gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.lg, color: colors.textSecondary,
    fontWeight: typography.semiBold,
  },
});