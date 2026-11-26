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
  SURAHS,
  computeSurahProgress,
  computeSurahRevisionPlan,
  findActiveLearningLesson,
  formatNum,
  getSurahActiveSessionNumber,
  getSurahById,
  getSurahDisplayName,
  type LessonRecord,
  type SelfEvalRating,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { ARABESQUE_CARD_PATTERNS, ArabesqueBackdrop } from '../src/components/milla/ArabesqueBackdrop';
import { MemorizeInfoModal } from '../src/components/milla/MemorizeModals';
import { SurahProgressBar } from '../src/components/milla/SurahProgressBar';
import { useMilla } from '../src/context/MillaContext';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

const QUIET_STUDY_IMG = require('../assets/images/quiet-study.jpg');
const HERO_MEMORIZE_IMG = require('../assets/images/hero-memorize.jpg');

type AllSurahsModalMode = 'ongoing' | 'completed';
type SurahItem = (typeof SURAHS)[number];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SurahProgressRow {
  surahId: number;
  name: string;
  totalAyahs: number;
  memorizedCount: number;
  weakCount: number;
  percent: number;
  sessionsCompleted: number;
  lessons: LessonRecord[];
  latestLesson: LessonRecord | null;
  dueCount: number;
}

export default function MemorizeDashboardScreen() {
  const router = useRouter();
  const { state, theme, setCursor } = useMilla();

  const [allSurahsModalMode, setAllSurahsModalMode] = useState<AllSurahsModalMode | null>(null);
  const [allSurahsSearch, setAllSurahsSearch] = useState('');
  const [showNewSurahModal, setShowNewSurahModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [surahSearch, setSurahSearch] = useState('');
  const [lessonsModalSurahId, setLessonsModalSurahId] = useState<number | null>(null);

  const language = state?.language ?? 'ar';
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const dirArrow = isRtl ? 'arrow-back' : 'arrow-forward';
  const today = todayIso();

  const surahRows = useMemo<SurahProgressRow[]>(() => {
    if (!state) return [];
    const activeSurahIds = new Set<number>();
    for (const rec of Object.values(state.verseRecords)) {
      if (rec.status === 'memorized' || rec.status === 'weak' || rec.status === 'in_progress') {
        activeSurahIds.add(rec.surahId);
      }
    }
    for (const l of state.lessons) {
      activeSurahIds.add(l.surahId);
    }

    return Array.from(activeSurahIds)
      .map((surahId) => {
        const s = getSurahById(surahId);
        const surahVerses = Object.values(state.verseRecords).filter((r) => r.surahId === surahId);
        const { memorizedCount, percent } = computeSurahProgress({
          surahId,
          totalAyahs: s.totalAyahs,
          verseRecords: state.verseRecords,
          lessons: state.lessons,
        });
        const weakCount = surahVerses.filter((r) => r.status === 'weak').length;
        const surahLessons = state.lessons
          .filter((l) => l.surahId === surahId)
          .sort((a, b) => b.lastReviewedSession - a.lastReviewedSession || b.endVerse - a.endVerse);
        const sessionsCompleted = state.surahSessions[surahId] ?? 0;
        const plan = computeSurahRevisionPlan(state.lessons, {
          surahId,
          activeSessionNumber: getSurahActiveSessionNumber(state.surahSessions, surahId),
          todayIso: today,
        });

        return {
          surahId,
          name: getSurahDisplayName(s, language),
          totalAyahs: s.totalAyahs,
          memorizedCount,
          weakCount,
          percent,
          sessionsCompleted,
          lessons: surahLessons,
          latestLesson: surahLessons[0] ?? null,
          dueCount: plan.allLessons.length,
        };
      })
      .sort((a, b) => {
        if (a.surahId === state.currentSurahId) return -1;
        if (b.surahId === state.currentSurahId) return 1;
        return b.memorizedCount - a.memorizedCount || a.surahId - b.surahId;
      });
  }, [state, language, today]);

  const surahRowMap = useMemo(() => {
    const map = new Map<number, SurahProgressRow>();
    for (const row of surahRows) {
      map.set(row.surahId, row);
    }
    return map;
  }, [surahRows]);

  const ongoingRows = useMemo(
    () => surahRows.filter((r) => r.percent < 100),
    [surahRows],
  );
  const completedRows = useMemo(
    () => surahRows.filter((r) => r.percent >= 100),
    [surahRows],
  );
  const previewOngoingRows = useMemo(() => ongoingRows.slice(0, 4), [ongoingRows]);

  const modalFilteredSurahRows = useMemo(() => {
    const base = allSurahsModalMode === 'completed' ? completedRows : ongoingRows;
    const q = allSurahsSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter((r) => {
      const s = getSurahById(r.surahId);
      const hay = `${r.surahId} ${r.name} ${s.nameAr} ${s.nameEn} ${s.nameFr}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allSurahsModalMode, completedRows, ongoingRows, allSurahsSearch]);

  const searchedNewSurahs = useMemo<SurahItem[]>(() => {
    const q = surahSearch.trim().toLowerCase();
    if (!q) return SURAHS;
    return SURAHS.filter((s) => {
      const hay = `${s.id} ${s.nameAr} ${s.nameEn} ${s.nameFr} ${s.revelationTypeAr}`.toLowerCase();
      return hay.includes(q);
    });
  }, [surahSearch]);

  if (!state) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const currentSurah = getSurahById(state.currentSurahId);
  const currentSurahProgress = computeSurahProgress({
    surahId: currentSurah.id,
    totalAyahs: currentSurah.totalAyahs,
    verseRecords: state.verseRecords,
    lessons: state.lessons,
  });
  const isCurrentSurahDone = currentSurahProgress.percent >= 100;
  const activeLearning = findActiveLearningLesson(state.lessons, currentSurah.id);
  const portionStart = activeLearning ? activeLearning.startVerse : state.currentAyah;
  const portionEnd = activeLearning
    ? activeLearning.endVerse
    : Math.min(currentSurah.totalAyahs, state.currentAyah + state.dailyTarget - 1);
  const activeSessionNum = getSurahActiveSessionNumber(state.surahSessions, currentSurah.id);
  const currentPlan = computeSurahRevisionPlan(state.lessons, {
    surahId: currentSurah.id,
    activeSessionNumber: activeSessionNum,
    todayIso: today,
  });

  const modalSurahRow =
    lessonsModalSurahId !== null ? (surahRowMap.get(lessonsModalSurahId) ?? null) : null;

  const remainingAyahs = Math.max(0, currentSurah.totalAyahs - currentSurahProgress.memorizedCount);
  const estimatedSessionsLeft =
    remainingAyahs === 0 ? 0 : Math.ceil(remainingAyahs / Math.max(1, state.dailyTarget));
  const activePaceLabel =
    state.mandatoryRepeats <= 3
      ? language === 'en'
        ? 'Fast'
        : language === 'fr'
          ? 'Rapide'
          : 'سريع'
      : state.mandatoryRepeats >= 7
        ? language === 'en'
          ? 'Gradual'
          : language === 'fr'
            ? 'Progressif'
            : 'تدريجي'
        : language === 'en'
          ? 'Balanced'
          : language === 'fr'
            ? 'Équilibré'
            : 'متوازن';

  const formatLessonState = (lesson: LessonRecord): string => {
    if (lesson.state === 'learning') return 'قيد التعلّم';
    if (lesson.state === 'strengthening') {
      return `ترسيخ (${formatNum(lesson.hidingLevel, language)}/${formatNum(3, language)})`;
    }
    return 'متقن';
  };

  const formatEval = (rating: SelfEvalRating | undefined): string => {
    if (rating === 'difficult') return copy.evalDifficult;
    if (rating === 'good') return copy.evalGood;
    if (rating === 'easy') return copy.evalEasy;
    return '—';
  };

  const handleSelectSurah = async (surahId: number) => {
    const savedAyah = state.surahCursors[surahId] ?? 1;
    await setCursor(surahId, savedAyah);
  };

  const handleStartSurahSession = async (surahId: number) => {
    setShowNewSurahModal(false);
    setLessonsModalSurahId(null);
    setSurahSearch('');
    if (surahId !== currentSurah.id) {
      await handleSelectSurah(surahId);
    }
    router.push('/memorize-session');
  };

  return (
    <AppShell
      title={copy.navMemorize}
      subtitle={`${getSurahDisplayName(currentSurah, language)} • ${copy.ayahLabel} ${formatNum(portionStart, language)} - ${formatNum(portionEnd, language)}`}
    >
      <View style={styles.stack}>
        {/* Top Header */}
        <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <View style={styles.headerBlock}>
            <Text
              style={[
                styles.pageTitle,
                { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
              ]}
            >
              {language === 'en'
                ? 'Your Journey with the Quran'
                : language === 'fr'
                  ? 'Votre chemin avec le Coran'
                  : 'رحلتك مع كتاب الله'}
            </Text>
            <Text
              style={[
                styles.pageSubtitle,
                { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
              ]}
            >
              {language === 'en'
                ? 'A few verses with presence and calm build lasting memory.'
                : language === 'fr'
                  ? 'Quelques versets avec calme et présence ancrent la mémoire.'
                  : 'آيات قليلة بتأنٍّ وحضور قلب، تُثمر حفظاً راسخاً.'}
            </Text>
          </View>

          <Pressable
            onPress={() => setShowInfoModal(true)}
            style={[
              styles.infoIconBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel="دليل الحفظ"
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.isDark ? theme.foreground : theme.primary}
            />
          </Pressable>
        </View>

        {/* Active / Ongoing Surah Hero Card */}
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
              source={HERO_MEMORIZE_IMG}
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
                    {isCurrentSurahDone
                      ? 'سورة مكتملة • أتممت حفظها'
                      : `السورة الجارية • جلسة ${formatNum(activeSessionNum, language)}`}
                  </Text>
                </View>
                <View style={styles.heroGlassPill}>
                  <Text style={[styles.heroGlassText, { color: theme.accent }]}>
                    {formatNum(currentSurahProgress.percent, language)}%
                  </Text>
                </View>
              </View>

              <View style={{ gap: 4 }}>
                <Text style={[styles.heroTitle, { textAlign: isRtl ? 'right' : 'left' }]}>
                  {getSurahDisplayName(currentSurah, language)}
                </Text>
                <Text style={[styles.heroSub, { textAlign: isRtl ? 'right' : 'left' }]}>
                  {isCurrentSurahDone
                    ? `أتممت حفظ ${formatNum(currentSurah.totalAyahs, language)} آية • اختر سورة جديدة للمتابعة`
                    : `ورد اليوم: الآيات ${formatNum(portionStart, language)} - ${formatNum(portionEnd, language)}${currentPlan.allLessons.length > 0
                      ? ` • ${formatNum(currentPlan.allLessons.length, language)} للمراجعة`
                      : ''
                    }`}
                </Text>
              </View>

              <View style={styles.heroProgressTrack}>
                <View
                  style={[
                    styles.heroProgressFill,
                    {
                      width: `${Math.min(100, Math.max(0, currentSurahProgress.percent))}%`,
                      backgroundColor: theme.accent,
                    },
                  ]}
                />
              </View>

              {/* Choice: Continue ongoing surah OR start a new surah */}
              {isCurrentSurahDone ? (
                <Pressable
                  onPress={() => {
                    setSurahSearch('');
                    setShowNewSurahModal(true);
                  }}
                  style={[
                    styles.heroCta,
                    {
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      backgroundColor: theme.isDark ? theme.primary : '#f7f5ed',
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={theme.isDark ? theme.primaryForeground : '#073d35'}
                  />
                  <Text
                    style={[
                      styles.heroCtaText,
                      { color: theme.isDark ? theme.primaryForeground : '#073d35' },
                    ]}
                  >
                    بدء سورة جديدة
                  </Text>
                  <Ionicons
                    name={dirArrow}
                    size={18}
                    color={theme.isDark ? theme.primaryForeground : '#073d35'}
                  />
                </Pressable>
              ) : (
                <View style={[styles.heroActions, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
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
                      متابعة الحفظ
                    </Text>
                    <Ionicons
                      name={dirArrow}
                      size={18}
                      color={theme.isDark ? theme.primaryForeground : '#073d35'}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setSurahSearch('');
                      setShowNewSurahModal(true);
                    }}
                    style={[
                      styles.heroSecondaryCta,
                      {
                        flexDirection: isRtl ? 'row-reverse' : 'row',
                        borderColor: theme.isDark ? theme.border : 'rgba(255,255,255,0.26)',
                      },
                    ]}
                    accessibilityRole="button"
                  >
                    <Ionicons name="add-circle-outline" size={18} color={theme.accent} />
                    <Text style={styles.heroSecondaryText}>سورة جديدة</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Memorization Plan & Pace Analytics */}
        <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ArabesqueBackdrop variant="subtle" pattern="arch" />

          <View style={[styles.statsGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <View style={[styles.statTile, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.statVal, { color: theme.isDark ? theme.foreground : theme.primary }]}>
                {formatNum(state.dailyTarget, language)}
              </Text>
              <Text style={[styles.statLbl, { color: theme.mutedForeground }]}>
                {language === 'en' ? 'Daily Portion' : language === 'fr' ? 'Portion/jour' : 'الورد اليومي'}
              </Text>
            </View>
            <View style={[styles.statTile, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.statVal, { color: theme.isDark ? theme.foreground : theme.primary }]}>
                {formatNum(ongoingRows.length, language)}
              </Text>
              <Text style={[styles.statLbl, { color: theme.mutedForeground }]}>
                {language === 'en' ? 'In Progress' : language === 'fr' ? 'En cours' : 'سور قيد الحفظ'}
              </Text>
            </View>
            <View style={[styles.statTile, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.statVal, { color: theme.isDark ? theme.foreground : theme.primary }]}>
                {formatNum(remainingAyahs, language)}
              </Text>
              <Text style={[styles.statLbl, { color: theme.mutedForeground }]}>
                {language === 'en'
                  ? 'Left in Surah'
                  : language === 'fr'
                    ? 'Restants'
                    : 'متبقّي بالسورة'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.paceSummaryRow,
              {
                borderTopColor: theme.border,
                flexDirection: isRtl ? 'row-reverse' : 'row',
              },
            ]}
          >
            <View style={[styles.paceItem, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Ionicons
                name="speedometer-outline"
                size={15}
                color={theme.isDark ? theme.accent : theme.primary}
              />
              <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                {language === 'en' ? 'Pace:' : language === 'fr' ? 'Rythme :' : 'وتيرة الحفظ:'}{' '}
                <Text style={{ color: theme.foreground, fontWeight: '700' }}>{activePaceLabel}</Text>
              </Text>
            </View>
            <View style={[styles.paceItem, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Ionicons
                name="layers-outline"
                size={15}
                color={theme.isDark ? theme.accent : theme.primary}
              />
              <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                {remainingAyahs === 0
                  ? language === 'en'
                    ? 'Surah complete'
                    : language === 'fr'
                      ? 'Sourate terminée'
                      : 'السورة مكتملة'
                  : language === 'en'
                    ? `~${formatNum(estimatedSessionsLeft, language)} sessions left`
                    : language === 'fr'
                      ? `~${formatNum(estimatedSessionsLeft, language)} séances`
                      : `المتبقّي ~${formatNum(estimatedSessionsLeft, language)} جلسات`}
              </Text>
            </View>
          </View>
        </View>

        {/* Ongoing Surahs (capped preview) + Completed Surahs Summary Row */}
        <View style={styles.sectionBlock}>
          <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
              {ongoingRows.length > 0
                ? `السور الجارية (${formatNum(ongoingRows.length, language)})`
                : 'السور المحفوظة'}
            </Text>
            <Pressable
              onPress={() => {
                setSurahSearch('');
                setShowNewSurahModal(true);
              }}
              style={[
                styles.newSurahChip,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  borderColor: theme.accent,
                  backgroundColor: `${theme.accent}1A`,
                },
              ]}
              accessibilityRole="button"
            >
              <Ionicons name="add" size={16} color={theme.foreground} />
              <Text style={[styles.newSurahChipText, { color: theme.foreground }]}>
                بدء سورة
              </Text>
            </Pressable>
          </View>

          {surahRows.length === 0 ? (
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
                  <Ionicons name="book-outline" size={28} color="#ffffff" />
                  <Text style={styles.emptyImageText}>
                    لم تبدأ بحفظ أي سورة بعد. اضغط «متابعة الحفظ» أو اختر سورة جديدة للبدء.
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {previewOngoingRows.length > 0 ? (
            <View style={styles.surahCardsList}>
              {previewOngoingRows.map((row, idx) => {
                const isSelected = row.surahId === currentSurah.id;
                const rowPattern =
                  ARABESQUE_CARD_PATTERNS[idx % ARABESQUE_CARD_PATTERNS.length] ?? 'medallion';
                return (
                  <View
                    key={row.surahId}
                    style={[
                      styles.surahCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: isSelected && !theme.isDark ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <ArabesqueBackdrop variant="corner" pattern={rowPattern} />

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
                          {row.name}
                        </Text>
                        {isSelected ? (
                          <View style={[styles.activeTag, { backgroundColor: `${theme.accent}28` }]}>
                            <Text style={[styles.activeTagText, { color: theme.foreground }]}>
                              الحالية
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.surahPct,
                          { color: theme.isDark ? theme.foreground : theme.primary },
                        ]}
                      >
                        {formatNum(row.percent, language)}%
                      </Text>
                    </View>

                    <SurahProgressBar percent={row.percent} height={6} />

                    <View
                      style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
                    >
                      <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                        {formatNum(row.memorizedCount, language)} /{' '}
                        {formatNum(row.totalAyahs, language)} آية •{' '}
                        {formatNum(row.sessionsCompleted, language)} جلسات
                      </Text>
                      {row.latestLesson ? (
                        <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                          {formatLessonState(row.latestLesson)}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={[styles.cardActions, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
                    >
                      <Pressable
                        onPress={() => void handleStartSurahSession(row.surahId)}
                        style={[
                          styles.cardPrimaryBtn,
                          {
                            flexDirection: isRtl ? 'row-reverse' : 'row',
                            backgroundColor: isSelected ? theme.primary : theme.secondary,
                          },
                        ]}
                        accessibilityRole="button"
                      >
                        <Text
                          style={[
                            styles.cardPrimaryBtnText,
                            {
                              color: isSelected
                                ? theme.primaryForeground
                                : theme.isDark
                                  ? theme.foreground
                                  : theme.primary,
                            },
                          ]}
                        >
                          {isSelected ? 'متابعة الجلسة' : 'استكمال الحفظ'}
                        </Text>
                        <Ionicons
                          name={dirArrow}
                          size={15}
                          color={
                            isSelected
                              ? theme.primaryForeground
                              : theme.isDark
                                ? theme.foreground
                                : theme.primary
                          }
                        />
                      </Pressable>

                      <Pressable
                        onPress={() => setLessonsModalSurahId(row.surahId)}
                        style={[
                          styles.cardSecondaryBtn,
                          {
                            flexDirection: isRtl ? 'row-reverse' : 'row',
                            borderColor: theme.border,
                            backgroundColor: theme.background,
                          },
                        ]}
                        accessibilityRole="button"
                      >
                        <Ionicons name="list-outline" size={15} color={theme.foreground} />
                        <Text style={[styles.cardSecondaryBtnText, { color: theme.foreground }]}>
                          الدروس ({formatNum(row.lessons.length, language)})
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}

              {ongoingRows.length > 4 ? (
                <Pressable
                  onPress={() => {
                    setAllSurahsSearch('');
                    setAllSurahsModalMode('ongoing');
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
                    عرض كل السور الجارية ({formatNum(ongoingRows.length, language)})
                  </Text>
                  <Ionicons
                    name={dirArrow}
                    size={16}
                    color={theme.isDark ? theme.foreground : theme.primary}
                  />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {completedRows.length > 0 ? (
            <Pressable
              onPress={() => {
                setAllSurahsSearch('');
                setAllSurahsModalMode('completed');
              }}
              style={[
                styles.completedSummaryCard,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
              accessibilityRole="button"
            >
              <ArabesqueBackdrop variant="corner" pattern="rosette" />

              <View
                style={[
                  styles.surahTitleGroup,
                  { flexDirection: isRtl ? 'row-reverse' : 'row', flex: 1 },
                ]}
              >
                <View
                  style={[
                    styles.completedIconCircle,
                    {
                      backgroundColor: theme.isDark ? theme.secondary : `${theme.primary}18`,
                      borderWidth: theme.isDark ? 1 : 0,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={theme.isDark ? theme.accent : theme.primary}
                  />
                </View>
                <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start', gap: 2 }}>
                  <Text style={[styles.surahName, { color: theme.foreground }]}>
                    سور مكتملة ({formatNum(completedRows.length, language)})
                  </Text>
                  <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                    اضغط لاستعراض جميع السور المكتملة ودروسها
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isRtl ? 'chevron-back' : 'chevron-forward'}
                size={18}
                color={theme.mutedForeground}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Start New Surah Modal */}
      <Modal
        visible={showNewSurahModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewSurahModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: theme.foreground }]}>
                اختر سورة للبدء
              </Text>
              <Pressable
                onPress={() => setShowNewSurahModal(false)}
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
              data={searchedNewSurahs}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => {
                const existing = surahRowMap.get(item.id);
                const isCurrent = item.id === currentSurah.id;
                return (
                  <Pressable
                    onPress={() => void handleStartSurahSession(item.id)}
                    style={[
                      styles.modalSurahItem,
                      {
                        flexDirection: isRtl ? 'row-reverse' : 'row',
                        borderColor: isCurrent ? theme.primary : theme.border,
                        backgroundColor: isCurrent ? theme.secondary : theme.background,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.surahNumCircle,
                        { backgroundColor: isCurrent ? theme.primary : theme.secondary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.surahNumText,
                          {
                            color: isCurrent
                              ? theme.primaryForeground
                              : theme.isDark
                                ? theme.foreground
                                : theme.primary,
                          },
                        ]}
                      >
                        {formatNum(item.id, language)}
                      </Text>
                    </View>

                    <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start', gap: 2 }}>
                      <Text style={[styles.surahName, { color: theme.foreground }]}>
                        {getSurahDisplayName(item, language)}
                      </Text>
                      <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                        {formatNum(item.totalAyahs, language)} آية • {item.revelationTypeAr}
                      </Text>
                    </View>

                    {existing ? (
                      <View
                        style={[
                          styles.activeTag,
                          {
                            backgroundColor: theme.isDark
                              ? theme.secondary
                              : `${theme.primary}18`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.activeTagText,
                            { color: theme.isDark ? theme.foreground : theme.primary },
                          ]}
                        >
                          {formatNum(existing.percent, language)}%
                        </Text>
                      </View>
                    ) : (
                      <Ionicons name={dirArrow} size={16} color={theme.mutedForeground} />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Surah Lessons Detail Modal */}
      <Modal
        visible={modalSurahRow !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setLessonsModalSurahId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            {modalSurahRow ? (
              <>
                <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                    <Text style={[styles.modalTitle, { color: theme.foreground }]}>
                      {modalSurahRow.name}
                    </Text>
                    <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                      {formatNum(modalSurahRow.memorizedCount, language)} /{' '}
                      {formatNum(modalSurahRow.totalAyahs, language)} آية •{' '}
                      {formatNum(modalSurahRow.percent, language)}%
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setLessonsModalSurahId(null)}
                    style={styles.modalCloseBtn}
                    accessibilityRole="button"
                    accessibilityLabel="إغلاق"
                  >
                    <Ionicons name="close" size={22} color={theme.foreground} />
                  </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.modalListContent}>
                  {modalSurahRow.lessons.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
                      لا توجد دروس مكتملة مسجّلة في هذه السورة بعد.
                    </Text>
                  ) : (
                    modalSurahRow.lessons.map((lesson) => (
                      <View
                        key={lesson.id}
                        style={[
                          styles.lessonItem,
                          {
                            flexDirection: isRtl ? 'row-reverse' : 'row',
                            borderColor: theme.border,
                            backgroundColor: theme.background,
                          },
                        ]}
                      >
                        <Text style={[styles.lessonRange, { color: theme.foreground }]}>
                          الآيات {formatNum(lesson.startVerse, language)} -{' '}
                          {formatNum(lesson.endVerse, language)}
                        </Text>
                        <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                          {formatLessonState(lesson)} • {formatEval(lesson.lastEvaluation)}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>

                {modalSurahRow.percent < 100 ? (
                  <Pressable
                    onPress={() => void handleStartSurahSession(modalSurahRow.surahId)}
                    style={[
                      styles.startSurahBtn,
                      { flexDirection: isRtl ? 'row-reverse' : 'row', backgroundColor: theme.primary },
                    ]}
                  >
                    <Text style={[styles.startSurahBtnText, { color: theme.primaryForeground }]}>
                      ابدأ جلسة في هذه السورة
                    </Text>
                    <Ionicons name={dirArrow} size={16} color={theme.primaryForeground} />
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Virtualized Full List Modal (Ongoing or Completed Surahs) */}
      <Modal
        visible={allSurahsModalMode !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setAllSurahsModalMode(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: theme.foreground }]}>
                {allSurahsModalMode === 'completed'
                  ? `السور المكتملة (${formatNum(completedRows.length, language)})`
                  : `السور الجارية (${formatNum(ongoingRows.length, language)})`}
              </Text>
              <Pressable
                onPress={() => setAllSurahsModalMode(null)}
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
                value={allSurahsSearch}
                onChangeText={setAllSurahsSearch}
                placeholder="ابحث باسم السورة أو رقمها..."
                placeholderTextColor={theme.mutedForeground}
                style={[
                  styles.searchInput,
                  { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                ]}
              />
              {allSurahsSearch.length > 0 ? (
                <Pressable onPress={() => setAllSurahsSearch('')}>
                  <Ionicons name="close-circle" size={18} color={theme.mutedForeground} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={modalFilteredSurahRows}
              keyExtractor={(item) => String(item.surahId)}
              initialNumToRender={14}
              windowSize={7}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalListContent}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
                  لا توجد سور مطابقة للبحث.
                </Text>
              }
              renderItem={({ item }) => {
                const isDone = item.percent >= 100;
                const isCurrent = item.surahId === currentSurah.id;
                return (
                  <Pressable
                    onPress={() => {
                      setAllSurahsModalMode(null);
                      setLessonsModalSurahId(item.surahId);
                    }}
                    style={[
                      styles.compactRow,
                      {
                        flexDirection: isRtl ? 'row-reverse' : 'row',
                        borderColor: isCurrent ? theme.primary : theme.border,
                        backgroundColor: isCurrent ? theme.secondary : theme.background,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.surahNumCircle,
                        {
                          backgroundColor: isDone
                            ? theme.isDark
                              ? theme.secondary
                              : `${theme.primary}18`
                            : theme.secondary,
                          borderWidth: isDone && theme.isDark ? 1 : 0,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      {isDone ? (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={theme.isDark ? theme.accent : theme.primary}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.surahNumText,
                            { color: theme.isDark ? theme.foreground : theme.primary },
                          ]}
                        >
                          {formatNum(item.surahId, language)}
                        </Text>
                      )}
                    </View>

                    <View style={{ flex: 1, gap: 4 }}>
                      <View
                        style={[
                          styles.rowBetween,
                          { flexDirection: isRtl ? 'row-reverse' : 'row' },
                        ]}
                      >
                        <Text style={[styles.surahName, { color: theme.foreground }]}>
                          {item.name}
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
                      {!isDone ? (
                        <SurahProgressBar percent={item.percent} height={4} />
                      ) : (
                        <Text
                          style={[
                            styles.metaText,
                            { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
                          ]}
                        >
                          {formatNum(item.totalAyahs, language)} آية •{' '}
                          {formatNum(item.lessons.length, language)} دروس
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <MemorizeInfoModal visible={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { gap: SPACING.lg },
  headerBlock: { flex: 1, gap: 4 },
  pageTitle: { fontSize: 24, fontWeight: '700' },
  pageSubtitle: { fontSize: 13, lineHeight: 20 },
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
  rowBetween: { alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  heroPill: {
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillDarkText: { fontSize: 11, fontWeight: '700', color: '#073d35' },
  heroGlassPill: {
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroGlassText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.88)' },
  heroProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  heroActions: {
    gap: 10,
    marginTop: 2,
  },
  heroCta: {
    flex: 1.4,
    minHeight: 48,
    borderRadius: RADII.card,
    backgroundColor: '#f7f5ed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  heroCtaText: { fontSize: 14, fontWeight: '700', color: '#073d35' },
  heroSecondaryCta: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADII.card,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  heroSecondaryText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  statsCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.md,
    gap: 12,
  },
  statsGrid: { gap: 8 },
  paceSummaryRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  paceItem: {
    alignItems: 'center',
    gap: 5,
  },
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
  sectionBlock: { gap: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  newSurahChip: {
    minHeight: 34,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  newSurahChipText: { fontSize: 12, fontWeight: '700' },
  emptyImageWrap: {
    borderRadius: RADII.card,
    overflow: 'hidden',
  },
  emptyBg: {
    width: '100%',
  },
  emptyOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(7, 61, 53, 0.74)',
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
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  surahCardsList: { gap: SPACING.md },
  surahCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: 12,
  },
  surahTitleGroup: { alignItems: 'center', gap: 8 },
  surahName: { fontSize: 15, fontWeight: '700' },
  activeTag: {
    borderRadius: RADII.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeTagText: { fontSize: 11, fontWeight: '700' },
  surahPct: { fontSize: 13, fontWeight: '700' },
  metaText: { fontSize: 11 },
  weakBadge: {
    borderRadius: RADII.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  weakBadgeText: { fontSize: 10, fontWeight: '700' },
  cardActions: { gap: 8, marginTop: 2 },
  cardPrimaryBtn: {
    flex: 1.3,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  cardPrimaryBtnText: { fontSize: 13, fontWeight: '700' },
  cardSecondaryBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  cardSecondaryBtnText: { fontSize: 12, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '82%',
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
  modalSurahItem: {
    minHeight: 56,
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
  lessonItem: {
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonRange: { fontSize: 13, fontWeight: '700' },
  startSurahBtn: {
    minHeight: 48,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  startSurahBtnText: { fontSize: 14, fontWeight: '700' },
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
  completedSummaryCard: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 60,
    borderRadius: RADII.card,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  completedIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactRow: {
    minHeight: 58,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 12,
  },
  infoIconBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: RADII.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
