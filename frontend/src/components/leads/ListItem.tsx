import React from 'react';
import {
  View, TouchableOpacity, StyleSheet, Text,
  Animated, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  iconBgColor?: string;
  rightElement?: React.ReactNode;
  badge?: { label: string; color: string };
  status?: 'active' | 'inactive';
  onPress?: () => void;
  onLongPress?: () => void;
  showDivider?: boolean;
  highlighted?: boolean;
}

export const ListItem = ({
  title,
  subtitle,
  icon,
  iconColor = colors.primary,
  iconBgColor = colors.primaryLight,
  rightElement,
  badge,
  status,
  onPress,
  onLongPress,
  showDivider = true,
  highlighted = false,
}: ListItemProps) => {
  const pressAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(pressAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        highlighted && styles.containerHighlighted,
        { transform: [{ scale: pressAnim }] }
      ]}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <View style={styles.content}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
              <Ionicons name={icon as any} size={24} color={iconColor} />
            </View>
          )}

          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
            )}
          </View>

          {badge && (
            <View style={[styles.badge, { backgroundColor: badge.color }]}>
              <Text style={styles.badgeText}>{badge.label}</Text>
            </View>
          )}

          {status && (
            <View style={[
              styles.statusDot,
              { backgroundColor: status === 'active' ? colors.success : colors.error }
            ]} />
          )}

          {rightElement}
        </View>
      </Pressable>

      {showDivider && <View style={styles.divider} />}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  containerHighlighted: {
    backgroundColor: colors.primaryLight,
  },
  pressable: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.base,
    fontWeight: typography.semiBold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginHorizontal: spacing.sm,
  },
  badgeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.white,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.base,
  },
});
