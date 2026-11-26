import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useMilla } from '../../context/MillaContext';

interface SurahProgressBarProps {
  percent: number;
  trackColor?: string;
  fillColor?: string;
  height?: number;
}

/**
 * Unified RTL-aware Surah progress bar used across Home, Memorize dashboard,
 * and Session completion summary.
 */
export function SurahProgressBar({
  percent,
  trackColor,
  fillColor,
  height = 7,
}: SurahProgressBarProps) {
  const { state, theme } = useMilla();
  const isRtl = (state?.language ?? 'ar') === 'ar';
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: Math.ceil(height / 2),
          backgroundColor: trackColor ?? theme.muted,
          flexDirection: isRtl ? 'row-reverse' : 'row',
        },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            borderRadius: Math.ceil(height / 2),
            backgroundColor: fillColor ?? theme.primary,
            width: `${clamped}%`,
            minWidth: clamped > 0 ? 6 : 0,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
