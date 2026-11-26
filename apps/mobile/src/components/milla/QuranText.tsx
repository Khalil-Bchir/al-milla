import React from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { toArabicDigits } from '@al-milla/core';
import { useMilla } from '../../context/MillaContext';
import { QURAN_FONT_FAMILY } from '../../theme/tokens';

interface QuranTextProps {
  children: React.ReactNode;
  ayahNumber?: number;
  fontSize?: number;
  align?: 'right' | 'center';
  color?: string;
  style?: TextStyle;
}

/**
 * Unified Quranic Arabic text renderer.
 * Enforces the KFGQPC Uthmanic Hafs Unicode typeface (`UthmanicHafs_V22.ttf`),
 * RTL writing direction, generous vertical line height so Uthmani diacritics
 * and waqf marks never clip, and distinct verse-end markers.
 */
export function QuranText({
  children,
  ayahNumber,
  fontSize,
  align = 'right',
  color,
  style,
}: QuranTextProps) {
  const { state, theme } = useMilla();
  const resolvedSize = fontSize ?? state?.quranFontSize ?? 26;
  const lineHeight = Math.round(resolvedSize * 2.05);

  return (
    <Text
      allowFontScaling
      style={[
        styles.base,
        {
          color: color ?? theme.foreground,
          fontSize: resolvedSize,
          lineHeight,
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
      {typeof ayahNumber === 'number' ? (
        <Text style={[styles.verseNumber, { color: theme.primary }]}>
          {' '}
          ﴿{toArabicDigits(ayahNumber)}﴾
        </Text>
      ) : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: QURAN_FONT_FAMILY,
    writingDirection: 'rtl',
    includeFontPadding: true,
    paddingVertical: 4,
  },
  verseNumber: {
    fontFamily: QURAN_FONT_FAMILY,
  },
});
