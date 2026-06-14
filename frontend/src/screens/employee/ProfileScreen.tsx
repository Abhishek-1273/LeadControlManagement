import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

// Menu Item Component
const MenuItem = ({
  icon, label, onPress, color
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon,
      { backgroundColor: (color || colors.primary) + '15' }]}>
      <Ionicons
        name={icon as any}
        size={20}
        color={color || colors.primary}
      />
    </View>
    <Text style={[styles.menuLabel,
      color ? { color } : {}]}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Kya aap sure hain logout karna chahte hain?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={styles.pageTitle}>Profile</Text>

        {/* Avatar + Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(user?.name || 'User')}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Employee'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role?.toUpperCase() || 'EMPLOYEE'}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => Alert.alert('Coming Soon')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => Alert.alert('Coming Soon')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => Alert.alert('Coming Soon')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => Alert.alert('Coming Soon')}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v1.0.0 — Lead Manager</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { height: 780, backgroundColor: colors.background },
  pageTitle: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  avatar: {
    width: 90, height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  avatarText: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  name: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  email: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginTop: spacing.xs,
  },
  roleText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.primary,
    letterSpacing: 1,
  },
  menuCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.base,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.md,
  },
  menuIcon: {
    width: 40, height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.base + 40 + spacing.md,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFF0F0',
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    padding: spacing.base,
    borderRadius: 14,
  },
  logoutText: {
    fontSize: typography.md,
    fontWeight: typography.semiBold,
    color: colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: typography.xs,
    color: colors.textLight,
    marginTop: spacing.xl,
    marginBottom: spacing.base,
  },
});