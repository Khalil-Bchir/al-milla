import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '@al-milla/core';
import { useMilla } from '../../context/MillaContext';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../../theme/tokens';

const LANG_OPTIONS: { id: AppLanguage; label: string; native: string }[] = [
  { id: 'ar', label: 'العربية', native: 'العربية' },
  { id: 'en', label: 'English', native: 'English' },
  { id: 'fr', label: 'Français', native: 'Français' },
];

export function LanguageSwitcher() {
  const { state, theme, setLanguage } = useMilla();
  const active = state?.language ?? 'ar';

  return (
    <View style={styles.row}>
      {LANG_OPTIONS.map((item) => {
        const selected = active === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => void setLanguage(item.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.card,
              {
                borderColor: selected ? theme.primary : theme.border,
                backgroundColor: selected ? theme.primary : theme.background,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? theme.primaryForeground : theme.foreground },
              ]}
            >
              {item.native}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', gap: SPACING.sm },
  card: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET + 4,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  label: { fontSize: 14, fontWeight: '700' },
});
