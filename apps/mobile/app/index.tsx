import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  RECITERS,
  buildCareRevisionQueue,
  buildSmartRevisionQueue,
  computeSurahProgress,
  computeSurahRevisionPlan,
  computeSurahRevisionSummaries,
  findActiveLearningLesson,
  formatNum,
  getSurahActiveSessionNumber,
  getSurahById,
  getSurahDisplayName,
  toArabicDigits,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { ARABESQUE_CARD_PATTERNS, ArabesqueBackdrop } from '../src/components/milla/ArabesqueBackdrop';
import { DailyQuoteCard } from '../src/components/milla/DailyQuoteCard';
import { MemorizeSettingsModal } from '../src/components/milla/MemorizeModals';
import { QuietDhikrCard } from '../src/components/milla/QuietDhikrCard';
import { SurahProgressBar } from '../src/components/milla/SurahProgressBar';
import { useMilla } from '../src/context/MillaContext';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

const MUSHAF_MORNING_IMG = require('../assets/images/mushaf-morning.jpg');

interface FeatureActionItem {
  id: string;
  label: string;
  subtitle: string;
  icon:
    | 'flash-outline'
    | 'sparkles-outline'
    | 'shuffle-outline'
    | 'git-commit-outline'
    | 'book-outline'
    | 'options-outline';
  onPress: () => void;
  disabled?: boolean;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const router = useRouter();
  const { state, theme, fs, isLoading } = useMilla();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && state && !state.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [isLoading, state, router]);

  if (isLoading || !state || !state.onboardingCompleted) {
    return <View style={[styles.center, { backgroundColor: theme.background }]} />;
  }

  const language = state.language;
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const dirArrow = isRtl ? 'arrow-back' : 'arrow-forward';

  const surah = getSurahById(state.currentSurahId);
  const activeLearning = findActiveLearningLesson(state.lessons, surah.id);
  const portionStart = activeLearning ? activeLearning.startVerse : state.currentAyah;
  const portionEnd = activeLearning
    ? activeLearning.endVerse
    : Math.min(surah.totalAyahs, state.currentAyah + state.dailyTarget - 1);

  const activeSessionNum = getSurahActiveSessionNumber(state.surahSessions, surah.id);
  const surahPlan = computeSurahRevisionPlan(state.lessons, {
    surahId: surah.id,
    activeSessionNumber: activeSessionNum,
    todayIso: todayIso(),
  });

  const { memorizedCount: memorizedInSurah, percent: surahPct } = computeSurahProgress({
    surahId: surah.id,
    totalAyahs: surah.totalAyahs,
    verseRecords: state.verseRecords,
    lessons: state.lessons,
  });

  const totalMemorized = Object.values(state.verseRecords).filter(
    (r) => r.status === 'memorized' || r.status === 'weak',
  ).length;

  const smartQueue5 = buildSmartRevisionQueue(state.lessons, {
    surahSessions: state.surahSessions,
    currentSurahId: surah.id,
    timePreset: 5,
    verseRecords: state.verseRecords,
  });
  const careQueue = buildCareRevisionQueue(
    state.lessons,
    state.surahSessions,
    state.verseRecords,
  );
  const surahSummaries = computeSurahRevisionSummaries(
    state.lessons,
    state.verseRecords,
    state.surahSessions,
    surah.id,
  );
  const currentSurahSummary = surahSummaries.find((s) => s.surahId === surah.id) ?? null;
  const hasCurrentSurahSaved = (currentSurahSummary?.memorizedCount ?? 0) > 0;
  const activeReciterObj = RECITERS.find((r) => r.id === state.reciter) ?? RECITERS[0]!;
  const activeReciterLabel = language === 'ar' ? activeReciterObj.nameAr : activeReciterObj.nameEn;

  const needLessonFirst =
    language === 'en'
      ? 'Complete a lesson first'
      : language === 'fr'
        ? 'Terminez une leçon d’abord'
        : 'ابدأ أول درس أولاً';

  const featureActions: FeatureActionItem[] = [
    {
      id: 'quick_review',
      label:
        language === 'en'
          ? 'Quick Review'
          : language === 'fr'
            ? 'Révision rapide'
            : 'مراجعة سريعة',
      subtitle:
        smartQueue5.length > 0
          ? language === 'en'
            ? `${formatNum(smartQueue5.length, language)} passages ready`
            : language === 'fr'
              ? `${formatNum(smartQueue5.length, language)} passages prêts`
              : `${formatNum(smartQueue5.length, language)} دروس من محفوظك`
          : needLessonFirst,
      icon: 'flash-outline',
      disabled: smartQueue5.length === 0,
      onPress: () =>
        router.push({
          pathname: '/revision-session',
          params: { mode: 'smart', minutes: '5' },
        }),
    },
    careQueue.length > 0
      ? {
          id: 'care_review',
          label:
            language === 'en'
              ? 'Gentle Care'
              : language === 'fr'
                ? 'Soin doux'
                : 'عناية خاصة',
          subtitle:
            language === 'en'
              ? `${formatNum(careQueue.length, language)} challenging verses`
              : language === 'fr'
                ? `${formatNum(careQueue.length, language)} passages difficiles`
                : `${formatNum(careQueue.length, language)} دروس تحتاج عناية`,
          icon: 'sparkles-outline',
          onPress: () =>
            router.push({
              pathname: '/revision-session',
              params: { mode: 'care' },
            }),
        }
      : {
          id: 'random_recall',
          label:
            language === 'en'
              ? 'Random Recall'
              : language === 'fr'
                ? 'Rappel aléatoire'
                : 'تسميع عشوائي',
          subtitle: hasCurrentSurahSaved
            ? getSurahDisplayName(surah, language)
            : needLessonFirst,
          icon: 'shuffle-outline',
          disabled: !hasCurrentSurahSaved,
          onPress: () =>
            router.push({
              pathname: '/revision-session',
              params: { mode: 'surah_random', surahId: String(surah.id) },
            }),
        },
    currentSurahSummary?.hasConnections
      ? {
          id: 'connection_drill',
          label:
            language === 'en'
              ? 'Connection Drill'
              : language === 'fr'
                ? 'Liaisons'
                : 'اختبار الربط',
          subtitle: getSurahDisplayName(surah, language),
          icon: 'git-commit-outline',
          onPress: () =>
            router.push({
              pathname: '/revision-session',
              params: { mode: 'surah_connections', surahId: String(surah.id) },
            }),
        }
      : {
          id: 'surah_flow',
          label:
            language === 'en'
              ? 'Surah Flow'
              : language === 'fr'
                ? 'Enchaînement'
                : 'تسميع السورة',
          subtitle: hasCurrentSurahSaved
            ? getSurahDisplayName(surah, language)
            : needLessonFirst,
          icon: 'book-outline',
          disabled: !hasCurrentSurahSaved,
          onPress: () =>
            router.push({
              pathname: '/revision-session',
              params: { mode: 'surah_flow', surahId: String(surah.id) },
            }),
        },
    {
      id: 'quick_prefs',
      label:
        language === 'en'
          ? 'Portion & Voice'
          : language === 'fr'
            ? 'Portion & Voix'
            : 'الدرس والصوت',
      subtitle: `${formatNum(state.dailyTarget, language)} ${copy.versesUnit} • ${activeReciterLabel}`,
      icon: 'options-outline',
      onPress: () => setSettingsOpen(true),
    },
  ];

  const shortcutsHeading =
    language === 'en'
      ? 'Quick Actions'
      : language === 'fr'
        ? 'Actions rapides'
        : 'اختصارات سريعة';

  return (
    <AppShell title={copy.navHome} subtitle={copy.homeSubtitle}>
      <View style={styles.stack}>
        {/* Greeting */}
        <View>
          <Text
            style={[
              styles.greeting,
              { color: theme.foreground, textAlign: isRtl ? 'right' : 'left', fontSize: fs(24) },
            ]}
          >
            {copy.homeGreeting}
          </Text>
          <Text
            style={[
              styles.subgreeting,
              {
                color: theme.mutedForeground,
                textAlign: isRtl ? 'right' : 'left',
                fontSize: fs(13),
              },
            ]}
          >
            {copy.homeSubgreeting}
          </Text>
        </View>

        {/* Primary Today's Memorization Hero */}
        <View
          style={[
            styles.heroWrap,
            theme.isDark ? { borderWidth: 1, borderColor: theme.border } : null,
          ]}
        >
          <View style={styles.heroBg}>
            <Image
              source={MUSHAF_MORNING_IMG}
              style={[styles.heroOverlay, { width: '100%', height: '100%' }]}
              resizeMode="cover"
              accessible={false}
              importantForAccessibility="no"
            />
            <View
              style={[
                styles.heroOverlay,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(11, 11, 10, 0.84)'
                    : 'rgba(7, 61, 53, 0.84)',
                },
              ]}
            />
            <ArabesqueBackdrop variant="featured" pattern="medallion" />
            <View style={styles.heroInner}>
              <View
                style={[
                  styles.heroBadgesRow,
                  { flexDirection: isRtl ? 'row-reverse' : 'row' },
                ]}
              >
                <View style={[styles.coralBadge, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.coralBadgeText, { color: theme.accentForeground }]}>
                    {copy.homeTodayWird}
                  </Text>
                </View>
                <View style={styles.glassBadge}>
                  <Text style={styles.glassBadgeText}>
                    الدرس {toArabicDigits(activeSessionNum)}
                    {surahPlan.allLessons.length > 0
                      ? ` • ${toArabicDigits(surahPlan.allLessons.length)} للمراجعة`
                      : ''}
                  </Text>
                </View>
              </View>

              <Text style={[styles.heroTitle, { textAlign: isRtl ? 'right' : 'left' }]}>
                {getSurahDisplayName(surah, language)}
              </Text>
              <Text style={[styles.heroSub, { textAlign: isRtl ? 'right' : 'left' }]}>
                {copy.ayahLabel} {formatNum(portionStart, language)} -{' '}
                {formatNum(portionEnd, language)} • {copy.hizbLabel}{' '}
                {formatNum(surah.hizb, language)}
              </Text>

              <View style={styles.heroProgressWrap}>
                <View
                  style={[
                    styles.heroProgressLabels,
                    { flexDirection: isRtl ? 'row-reverse' : 'row' },
                  ]}
                >
                  <Text style={styles.heroProgressText}>
                    {formatNum(memorizedInSurah, language)} /{' '}
                    {formatNum(surah.totalAyahs, language)} {copy.versesUnit}
                  </Text>
                  <Text style={[styles.heroPctText, { color: theme.accent }]}>
                    {formatNum(surahPct, language)}%
                  </Text>
                </View>
                <SurahProgressBar
                  percent={surahPct}
                  trackColor="rgba(255,255,255,0.2)"
                  fillColor={theme.accent}
                  height={7}
                />
              </View>

              <Pressable
                onPress={() => router.push('/memorize-session')}
                style={[
                  styles.heroCta,
                  {
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    backgroundColor: theme.isDark ? theme.primary : '#f7f5ed',
                  },
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.heroCtaText,
                    { color: theme.isDark ? theme.primaryForeground : '#073d35' },
                  ]}
                >
                  {totalMemorized > 0
                    ? copy.homeContinueCta
                    : language === 'en'
                      ? 'Start Memorizing'
                      : language === 'fr'
                        ? 'Commencer'
                        : 'ابدأ الحفظ'}
                </Text>
                <Ionicons
                  name={dirArrow}
                  size={20}
                  color={theme.isDark ? theme.primaryForeground : '#073d35'}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <DailyQuoteCard />

        {/* All App Feature Shortcuts */}
        <View style={styles.sectionBlock}>
          <Text
            style={[
              styles.sectionHeading,
              { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {shortcutsHeading}
          </Text>

          <View style={styles.shortcutsGrid}>
            {[0, 2].map((rowStart) => (
              <View
                key={rowStart}
                style={[styles.shortcutsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
              >
                {featureActions.slice(rowStart, rowStart + 2).map((item, offset) => {
                  const idx = rowStart + offset;
                  const isDisabled = Boolean(item.disabled);
                  const shortcutPattern =
                    ARABESQUE_CARD_PATTERNS[idx % ARABESQUE_CARD_PATTERNS.length] ?? 'medallion';
                  return (
                    <Pressable
                      key={item.id}
                      disabled={isDisabled}
                      onPress={item.onPress}
                      style={[
                        styles.shortcutCard,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                          opacity: isDisabled ? 0.58 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: isDisabled }}
                    >
                      <ArabesqueBackdrop variant="corner" pattern={shortcutPattern} />

                      <View
                        style={[
                          styles.shortcutTop,
                          { flexDirection: isRtl ? 'row-reverse' : 'row' },
                        ]}
                      >
                        <View
                          style={[
                            styles.shortcutIconBox,
                            { backgroundColor: isDisabled ? theme.muted : theme.secondary },
                          ]}
                        >
                          <Ionicons
                            name={item.icon}
                            size={20}
                            color={
                              isDisabled
                                ? theme.mutedForeground
                                : theme.isDark
                                  ? theme.foreground
                                  : theme.primary
                            }
                          />
                        </View>
                        <Ionicons
                          name={dirArrow}
                          size={16}
                          color={
                            isDisabled
                              ? theme.mutedForeground
                              : theme.isDark
                                ? theme.foreground
                                : theme.primary
                          }
                        />
                      </View>

                      <Text
                        style={[
                          styles.shortcutTitle,
                          { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                        ]}
                        numberOfLines={2}
                        maxFontSizeMultiplier={1.25}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.shortcutSub,
                          { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
                        ]}
                        numberOfLines={2}
                        maxFontSizeMultiplier={1.2}
                      >
                        {item.subtitle}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <QuietDhikrCard />
      </View>

      <MemorizeSettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  stack: { gap: SPACING.xl },
  greeting: { fontSize: 24, fontWeight: '700' },
  subgreeting: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  heroWrap: {
    borderRadius: RADII.hero,
    overflow: 'hidden',
  },
  heroBg: {
    width: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(7, 61, 53, 0.84)',
  },
  heroInner: {
    padding: SPACING.xl,
    gap: 12,
  },
  heroBadgesRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  coralBadge: {
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  coralBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#073d35',
  },
  glassBadge: {
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  glassBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
  },
  heroProgressWrap: {
    gap: 6,
    marginTop: 4,
  },
  heroProgressLabels: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroProgressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.86)',
  },
  heroPctText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  heroFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroCta: {
    minHeight: 50,
    borderRadius: RADII.card,
    backgroundColor: '#f7f5ed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  heroCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#073d35',
  },
  sectionBlock: {
    gap: SPACING.md,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  shortcutsGrid: {
    gap: 10,
  },
  shortcutsRow: {
    gap: 10,
  },
  shortcutCard: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 116,
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.md,
    gap: 8,
    justifyContent: 'space-between',
  },
  shortcutTop: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shortcutIconBox: {
    width: MIN_TOUCH_TARGET - 6,
    height: MIN_TOUCH_TARGET - 6,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonBadge: {
    borderRadius: RADII.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  soonBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  shortcutSub: {
    fontSize: 11,
    lineHeight: 16,
  },
});
