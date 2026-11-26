import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatNum } from '@al-milla/core';
import { useMilla } from '../../context/MillaContext';
import { QURAN_FONT_FAMILY, RADII, SPACING } from '../../theme/tokens';
import { ArabesqueBackdrop } from './ArabesqueBackdrop';

type QuoteLanguage = 'ar' | 'en' | 'fr';

const AUTO_SWITCH_INTERVAL_MS = 9000;

interface DailyQuoteItem {
  id: string;
  ar: string;
  en: string;
  fr: string;
  sourceAr: string;
  sourceEn: string;
  sourceFr: string;
}

const DAILY_QUOTES: readonly DailyQuoteItem[] = [
  {
    id: 'best-of-you',
    ar: '«خَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَهُ»',
    en: '“The best of you are those who learn the Quran and teach it.”',
    fr: '« Les meilleurs d’entre vous sont ceux qui apprennent le Coran et l’enseignent. »',
    sourceAr: 'رواه البخاري',
    sourceEn: 'Sahih al-Bukhari',
    sourceFr: 'Sahih al-Boukhari',
  },
  {
    id: 'most-beloved-deeds',
    ar: '«أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ تَعَالَى أَدْوَمُهَا وَإِنْ قَلَّ»',
    en: '“The most beloved deeds to Allah are the most consistent, even if small.”',
    fr: '« Les œuvres les plus aimées d’Allah sont les plus régulières, même si elles sont modestes. »',
    sourceAr: 'متفق عليه',
    sourceEn: 'Agreed upon (al-Bukhari & Muslim)',
    sourceFr: 'Rapporté par al-Boukhari et Mouslim',
  },
  {
    id: 'companion-of-quran',
    ar: '«اقْرَءُوا القُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ القِيَامَةِ شَفِيعًا لِأَصْحَابِهِ»',
    en: '“Recite the Quran, for it will come as an intercessor for its companions on the Day of Resurrection.”',
    fr: '« Récitez le Coran, car il viendra au Jour de la Résurrection intercéder pour ses compagnons. »',
    sourceAr: 'رواه مسلم',
    sourceEn: 'Sahih Muslim',
    sourceFr: 'Sahih Mouslim',
  },
  {
    id: 'care-for-quran',
    ar: '«تَعَاهَدُوا القُرْآنَ، فَوَالَّذِي نَفْسِي بِيَدِهِ لَهُوَ أَشَدُّ تَفَصِّيًا مِنَ الإِبِلِ فِي عُقُلِهَا»',
    en: '“Commit yourselves regularly to the Quran, for it escapes faster than camels from their tethers.”',
    fr: '« Veillez régulièrement sur le Coran, car il s’échappe plus vite que les chameaux de leurs entraves. »',
    sourceAr: 'متفق عليه',
    sourceEn: 'Agreed upon (al-Bukhari & Muslim)',
    sourceFr: 'Rapporté par al-Boukhari et Mouslim',
  },
  {
    id: 'two-rewards',
    ar: '«المَاهِرُ بِالقُرْآنِ مَعَ السَّفَرَةِ الكِرَامِ البَرَرَةِ، وَالَّذِي يَقْرَأُ القُرْآنَ وَيَتَتَعْتَعُ فِيهِ وَهُوَ عَلَيْهِ شَاقٌّ لَهُ أَجْرَانِ»',
    en: '“The one proficient with the Quran is with the noble scribes; the one who reads with difficulty receives two rewards.”',
    fr: '« Celui qui maîtrise le Coran est avec les nobles scribes ; celui qui le lit avec peine obtient deux récompenses. »',
    sourceAr: 'متفق عليه',
    sourceEn: 'Agreed upon (al-Bukhari & Muslim)',
    sourceFr: 'Rapporté par al-Boukhari et Mouslim',
  },
  {
    id: 'tranquility-descends',
    ar: '«مَا اجْتَمَعَ قَوْمٌ فِي بَيْتٍ مِنْ بُيُوتِ اللَّهِ يَتْلُونَ كِتَابَ اللَّهِ وَيَتَدَارَسُونَهُ بَيْنَهُمْ إِلَّا نَزَلَتْ عَلَيْهِمُ السَّكِينَةُ وَغَشِيَتْهُمُ الرَّحْمَةُ»',
    en: '“Whenever people gather in a house of Allah to recite and study His Book, tranquility descends upon them and mercy envelops them.”',
    fr: '« Chaque fois que des gens se réunissent pour réciter et étudier le Livre d’Allah, la quiétude descend sur eux et la miséricorde les enveloppe. »',
    sourceAr: 'رواه مسلم',
    sourceEn: 'Sahih Muslim',
    sourceFr: 'Sahih Mouslim',
  },
];

