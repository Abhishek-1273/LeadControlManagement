import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  iconColor?: string;
  height?: number;
}

export const EmptyState = ({
  icon = 'inbox-outline',
  title,
  message,
  actionLabel,
  onActionPress,
  iconColor = colors.textLight,
  height = 250,
}: EmptyStateProps) => {
  return (
    <View style={[styles.container, { minHeight: height }]}>
      <Ionicons name={icon as any} size={64} color={iconColor} />

      <Text style={styles.title}>{title}</Text>

      {message && (
        <Text style={styles.message}>{message}</Text>
      )}

      {actionLabel && onActionPress && (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onActionPress}
          activeOpacity={0.7}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionLabel: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.white,
  },
});
