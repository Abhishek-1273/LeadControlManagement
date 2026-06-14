import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// SplashScreen is just a visual — AppNavigator handles all auth logic
// It auto-dismisses because AppNavigator swaps to EmployeeNavigator
// or keeps AuthNavigator (showing Login next) once isLoading becomes false

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>LM</Text>
        </View>
        <Text style={styles.appName}>Lead Manager</Text>
        <Text style={styles.tagline}>Manage your leads efficiently</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: typography.xxxl,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  appName: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.white,
    textAlign: 'center',
  },
  tagline: {
    fontSize: typography.base,
    color: colors.white,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
});
