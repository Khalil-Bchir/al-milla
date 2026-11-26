import React from 'react';
import { Switch } from 'react-native';
import { useMilla } from '../../context/MillaContext';

interface MillaSwitchProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}

/**
 * Theme-calibrated Switch with crisp track and thumb contrast in dark and light modes.
 */
export function MillaSwitch({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
}: MillaSwitchProps) {
  const { theme } = useMilla();

  const trackFalse = theme.isDark ? theme.border : '#D4DBD2';
  const trackTrue = theme.primary;
  const thumbColor = theme.isDark
    ? value
      ? theme.card
      : theme.mutedForeground
    : '#FFFFFF';

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: trackFalse, true: trackTrue }}
      thumbColor={thumbColor}
      ios_backgroundColor={trackFalse}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
