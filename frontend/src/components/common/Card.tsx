import React from 'react';
import {
  View, TouchableOpacity, StyleSheet,
  Animated, Pressable
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: 'default' | 'outline' | 'elevated';
  padding?: number;
  margin?: number;
  highlighted?: boolean;
  disabled?: boolean;
}

export const Card = ({
  children,
  onPress,
  onLongPress,
  variant = 'default',
  padding = spacing.lg,
  margin = spacing.md,
  highlighted = false,
  disabled = false,
}: CardProps) => {
  const pressAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled && onPress) {
      Animated.timing(pressAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && onPress) {
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const variantStyles = {
    default: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 1,
      shadowOpacity: 0.04,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.border,
      elevation: 0,
    },
    elevated: {
      backgroundColor: colors.white,
      borderWidth: 0,
      elevation: 3,
      shadowOpacity: 0.1,
    },
  };

  const style = variantStyles[variant];

  const content = (
    <Animated.View
      style={[
        styles.card,
        style,
        {
          padding,
          margin,
          backgroundColor: highlighted ? colors.primaryLight : style.backgroundColor,
          transform: [{ scale: pressAnim }],
        }
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
});
