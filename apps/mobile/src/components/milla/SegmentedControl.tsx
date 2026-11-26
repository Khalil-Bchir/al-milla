import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMilla } from '../../context/MillaContext';
import { MIN_TOUCH_TARGET, RADII } from '../../theme/tokens';

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
  icon?: 'sparkles-outline' | 'eye-off-outline' | 'eye-outline';
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
}

const CONTAINER_PADDING = 4;
const ITEM_GAP = 4;

/**
 * Smooth, spring-animated segmented control with RTL support.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { state, theme } = useMilla();
  const isRtl = (state?.language ?? 'ar') === 'ar';

  const [trackWidth, setTrackWidth] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const didInitRef = useRef(false);

  const count = Math.max(1, options.length);
  const activeIdx = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );
  const innerWidth = Math.max(0, trackWidth - CONTAINER_PADDING * 2);
  const pillWidth = Math.max(0, (innerWidth - ITEM_GAP * (count - 1)) / count);
  const visualIdx = isRtl ? count - 1 - activeIdx : activeIdx;
  const targetX = CONTAINER_PADDING + visualIdx * (pillWidth + ITEM_GAP);

  useEffect(() => {
    if (pillWidth <= 0) return;
    if (!didInitRef.current) {
      didInitRef.current = true;
      slideX.setValue(targetX);
      return;
    }
    Animated.spring(slideX, {
      toValue: targetX,
      damping: 20,
      stiffness: 240,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [targetX, pillWidth, slideX]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const nextWidth = e.nativeEvent.layout.width;
    if (nextWidth > 0 && nextWidth !== trackWidth) {
      setTrackWidth(nextWidth);
    }
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.track,
        {
          flexDirection: isRtl ? 'row-reverse' : 'row',
          backgroundColor: theme.background,
          borderColor: theme.border,
        },
      ]}
    >
      {pillWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            {
              width: pillWidth,
              backgroundColor: theme.primary,
              transform: [{ translateX: slideX }],
            },
          ]}
        />
      ) : null}

      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[
              styles.item,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            {opt.icon ? (
              <Ionicons
                name={opt.icon}
                size={15}
                color={selected ? theme.primaryForeground : theme.mutedForeground}
              />
            ) : null}
            <Text
              style={[
                styles.label,
                { color: selected ? theme.primaryForeground : theme.foreground },
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'relative',
    borderRadius: RADII.control,
    borderWidth: 1,
    padding: CONTAINER_PADDING,
    gap: ITEM_GAP,
  },
  activePill: {
    position: 'absolute',
    top: CONTAINER_PADDING,
    bottom: CONTAINER_PADDING,
    left: 0,
    borderRadius: RADII.control - 2,
  },
  item: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    zIndex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
