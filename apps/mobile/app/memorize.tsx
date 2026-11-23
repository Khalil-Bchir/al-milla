import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  SURAHS,
  computeRevisionQueues,
  formatNum,
  getSurahById,
  getSurahDisplayName,
  maskVerseByLevel,
  toArabicDigits,
  type AyahEntry,
  type ProgressiveHideLevel,
  type SelfEvalRating,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { AudioPlayerBar } from '../src/components/milla/AudioPlayerBar';
import { MillaPicker } from '../src/components/milla/MillaPicker';
import { useMilla } from '../src/context/MillaContext';
import type { DailyStageKey } from '../src/db/database';
import { loadVerifiedSurahAyahs } from '../src/services/quran';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

type SessionStepId = DailyStageKey | 'completed';

interface GuidedStepDef {
  id: DailyStageKey;
  label: string;
}

export default function MemorizeScreen() {
  const router = useRouter();
  const {
    state,
    theme,
    setCursor,
    setVerseStatus,
    evaluateVerse,
    setDailyStage,
    completeSession,
  } = useMilla();

  const language = state?.language ?? 'ar';
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const dirArrow = isRtl ? 'arrow-back' : 'arrow-forward';
  const currentSurahId = state?.currentSurahId ?? 18;
  const currentAyah = state?.currentAyah ?? 1;
  const dailyTarget = state?.dailyTarget ?? 4;
  const surah = getSurahById(currentSurahId);

  const [ayahs, setAyahs] = useState<AyahEntry[]>(surah.ayahs);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [initialQueues, setInitialQueues] = useState(() =>
    computeRevisionQueues(state?.verseRecords ?? {}, {
      lastSessionKeys: state?.lastSessionKeys ?? [],
      lastSessionCompletedAt: state?.lastSessionCompletedAt ?? null,
    }),
  );

  // Sync initial queues once state hydrates
  const [queuesHydrated, setQueuesHydrated] = useState(false);
  useEffect(() => {
    if (state && !queuesHydrated) {
      setInitialQueues(
        computeRevisionQueues(state.verseRecords, {
          lastSessionKeys: state.lastSessionKeys,
          lastSessionCompletedAt: state.lastSessionCompletedAt,
        }),
      );
      setQueuesHydrated(true);
    }
  }, [state, queuesHydrated]);

  const yesterdayQueue = useMemo(
    () =>
      [...initialQueues.yesterdayItems].sort(
        (a, b) => a.surahId - b.surahId || a.ayahNumber - b.ayahNumber,
      ),
    [initialQueues.yesterdayItems],
  );

  const olderQueue = useMemo(() => {
    const merged = [...initialQueues.weakItems, ...initialQueues.olderDueItems];
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });
  }, [initialQueues.weakItems, initialQueues.olderDueItems]);

  const sessionSteps = useMemo<GuidedStepDef[]>(() => {
    const steps: GuidedStepDef[] = [];
    if (yesterdayQueue.length > 0) {
      steps.push({
        id: 'yesterdayReview',
        label: language === 'en' ? 'Yesterday' : language === 'fr' ? 'Hier' : 'مراجعة الأمس',
      });
    }
    if (olderQueue.length > 0) {
      steps.push({
        id: 'olderReview',
        label: language === 'en' ? 'Older' : language === 'fr' ? 'Ancien' : 'المراجعة السابقة',
      });
    }
    steps.push(
      {
        id: 'newMemorization',
        label: language === 'en' ? 'Memorize' : language === 'fr' ? 'Mémoriser' : 'الحفظ الجديد',
      },
      {
        id: 'selfTest',
        label: language === 'en' ? 'Self-Test' : language === 'fr' ? 'Auto-test' : 'التسميع',
      },
      {
        id: 'verseConnection',
        label: language === 'en' ? 'Connect' : language === 'fr' ? 'Relier' : 'ربط الآيات',
      },
    );
    return steps;
  }, [yesterdayQueue.length, olderQueue.length, language]);

  const [stepIndex, setStepIndex] = useState(0);
  const [isSessionDone, setIsSessionDone] = useState(false);

  const [yesterdaySurahId, setYesterdaySurahId] = useState<number | null>(null);
  const [olderSurahId, setOlderSurahId] = useState<number | null>(null);
  const [yesterdayIdx, setYesterdayIdx] = useState(0);
  const [olderIdx, setOlderIdx] = useState(0);
  const [reviewHidden, setReviewHidden] = useState(false);

  const yesterdaySurahIds = useMemo(
    () => Array.from(new Set(yesterdayQueue.map((i) => i.surahId))).sort((a, b) => a - b),
    [yesterdayQueue],
  );
  const activeYesterdaySurahId =
    yesterdaySurahId !== null && yesterdaySurahIds.includes(yesterdaySurahId)
      ? yesterdaySurahId
      : (yesterdaySurahIds[0] ?? null);
  const activeYesterdayQueue = useMemo(
    () =>
      activeYesterdaySurahId === null
        ? []
        : yesterdayQueue.filter((i) => i.surahId === activeYesterdaySurahId),
    [yesterdayQueue, activeYesterdaySurahId],
  );

  const olderSurahIds = useMemo(
    () => Array.from(new Set(olderQueue.map((i) => i.surahId))).sort((a, b) => a - b),
    [olderQueue],
  );
  const activeOlderSurahId =
    olderSurahId !== null && olderSurahIds.includes(olderSurahId)
      ? olderSurahId
      : (olderSurahIds[0] ?? null);
  const activeOlderQueue = useMemo(
    () =>
      activeOlderSurahId === null
        ? []
        : olderQueue.filter((i) => i.surahId === activeOlderSurahId),
    [olderQueue, activeOlderSurahId],
  );

  const safeYesterdayIdx = yesterdayIdx < activeYesterdayQueue.length ? yesterdayIdx : 0;
  const safeOlderIdx = olderIdx < activeOlderQueue.length ? olderIdx : 0;

  const yesterdayTarget = activeYesterdayQueue[safeYesterdayIdx];
  const yesterdaySurah = yesterdayTarget ? getSurahById(yesterdayTarget.surahId) : null;
  const olderTarget = activeOlderQueue[safeOlderIdx];
  const olderSurah = olderTarget ? getSurahById(olderTarget.surahId) : null;

  const [reviewAyahTexts, setReviewAyahTexts] = useState<Record<string, string>>({});
  const [loadingReviewText, setLoadingReviewText] = useState(false);

  const [memOffset, setMemOffset] = useState(0);
  const [hideLevel, setHideLevel] = useState<ProgressiveHideLevel>(0);
  const [showTafsirBox, setShowTafsirBox] = useState(false);
  const [yesterdayRating, setYesterdayRating] = useState<SelfEvalRating>('good');
  const [olderRating, setOlderRating] = useState<SelfEvalRating>('good');
  const [doneYesterdaySurahs, setDoneYesterdaySurahs] = useState<number[]>([]);
  const [doneOlderSurahs, setDoneOlderSurahs] = useState<number[]>([]);
  const [testOffset, setTestOffset] = useState(0);
  const [testRevealed, setTestRevealed] = useState(false);
  const [testRating, setTestRating] = useState<SelfEvalRating | null>(null);
  const [connectIdx, setConnectIdx] = useState(0);
  const [justFinishedSurah, setJustFinishedSurah] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingAyahs(true);
    setLoadError(null);
    void loadVerifiedSurahAyahs(currentSurahId).then((res) => {
      if (cancelled) return;
      if (res.ayahs.length > 0) setAyahs(res.ayahs);
      setLoadError(res.error);
      setLoadingAyahs(false);
    });
    return () => {
      cancelled = true;
    };
  }, [currentSurahId]);

  useEffect(() => {
    const uniqueSurahIds = Array.from(
      new Set([
        ...yesterdayQueue.map((i) => i.surahId),
        ...olderQueue.map((i) => i.surahId),
      ]),
    );
    if (uniqueSurahIds.length === 0) return;

    let cancelled = false;
    setLoadingReviewText(true);
    void Promise.all(
      uniqueSurahIds.map(async (sid) => {
        const res = await loadVerifiedSurahAyahs(sid);
        return { sid, ayahs: res.ayahs };
      }),
    ).then((results) => {
      if (cancelled) return;
      const nextMap: Record<string, string> = {};
      for (const { sid, ayahs: surahAyahs } of results) {
        for (const a of surahAyahs) {
          nextMap[`${sid}:${a.number}`] = a.textAr;
        }
      }
      setReviewAyahTexts(nextMap);
      setLoadingReviewText(false);
    });
    return () => {
      cancelled = true;
    };
  }, [yesterdayQueue, olderQueue]);

  if (!state) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const startIdx = Math.max(
    0,
    ayahs.findIndex((a) => a.number === currentAyah),
  );
  const portionAyahs = ayahs.slice(startIdx, startIdx + dailyTarget);
  const activeMemAyah = portionAyahs[memOffset] ?? portionAyahs[0];
  const activeTestAyah = portionAyahs[testOffset] ?? portionAyahs[0];

  const prevAyahEntry = startIdx > 0 ? ayahs[startIdx - 1] : null;
  const prevAyahRecord = prevAyahEntry
    ? state.verseRecords[`${surah.id}:${prevAyahEntry.number}`]
    : undefined;
  const hasMemorizedPrevAyah =
    prevAyahRecord?.status === 'memorized' || prevAyahRecord?.status === 'weak';
  const connectStartIdx = hasMemorizedPrevAyah ? startIdx - 1 : startIdx;
  const connectAyahs = ayahs.slice(connectStartIdx, startIdx + dailyTarget);

  const currentStep: SessionStepId = isSessionDone
    ? 'completed'
    : (sessionSteps[stepIndex]?.id ?? 'newMemorization');

  const advanceNextWirdPosition = async () => {
    const lastCompletedAyah = portionAyahs[portionAyahs.length - 1]?.number ?? currentAyah;
    if (lastCompletedAyah < surah.totalAyahs) {
      setJustFinishedSurah(false);
      await setCursor(surah.id, lastCompletedAyah + 1);
    } else {
      setJustFinishedSurah(true);
    }
  };

  const advanceStep = async (completedKey: DailyStageKey) => {
    await setDailyStage(completedKey, true);
    setReviewHidden(false);
    setHideLevel(0);
    setTestRevealed(false);
    setTestRating(null);
    setConnectIdx(0);

    if (stepIndex + 1 < sessionSteps.length) {
      setStepIndex((i) => i + 1);
    } else {
      await completeSession(portionAyahs.map((a) => `${surah.id}:${a.number}`));
      await advanceNextWirdPosition();
      setIsSessionDone(true);
    }
  };

  const handleCompleteYesterdayReview = async () => {
    if (activeYesterdaySurahId === null) {
      await advanceStep('yesterdayReview');
      return;
    }
    for (const item of activeYesterdayQueue) {
      await evaluateVerse(item.surahId, item.ayahNumber, yesterdayRating, false);
    }
    const nextDone = Array.from(new Set([...doneYesterdaySurahs, activeYesterdaySurahId]));
    const remaining = yesterdaySurahIds.filter((id) => !nextDone.includes(id));
    if (remaining.length > 0) {
      setDoneYesterdaySurahs(nextDone);
      setYesterdaySurahId(remaining[0] ?? null);
      setYesterdayIdx(0);
      setYesterdayRating('good');
      return;
    }
    setDoneYesterdaySurahs([]);
    await advanceStep('yesterdayReview');
  };

  const handleCompleteOlderReview = async () => {
    if (activeOlderSurahId === null) {
      await advanceStep('olderReview');
      return;
    }
    for (const item of activeOlderQueue) {
      await evaluateVerse(item.surahId, item.ayahNumber, olderRating, false);
    }
    const nextDone = Array.from(new Set([...doneOlderSurahs, activeOlderSurahId]));
    const remaining = olderSurahIds.filter((id) => !nextDone.includes(id));
    if (remaining.length > 0) {
      setDoneOlderSurahs(nextDone);
      setOlderSurahId(remaining[0] ?? null);
      setOlderIdx(0);
      setOlderRating('good');
      return;
    }
    setDoneOlderSurahs([]);
    await advanceStep('olderReview');
  };

  const handleStartNextSession = () => {
    setInitialQueues(
      computeRevisionQueues(state.verseRecords, {
        lastSessionKeys: state.lastSessionKeys,
        lastSessionCompletedAt: state.lastSessionCompletedAt,
      }),
    );
    setYesterdayIdx(0);
    setOlderIdx(0);
    setYesterdaySurahId(null);
    setOlderSurahId(null);
    setDoneYesterdaySurahs([]);
    setDoneOlderSurahs([]);
    setYesterdayRating('good');
    setOlderRating('good');
    setMemOffset(0);
    setTestOffset(0);
    setConnectIdx(0);
    setReviewHidden(false);
    setHideLevel(0);
    setTestRevealed(false);
    setTestRating(null);
    setJustFinishedSurah(false);
    setStepIndex(0);
    setIsSessionDone(false);
  };

  const handleSurahChange = async (nextSurahId: number) => {
    const savedAyah = state.surahCursors[nextSurahId] ?? 1;
    await setCursor(nextSurahId, savedAyah);
    setMemOffset(0);
    setTestOffset(0);
    setConnectIdx(0);
    setJustFinishedSurah(false);
    setIsSessionDone(false);
    const memIdx = sessionSteps.findIndex((s) => s.id === 'newMemorization');
    setStepIndex(memIdx >= 0 ? memIdx : 0);
  };

  const handleCompleteMemorizeAyah = async () => {
    if (!activeMemAyah) return;
    await setVerseStatus(surah.id, activeMemAyah.number, 'in_progress');
    setHideLevel(0);
    if (memOffset + 1 < portionAyahs.length) {
      setMemOffset((o) => o + 1);
    } else {
      setTestOffset(0);
      await advanceStep('newMemorization');
    }
  };

  const handleCompleteTestAyah = async () => {
    if (!activeTestAyah || !testRating) return;
    await evaluateVerse(surah.id, activeTestAyah.number, testRating, true);
    setTestRevealed(false);
    setTestRating(null);
    if (testOffset + 1 < portionAyahs.length) {
      setTestOffset((o) => o + 1);
    } else {
      setConnectIdx(0);
      await advanceStep('selfTest');
    }
  };

  return (
    <AppShell
      title="الحفظ الموجّه"
      subtitle={`${surah.nameAr} • الآيات ${toArabicDigits(currentAyah)} - ${toArabicDigits(
        Math.min(surah.totalAyahs, currentAyah + dailyTarget - 1),
      )}`}
    >
      <View style={styles.stack}>
        {/* Top Surah Selector */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border, gap: 10 },
          ]}
        >
          <MillaPicker
            searchable
            fullWidth
            value={String(surah.id)}
            onChange={(val) => void handleSurahChange(Number(val))}
            title="اختر السورة للحفظ"
            ariaLabel="اختر السورة"
            iconName="book-outline"
            options={SURAHS.map((s) => ({
              value: String(s.id),
              label: `${toArabicDigits(s.id)}. ${s.nameAr}`,
              description: `${toArabicDigits(s.totalAyahs)} آية • ${s.revelationTypeAr}`,
              keywords: `${s.nameEn} ${s.nameFr}`,
            }))}
          />
          <View
            style={[
              styles.badgesRow,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.badgeText, { color: theme.secondaryForeground }]}>
                {copy.hafsBadge}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.badgeText, { color: theme.secondaryForeground }]}>
                {copy.scriptBadge}
              </Text>
            </View>
          </View>
        </View>

        {/* Read-Only Guided Session Progress Bar */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View
            style={[
              styles.rowBetween,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={[styles.progressTitle, { color: theme.foreground }]}>
              مسار الجلسة الموجّهة
            </Text>
            <Text style={[styles.progressCount, { color: theme.mutedForeground }]}>
              {isSessionDone
                ? 'اكتملت الجلسة ✓'
                : `الخطوة ${toArabicDigits(stepIndex + 1)} من ${toArabicDigits(sessionSteps.length)}`}
            </Text>
          </View>

          <View style={[styles.stepsGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            {sessionSteps.map((step, idx) => {
              const isDone = isSessionDone || idx < stepIndex;
              const isCurrent = !isSessionDone && idx === stepIndex;
              return (
                <View key={step.id} style={styles.stepCol}>
                  <View
                    style={[
                      styles.stepBar,
                      {
                        backgroundColor: isDone
                          ? theme.primary
                          : isCurrent
                            ? theme.accent
                            : theme.muted,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.stepLbl,
                      {
                        color: isCurrent
                          ? theme.foreground
                          : isDone
                            ? theme.primary
                            : theme.mutedForeground,
                        fontWeight: isCurrent ? '700' : '600',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {isDone ? `✓ ${step.label}` : step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* STEP 1: Yesterday Review */}
        {currentStep === 'yesterdayReview' && yesterdayTarget && yesterdaySurah ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View
              style={[
                styles.rowBetween,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                <Text style={[styles.stepHeading, { color: theme.foreground }]}>
                  مراجعة الأمس
                </Text>
                <Text style={[styles.stepSub, { color: theme.mutedForeground }]}>
                  مراجعة {toArabicDigits(activeYesterdayQueue.length)}{' '}
                  {activeYesterdayQueue.length === 1 ? 'آية' : 'آيات'} من{' '}
                  {yesterdaySurah.nameAr}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  {yesterdaySurah.nameAr} • الآية {toArabicDigits(yesterdayTarget.ayahNumber)}
                </Text>
              </View>
            </View>

            {yesterdaySurahIds.length > 1 ? (
              <View style={styles.badgesRow}>
                {yesterdaySurahIds.map((sid) => {
                  const s = getSurahById(sid);
                  const selected = sid === activeYesterdaySurahId;
                  return (
                    <Pressable
                      key={sid}
                      onPress={() => {
                        setYesterdaySurahId(sid);
                        setYesterdayIdx(0);
                      }}
                      style={[
                        styles.surahPill,
                        {
                          borderColor: selected ? theme.primary : theme.border,
                          backgroundColor: selected ? theme.primary : theme.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.surahPillText,
                          { color: selected ? theme.primaryForeground : theme.foreground },
                        ]}
                      >
                        {s.nameAr}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <View style={[styles.verseSurface, { backgroundColor: theme.secondary }]}>
              {reviewHidden ? (
                <Text style={[styles.hiddenHint, { color: theme.mutedForeground }]}>
                  [ النص مخفي: سمّع الآيات غيباً ثم أظهرها للتحقق ]
                </Text>
              ) : loadingReviewText && !reviewAyahTexts[yesterdayTarget.key] ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                activeYesterdayQueue.map((item, idx) => (
                  <Pressable
                    key={item.key}
                    onPress={() => setYesterdayIdx(idx)}
                    style={[
                      styles.clickableVerse,
                      idx === safeYesterdayIdx
                        ? { backgroundColor: `${theme.primary}1A` }
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quranText,
                        { color: theme.foreground, fontSize: state.quranFontSize },
                      ]}
                    >
                      {reviewAyahTexts[item.key] ?? 'جاري التحميل...'}{' '}
                      <Text style={{ color: theme.primary }}>
                        ﴿{toArabicDigits(item.ayahNumber)}﴾
                      </Text>
                    </Text>
                  </Pressable>
                ))
              )}
            </View>

            <Pressable
              onPress={() => setReviewHidden((v) => !v)}
              style={[
                styles.outlineBtn,
                { borderColor: theme.border, backgroundColor: theme.background },
              ]}
            >
              <Ionicons
                name={reviewHidden ? 'eye-outline' : 'eye-off-outline'}
                size={16}
                color={theme.foreground}
              />
              <Text style={[styles.outlineBtnText, { color: theme.foreground }]}>
                {reviewHidden ? 'إظهار النص للتحقق' : 'إخفاء النص للتسميع'}
              </Text>
            </Pressable>

            <AudioPlayerBar
              mode="reference"
              surahId={yesterdayTarget.surahId}
              surahName={yesterdaySurah.nameAr}
              ayahNumber={yesterdayTarget.ayahNumber}
              onPrevAyah={
                safeYesterdayIdx > 0 ? () => setYesterdayIdx((i) => Math.max(0, i - 1)) : undefined
              }
              onNextAyah={
                safeYesterdayIdx + 1 < activeYesterdayQueue.length
                  ? () => setYesterdayIdx((i) => i + 1)
                  : undefined
              }
            />

            <View style={styles.evalGrid}>
              {(
                [
                  { id: 'difficult', label: copy.evalDifficult },
                  { id: 'good', label: copy.evalGood },
                  { id: 'easy', label: copy.evalEasy },
                ] as const
              ).map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={() => setYesterdayRating(opt.id)}
                  style={[
                    styles.compactEvalBtn,
                    {
                      borderColor: yesterdayRating === opt.id ? theme.primary : theme.border,
                      backgroundColor: yesterdayRating === opt.id ? theme.primary : theme.card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.compactEvalText,
                      {
                        color:
                          yesterdayRating === opt.id ? theme.primaryForeground : theme.foreground,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => void handleCompleteYesterdayReview()}
              style={[
                styles.primaryBtn,
                { flexDirection: isRtl ? 'row-reverse' : 'row', backgroundColor: theme.primary },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                أتممت مراجعة الأمس • المتابعة
              </Text>
              <Ionicons name={dirArrow} size={18} color={theme.primaryForeground} />
            </Pressable>
          </View>
        ) : null}

        {/* STEP 2: Older / Weak Review */}
        {currentStep === 'olderReview' && olderTarget && olderSurah ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View
              style={[
                styles.rowBetween,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                <Text style={[styles.stepHeading, { color: theme.foreground }]}>
                  المراجعة السابقة
                </Text>
                <Text style={[styles.stepSub, { color: theme.mutedForeground }]}>
                  مراجعة {toArabicDigits(activeOlderQueue.length)}{' '}
                  {activeOlderQueue.length === 1 ? 'آية' : 'آيات'} من {olderSurah.nameAr}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  {olderSurah.nameAr} • الآية {toArabicDigits(olderTarget.ayahNumber)}
                </Text>
              </View>
            </View>

            {olderSurahIds.length > 1 ? (
              <View style={styles.badgesRow}>
                {olderSurahIds.map((sid) => {
                  const s = getSurahById(sid);
                  const selected = sid === activeOlderSurahId;
                  return (
                    <Pressable
                      key={sid}
                      onPress={() => {
                        setOlderSurahId(sid);
                        setOlderIdx(0);
                      }}
                      style={[
                        styles.surahPill,
                        {
                          borderColor: selected ? theme.primary : theme.border,
                          backgroundColor: selected ? theme.primary : theme.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.surahPillText,
                          { color: selected ? theme.primaryForeground : theme.foreground },
                        ]}
                      >
                        {s.nameAr}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <View style={[styles.verseSurface, { backgroundColor: theme.secondary }]}>
              {reviewHidden ? (
                <Text style={[styles.hiddenHint, { color: theme.mutedForeground }]}>
                  [ النص مخفي: سمّع الآيات غيباً ثم أظهرها للتحقق ]
                </Text>
              ) : loadingReviewText && !reviewAyahTexts[olderTarget.key] ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                activeOlderQueue.map((item, idx) => (
                  <Pressable
                    key={item.key}
                    onPress={() => setOlderIdx(idx)}
                    style={[
                      styles.clickableVerse,
                      idx === safeOlderIdx ? { backgroundColor: `${theme.primary}1A` } : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quranText,
                        { color: theme.foreground, fontSize: state.quranFontSize },
                      ]}
                    >
                      {reviewAyahTexts[item.key] ?? 'جاري التحميل...'}{' '}
                      <Text style={{ color: theme.primary }}>
                        ﴿{toArabicDigits(item.ayahNumber)}﴾
                      </Text>
                    </Text>
                  </Pressable>
                ))
              )}
            </View>

            <Pressable
              onPress={() => setReviewHidden((v) => !v)}
              style={[
                styles.outlineBtn,
                { borderColor: theme.border, backgroundColor: theme.background },
              ]}
            >
              <Ionicons
                name={reviewHidden ? 'eye-outline' : 'eye-off-outline'}
                size={16}
                color={theme.foreground}
              />
              <Text style={[styles.outlineBtnText, { color: theme.foreground }]}>
                {reviewHidden ? 'إظهار النص للتحقق' : 'إخفاء النص للتسميع'}
              </Text>
            </Pressable>

            <AudioPlayerBar
              mode="reference"
              surahId={olderTarget.surahId}
              surahName={olderSurah.nameAr}
              ayahNumber={olderTarget.ayahNumber}
              onPrevAyah={
                safeOlderIdx > 0 ? () => setOlderIdx((i) => Math.max(0, i - 1)) : undefined
              }
              onNextAyah={
                safeOlderIdx + 1 < activeOlderQueue.length
                  ? () => setOlderIdx((i) => i + 1)
                  : undefined
              }
            />

            <View style={styles.evalGrid}>
              {(
                [
                  { id: 'difficult', label: copy.evalDifficult },
                  { id: 'good', label: copy.evalGood },
                  { id: 'easy', label: copy.evalEasy },
                ] as const
              ).map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={() => setOlderRating(opt.id)}
                  style={[
                    styles.compactEvalBtn,
                    {
                      borderColor: olderRating === opt.id ? theme.primary : theme.border,
                      backgroundColor: olderRating === opt.id ? theme.primary : theme.card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.compactEvalText,
                      {
                        color: olderRating === opt.id ? theme.primaryForeground : theme.foreground,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => void handleCompleteOlderReview()}
              style={[
                styles.primaryBtn,
                { flexDirection: isRtl ? 'row-reverse' : 'row', backgroundColor: theme.primary },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                أتممت المراجعة السابقة • بدء الحفظ الجديد
              </Text>
              <Ionicons name={dirArrow} size={18} color={theme.primaryForeground} />
            </Pressable>
          </View>
        ) : null}

        {/* STEP 3: New Memorization */}
        {currentStep === 'newMemorization' ? (
          <View style={styles.stack}>
            <View
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View
                style={[
                  styles.rowBetween,
                  { flexDirection: isRtl ? 'row-reverse' : 'row' },
                ]}
              >
                <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                  <Text style={[styles.stepHeading, { color: theme.foreground }]}>
                    الحفظ الجديد
                  </Text>
                  <Text style={[styles.stepSub, { color: theme.mutedForeground }]}>
                    الآية {toArabicDigits(memOffset + 1)} من{' '}
                    {toArabicDigits(portionAyahs.length || 1)} في ورد اليوم
                  </Text>
                </View>

                <Pressable
                  onPress={() => setHideLevel((lvl) => ((lvl + 1) % 4) as ProgressiveHideLevel)}
                  style={[
                    styles.hideBtn,
                    {
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      borderColor: hideLevel > 0 ? theme.primary : theme.border,
                      backgroundColor: hideLevel > 0 ? theme.primary : theme.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={hideLevel > 0 ? 'eye-outline' : 'eye-off-outline'}
                    size={16}
                    color={hideLevel > 0 ? theme.primaryForeground : theme.foreground}
                  />
                  <Text
                    style={[
                      styles.hideBtnText,
                      { color: hideLevel > 0 ? theme.primaryForeground : theme.foreground },
                    ]}
                  >
                    {hideLevel === 0
                      ? 'إخفاء تدريجي'
                      : hideLevel === 3
                        ? 'إظهار الكل'
                        : `إخفاء ${formatNum(hideLevel, language)}/${formatNum(3, language)}`}
                  </Text>
                </Pressable>
              </View>

              {surah.id !== 1 && surah.id !== 9 && activeMemAyah?.number === 1 ? (
                <Text style={[styles.basmalah, { color: theme.mutedForeground }]}>
                  بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
                </Text>
              ) : null}

              {loadingAyahs && !activeMemAyah ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.stepSub, { color: theme.mutedForeground }]}>
                    جاري تحميل آيات {surah.nameAr} وحفظها في SQLite...
                  </Text>
                </View>
              ) : activeMemAyah ? (
                <>
                  <View style={[styles.verseSurface, { backgroundColor: theme.secondary }]}>
                    <Text
                      style={[
                        styles.quranTextCenter,
                        { color: theme.foreground, fontSize: state.quranFontSize },
                      ]}
                    >
                      {maskVerseByLevel(activeMemAyah.textAr, hideLevel)}{' '}
                      <Text style={{ color: theme.primary }}>
                        ﴿{toArabicDigits(activeMemAyah.number)}﴾
                      </Text>
                    </Text>
                  </View>

                  {state.showTranslation ? (
                    <Text style={[styles.transText, { color: theme.mutedForeground }]}>
                      {language === 'fr'
                        ? activeMemAyah.translationFr
                        : activeMemAyah.translationEn}
                    </Text>
                  ) : null}

                  <Pressable
                    onPress={() => setShowTafsirBox((v) => !v)}
                    style={[
                      styles.tafsirToggle,
                      {
                        flexDirection: isRtl ? 'row-reverse' : 'row',
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                      },
                    ]}
                  >
                    <Text style={[styles.tafsirToggleText, { color: theme.foreground }]}>
                      المعنى والترجمة الميسرة
                    </Text>
                    <Ionicons
                      name={showTafsirBox ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={theme.mutedForeground}
                    />
                  </Pressable>

                  {showTafsirBox ? (
                    <View style={[styles.tafsirBody, { backgroundColor: theme.muted }]}>
                      <Text style={[styles.transText, { color: theme.foreground }]}>
                        {language === 'fr'
                          ? activeMemAyah.translationFr
                          : activeMemAyah.translationEn}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={[styles.stepSub, { color: theme.mutedForeground }]}>
                  {loadError ?? 'اتصل بالإنترنت لمرة واحدة لتحميل هذه السورة.'}
                </Text>
              )}
            </View>

            <AudioPlayerBar
              mode="memorize"
              surahId={surah.id}
              surahName={surah.nameAr}
              ayahNumber={activeMemAyah?.number ?? 1}
            />

            <View
              style={[
                styles.tipBox,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  borderColor: theme.border,
                  backgroundColor: theme.secondary,
                },
              ]}
            >
              <Ionicons name="bulb-outline" size={18} color={theme.primary} />
              <Text
                style={[
                  styles.tipText,
                  { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                ]}
              >
                استمع للآية وكررها بهدوء، وعندما تثبت في ذهنك انتقل للخطوة التالية.
              </Text>
            </View>

            <Pressable
              disabled={!activeMemAyah}
              onPress={() => void handleCompleteMemorizeAyah()}
              style={[
                styles.primaryBtn,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  backgroundColor: theme.primary,
                  opacity: activeMemAyah ? 1 : 0.45,
                },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.primaryForeground} />
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                {memOffset + 1 < portionAyahs.length
                  ? 'حفظت هذه الآية • الآية التالية'
                  : 'أتممت حفظ الورد • الانتقال للتسميع'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* STEP 4: Guided Blind Self-Test */}
        {currentStep === 'selfTest' && activeTestAyah ? (
          <View style={styles.stack}>
            <View
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View
                style={[
                  styles.rowBetween,
                  { flexDirection: isRtl ? 'row-reverse' : 'row' },
                ]}
              >
                <Text style={[styles.stepHeading, { color: theme.foreground }]}>
                  التسميع الغيبي
                </Text>
                <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
                  <Text style={[styles.badgeText, { color: theme.primary }]}>
                    الآية {toArabicDigits(testOffset + 1)} من{' '}
                    {toArabicDigits(portionAyahs.length)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.promptText, { color: theme.mutedForeground }]}>
                اقرأ الآية {toArabicDigits(activeTestAyah.number)} من {surah.nameAr} غيباً دون
                النظر، ثم اكشف النص للمطابقة.
              </Text>

              <View
                style={[
                  styles.dashedBox,
                  { borderColor: theme.border, backgroundColor: theme.secondary },
                ]}
              >
                {testRevealed ? (
                  <Text
                    style={[
                      styles.quranTextCenter,
                      { color: theme.foreground, fontSize: state.quranFontSize },
                    ]}
                  >
                    {activeTestAyah.textAr} ({toArabicDigits(activeTestAyah.number)})
                  </Text>
                ) : (
                  <View style={styles.loadingBox}>
                    <Ionicons name="eye-off-outline" size={28} color={theme.mutedForeground} />
                    <Text style={[styles.hiddenHint, { color: theme.mutedForeground }]}>
                      [ نص الآية محجوب للتسميع ]
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={() => setTestRevealed((v) => !v)}
                style={[
                  styles.outlineBtn,
                  { borderColor: theme.border, backgroundColor: theme.secondary },
                ]}
              >
                <Ionicons
                  name={testRevealed ? 'eye-off-outline' : 'eye-outline'}
                  size={16}
                  color={theme.secondaryForeground}
                />
                <Text style={[styles.outlineBtnText, { color: theme.secondaryForeground }]}>
                  {testRevealed ? 'إخفاء النص' : 'كشف النص للتحقق والمطابقة'}
                </Text>
              </Pressable>
            </View>

            <AudioPlayerBar
              mode="reference"
              surahId={surah.id}
              surahName={surah.nameAr}
              ayahNumber={activeTestAyah.number}
            />

            <View
              style={[
                styles.tipBox,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  borderColor: theme.border,
                  backgroundColor: theme.secondary,
                },
              ]}
            >
              <Ionicons name="information-circle-outline" size={18} color={theme.primary} />
              <Text
                style={[
                  styles.tipText,
                  { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                ]}
              >
                {copy.selfEvalDisclaimer}
              </Text>
            </View>

            <View
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Text
                style={[
                  styles.stepSubBold,
                  { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                ]}
              >
                قيّم استحضارك للآية:
              </Text>
              <View style={styles.evalGrid}>
                {(
                  [
                    { id: 'difficult', title: 'صعبة', sub: 'إعادة غداً' },
                    { id: 'good', title: 'جيدة', sub: 'بتأنٍّ' },
                    { id: 'easy', title: 'سهلة', sub: 'ثابتة بيسر' },
                  ] as const
                ).map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setTestRating(item.id)}
                    style={[
                      styles.evalTile,
                      {
                        borderColor: testRating === item.id ? theme.primary : theme.border,
                        backgroundColor: testRating === item.id ? theme.primary : theme.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.evalTitle,
                        {
                          color:
                            testRating === item.id ? theme.primaryForeground : theme.foreground,
                        },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.evalSub,
                        {
                          color:
                            testRating === item.id
                              ? theme.primaryForeground
                              : theme.mutedForeground,
                        },
                      ]}
                    >
                      {item.sub}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              disabled={!testRating}
              onPress={() => void handleCompleteTestAyah()}
              style={[
                styles.primaryBtn,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  backgroundColor: theme.primary,
                  opacity: testRating ? 1 : 0.45,
                },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                {testOffset + 1 < portionAyahs.length
                  ? 'تثبيت التقييم • الآية التالية'
                  : 'أتممت التسميع • الانتقال لربط الآيات'}
              </Text>
              <Ionicons name={dirArrow} size={18} color={theme.primaryForeground} />
            </Pressable>
          </View>
        ) : null}

        {/* STEP 5: Connecting Verses */}
        {currentStep === 'verseConnection' ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View
              style={[
                styles.rowBetween,
                { flexDirection: isRtl ? 'row-reverse' : 'row' },
              ]}
            >
              <Text style={[styles.stepHeading, { color: theme.foreground }]}>
                {language === 'en'
                  ? 'Connect Verses'
                  : language === 'fr'
                    ? 'Relier les versets'
                    : 'ربط الآيات'}
              </Text>
              <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  {language === 'en'
                    ? 'Full Passage'
                    : language === 'fr'
                      ? 'Passage complet'
                      : 'المقطع الكامل'}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.stepSub,
                { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left' },
              ]}
            >
              اقرأ الآيات متصلة من بدايتها لتثبيت الانتقال بين نهايات الآيات وبداياتها. اضغط على أي
              آية للاستماع.
            </Text>

            <View style={[styles.verseSurface, { backgroundColor: theme.secondary }]}>
              {connectAyahs.map((a, idx) => (
                <Pressable
                  key={a.number}
                  onPress={() => setConnectIdx(idx)}
                  style={[
                    styles.clickableVerse,
                    idx === connectIdx ? { backgroundColor: `${theme.primary}1A` } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.quranText,
                      { color: theme.foreground, fontSize: state.quranFontSize },
                    ]}
                  >
                    {a.textAr}{' '}
                    <Text style={{ color: theme.primary }}>﴿{toArabicDigits(a.number)}﴾</Text>
                  </Text>
                </Pressable>
              ))}
            </View>

            {connectAyahs.length > 0 ? (
              <AudioPlayerBar
                mode="reference"
                surahId={surah.id}
                surahName={getSurahDisplayName(surah, language)}
                ayahNumber={
                  connectAyahs[Math.min(connectIdx, connectAyahs.length - 1)]?.number ??
                  connectAyahs[0]?.number ??
                  1
                }
                onPrevAyah={connectIdx > 0 ? () => setConnectIdx((i) => Math.max(0, i - 1)) : undefined}
                onNextAyah={
                  connectIdx + 1 < connectAyahs.length
                    ? () => setConnectIdx((i) => i + 1)
                    : undefined
                }
              />
            ) : null}

            <Pressable
              onPress={() => void advanceStep('verseConnection')}
              style={[
                styles.primaryBtn,
                { flexDirection: isRtl ? 'row-reverse' : 'row', backgroundColor: theme.primary },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.primaryForeground} />
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                أتممت ربط الآيات وإنهاء الجلسة
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* SESSION COMPLETE */}
        {currentStep === 'completed' ? (
          <View
            style={[
              styles.doneCard,
              { backgroundColor: theme.card, borderColor: theme.primary },
            ]}
          >
            <View style={[styles.doneIconBox, { backgroundColor: theme.secondary }]}>
              <Ionicons name="checkmark-circle-outline" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.doneTitle, { color: theme.primary }]}>
              {language === 'en'
                ? 'Well done, keep going'
                : language === 'fr'
                  ? 'Bravo, continuez ainsi'
                  : 'أحسنت، واصل'}
            </Text>
            <Text style={[styles.doneBody, { color: theme.mutedForeground }]}>
              {justFinishedSurah
                ? `أتممت بفضل الله ${surah.nameAr}. اختر السورة التالية التي تودّ البدء بها.`
                : `تمّ حفظ الورد بنجاح وتحديث موضعك القادم إلى ${surah.nameAr} • الآية ${toArabicDigits(currentAyah)}.`}
            </Text>

            {justFinishedSurah ? (
              <MillaPicker
                searchable
                fullWidth
                value={String(surah.id)}
                onChange={(val) => {
                  const nextId = Number(val);
                  void setCursor(nextId, state.surahCursors[nextId] ?? 1);
                  handleStartNextSession();
                }}
                title="اختر السورة التالية"
                ariaLabel="اختر السورة التالية"
                iconName="book-outline"
                options={SURAHS.map((s) => ({
                  value: String(s.id),
                  label: `${toArabicDigits(s.id)}. ${getSurahDisplayName(s, language)}`,
                  description: `${formatNum(s.totalAyahs, language)} ${copy.versesUnit}`,
                  keywords: `${s.nameEn} ${s.nameFr} ${s.nameAr}`,
                }))}
              />
            ) : null}

            <Pressable
              onPress={handleStartNextSession}
              style={[
                styles.primaryBtn,
                {
                  width: '100%',
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                بدء الورد التالي الآن
              </Text>
              <Ionicons name={dirArrow} size={18} color={theme.primaryForeground} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/')}
              style={[
                styles.outlineBtn,
                {
                  width: '100%',
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
            >
              <Ionicons name="home-outline" size={16} color={theme.foreground} />
              <Text style={[styles.outlineBtnText, { color: theme.foreground }]}>
                العودة للرئيسية
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { gap: SPACING.lg },
  card: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  badgesRow: { flexWrap: 'wrap', gap: 6 },
  badge: { borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  rowBetween: { alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  progressTitle: { fontSize: 12, fontWeight: '700' },
  progressCount: { fontSize: 12 },
  stepsGrid: { gap: 6 },
  stepCol: { flex: 1, alignItems: 'center', gap: 6 },
  stepBar: { width: '100%', height: 8, borderRadius: RADII.pill },
  stepLbl: { fontSize: 10, textAlign: 'center' },
  stepHeading: { fontSize: 17, fontWeight: '700' },
  stepSub: { fontSize: 12, marginTop: 2 },
  stepSubBold: { fontSize: 14, fontWeight: '700' },
  surahPill: {
    minHeight: 36,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  surahPillText: { fontSize: 12, fontWeight: '700' },
  verseSurface: { borderRadius: RADII.card, padding: SPACING.md, gap: 6 },
  clickableVerse: { borderRadius: 8, padding: 6 },
  quranText: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 46 },
  quranTextCenter: { textAlign: 'center', writingDirection: 'rtl', lineHeight: 46 },
  basmalah: { fontSize: 20, textAlign: 'center', writingDirection: 'rtl' },
  hiddenHint: { fontSize: 14, fontWeight: '500', textAlign: 'center', paddingVertical: 14 },
  outlineBtn: {
    minHeight: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  outlineBtnText: { fontSize: 13, fontWeight: '600' },
  evalGrid: { flexDirection: 'row-reverse', gap: 8 },
  compactEvalBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactEvalText: { fontSize: 12, fontWeight: '700' },
  evalTile: {
    flex: 1,
    minHeight: 76,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  evalTitle: { fontSize: 14, fontWeight: '700' },
  evalSub: { fontSize: 11, marginTop: 2 },
  primaryBtn: {
    minHeight: 54,
    borderRadius: RADII.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700' },
  hideBtn: {
    minHeight: 48,
    alignItems: 'center',
    gap: 6,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  hideBtnText: { fontSize: 13, fontWeight: '600' },
  loadingBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  transText: { fontSize: 14, lineHeight: 22, textAlign: 'left' },
  tafsirToggle: {
    minHeight: 48,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  tafsirToggleText: { fontSize: 13, fontWeight: '600' },
  tafsirBody: { borderRadius: RADII.control, padding: 14 },
  tipBox: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
  promptText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  dashedBox: {
    minHeight: 130,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  doneCard: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: 14,
  },
  doneIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: { fontSize: 22, fontWeight: '700' },
  doneBody: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
