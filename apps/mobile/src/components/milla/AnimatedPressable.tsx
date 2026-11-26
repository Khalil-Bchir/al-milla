import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
  reduceMotion?: boolean;
  children: React.ReactNode;
}

export function AnimatedPressable({
  style,
  containerStyle,
  scaleTo = 0.97,
  reduceMotion = false,
  disabled,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: AnimatedPressableProps) {
  const scale = useRef<Animated.Value>(new Animated.Value(1)).current;

  const animateTo = (target: number) => {
    if (reduceMotion || disabled) return;
    Animated.spring(scale, {
      toValue: target,
      useNativeDriver: true,
      speed: 36,
      bounciness: 4,
    }).start();
  };

  const handlePressIn = (event: GestureResponderEvent) => {
    animateTo(scaleTo);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    animateTo(1);
    onPressOut?.(event);
  };

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <Pressable
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
