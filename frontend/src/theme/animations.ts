import { Animated, Easing } from 'react-native';

export const animations = {
  // Fade animations
  fadeIn: (duration = 300) => ({
    duration,
    useNativeDriver: true,
    easing: Easing.ease,
  }),

  fadeOut: (duration = 300) => ({
    duration,
    useNativeDriver: true,
    easing: Easing.ease,
  }),

  // Slide animations
  slideInUp: (duration = 300) => ({
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.cubic),
  }),

  slideInDown: (duration = 300) => ({
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.cubic),
  }),

  slideInLeft: (duration = 300) => ({
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.cubic),
  }),

  slideInRight: (duration = 300) => ({
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.cubic),
  }),

  // Scale animations
  scaleIn: (duration = 300) => ({
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.cubic),
  }),

  // Spring animation
  spring: (tension = 40, friction = 7) => ({
    tension,
    friction,
    useNativeDriver: true,
  }),

  // Timing for micro-interactions
  micro: (duration = 150) => ({
    duration,
    useNativeDriver: true,
    easing: Easing.ease,
  }),

  // Smooth transitions
  smooth: (duration = 250) => ({
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.quad),
  }),
};

// Helper function for opacity animation
export const createOpacityAnim = (initialValue = 0) => {
  return new Animated.Value(initialValue);
};

// Helper function for position animation
export const createPositionAnim = (initialValue = 0) => {
  return new Animated.Value(initialValue);
};

// Helper function for scale animation
export const createScaleAnim = (initialValue = 0.9) => {
  return new Animated.Value(initialValue);
};
