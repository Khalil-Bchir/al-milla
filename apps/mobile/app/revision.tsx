import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  buildCareRevisionQueue,
  buildSmartRevisionQueue,
  computeSurahRevisionSummaries,
  formatNum,
  getSurahById,
  getSurahDisplayName,
  type RevisionTimePreset,
  type SurahRevisionCardSummary,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { ARABESQUE_CARD_PATTERNS, ArabesqueBackdrop } from '../src/components/milla/ArabesqueBackdrop';
import { SurahProgressBar } from '../src/components/milla/SurahProgressBar';
import { useMilla } from '../src/context/MillaContext';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

const QUIET_STUDY_IMG = require('../assets/images/quiet-study.jpg');
const HERO_REVISION_IMG = require('../assets/images/hero-revision.jpg');
const TIME_PRESETS: readonly { minutes: RevisionTimePreset; label: string }[] = [
  { minutes: 5, label: 'سريعة' },
  { minutes: 10, label: 'متوسطة' },
  { minutes: 20, label: 'شاملة' },
];

export default function RevisionDashboardScreen() {
  const router = useRouter();
  const { state, theme } = useMilla();

  const [timePreset, setTimePreset] = useState<RevisionTimePreset>(10);
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
  const [showAllSurahsModal, setShowAllSurahsModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [surahSearch, setSurahSearch] = useState('');

  const language = state?.language ?? 'ar';
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const dirArrow = isRtl ? 'arrow-back' : 'arrow-forward';

  const surahSummaries = useMemo<SurahRevisionCardSummary[]>(() => {
    if (!state) return [];
    return computeSurahRevisionSummaries(
      state.lessons,
      state.verseRecords,
      state.surahSessions,
      state.currentSurahId,
    );
  }, [state]);

  const smartQueue = useMemo(() => {
    if (!state) return [];
    return buildSmartRevisionQueue(state.lessons, {
      surahSessions: state.surahSessions,
      currentSurahId: state.currentSurahId,
      timePreset,
      verseRecords: state.verseRecords,
    });
  }, [state, timePreset]);

  const careQueue = useMemo(() => {
    if (!state) return [];
    return buildCareRevisionQueue(state.lessons, state.surahSessions, state.verseRecords);
  }, [state]);

  const smartSurahNames = useMemo(() => {
    const ids = Array.from(new Set(smartQueue.map((item) => item.surahId)));
    return ids.map((id) => getSurahDisplayName(getSurahById(id), language));
  }, [smartQueue, language]);

  const previewSummaries = useMemo(() => surahSummaries.slice(0, 4), [surahSummaries]);

  const modalFilteredSummaries = useMemo(() => {
    const q = surahSearch.trim().toLowerCase();
    if (!q) return surahSummaries;
    return surahSummaries.filter((item) => {
      const s = getSurahById(item.surahId);
      const hay = `${item.surahId} ${s.nameAr} ${s.nameEn} ${s.nameFr}`.toLowerCase();
      return hay.includes(q);
    });
  }, [surahSummaries, surahSearch]);

  if (!state) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const hasSavedContent = surahSummaries.length > 0;
  const hasSmartItems = smartQueue.length > 0;
  const selectedSummary =
    selectedSurahId !== null
      ? (surahSummaries.find((s) => s.surahId === selectedSurahId) ?? null)
      : null;

  const handleLaunchSmart = () => {
    if (!hasSmartItems) {
      if (hasSavedContent && surahSummaries[0]) {
        setSelectedSurahId(surahSummaries[0].surahId);
        return;
      }
      router.push('/memorize');
      return;
    }
    router.push({
      pathname: '/revision-session',
      params: { mode: 'smart', minutes: String(timePreset) },
    });
  };

  const handleLaunchCare = () => {
    router.push({
      pathname: '/revision-session',
      params: { mode: 'care' },
    });
  };

  const handleLaunchSurahMode = (
    surahId: number,
    mode: 'surah_flow' | 'surah_connections' | 'surah_random',
  ) => {
    setSelectedSurahId(null);
    setShowAllSurahsModal(false);
    router.push({
      pathname: '/revision-session',
      params: { mode, surahId: String(surahId) },
    });
  };

  const totalLessonsCount = state.lessons.length;
  const careLessonsCount = careQueue.length;
  const strongLessonsCount = state.lessons.filter(
    (l) => l.state === 'done' && l.lastEvaluation !== 'difficult' && l.consecutiveDifficultCount === 0,
  ).length;
  const steadyLessonsCount = Math.max(0, totalLessonsCount - strongLessonsCount - careLessonsCount);
  const readySurahId = surahSummaries[0]?.surahId ?? null;
  const connectionsSurahId = surahSummaries.find((s) => s.hasConnections)?.surahId ?? null;

  const modesHeading =
    language === 'en'
      ? 'Revision Modes'
      : language === 'fr'
        ? 'Modes de révision'
        : 'أساليب المراجعة';

  const modeCards: readonly {
    id: string;
    icon: 'reader-outline' | 'git-merge-outline' | 'shuffle-outline' | 'heart-outline';
    title: string;
    subtitle: string;
    badge?: string;
    disabled: boolean;
    onPress: () => void;
  }[] = [
    {
      id: 'flow',
      icon: 'reader-outline',
      title: language === 'en' ? 'Connected Flow' : language === 'fr' ? 'Flux continu' : 'تلاوة متصلة',
      subtitle: readySurahId
        ? getSurahDisplayName(getSurahById(readySurahId), language)
        : language === 'en'
          ? 'Start memorizing first'
          : language === 'fr'
            ? 'Commencez à mémoriser'
            : 'ابدأ الحفظ أولاً',
      disabled: readySurahId === null,
      onPress: () => {
        if (readySurahId !== null) handleLaunchSurahMode(readySurahId, 'surah_flow');
      },
    },
    {
      id: 'connections',
      icon: 'git-merge-outline',
      title:
        language === 'en' ? 'Verse Linking' : language === 'fr' ? 'Liaison des versets' : 'ربط الآيات',
      subtitle: connectionsSurahId
        ? getSurahDisplayName(getSurahById(connectionsSurahId), language)
        : language === 'en'
          ? 'Needs 2 passages in a surah'
          : language === 'fr'
            ? 'Requiert 2 passages'
            : 'يتطلب مقطعين في سورة',
      disabled: connectionsSurahId === null,
      onPress: () => {
        if (connectionsSurahId !== null) handleLaunchSurahMode(connectionsSurahId, 'surah_connections');
      },
    },
    {
      id: 'random',
      icon: 'shuffle-outline',
      title: language === 'en' ? 'Random Recall' : language === 'fr' ? 'Rappel aléatoire' : 'اختبار عشوائي',
      subtitle: readySurahId
        ? getSurahDisplayName(getSurahById(readySurahId), language)
        : language === 'en'
          ? 'Start memorizing first'
          : language === 'fr'
            ? 'Commencez à mémoriser'
            : 'ابدأ الحفظ أولاً',
      disabled: readySurahId === null,
      onPress: () => {
        if (readySurahId !== null) handleLaunchSurahMode(readySurahId, 'surah_random');
      },
    },
    {
      id: 'care',
      icon: 'heart-outline',
      title: language === 'en' ? 'Gentle Care' : language === 'fr' ? 'Soin particulier' : 'عناية خاصة',
      subtitle:
        careLessonsCount > 0
          ? language === 'en'
            ? 'Strengthen harder passages'
            : language === 'fr'
              ? 'Consolider les passages'
              : 'تثبيت الآيات الصعبة'
          : language === 'en'
            ? 'Everything is steady'
            : language === 'fr'
              ? 'Tout est stable'
              : 'محفوظك مستقر حالياً',
      badge: careLessonsCount > 0 ? formatNum(careLessonsCount, language) : undefined,
      disabled: careLessonsCount === 0,
      onPress: handleLaunchCare,
    },
  ];

  return (
    <AppShell title={copy.navRevision}>
      <View style={styles.stack}>
        <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <View style={styles.headerTextCol}>
            <Text
              style={[
                styles.pageTitle,
                { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
              ]}
            >
              {language === 'en'
                ? 'Tend to What You Memorized'
                : language === 'fr'
                  ? 'Prenez soin de vos acquis'
                  : 'تعاهَد محفوظك برفق'}
            </Text>
            <Text
              style={[
                styles.pageSubtitle,
                { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
              ]}
            >
              {language === 'en'
                ? 'Calm, steady review keeps every verse alive in your heart.'
                : language === 'fr'
                  ? 'Une révision paisible garde chaque verset vivant dans votre cœur.'
                  : 'المراجعة الهادئة تُبقي الآيات حيّة في قلبك دون عجلة.'}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowInfoModal(true)}
            style={[
              styles.infoIconBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel="دليل المراجعة"
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.isDark ? theme.foreground : theme.primary}
            />
          </Pressable>
        </View>

        {/* Smart Daily Revision Hero */}
        <View
          style={[
            styles.heroWrap,
            {
              borderWidth: theme.isDark ? 1 : 0,
              borderColor: theme.isDark ? theme.border : 'transparent',
            },
          ]}
        >
          <View style={styles.heroBg}>
            <Image
              source={HERO_REVISION_IMG}
              style={[styles.heroOverlay, { width: '100%', height: '100%' }]}
              resizeMode="cover"
            />
            <View
              style={[
                styles.heroOverlay,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(18, 20, 18, 0.80)'
                    : 'rgba(7, 61, 53, 0.82)',
                },
              ]}
            />
            <View style={styles.heroCard}>
          <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <View style={[styles.heroPill, { backgroundColor: theme.accent }]}>
              <Text
                style={[
                  styles.heroPillDarkText,
                  { color: theme.isDark ? theme.accentForeground : '#073d35' },
                ]}
              >
                المراجعة الذكية
              </Text>
            </View>
            {hasSmartItems ? (
              <View style={styles.heroGlassPill}>
                <Text style={[styles.heroGlassText, { color: theme.accent }]}>
                  {formatNum(smartQueue.length, language)} مقاطع
                </Text>
              </View>
            ) : null}
          </View>

          <View style={{ gap: 4 }}>
            <Text style={[styles.heroTitle, { textAlign: isRtl ? 'right' : 'left' }]}>
              راجع محفوظك
            </Text>
            <Text style={[styles.heroSub, { textAlign: isRtl ? 'right' : 'left' }]}>
              {hasSmartItems
                ? smartSurahNames.length === 1
                  ? `${formatNum(smartQueue.length, language)} مقاطع من ${smartSurahNames[0]}`
                  : `${formatNum(smartQueue.length, language)} مقاطع من ${formatNum(smartSurahNames.length, language)} سور`
                : hasSavedContent
                  ? 'اختر أي سورة بالأسفل لمراجعتها'
                  : 'احفظ أول درس لتبدأ خطة مراجعتك'}
            </Text>
          </View>

          {/* Time-box Selector */}
          <View style={[styles.timeRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            {TIME_PRESETS.map((preset) => {
              const selected = timePreset === preset.minutes;
              return (
                <Pressable
                  key={preset.minutes}
                  onPress={() => setTimePreset(preset.minutes)}
                  style={[
                    styles.timeChip,
                    {
                      borderColor: selected ? theme.accent : 'rgba(255,255,255,0.22)',
                      backgroundColor: selected ? `${theme.accent}2E` : 'rgba(255,255,255,0.08)',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      { color: selected ? theme.accent : '#ffffff' },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleLaunchSmart}
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
              {hasSmartItems ? 'ابدأ المراجعة' : hasSavedContent ? 'اختر سورة للمراجعة' : 'ابدأ أول درس حفظ'}
            </Text>
            <Ionicons
              name={dirArrow}
              size={18}
              color={theme.isDark ? theme.primaryForeground : '#073d35'}
            />
          </Pressable>
            </View>
          </View>
        </View>

        {/* Revision Strength & Overview Analytics */}
        <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ArabesqueBackdrop variant="subtle" pattern="arch" />

          <View style={[styles.statsGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <View style={[styles.statTile, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.statVal, { color: theme.isDark ? theme.foreground : theme.primary }]}>
                {formatNum(surahSummaries.length, language)}
              </Text>
              <Text style={[styles.statLbl, { color: theme.mutedForeground }]}>
                {language === 'en' ? 'Surahs' : language === 'fr' ? 'Sourates' : 'سورة للمراجعة'}
              </Text>
            </View>
            <View style={[styles.statTile, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.statVal, { color: theme.isDark ? theme.foreground : theme.primary }]}>
                {formatNum(smartQueue.length, language)}
              </Text>
              <Text style={[styles.statLbl, { color: theme.mutedForeground }]}>
                {language === 'en'
                  ? "Today's Passages"
                  : language === 'fr'
                    ? 'Passages du jour'
                    : 'مقاطع اليوم'}
              </Text>
            </View>
            <View style={[styles.statTile, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.statVal, { color: theme.isDark ? theme.foreground : theme.primary }]}>
                {formatNum(careLessonsCount, language)}
              </Text>
              <Text style={[styles.statLbl, { color: theme.mutedForeground }]}>
                {language === 'en' ? 'Needs Care' : language === 'fr' ? 'À consolider' : 'تحتاج عناية'}
              </Text>
            </View>
          </View>

          {totalLessonsCount > 0 ? (
            <View style={styles.masteryWrap}>
              <View style={[styles.masteryTrack, { backgroundColor: theme.secondary }]}>
                {strongLessonsCount > 0 ? (
                  <View
                    style={[
                      styles.masterySeg,
                      { flex: strongLessonsCount, backgroundColor: theme.primary },
                    ]}
                  />
                ) : null}
                {steadyLessonsCount > 0 ? (
                  <View
                    style={[
                      styles.masterySeg,
                      { flex: steadyLessonsCount, backgroundColor: theme.accent },
                    ]}
                  />
                ) : null}
                {careLessonsCount > 0 ? (
                  <View
                    style={[
                      styles.masterySeg,
                      { flex: careLessonsCount, backgroundColor: theme.mutedForeground },
                    ]}
                  />
                ) : null}
              </View>
              <View
                style={[styles.masteryLegend, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
              >
                <View style={[styles.legendItem, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                  <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                    {language === 'en' ? 'Strong' : language === 'fr' ? 'Maîtrisé' : 'متقن'} (
                    {formatNum(strongLessonsCount, language)})
                  </Text>
                </View>
                <View style={[styles.legendItem, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
                  <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                    {language === 'en' ? 'Steady' : language === 'fr' ? 'En cours' : 'قيد التثبيت'} (
                    {formatNum(steadyLessonsCount, language)})
                  </Text>
                </View>
                <View style={[styles.legendItem, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.legendDot, { backgroundColor: theme.mutedForeground }]} />
                  <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                    {language === 'en' ? 'Needs Care' : language === 'fr' ? 'Fragile' : 'يحتاج عناية'} (
                    {formatNum(careLessonsCount, language)})
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>

        {/* Quick Revision Modes 2x2 Grid */}
        <View style={styles.sectionBlock}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            {modesHeading}
          </Text>

          <View style={styles.modesGrid}>
            {modeCards.map((item, idx) => {
              const modePattern =
                ARABESQUE_CARD_PATTERNS[idx % ARABESQUE_CARD_PATTERNS.length] ?? 'medallion';
              return (
                <Pressable
                  key={item.id}
                  disabled={item.disabled}
                  onPress={item.onPress}
                  style={[
                    styles.modeGridCard,
                    {
                      backgroundColor: theme.card,
                      borderColor:
                        theme.isDark || item.disabled ? theme.border : theme.primary,
                      opacity: item.disabled ? 0.58 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: item.disabled }}
                >
                  <ArabesqueBackdrop variant="corner" pattern={modePattern} />

                  <View
                    style={[
                      styles.modeGridTop,
                      { flexDirection: isRtl ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <View
                      style={[
                        styles.modeGridIconBox,
                        { backgroundColor: item.disabled ? theme.muted : theme.secondary },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={
                          item.disabled
                            ? theme.mutedForeground
                            : theme.isDark
                              ? theme.foreground
                              : theme.primary
                        }
                      />
                    </View>
                    {item.badge ? (
                      <View
                        style={[
                          styles.modeBadgePill,
                          { backgroundColor: `${theme.accent}28` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modeBadgeText,
                            { color: theme.isDark ? theme.accent : theme.foreground },
                          ]}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    ) : (
                      <Ionicons
                        name={dirArrow}
                        size={16}
                        color={
                          item.disabled
                            ? theme.mutedForeground
                            : theme.isDark
                              ? theme.foreground
                              : theme.primary
                        }
                      />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.modeGridTitle,
                      { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.modeGridSub,
                      { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
                    ]}
                    numberOfLines={2}
                  >
                    {item.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Revise by Surah */}
        <View style={styles.sectionBlock}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            اختر سورة للمراجعة
          </Text>

          {surahSummaries.length === 0 ? (
            <View style={styles.emptyImageWrap}>
              <View style={styles.emptyBg}>
                <Image
                  source={QUIET_STUDY_IMG}
                  style={[styles.emptyOverlay, { width: '100%', height: '100%' }]}
                  resizeMode="cover"
                />
                <View
                  style={[
                    styles.emptyOverlay,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(11, 11, 10, 0.78)'
                        : 'rgba(7, 61, 53, 0.74)',
                    },
                  ]}
                />
                <View style={styles.emptyCard}>
                  <Ionicons name="refresh-outline" size={28} color="#ffffff" />
                  <Text style={styles.emptyImageText}>
                    ستظهر هنا السور التي بدأت بحفظها لمراجعتها في أي وقت.
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.surahCardsList}>
              {previewSummaries.map((summary, idx) => {
                const surah = getSurahById(summary.surahId);
                const summaryPattern =
                  ARABESQUE_CARD_PATTERNS[(idx + 1) % ARABESQUE_CARD_PATTERNS.length] ??
                  'rosette';
                return (
                  <Pressable
                    key={summary.surahId}
                    onPress={() => setSelectedSurahId(summary.surahId)}
                    style={[
                      styles.surahCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                    accessibilityRole="button"
                  >
                    <ArabesqueBackdrop variant="corner" pattern={summaryPattern} />

                    <View
                      style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
                    >
                      <View
                        style={[
                          styles.surahTitleGroup,
                          { flexDirection: isRtl ? 'row-reverse' : 'row' },
                        ]}
                      >
                        <Text style={[styles.surahName, { color: theme.foreground }]}>
                          {getSurahDisplayName(surah, language)}
                        </Text>
                        <View
                          style={[
                            styles.readinessPill,
                            {
                              backgroundColor:
                                summary.readiness === 'care'
                                  ? `${theme.accent}28`
                                  : theme.secondary,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.readinessText,
                              {
                                color:
                                  summary.readiness === 'care' && theme.isDark
                                    ? theme.accent
                                    : theme.foreground,
                              },
                            ]}
                          >
                            {summary.readiness === 'care'
                              ? 'تحتاج عناية'
                              : summary.readiness === 'ready'
                                ? 'جاهزة'
                                : 'مستقرة'}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.surahTitleGroup,
                          { flexDirection: isRtl ? 'row-reverse' : 'row' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.surahPct,
                            { color: theme.isDark ? theme.foreground : theme.primary },
                          ]}
                        >
                          {formatNum(summary.percent, language)}%
                        </Text>
                        <Ionicons
                          name={isRtl ? 'chevron-back' : 'chevron-forward'}
                          size={16}
                          color={theme.mutedForeground}
                        />
                      </View>
                    </View>

                    <SurahProgressBar percent={summary.percent} height={6} />

                    <Text
                      style={[
                        styles.metaText,
                        { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
                      ]}
                    >
                      {formatNum(summary.memorizedCount, language)} /{' '}
                      {formatNum(summary.totalAyahs, language)} آية •{' '}
                      {formatNum(summary.lessonCount, language)} مقاطع
                    </Text>
                  </Pressable>
                );
              })}

              {surahSummaries.length > 4 ? (
                <Pressable
                  onPress={() => {
                    setSurahSearch('');
                    setShowAllSurahsModal(true);
                  }}
                  style={[
                    styles.viewAllBtn,
                    {
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      borderColor: theme.border,
                      backgroundColor: theme.card,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.viewAllText,
                      { color: theme.isDark ? theme.foreground : theme.primary },
                    ]}
                  >
                    عرض كل السور ({formatNum(surahSummaries.length, language)})
                  </Text>
                  <Ionicons
                    name={dirArrow}
                    size={16}
                    color={theme.isDark ? theme.foreground : theme.primary}
                  />
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </View>

      {/* Surah Mode Selector Sheet */}
      <Modal
        visible={selectedSummary !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedSurahId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            {selectedSummary ? (
              <>
                <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start', gap: 2 }}>
                    <Text style={[styles.modalTitle, { color: theme.foreground }]}>
                      {getSurahDisplayName(getSurahById(selectedSummary.surahId), language)}
                    </Text>
                    <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                      اختر أسلوب المراجعة لهذه السورة فقط
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setSelectedSurahId(null)}
                    style={styles.modalCloseBtn}
                    accessibilityRole="button"
                    accessibilityLabel="إغلاق"
                  >
                    <Ionicons name="close" size={22} color={theme.foreground} />
                  </Pressable>
                </View>

                <View style={styles.modeCardsStack}>
                  <Pressable
                    onPress={() => handleLaunchSurahMode(selectedSummary.surahId, 'surah_flow')}
                    style={[
                      styles.modeTile,
                      {
                        flexDirection: isRtl ? 'row-reverse' : 'row',
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                      },
                    ]}
                  >
                    <View style={[styles.modeIconBox, { backgroundColor: theme.secondary }]}>
                      <Ionicons
                        name="book-outline"
                        size={18}
                        color={theme.isDark ? theme.foreground : theme.primary}
                      />
                    </View>
                    <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start', gap: 2 }}>
                      <Text style={[styles.surahName, { color: theme.foreground }]}>
                        تسميع بالترتيب
                      </Text>
                      <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                        راجع السورة من أولها
                      </Text>
                    </View>
                    <Ionicons name={dirArrow} size={16} color={theme.mutedForeground} />
                  </Pressable>

                  <Pressable
                    disabled={!selectedSummary.hasConnections}
                    onPress={() =>
                      handleLaunchSurahMode(selectedSummary.surahId, 'surah_connections')
                    }
                    style={[
                      styles.modeTile,
                      {
                        flexDirection: isRtl ? 'row-reverse' : 'row',
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                        opacity: selectedSummary.hasConnections ? 1 : 0.45,
                      },
                    ]}
                  >
                    <View style={[styles.modeIconBox, { backgroundColor: theme.secondary }]}>
                      <Ionicons
                        name="git-commit-outline"
                        size={18}
                        color={theme.isDark ? theme.foreground : theme.primary}
                      />
                    </View>
                    <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start', gap: 2 }}>
                      <Text style={[styles.surahName, { color: theme.foreground }]}>
                        اختبار الربط
                      </Text>
                      <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                        {selectedSummary.hasConnections
                          ? 'الوصل بين الدروس المتجاورة'
                          : 'يتاح بعد إتمام درسين متجاورين'}
                      </Text>
                    </View>
                    <Ionicons name={dirArrow} size={16} color={theme.mutedForeground} />
                  </Pressable>

                  <Pressable
                    onPress={() => handleLaunchSurahMode(selectedSummary.surahId, 'surah_random')}
                    style={[
                      styles.modeTile,
                      {
                        flexDirection: isRtl ? 'row-reverse' : 'row',
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                      },
                    ]}
                  >
                    <View style={[styles.modeIconBox, { backgroundColor: `${theme.accent}24` }]}>
                      <Ionicons name="shuffle-outline" size={18} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start', gap: 2 }}>
                      <Text style={[styles.surahName, { color: theme.foreground }]}>
                        تسميع عشوائي
                      </Text>
                      <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                        ابدأ من مواضع متفرقة
                      </Text>
                    </View>
                    <Ionicons name={dirArrow} size={16} color={theme.mutedForeground} />
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Virtualized All Surahs Modal */}
      <Modal
        visible={showAllSurahsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAllSurahsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { maxHeight: '82%', backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: theme.foreground }]}>
                جميع السور ({formatNum(surahSummaries.length, language)})
              </Text>
              <Pressable
                onPress={() => setShowAllSurahsModal(false)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="إغلاق"
              >
                <Ionicons name="close" size={22} color={theme.foreground} />
              </Pressable>
            </View>

            <View
              style={[
                styles.searchWrap,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
            >
              <Ionicons name="search-outline" size={18} color={theme.mutedForeground} />
              <TextInput
                value={surahSearch}
                onChangeText={setSurahSearch}
                placeholder="ابحث باسم السورة أو رقمها..."
                placeholderTextColor={theme.mutedForeground}
                style={[
                  styles.searchInput,
                  { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                ]}
              />
              {surahSearch.length > 0 ? (
                <Pressable onPress={() => setSurahSearch('')}>
                  <Ionicons name="close-circle" size={18} color={theme.mutedForeground} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={modalFilteredSummaries}
              keyExtractor={(item) => String(item.surahId)}
              initialNumToRender={14}
              windowSize={7}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => {
                const surah = getSurahById(item.surahId);
                return (
                  <Pressable
                    onPress={() => {
                      setShowAllSurahsModal(false);
                      setSelectedSurahId(item.surahId);
                    }}
                    style={[
                      styles.compactRow,
                      {
                        flexDirection: isRtl ? 'row-reverse' : 'row',
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                      },
                    ]}
                  >
                    <View style={[styles.surahNumCircle, { backgroundColor: theme.secondary }]}>
                      <Text
                        style={[
                          styles.surahNumText,
                          { color: theme.isDark ? theme.foreground : theme.primary },
                        ]}
                      >
                        {formatNum(item.surahId, language)}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View
                        style={[
                          styles.rowBetween,
                          { flexDirection: isRtl ? 'row-reverse' : 'row' },
                        ]}
                      >
                        <Text style={[styles.surahName, { color: theme.foreground }]}>
                          {getSurahDisplayName(surah, language)}
                        </Text>
                        <Text
                          style={[
                            styles.surahPct,
                            { color: theme.isDark ? theme.foreground : theme.primary },
                          ]}
                        >
                          {formatNum(item.percent, language)}%
                        </Text>
                      </View>
                      <SurahProgressBar percent={item.percent} height={4} />
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Revision Guide Info Modal */}
      <Modal
        visible={showInfoModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { maxHeight: '82%', backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: theme.foreground }]}>
                دليل المراجعة
              </Text>
              <Pressable
                onPress={() => setShowInfoModal(false)}
                style={styles.modalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="إغلاق"
              >
                <Ionicons name="close" size={22} color={theme.foreground} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalListContent}
            >
              {[
                {
                  title: 'المراجعة الذكية',
                  body: 'تختار لك تلقائياً أهم ما يحتاج إلى مراجعة بناءً على تقييمك السابق وحالة الدروس دون خلط بين السور ودون بدء درس حفظ جديد. اختر «سريعة» (حتى مقطعين)، «متوسطة» (حتى ٤ مقاطع)، أو «شاملة» (حتى ٨ مقاطع).',
                },
                {
                  title: 'مقاطع تحتاج عناية',
                  body: 'تظهر تلقائياً عند وجود مقاطع قيّمتها كـ «صعب» أو لا تزال قيد التعلّم، لتثبيتها بهدوء بالاستماع والتدرّج.',
                },
                {
                  title: 'أساليب مراجعة السورة',
                  body: '• تسميع بالترتيب: مراجعة مقاطع السورة بالتسلسل من بدايتها.\n• اختبار الربط: التركيز على مواضع الوصل بين الدروس المتجاورة.\n• تسميع عشوائي: استدعاء مقاطع متفرقة لكسر الاعتماد على الترتيب فقط.',
                },
                {
                  title: 'التلميح والتقييم',
                  body: 'أثناء الإخفاء الكامل يمكنك استخدام زر «تلميح» لإظهار الكلمات الأولى فقط من الآية. تقييمك بعد كل مقطع يحدّث أولوية مراجعتك القادمة وشريط قوة الحفظ دون تغيير موضع حفظك الجديد.',
                },
                {
                  title: 'كيف يؤثر التقييم على المراجعة؟',
                  body: '• صعب: يرفع أولوية المقطع فوراً إلى مقدّمة المراجعة الذكية ويضيفه إلى «عناية خاصة».\n• جيد: يثبّت المقطع بالإخفاء التدريجي (١/٣ ثم ٢/٣ ثم ٣/٣) ويعيده للمراجعة قريباً.\n• سهل: يرفع حالة المقطع إلى «متقن» ويباعد بين جلسات مراجعته (١، ٣، ٧، ١٤، ٣٠ جلسة).',
                },
              ].map((item) => (
                <View
                  key={item.title}
                  style={[
                    styles.infoGuideCard,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.surahName,
                      {
                        color: theme.isDark ? theme.accent : theme.primary,
                        textAlign: isRtl ? 'right' : 'left',
                      },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.infoGuideBody,
                      { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                    ]}
                  >
                    {item.body}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { gap: SPACING.lg },
  headerTextCol: { flex: 1, gap: 4 },
  pageTitle: { fontSize: 24, fontWeight: '700' },
  pageSubtitle: { fontSize: 13, lineHeight: 20 },
  rowBetween: { alignItems: 'center', justifyContent: 'space-between', gap: 10 },
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
  },
  heroCard: {
    padding: SPACING.xl,
    gap: 14,
  },
  heroPill: {
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillDarkText: { fontSize: 11, fontWeight: '700' },
  heroGlassPill: {
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroGlassText: { fontSize: 12, fontWeight: '700' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 20 },
  timeRow: { gap: 8 },
  timeChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipText: { fontSize: 13, fontWeight: '700' },
  heroCta: {
    minHeight: 48,
    borderRadius: RADII.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  heroCtaText: { fontSize: 14, fontWeight: '700' },
  statsCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.md,
    gap: 12,
  },
  statsGrid: { gap: 8 },
  statTile: {
    flex: 1,
    borderRadius: RADII.control,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  statVal: { fontSize: 19, fontWeight: '700' },
  statLbl: { fontSize: 11, textAlign: 'center' },
  masteryWrap: { gap: 8 },
  masteryTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 2,
  },
  masterySeg: {
    height: '100%',
    borderRadius: 3,
  },
  masteryLegend: {
    justifyContent: 'space-around',
    gap: 8,
  },
  legendItem: {
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modeGridCard: {
    position: 'relative',
    overflow: 'hidden',
    width: '48.5%',
    minHeight: 116,
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.md,
    gap: 8,
    justifyContent: 'space-between',
  },
  modeGridTop: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeGridIconBox: {
    width: MIN_TOUCH_TARGET - 6,
    height: MIN_TOUCH_TARGET - 6,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBadgePill: {
    borderRadius: RADII.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modeGridTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  modeGridSub: {
    fontSize: 11,
    lineHeight: 16,
  },
  sectionBlock: { gap: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  emptyImageWrap: { borderRadius: RADII.card, overflow: 'hidden' },
  emptyBg: { width: '100%' },
  emptyOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 18,
    gap: 10,
  },
  emptyImageText: {
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  surahCardsList: { gap: SPACING.md },
  surahCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: 12,
  },
  surahTitleGroup: { alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  surahName: { fontSize: 15, fontWeight: '700' },
  readinessPill: {
    borderRadius: RADII.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  readinessText: { fontSize: 11, fontWeight: '700' },
  surahPct: { fontSize: 13, fontWeight: '700' },
  metaText: { fontSize: 11, lineHeight: 16 },
  chooseModeBtn: {
    minHeight: 36,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  chooseModeText: { fontSize: 12, fontWeight: '700' },
  viewAllBtn: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  viewAllText: { fontSize: 13, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: RADII.hero,
    borderTopRightRadius: RADII.hero,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalCloseBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCardsStack: { gap: 10, paddingBottom: 12 },
  modeTile: {
    minHeight: 64,
    borderRadius: RADII.control,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  modeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 8 },
  modalListContent: { gap: 8, paddingBottom: 16 },
  compactRow: {
    minHeight: 58,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 12,
  },
  surahNumCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahNumText: { fontSize: 12, fontWeight: '700' },
  infoIconBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: RADII.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGuideCard: {
    borderRadius: RADII.control,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  infoGuideBody: { fontSize: 13, lineHeight: 21 },
});