function getDayOfYearIndex(totalQuotes: number): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diffMs = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffMs / 86_400_000);
  return dayOfYear % totalQuotes;
}

function getQuoteText(item: DailyQuoteItem, language: QuoteLanguage): string {
  if (language === 'fr') return item.fr;
  if (language === 'en') return item.en;
  return item.ar;
}

function getSourceText(item: DailyQuoteItem, language: QuoteLanguage): string {
  if (language === 'fr') return item.sourceFr;
  if (language === 'en') return item.sourceEn;
  return item.sourceAr;
}

export function DailyQuoteCard() {
  const { state, theme } = useMilla();
  const language: QuoteLanguage = state?.language ?? 'ar';
  const isRtl = language === 'ar';

  const initialIndex = useMemo(() => getDayOfYearIndex(DAILY_QUOTES.length), []);
  const [quoteIndex, setQuoteIndex] = useState<number>(initialIndex);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isTransitioningRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const advanceQuote = useCallback(() => {
    if (isTransitioningRef.current || !isMountedRef.current) return;
    isTransitioningRef.current = true;

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || !isMountedRef.current) {
        isTransitioningRef.current = false;
        return;
      }
      setQuoteIndex((prev) => (prev + 1) % DAILY_QUOTES.length);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start(() => {
        isTransitioningRef.current = false;
      });
    });
  }, [fadeAnim]);

  useEffect(() => {
    const timer: ReturnType<typeof setInterval> = setInterval(() => {
      advanceQuote();
    }, AUTO_SWITCH_INTERVAL_MS);
    return () => {
      clearInterval(timer);
    };
  }, [advanceQuote, quoteIndex]);

  const quote = DAILY_QUOTES[quoteIndex] ?? DAILY_QUOTES[0];
  if (!quote) return null;

  const headingLabel =
    language === 'fr' ? 'Rappel du jour' : language === 'en' ? 'Daily Reflection' : 'إشراقة اليوم';
  const positionLabel = `${formatNum(quoteIndex + 1, language)} / ${formatNum(
    DAILY_QUOTES.length,
    language,
  )}`;

  const innerChipBg = theme.isDark ? theme.secondary : theme.card;
  const quoteText = getQuoteText(quote, language);
  const sourceText = getSourceText(quote, language);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.isDark ? theme.card : theme.secondary,
          borderColor: theme.border,
        },
      ]}
    >
      <ArabesqueBackdrop />

      <View style={[styles.headerRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
        <View style={[styles.titleGroup, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <View style={[styles.iconBox, { backgroundColor: innerChipBg }]}>
            <Ionicons name="sparkles-outline" size={16} color={theme.primary} />
          </View>
          <Text style={[styles.headingText, { color: theme.foreground }]}>{headingLabel}</Text>
        </View>
      </View>

      <Pressable
        onPress={advanceQuote}
        accessibilityRole="button"
        accessibilityLabel={`${quoteText} — ${sourceText} (${positionLabel})`}
        style={({ pressed }) => [
          styles.quotePressable,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Animated.View style={[styles.quoteBody, { opacity: fadeAnim }]}>
          <Text
            style={[
              language === 'ar' ? styles.quoteTextAr : styles.quoteTextLatin,
              {
                color: theme.foreground,
              },
            ]}
          >
            {quoteText}
          </Text>

          <View style={styles.footerRow}>
            <View
              style={[
                styles.attributionPill,
                {
                  backgroundColor: innerChipBg,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.sourceText,
                  {
                    color: theme.isDark ? theme.mutedForeground : theme.primary,
                  },
                ]}
              >
                {sourceText}
              </Text>
            </View>

            <View
              style={[
                styles.dotsRow,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              {DAILY_QUOTES.map((item, idx) => {
                const isActive = idx === quoteIndex;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.dot,
                      {
                        width: isActive ? 18 : 6,
                        backgroundColor: isActive ? theme.primary : theme.border,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADII.hero,
    borderWidth: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    gap: SPACING.lg,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: SPACING.sm,
  },
  titleGroup: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  quotePressable: {
    paddingVertical: SPACING.sm,
  },
  quoteBody: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  quoteTextAr: {
    fontFamily: QURAN_FONT_FAMILY,
    fontSize: 23,
    lineHeight: 42,
    textAlign: 'center',
  },
  quoteTextLatin: {
    fontSize: 20,
    lineHeight: 31,
    fontWeight: '600',
    textAlign: 'center',
  },
  footerRow: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  attributionPill: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  sourceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dotsRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 2,
  },
  dot: {
    height: 6,
    borderRadius: RADII.pill,
  },
});
