import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Switch, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface FilterOption {
  id: string;
  label: string;
  value?: any;
}

interface FilterGroup {
  id: string;
  title: string;
  type: 'checkbox' | 'radio' | 'toggle';
  options: FilterOption[];
}

interface FilterModalProps {
  visible: boolean;
  filters: FilterGroup[];
  selectedFilters: Record<string, any>;
  onApplyFilters: (filters: Record<string, any>) => void;
  onClose: () => void;
  onReset?: () => void;
}

export const FilterModal = ({
  visible,
  filters,
  selectedFilters,
  onApplyFilters,
  onClose,
  onReset,
}: FilterModalProps) => {
  const [tempFilters, setTempFilters] = React.useState(selectedFilters);
  const slideAnim = React.useRef(new Animated.Value(500)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleToggleOption = (groupId: string, optionId: string, type: string) => {
    setTempFilters(prev => {
      const current = prev[groupId] || [];
      if (type === 'radio') {
        return { ...prev, [groupId]: optionId };
      } else {
        const updated = current.includes(optionId)
          ? current.filter((id: string) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [groupId]: updated };
      }
    });
  };

  const handleApply = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleReset = () => {
    setTempFilters({});
    onReset?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Filters */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {filters.map(group => (
              <View key={group.id} style={styles.filterGroup}>
                <Text style={styles.groupTitle}>{group.title}</Text>

                <View style={styles.optionsContainer}>
                  {group.options.map(option => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.option}
                      onPress={() => handleToggleOption(group.id, option.id, group.type)}
                    >
                      {group.type === 'toggle' ? (
                        <>
                          <Text style={styles.optionLabel}>{option.label}</Text>
                          <Switch
                            value={tempFilters[group.id] === option.id}
                            onValueChange={() => handleToggleOption(group.id, option.id, group.type)}
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={tempFilters[group.id] === option.id ? colors.primary : colors.textLight}
                          />
                        </>
                      ) : (
                        <>
                          <View style={styles.checkbox}>
                            {(group.type === 'checkbox' && tempFilters[group.id]?.includes(option.id)) ||
                            (group.type === 'radio' && tempFilters[group.id] === option.id) ? (
                              <Ionicons
                                name={group.type === 'radio' ? 'radio-button-on' : 'checkmark'}
                                size={20}
                                color={colors.primary}
                              />
                            ) : (
                              <Ionicons
                                name={group.type === 'radio' ? 'radio-button-off' : 'square-outline'}
                                size={20}
                                color={colors.border}
                              />
                            )}
                          </View>
                          <Text style={styles.optionLabel}>{option.label}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleReset}
            >
              <Text style={styles.resetLabel}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApply}
            >
              <Text style={styles.applyLabel}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  filterGroup: {
    marginBottom: spacing.xl,
  },
  groupTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: typography.base,
    color: colors.textPrimary,
    fontWeight: typography.medium,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetLabel: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  applyBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  applyLabel: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.white,
  },
});
