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

export default function SplashAnimation({
  onFinish,
}: SplashAnimationProps) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Scale Animation
    scale.value = withSequence(
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }),
      withDelay(
        400,
        withTiming(
          0.2,
          {
            duration: 500,
            easing: Easing.in(Easing.cubic),
          },
          (finished) => {
            if (finished) {
              runOnJS(onFinish)();
            }
          }
        )
      )
    );

    // Opacity Animation
    opacity.value = withSequence(
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }),
      withDelay(
        400,
        withTiming(0, {
          duration: 500,
          easing: Easing.in(Easing.cubic),
        })
      )
    );
  }, [onFinish, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Image
          source={require('../../../assets/icon.png')}
          style={{
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            borderRadius: LOGO_SIZE * 0.22,
          }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});