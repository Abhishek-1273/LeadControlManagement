import React from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface SearchFilterBarProps {
  onSearch: (text: string) => void;
  onFilterPress?: () => void;
  placeholder?: string;
  showFilter?: boolean;
  activeFilters?: number;
}

export const SearchFilterBar = ({
  onSearch,
  onFilterPress,
  placeholder = 'Search...',
  showFilter = true,
  activeFilters = 0
}: SearchFilterBarProps) => {
  const [search, setSearch] = React.useState('');
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handleChangeText = (text: string) => {
    setSearch(text);
    onSearch(text);
  };

  const handleClear = () => {
    setSearch('');
    onSearch('');
  };

  const handleFilterPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();

    onFilterPress?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textLight} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={handleChangeText}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {showFilter && (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeFilters > 0 && styles.filterBtnActive
            ]}
            onPress={handleFilterPress}
          >
            <Ionicons
              name="filter"
              size={20}
              color={activeFilters > 0 ? colors.primary : colors.textSecondary}
            />
            {activeFilters > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilters}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: typography.base,
    color: colors.textPrimary,
    fontWeight: typography.medium,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
});
