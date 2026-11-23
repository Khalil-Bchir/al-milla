import React, { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatNum } from '@al-milla/core';
import { useMilla } from '../../context/MillaContext';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../../theme/tokens';

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

  const language = state?.language ?? 'ar';
  const isRtl = language === 'ar';
  const item = ADHKAR[dhikrIdx] ?? ADHKAR[0]!;

  const labels =
    language === 'en'
      ? { title: 'Quiet Dhikr', next: 'Next', tapHint: 'Tap to count' }
      : language === 'fr'
        ? { title: 'Dhikr apaisant', next: 'Suivant', tapHint: 'Appuyez pour compter' }
        : { title: 'ذِكْرٌ هادئ', next: 'ذكر آخر', tapHint: 'اضغط للتسبيح' };

  const handleNext = () => {
    setDhikrIdx((i) => (i + 1) % ADHKAR.length);
    setCount(0);
  };

  const progressPct = Math.min(100, Math.round((count / item.target) * 100));

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <ImageBackground source={QUIET_STUDY_IMG} style={styles.banner} resizeMode="cover">
        <View
          style={[
            styles.bannerOverlay,
            { backgroundColor: theme.isDark ? 'rgba(19, 32, 28, 0.72)' : 'rgba(255, 255, 255, 0.72)' },
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

          <Pressable
            onPress={handleNext}
            accessibilityRole="button"
            accessibilityLabel={labels.next}
            style={[
              styles.nextBtn,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderColor: theme.border,
                backgroundColor: theme.card,
              },
            ]}
          >
            <Ionicons name="refresh-outline" size={14} color={theme.primary} />
            <Text style={[styles.nextText, { color: theme.foreground }]}>{labels.next}</Text>
          </Pressable>
        </View>
      </ImageBackground>

      <Pressable
        onPress={() => setCount((c) => c + 1)}
        accessibilityRole="button"
        accessibilityLabel={`${item.ar} - ${labels.tapHint}`}
        style={styles.tapBody}
      >
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
            <Text style={styles.counterText}>
              {formatNum(count, language)} / {formatNum(item.target, language)}
            </Text>
          </View>
        </View>

        <View style={[styles.track, { backgroundColor: theme.muted }]}>
          <View
            style={[styles.fill, { backgroundColor: theme.accent, width: `${progressPct}%` }]}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.hero,
    borderWidth: 1,
    overflow: 'hidden',
  },
  banner: {
    height: 96,
    justifyContent: 'flex-end',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
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
  nextBtn: {
    minHeight: 36,
    alignItems: 'center',
    gap: 6,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  nextText: { fontSize: 12, fontWeight: '600' },
  tapBody: {
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
