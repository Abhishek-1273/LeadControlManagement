import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAdminStore } from '../../store/adminStore';
import { useLeadStore } from '../../store/leadStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function AssignLeadScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { leadId, currentEmployee } = route.params || {};
  const { employees, assignLead } = useAdminStore();
  const { fetchLeads } = useLeadStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(currentEmployee?._id || '');
  const [isLoading, setIsLoading] = useState(false);

  const activeEmployees = employees
    .filter((e) => e.isActive)
    .filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
    );

  const handleAssign = async () => {
    if (!selected) {
      Toast.show({
        type: 'error',
        text1: 'Select Employee ❌',
        text2: 'Please select an employee to assign',
      });
      return;
    }
    setIsLoading(true);
    try {
      await assignLead(leadId, selected);
      await fetchLeads();
      Toast.show({
        type: 'success',
        text1: 'Lead Assigned ✅',
        text2: 'Lead assigned successfully',
        visibilityTime: 2000,
      });
      navigation.goBack();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed ❌',
        text2: 'Could not assign lead',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Assign Lead</Text>
        <TouchableOpacity
          style={[styles.assignBtn, isLoading && { opacity: 0.6 }]}
          onPress={handleAssign}
          disabled={isLoading}
        >
          <Text style={styles.assignBtnText}>
            {isLoading ? 'Assigning...' : 'Assign'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current Assignment */}
      {currentEmployee && (
        <View style={styles.currentCard}>
          <Ionicons name="information-circle" size={18}
            color={colors.primary} />
          <Text style={styles.currentText}>
            Currently assigned to:{' '}
            <Text style={styles.currentName}>
              {currentEmployee.name}
            </Text>
          </Text>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search employee..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Employee List */}
      <FlatList
        data={activeEmployees}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = selected === item._id;
          return (
            <TouchableOpacity
              style={[styles.empCard, isSelected && styles.empCardSelected]}
              onPress={() => setSelected(item._id)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar,
                isSelected && styles.avatarSelected]}>
                <Text style={[styles.avatarText,
                  isSelected && { color: colors.white }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.empInfo}>
                <Text style={[styles.empName,
                  isSelected && { color: colors.primary }]}>
                  {item.name}
                </Text>
                <Text style={styles.empEmail}>{item.email}</Text>
                <Text style={styles.empLeads}>
                  {item.totalLeads || 0} leads assigned
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle"
                  size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48}
              color={colors.textLight} />
            <Text style={styles.emptyText}>No active employees</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  title: {
    fontSize: typography.lg, fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  assignBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: 10,
  },
  assignBtnText: {
    color: colors.white, fontWeight: typography.bold,
    fontSize: typography.sm,
  },
  currentCard: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.base, marginTop: spacing.md,
    padding: spacing.md, borderRadius: 12,
  },
  currentText: { fontSize: typography.sm, color: colors.textSecondary },
  currentName: { fontWeight: typography.bold, color: colors.primary },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, marginHorizontal: spacing.base,
    marginTop: spacing.md, marginBottom: spacing.sm,
    borderRadius: 12, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, gap: spacing.sm, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: typography.base, color: colors.textPrimary },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl, gap: spacing.sm,
  },
  empCard: {
    backgroundColor: colors.white, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, gap: spacing.md,
    borderWidth: 2, borderColor: 'transparent',
    elevation: 1,
  },
  empCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarSelected: { backgroundColor: colors.primary },
  avatarText: {
    fontSize: typography.lg, fontWeight: typography.bold,
    color: colors.primary,
  },
  empInfo: { flex: 1 },
  empName: {
    fontSize: typography.base, fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  empEmail: { fontSize: typography.xs, color: colors.textSecondary },
  empLeads: { fontSize: typography.xs, color: colors.primary, marginTop: 2 },
  emptyState: {
    alignItems: 'center', paddingTop: 80, gap: spacing.sm,
  },
  emptyText: { fontSize: typography.base, color: colors.textSecondary },
});