import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const LOGO_SIZE = width * 0.32;

interface SplashAnimationProps {
  onFinish: () => void;
}

export default function SplashAnimation({ onFinish }: SplashAnimationProps) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Phase 1: fade in + scale up smoothly (0.3 → 1.0)
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });

    scale.value = withSequence(
      // Scale up: small → full size, smooth ease
      withTiming(1.0, { duration: 600, easing: Easing.out(Easing.cubic) }),
      // Hold for a moment
      withDelay(
        400,
        // Phase 2: scale down + fade out together, then call onFinish
        withTiming(0.15, { duration: 500, easing: Easing.in(Easing.cubic) }, () => {
          runOnJS(onFinish)();
        })
      )
    );

    // Fade out synced with scale down
    opacity.value = withSequence(
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
      withDelay(400, withTiming(0, { duration: 500, easing: Easing.in(Easing.cubic) }))
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Image
          source={require('../../../assets/icon.png')}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: LOGO_SIZE * 0.22 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
