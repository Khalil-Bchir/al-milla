import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatNum } from '@al-milla/core';
import { useMilla } from '../../context/MillaContext';
import { animateLayout } from '../../theme/motion';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../../theme/tokens';
import { ArabesqueBackdrop } from './ArabesqueBackdrop';

const QUIET_STUDY_IMG = require('../../../assets/images/quiet-study.jpg');

interface DhikrItem {
  ar: string;
  en: string;
  fr: string;
  target: number;
}

const ADHKAR: readonly DhikrItem[] = [
  {
    ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    en: 'Glory and praise be to Allah',
    fr: 'Gloire et louange à Allah',
    target: 33,
  },
  {
    ar: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    en: 'I seek Allah’s forgiveness and turn to Him',
    fr: 'Je demande pardon à Allah et je me repens à Lui',
    target: 33,
  },
  {
    ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    en: 'There is no might nor power except through Allah',
    fr: 'Il n’y a de force ni de puissance qu’en Allah',
    target: 33,
  },
  {
    ar: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    en: 'O Allah, send peace and blessings upon our Prophet Muhammad',
    fr: 'Ô Allah, accorde paix et bénédictions à notre Prophète Muhammad',
    target: 10,
  },
];

export function QuietDhikrCard() {
  const { state, theme } = useMilla();
  const [dhikrIdx, setDhikrIdx] = useState(0);
  const [count, setCount] = useState(0);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const language = state?.language ?? 'ar';
  const isRtl = language === 'ar';
  const item = ADHKAR[dhikrIdx] ?? ADHKAR[0]!;

  const labels =
    language === 'en'
      ? { title: 'Quiet Dhikr', next: 'Next', tapHint: 'Tap to count' }
      : language === 'fr'
        ? { title: 'Dhikr apaisant', next: 'Suivant', tapHint: 'Appuyez pour compter' }
        : { title: 'ذِكْرٌ هادئ', next: 'ذكر آخر', tapHint: 'اضغط للتسبيح' };

  const switchDhikr = (delta: number) => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    animateLayout();
    setDhikrIdx((i) => (i + delta + ADHKAR.length) % ADHKAR.length);
    setCount(0);
  };

  const handleTapDhikr = () => {
    if (count >= item.target) return;
    const nextCount = count + 1;
    setCount(nextCount);
    if (nextCount >= item.target) {
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        animateLayout();
        setDhikrIdx((i) => (i + 1) % ADHKAR.length);
        setCount(0);
      }, 240);
    }
  };

  const progressPct = Math.min(100, Math.round((count / item.target) * 100));

  return (
    <Pressable
      onPress={handleTapDhikr}
      accessibilityRole="button"
      accessibilityLabel={`${item.ar} - ${labels.tapHint}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      <View style={styles.banner}>
        <Image
          source={QUIET_STUDY_IMG}
          style={styles.bannerOverlay}
          resizeMode="cover"
          accessible={false}
          importantForAccessibility="no"
        />
        <View
          style={[
            styles.bannerOverlay,
            { backgroundColor: theme.isDark ? 'rgba(20, 20, 19, 0.78)' : 'rgba(255, 255, 255, 0.72)' },
          ]}
        />
        <View
          style={[
            styles.bannerBottom,
            { flexDirection: isRtl ? 'row-reverse' : 'row' },
          ]}
        >
          <View
            style={[
              styles.titleGroup,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={[styles.sparkleBox, { backgroundColor: `${theme.accent}40` }]}>
              <Ionicons name="sparkles-outline" size={16} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.foreground }]}>{labels.title}</Text>
          </View>

          <View
            style={[
              styles.switcherPill,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderColor: theme.border,
                backgroundColor: theme.card,
              },
            ]}
          >
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                switchDhikr(-1);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="الذكر السابق"
              style={styles.switcherStepBtn}
            >
              <Ionicons
                name={isRtl ? 'chevron-forward' : 'chevron-back'}
                size={16}
                color={theme.primary}
              />
            </Pressable>

            <Text style={[styles.switcherCount, { color: theme.foreground }]}>
              {formatNum(dhikrIdx + 1, language)} / {formatNum(ADHKAR.length, language)}
            </Text>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                switchDhikr(1);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={labels.next}
              style={styles.switcherStepBtn}
            >
              <Ionicons
                name={isRtl ? 'chevron-back' : 'chevron-forward'}
                size={16}
                color={theme.primary}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.tapBody}>
        <ArabesqueBackdrop variant="subtle" pattern="rosette" />

        <Text style={[styles.dhikrArabic, { color: theme.foreground }]}>{item.ar}</Text>
        {language !== 'ar' ? (
          <Text style={[styles.dhikrTrans, { color: theme.mutedForeground }]}>
            {language === 'fr' ? item.fr : item.en}
          </Text>
        ) : null}

        <View
          style={[
            styles.counterRow,
            { flexDirection: isRtl ? 'row-reverse' : 'row' },
          ]}
        >
          <Text style={[styles.tapHint, { color: theme.mutedForeground }]}>{labels.tapHint}</Text>
          <View style={[styles.counterPill, { backgroundColor: theme.accent }]}>
            <Text style={[styles.counterText, { color: theme.accentForeground }]}>
              {formatNum(count, language)} / {formatNum(item.target, language)}
            </Text>
          </View>
        </View>

        <View style={[styles.track, { backgroundColor: theme.muted }]}>
          <View
            style={[styles.fill, { backgroundColor: theme.accent, width: `${progressPct}%` }]}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.hero,
    borderWidth: 1,
    overflow: 'hidden',
  },
  banner: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 96,
    paddingTop: 14,
    justifyContent: 'flex-end',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  bannerBottom: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: 10,
  },
  titleGroup: { alignItems: 'center', gap: 8 },
  sparkleBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '700' },
  switcherPill: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 4,
    gap: 2,
  },
  switcherStepBtn: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switcherCount: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 34,
    textAlign: 'center',
  },
  tapBody: {
    position: 'relative',
    overflow: 'hidden',
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  dhikrArabic: {
    fontSize: 22,
    lineHeight: 40,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontWeight: '600',
  },
  dhikrTrans: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  counterRow: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tapHint: { fontSize: 11, fontWeight: '500' },
  counterPill: {
    borderRadius: RADII.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  counterText: { fontSize: 12, fontWeight: '700', color: '#242a25' },
  track: {
    marginTop: 10,
    height: 6,
    borderRadius: RADII.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: RADII.pill },
});
