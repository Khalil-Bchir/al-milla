import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  MILLA_COPY,
  SURAHS,
  computeLinkAnchorRange,
  computePortionSuggestion,
  computeSurahProgress,
  computeSurahRevisionPlan,
  findActiveLearningLesson,
  formatNum,
  getSurahActiveSessionNumber,
  getSurahById,
  getSurahDisplayName,
  maskVerseDynamic,
  maskVerseForStrengthening,
  toArabicDigits,
  type AyahEntry,
  type LessonRecord,
  type SelfEvalRating,
} from '@al-milla/core';
import { AppShell } from '../src/components/milla/AppShell';
import { AudioPlayerBar } from '../src/components/milla/AudioPlayerBar';
import { MemorizeCornerActions } from '../src/components/milla/MemorizeModals';
import { MillaPicker } from '../src/components/milla/MillaPicker';
import { QuranText } from '../src/components/milla/QuranText';
import { SegmentedControl } from '../src/components/milla/SegmentedControl';
import { SurahProgressBar } from '../src/components/milla/SurahProgressBar';
import { useMilla } from '../src/context/MillaContext';
import { loadSurahArabicTafsir, loadVerifiedSurahAyahs } from '../src/services/quran';
import { MIN_TOUCH_TARGET, RADII, SPACING } from '../src/theme/tokens';

type MemorizeStepId = 'revise' | 'memorize' | 'test' | 'link';
type ScreenPhase = MemorizeStepId | 'completed' | 'finished_early';

interface GuidedStepDef {
  id: MemorizeStepId;
  label: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function MemorizeSessionScreen() {
  const router = useRouter();
  const {
    state,
    theme,
    setCursor,
    setVerseStatus,
    setDailyStage,
    completeSession,
    saveLearningLesson,
    recordLessonTest,
    evaluateLessonReview,
    finishSessionEarly,
    saveSessionDraft,
  } = useMilla();

  const language = state?.language ?? 'ar';
  const copy = MILLA_COPY[language];
  const isRtl = language === 'ar';
  const dirArrow = isRtl ? 'arrow-back' : 'arrow-forward';
  const backArrow = isRtl ? 'arrow-forward' : 'arrow-back';
  const currentSurahId = state?.currentSurahId ?? 18;
  const currentAyah = state?.currentAyah ?? 1;
  const normalDailyTarget = state?.dailyTarget ?? 3;
  const surah = getSurahById(currentSurahId);
  const today = todayIso();

  const [ayahs, setAyahs] = useState<AyahEntry[]>(surah.ayahs);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [acceptedTarget, setAcceptedTarget] = useState<number | null>(null);
  const [dismissedSuggestionId, setDismissedSuggestionId] = useState<string | null>(null);

  const activeSessionNum = getSurahActiveSessionNumber(
    state?.surahSessions ?? {},
    surah.id,
  );

  const activeLearningLesson = useMemo(
    () => findActiveLearningLesson(state?.lessons ?? [], surah.id),
    [state?.lessons, surah.id],
  );
  const usingLearningRange = Boolean(activeLearningLesson);

  const buildPreviousLessonPlan = (
    lessons: readonly LessonRecord[],
    targetSurahId: number,
    sessionNum: number,
    todayIsoDate: string,
    excludeLessonId?: string,
  ) => {
    const raw = computeSurahRevisionPlan(lessons, {
      surahId: targetSurahId,
      activeSessionNumber: sessionNum,
      todayIso: todayIsoDate,
    });
    const lastFromPlan = raw.lastSessionLessons.find((l) => l.id !== excludeLessonId) ?? null;
    const fallbackPrev =
      lessons
        .filter(
          (l) =>
            l.surahId === targetSurahId &&
            l.id !== excludeLessonId &&
            (sessionNum <= 0 || l.lastReviewedSession < sessionNum),
        )
        .sort((a, b) => b.sessionLearned - a.sessionLearned || b.endVerse - a.endVerse)[0] ?? null;
    const prevLesson = lastFromPlan ?? fallbackPrev;
    return {
      surahId: targetSurahId,
      lastSessionLessons: prevLesson ? [prevLesson] : [],
      earlierSessionLessons: [] as LessonRecord[],
      safetyNetLessons: [] as LessonRecord[],
      allLessons: prevLesson ? [prevLesson] : [],
    };
  };

  const [surahPlan, setSurahPlan] = useState(() =>
    buildPreviousLessonPlan(
      state?.lessons ?? [],
      surah.id,
      activeSessionNum,
      today,
      activeLearningLesson?.id,
    ),
  );
  const [planSurahKey, setPlanSurahKey] = useState<string>('');

  useEffect(() => {
    if (!state) return;
    const key = `${surah.id}:${activeSessionNum}`;
    if (planSurahKey !== key) {
      setSurahPlan(
        buildPreviousLessonPlan(
          state.lessons,
          surah.id,
          activeSessionNum,
          today,
          activeLearningLesson?.id,
        ),
      );
      setPlanSurahKey(key);
    }
  }, [state, surah.id, activeSessionNum, today, planSurahKey, activeLearningLesson]);

  // Step 1 (Revise) state
  const [reviseLessonIdx, setReviseLessonIdx] = useState(0);
  const [reviseAyahOffset, setReviseAyahOffset] = useState(0);
  const [reviseViewMode, setReviseViewMode] = useState<'partial' | 'hidden' | 'revealed'>('partial');
  const reviseFadeAnim = useRef(new Animated.Value(1)).current;
  const [reviewedLessonIds, setReviewedLessonIds] = useState<string[]>([]);
  const [reviseAyahTexts, setReviseAyahTexts] = useState<Record<string, string>>({});
  const [loadingReviseText, setLoadingReviseText] = useState(false);
  const [submittingRevise, setSubmittingRevise] = useState(false);

  // Step 2 (Memorize) state
  const [memOffset, setMemOffset] = useState(0);
  const [highestLearnedOffset, setHighestLearnedOffset] = useState(0);
  const [verseRepeatCount, setVerseRepeatCount] = useState(0);
  const [showTafsirBox, setShowTafsirBox] = useState(false);
  const [tafsirMap, setTafsirMap] = useState<Record<number, string>>({});
  const [loadingTafsir, setLoadingTafsir] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!showTafsirBox && !state?.showTranslation) return undefined;
    if (Object.keys(tafsirMap).length > 0) return undefined;

    setLoadingTafsir(true);
    void loadSurahArabicTafsir(currentSurahId).then((map) => {
      if (cancelled) return;
      setTafsirMap(map);
      setLoadingTafsir(false);
    });
    return () => {
      cancelled = true;
    };
  }, [currentSurahId, showTafsirBox, state?.showTranslation, tafsirMap]);

  useEffect(() => {
    if (!state) return;
    setVerseRepeatCount((prev) => Math.min(prev, state.mandatoryRepeats));
  }, [state?.mandatoryRepeats]);

  // Step 3 (Test) state
  const [testRevealed, setTestRevealed] = useState(false);
  const [testAudioOffset, setTestAudioOffset] = useState(0);
  const [testRating, setTestRating] = useState<SelfEvalRating | null>(null);
  const [testHardAyahs, setTestHardAyahs] = useState<number[]>([]);

  // Step 4 (Link) state
  const [linkAudioIdx, setLinkAudioIdx] = useState(0);
  const [linkViewMode, setLinkViewMode] = useState<'hidden' | 'revealed'>('revealed');
  const linkFadeAnim = useRef(new Animated.Value(1)).current;

  // Session progression
  const [stepIndex, setStepIndex] = useState(0);
  const [highestStepIndex, setHighestStepIndex] = useState(0);
  const [endPhase, setEndPhase] = useState<'active' | 'completed' | 'finished_early'>('active');
  const [justFinishedSurah, setJustFinishedSurah] = useState(false);
  const [completedRange, setCompletedRange] = useState<{
    start: number;
    end: number;
    count: number;
  } | null>(null);
  const [draftRestoredKey, setDraftRestoredKey] = useState<string>('');
  const isEndingSessionRef = useRef(false);

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
    if (surahPlan.allLessons.length === 0) return;
    let cancelled = false;
    setLoadingReviseText(true);
    void loadVerifiedSurahAyahs(surah.id).then((res) => {
      if (cancelled) return;
      const nextMap: Record<string, string> = {};
      for (const a of res.ayahs) {
        nextMap[`${surah.id}:${a.number}`] = a.textAr;
      }
      setReviseAyahTexts(nextMap);
      setLoadingReviseText(false);
    });
    return () => {
      cancelled = true;
    };
  }, [surah.id, surahPlan.allLessons.length]);

  const effectiveTarget = acceptedTarget ?? normalDailyTarget;
  const portionStartAyah =
    usingLearningRange && activeLearningLesson ? activeLearningLesson.startVerse : currentAyah;
  const startIdx = Math.max(
    0,
    ayahs.findIndex((a) => a.number === portionStartAyah),
  );

  const portionAyahs = useMemo(() => {
    if (usingLearningRange && activeLearningLesson) {
      const count = Math.max(
        1,
        activeLearningLesson.endVerse - activeLearningLesson.startVerse + 1,
      );
      return ayahs.slice(startIdx, startIdx + count);
    }
    return ayahs.slice(startIdx, startIdx + effectiveTarget);
  }, [ayahs, startIdx, effectiveTarget, usingLearningRange, activeLearningLesson]);

  const linkAnchor = useMemo(
    () =>
      computeLinkAnchorRange({
        ayahs,
        startIdx,
        portionCount: portionAyahs.length,
        verseRecords: state?.verseRecords ?? {},
        lessons: state?.lessons ?? [],
        surahId: surah.id,
        maxOldVerses: 5,
      }),
    [ayahs, startIdx, portionAyahs.length, state?.verseRecords, state?.lessons, surah.id],
  );

  const [sessionSteps, setSessionSteps] = useState<GuidedStepDef[]>(() => {
    const steps: GuidedStepDef[] = [];
    if (surahPlan.allLessons.length > 0) {
      steps.push({ id: 'revise', label: 'المراجعة' });
    }
    steps.push({ id: 'memorize', label: 'الحفظ' }, { id: 'test', label: 'التسميع' });
    if (linkAnchor.hasOldVerses) {
      steps.push({ id: 'link', label: 'الربط' });
    }
    return steps;
  });
  const [stepsKey, setStepsKey] = useState<string>('');

  useEffect(() => {
    const expectedPlanKey = `${surah.id}:${activeSessionNum}`;
    if (!state || ayahs.length === 0 || planSurahKey !== expectedPlanKey) return;

    const hasRevise = surahPlan.allLessons.length > 0;
    const hasLink = linkAnchor.hasOldVerses;
    const key = `${expectedPlanKey}:${ayahs.length}:${hasRevise ? 1 : 0}:${hasLink ? 1 : 0}`;
    if (stepsKey !== key && (stepsKey === '' || stepIndex === 0)) {
      const steps: GuidedStepDef[] = [];
      if (hasRevise) {
        steps.push({ id: 'revise', label: 'المراجعة' });
      }
      steps.push({ id: 'memorize', label: 'الحفظ' }, { id: 'test', label: 'التسميع' });
      if (hasLink) {
        steps.push({ id: 'link', label: 'الربط' });
      }
      setSessionSteps(steps);
      setStepsKey(key);
    }
  }, [
    state,
    surah.id,
    activeSessionNum,
    ayahs.length,
    planSurahKey,
    surahPlan.allLessons.length,
    linkAnchor.hasOldVerses,
    stepsKey,
    stepIndex,
  ]);

  // Restore in-progress session draft if user closed app mid-session
  useEffect(() => {
    if (!state || endPhase !== 'active' || isEndingSessionRef.current) return;
    const key = `${surah.id}:${activeSessionNum}`;
    if (draftRestoredKey === key) return;
    setDraftRestoredKey(key);

    const draft = state.activeSessionDraft;
    if (draft && draft.surahId === surah.id && draft.sessionNumber === activeSessionNum) {
      const safeStep = Math.max(0, Math.min(sessionSteps.length - 1, draft.stepIndex));
      const maxMem = Math.max(0, portionAyahs.length - 1);
      const safeMem = Math.max(0, Math.min(maxMem, draft.memOffset));
      const safeHighest = Math.max(safeMem, Math.min(maxMem, draft.highestLearnedOffset));
      const maxRev = Math.max(0, surahPlan.allLessons.length - 1);
      const safeRev = Math.max(0, Math.min(maxRev, draft.reviseLessonIdx));

      setStepIndex(safeStep);
      setHighestStepIndex(safeStep);
      setMemOffset(safeMem);
      setHighestLearnedOffset(safeHighest);
      setReviseLessonIdx(safeRev);
    }
  }, [
    state,
    endPhase,
    surah.id,
    activeSessionNum,
    draftRestoredKey,
    sessionSteps.length,
    portionAyahs.length,
    surahPlan.allLessons.length,
  ]);

  const isStateReady = Boolean(state);

  // Persist active step & verse offset so interruptions never lose place
  useEffect(() => {
    if (!isStateReady || endPhase !== 'active' || isEndingSessionRef.current) return;
    const key = `${surah.id}:${activeSessionNum}`;
    if (draftRestoredKey !== key) return;

    const hasProgress =
      stepIndex > 0 || memOffset > 0 || highestLearnedOffset > 0 || reviseLessonIdx > 0;
    if (!hasProgress) return;

    void saveSessionDraft({
      surahId: surah.id,
      sessionNumber: activeSessionNum,
      stepIndex,
      memOffset,
      highestLearnedOffset,
      reviseLessonIdx,
    });
  }, [
    isStateReady,
    endPhase,
    surah.id,
    activeSessionNum,
    draftRestoredKey,
    stepIndex,
    memOffset,
    highestLearnedOffset,
    reviseLessonIdx,
    saveSessionDraft,
  ]);

  const plannerSuggestion = useMemo(() => {
    if (!state || acceptedTarget !== null || usingLearningRange) return null;
    const weakCount = Object.values(state.verseRecords).filter((v) => v.status === 'weak').length;
    const suggestion = computePortionSuggestion({
      normalTarget: normalDailyTarget,
      lastSessionDate: state.currentSessionDate,
      todayIso: today,
      weakVerseCount: weakCount,
    });
    if (!suggestion || suggestion.id === dismissedSuggestionId) return null;
    return suggestion;
  }, [state, acceptedTarget, usingLearningRange, normalDailyTarget, today, dismissedSuggestionId]);

  if (!state) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const activeReviseLesson: LessonRecord | null =
    surahPlan.allLessons[reviseLessonIdx] ?? surahPlan.allLessons[0] ?? null;

  useEffect(() => {
    setReviseViewMode(activeReviseLesson?.state === 'strengthening' ? 'partial' : 'hidden');
    setReviseAyahOffset(0);
  }, [activeReviseLesson?.id, activeReviseLesson?.state]);

  const activeLessonVerseNumbers: number[] = activeReviseLesson
    ? Array.from(
        { length: Math.max(1, activeReviseLesson.endVerse - activeReviseLesson.startVerse + 1) },
        (_, i) => activeReviseLesson.startVerse + i,
      )
    : [];

  const activeMemAyah = portionAyahs[memOffset] ?? portionAyahs[0];
  const safeTestAudioIdx = Math.min(testAudioOffset, Math.max(0, portionAyahs.length - 1));
  const activeTestAudioAyah = portionAyahs[safeTestAudioIdx] ?? portionAyahs[0];

  const currentPhase: ScreenPhase =
    endPhase !== 'active' ? endPhase : (sessionSteps[stepIndex]?.id ?? 'memorize');

  const getReviseSectionLabel = (lesson: LessonRecord): string => {
    if (surahPlan.safetyNetLessons.some((l) => l.id === lesson.id)) {
      return 'مراجعة ذات أولوية';
    }
    if (surahPlan.lastSessionLessons.some((l) => l.id === lesson.id)) {
      return 'الجلسة السابقة';
    }
    return 'جلسات سابقة';
  };

  const handleReviseModeChange = (nextMode: 'partial' | 'hidden' | 'revealed') => {
    reviseFadeAnim.setValue(0.6);
    setReviseViewMode(nextMode);
    Animated.timing(reviseFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleLinkModeChange = (nextMode: 'hidden' | 'revealed') => {
    linkFadeAnim.setValue(0.6);
    setLinkViewMode(nextMode);
    Animated.timing(linkFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const getReviseDisplayText = (lesson: LessonRecord, rawText: string): string => {
    if (reviseViewMode === 'revealed') return rawText;
    if (reviseViewMode === 'partial' && lesson.state === 'strengthening') {
      return maskVerseForStrengthening(rawText, lesson.hidingLevel);
    }
    return '';
  };

  const toggleHardAyah = (list: number[], setList: (next: number[]) => void, num: number) => {
    if (list.includes(num)) {
      setList(list.filter((n) => n !== num));
    } else {
      setList([...list, num]);
    }
  };

  const advanceNextWirdPosition = async () => {
    const lastCompletedAyah = portionAyahs[portionAyahs.length - 1]?.number ?? portionStartAyah;
    if (lastCompletedAyah < surah.totalAyahs) {
      setJustFinishedSurah(false);
      await setCursor(surah.id, lastCompletedAyah + 1);
    } else {
      setJustFinishedSurah(true);
    }
  };

  const finishFullSession = async (advanceCursor: boolean) => {
    isEndingSessionRef.current = true;
    const first = portionAyahs[0]?.number ?? portionStartAyah;
    const last = portionAyahs[portionAyahs.length - 1]?.number ?? portionStartAyah;
    setCompletedRange({ start: first, end: last, count: portionAyahs.length });
    setEndPhase('completed');
    await completeSession(portionAyahs.map((a) => `${surah.id}:${a.number}`));
    if (advanceCursor) {
      await advanceNextWirdPosition();
    }
  };

  const advanceToNextStep = async (advanceCursorOnComplete = true) => {
    setReviseViewMode('partial');
    setVerseRepeatCount(0);
    setTestRevealed(false);
    setTestRating(null);
    setTestHardAyahs([]);
    setLinkAudioIdx(0);
    setLinkViewMode('revealed');

    if (stepIndex + 1 < sessionSteps.length) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      setHighestStepIndex((prev) => Math.max(prev, nextIdx));
      return;
    }

    await finishFullSession(advanceCursorOnComplete);
  };

  const handleSubmitReviseLesson = async () => {
    if (!activeReviseLesson || submittingRevise) return;
    setSubmittingRevise(true);
    try {
      const reviewedId = activeReviseLesson.id;
      setReviewedLessonIds((prev) => (prev.includes(reviewedId) ? prev : [...prev, reviewedId]));

      if (reviseLessonIdx + 1 < surahPlan.allLessons.length) {
        setReviseAyahOffset(0);
        setReviseViewMode('partial');
        setReviseLessonIdx((idx) => idx + 1);
        return;
      }

      try {
        if (surahPlan.lastSessionLessons.length > 0) {
          await setDailyStage('yesterdayReview', true);
        }
        if (surahPlan.earlierSessionLessons.length > 0 || surahPlan.safetyNetLessons.length > 0) {
          await setDailyStage('olderReview', true);
        }
      } catch {
        // Daily stage persistence should not block advancing to Memorize
      }
      await advanceToNextStep();
    } finally {
      setSubmittingRevise(false);
    }
  };

  const handleMemPrevAyah = () => {
    setVerseRepeatCount(0);
    setShowTafsirBox(false);
    setMemOffset((o) => Math.max(0, o - 1));
  };

  const handleMemNextAyah = async () => {
    if (!activeMemAyah) return;
    await setVerseStatus(surah.id, activeMemAyah.number, 'in_progress');
    setVerseRepeatCount(0);
    setShowTafsirBox(false);
    const nextOff = Math.min(portionAyahs.length - 1, memOffset + 1);
    setHighestLearnedOffset((prev) => Math.max(prev, nextOff));
    setMemOffset(nextOff);
  };

  const advanceRepeatCount = (prev: number, target: number): number => {
    const limit = Math.max(1, target);
    return prev >= limit ? 1 : prev + 1;
  };

  const handleManualRepeatTap = () => {
    setVerseRepeatCount((prev) => advanceRepeatCount(prev, state?.mandatoryRepeats ?? 5));
  };

  const handleReadyToTest = async () => {
    if (portionAyahs.length === 0) return;
    const first = portionAyahs[0];
    const last = portionAyahs[portionAyahs.length - 1];
    if (!first || !last) return;

    for (const a of portionAyahs) {
      await setVerseStatus(surah.id, a.number, 'in_progress');
    }
    await saveLearningLesson({
      surahId: surah.id,
      startVerse: first.number,
      endVerse: last.number,
    });
    await setDailyStage('newMemorization', true);
    await advanceToNextStep();
  };

  const submitFinalLessonRating = async (markVerseConnection: boolean) => {
    if (!testRating || portionAyahs.length === 0) return;
    const first = portionAyahs[0];
    const last = portionAyahs[portionAyahs.length - 1];
    if (!first || !last) return;

    await recordLessonTest({
      surahId: surah.id,
      startVerse: first.number,
      endVerse: last.number,
      rating: testRating,
      hardAyahNumbers: testRating === 'difficult' ? testHardAyahs : [],
    });

    for (const lessonId of reviewedLessonIds) {
      await evaluateLessonReview({ lessonId, rating: testRating, hardAyahNumbers: [] });
    }

    if (markVerseConnection) {
      await setDailyStage('verseConnection', true);
    }

    const shouldAdvance = testRating !== 'difficult';
    await advanceToNextStep(shouldAdvance);
  };

  const handleFinishEarly = async () => {
    isEndingSessionRef.current = true;
    setEndPhase('finished_early');
    if (currentPhase === 'memorize' && portionAyahs.length > 0) {
      const learnedCount = Math.max(1, Math.max(memOffset, highestLearnedOffset) + 1);
      const learnedSlice = portionAyahs.slice(0, learnedCount);
      const first = learnedSlice[0];
      const last = learnedSlice[learnedSlice.length - 1];
      if (first && last) {
        await saveLearningLesson({
          surahId: surah.id,
          startVerse: first.number,
          endVerse: last.number,
        });
      }
    }
    await finishSessionEarly();
  };

  const handleStartNextSession = () => {
    const nextSessionNum = getSurahActiveSessionNumber(state.surahSessions, surah.id);
    isEndingSessionRef.current = false;
    setDraftRestoredKey(`${surah.id}:${nextSessionNum}`);
    void saveSessionDraft(null);
    setSurahPlan(
      buildPreviousLessonPlan(
        state.lessons,
        surah.id,
        nextSessionNum,
        today,
        activeLearningLesson?.id,
      ),
    );
    setPlanSurahKey(`${surah.id}:${nextSessionNum}`);
    setReviseLessonIdx(0);
    setReviseAyahOffset(0);
    setReviseViewMode('partial');
    setReviewedLessonIds([]);
    setMemOffset(0);
    setHighestLearnedOffset(0);
    setVerseRepeatCount(0);
    setTestRevealed(false);
    setTestAudioOffset(0);
    setTestRating(null);
    setTestHardAyahs([]);
    setLinkAudioIdx(0);
    setLinkViewMode('revealed');
    setAcceptedTarget(null);
    setJustFinishedSurah(false);
    setCompletedRange(null);
    setStepIndex(0);
    setHighestStepIndex(0);
    setStepsKey('');
    setEndPhase('active');
  };

  const evalOptions: { id: SelfEvalRating; label: string; hint: string }[] = [
    { id: 'difficult', label: copy.evalDifficult, hint: copy.evalDifficultHint },
    { id: 'good', label: copy.evalGood, hint: copy.evalGoodHint },
    { id: 'easy', label: copy.evalEasy, hint: copy.evalEasyHint },
  ];

  const hasLinkStep = sessionSteps.some((s) => s.id === 'link');

  const lessonRatingCard = (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text
        style={[
          styles.stepSubBold,
          { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
        ]}
      >
        تقييم الدرس كاملاً:
      </Text>
      <View style={[styles.evalGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
        {evalOptions.map((item) => {
          const selected = testRating === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                setTestRating(item.id);
                if (item.id !== 'difficult') setTestHardAyahs([]);
              }}
              style={[
                styles.evalTile,
                {
                  borderColor: selected ? theme.primary : theme.border,
                  backgroundColor: selected ? theme.primary : theme.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.evalTitle,
                  { color: selected ? theme.primaryForeground : theme.foreground },
                ]}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  styles.evalSub,
                  { color: selected ? theme.primaryForeground : theme.mutedForeground },
                ]}
              >
                {item.hint}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {testRating === 'difficult' ? (
        <View
          style={[
            styles.hardBox,
            { backgroundColor: theme.secondary, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              styles.stepSubBold,
              { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
            ]}
          >
            أيّ الآيات كانت صعبة؟ (اختياري)
          </Text>
          <View style={[styles.badgesRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            {portionAyahs.map((a) => {
              const picked = testHardAyahs.includes(a.number);
              return (
                <Pressable
                  key={a.number}
                  onPress={() => toggleHardAyah(testHardAyahs, setTestHardAyahs, a.number)}
                  style={[
                    styles.hardChip,
                    {
                      borderColor: picked ? theme.accent : theme.border,
                      backgroundColor: picked ? theme.accent : theme.card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.hardChipText,
                      { color: picked ? theme.foreground : theme.mutedForeground },
                    ]}
                  >
                    الآية {toArabicDigits(a.number)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );

  const firstPortionNum = portionAyahs[0]?.number ?? portionStartAyah;
  const lastPortionNum = portionAyahs[portionAyahs.length - 1]?.number ?? portionStartAyah;

  return (
    <AppShell
      title={`${surah.nameAr} • جلسة ${toArabicDigits(activeSessionNum)}`}
      subtitle={`الآيات ${toArabicDigits(firstPortionNum)} - ${toArabicDigits(lastPortionNum)}`}
      hideBottomNav
    >
      <View style={styles.stack}>
        {/* Back to Memorize Dashboard + Active Learning Notice */}
        <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backPill,
              {
                flexDirection: isRtl ? 'row-reverse' : 'row',
                borderColor: theme.border,
                backgroundColor: theme.card,
              },
            ]}
          >
            <Ionicons name={backArrow} size={16} color={theme.foreground} />
            <Text style={[styles.backPillText, { color: theme.foreground }]}>
              العودة إلى الحفظ
            </Text>
          </Pressable>

          <MemorizeCornerActions />
        </View>

        {/* Session Progress Bar (2 steps on first session, up to 4 steps later) */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.progressTitle, { color: theme.foreground }]}>
              مسار الجلسة
            </Text>
            <Text style={[styles.progressCount, { color: theme.mutedForeground }]}>
              {endPhase === 'completed'
                ? 'اكتملت الجلسة ✓'
                : endPhase === 'finished_early'
                  ? 'حُفظ تقدّمك ✓'
                  : `الخطوة ${toArabicDigits(stepIndex + 1)} من ${toArabicDigits(sessionSteps.length)}`}
            </Text>
          </View>

          <View style={[styles.stepsGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            {sessionSteps.map((step, idx) => {
              const isCurrent = endPhase === 'active' && idx === stepIndex;
              const isDone =
                endPhase === 'completed' || (endPhase === 'active' && idx < highestStepIndex && !isCurrent);
              const isUnlocked = endPhase === 'active' && idx <= highestStepIndex;
              const canTap = isUnlocked && !isCurrent;
              return (
                <Pressable
                  key={step.id}
                  disabled={!canTap}
                  onPress={() => setStepIndex(idx)}
                  style={styles.stepCol}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canTap, selected: isCurrent }}
                >
                  <View
                    style={[
                      styles.stepBar,
                      {
                        backgroundColor: isCurrent
                          ? theme.accent
                          : isDone
                            ? theme.primary
                            : isUnlocked
                              ? `${theme.primary}66`
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
                          : isDone || isUnlocked
                            ? theme.primary
                            : theme.mutedForeground,
                        fontWeight: isCurrent ? '700' : '600',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {isDone ? `✓ ${step.label}` : step.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {endPhase === 'active' && (stepIndex > 0 || stepIndex < highestStepIndex) ? (
            <View style={[styles.stepNavRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              {stepIndex > 0 ? (
                <Pressable
                  onPress={() => setStepIndex((i) => Math.max(0, i - 1))}
                  style={[
                    styles.stepNavBtn,
                    {
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Ionicons name={backArrow} size={15} color={theme.foreground} />
                  <Text style={[styles.stepNavBtnText, { color: theme.foreground }]} numberOfLines={1}>
                    السابق: {sessionSteps[stepIndex - 1]?.label ?? ''}
                  </Text>
                </Pressable>
              ) : null}

              {stepIndex < highestStepIndex ? (
                <Pressable
                  onPress={() => setStepIndex((i) => Math.min(highestStepIndex, i + 1))}
                  style={[
                    styles.stepNavBtn,
                    {
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      borderColor: theme.primary,
                      backgroundColor: theme.secondary,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.stepNavBtnText, { color: theme.primary }]} numberOfLines={1}>
                    التالي: {sessionSteps[stepIndex + 1]?.label ?? ''}
                  </Text>
                  <Ionicons name={dirArrow} size={15} color={theme.primary} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* STEP 1: Revise (Active Surah Only, One Lesson at a Time) */}
        {currentPhase === 'revise' && activeReviseLesson ? (
          <View style={styles.stack}>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                  <Text style={[styles.stepHeading, { color: theme.foreground }]}>
                    المراجعة
                  </Text>
                  <Text style={[styles.stepSub, { color: theme.mutedForeground }]}>
                    {surah.nameAr} • الآيات {formatNum(activeReviseLesson.startVerse, language)} -{' '}
                    {formatNum(activeReviseLesson.endVerse, language)}
                    {surahPlan.allLessons.length > 1
                      ? ` • مقطع ${formatNum(reviseLessonIdx + 1, language)} من ${formatNum(surahPlan.allLessons.length, language)}`
                      : ''}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
                  <Text style={[styles.badgeText, { color: theme.primary }]}>
                    {getReviseSectionLabel(activeReviseLesson)}
                  </Text>
                </View>
              </View>

              <Animated.View
                style={[
                  styles.verseSurface,
                  {
                    backgroundColor: theme.secondary,
                    position: 'relative',
                    opacity: reviseFadeAnim,
                  },
                ]}
              >
                {loadingReviseText &&
                !reviseAyahTexts[`${activeReviseLesson.surahId}:${activeReviseLesson.startVerse}`] ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  activeLessonVerseNumbers.map((ayahNum, idx) => {
                    const key = `${activeReviseLesson.surahId}:${ayahNum}`;
                    const rawText = reviseAyahTexts[key] ?? '';
                    const isFullHidden =
                      reviseViewMode === 'hidden' ||
                      (reviseViewMode === 'partial' &&
                        activeReviseLesson.state !== 'strengthening');
                    const displayText = rawText
                      ? isFullHidden
                        ? rawText
                        : getReviseDisplayText(activeReviseLesson, rawText)
                      : 'جاري التحميل...';
                    return (
                      <Pressable
                        key={key}
                        disabled={isFullHidden}
                        onPress={() => setReviseAyahOffset(idx)}
                        style={[
                          styles.clickableVerse,
                          !isFullHidden && idx === reviseAyahOffset
                            ? { backgroundColor: `${theme.primary}1A` }
                            : null,
                        ]}
                      >
                        <View style={isFullHidden ? styles.hiddenTextMask : undefined}>
                          <QuranText ayahNumber={ayahNum}>
                            {displayText}
                          </QuranText>
                        </View>
                      </Pressable>
                    );
                  })
                )}

                {reviseViewMode === 'hidden' ||
                (reviseViewMode === 'partial' && activeReviseLesson.state !== 'strengthening') ? (
                  <View style={styles.hiddenOverlay} pointerEvents="none">
                    <View style={[styles.hiddenPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Ionicons name="eye-off-outline" size={20} color={theme.primary} />
                      <Text style={[styles.hiddenPillText, { color: theme.foreground }]}>
                        سمّع الدرس غيباً
                      </Text>
                    </View>
                  </View>
                ) : null}
              </Animated.View>

              {/* Smooth Spring-Animated Segmented Visibility Control */}
              <SegmentedControl
                options={
                  activeReviseLesson.state === 'strengthening'
                    ? ([
                        { id: 'partial', label: 'إخفاء جزئي', icon: 'sparkles-outline' },
                        { id: 'hidden', label: 'إخفاء كامل', icon: 'eye-off-outline' },
                        { id: 'revealed', label: 'إظهار', icon: 'eye-outline' },
                      ] as const)
                    : ([
                        { id: 'hidden', label: 'إخفاء كامل', icon: 'eye-off-outline' },
                        { id: 'revealed', label: 'إظهار', icon: 'eye-outline' },
                      ] as const)
                }
                value={
                  reviseViewMode === 'partial' && activeReviseLesson.state !== 'strengthening'
                    ? 'hidden'
                    : reviseViewMode
                }
                onChange={handleReviseModeChange}
              />
            </View>

            <AudioPlayerBar
              mode="reference"
              surahId={activeReviseLesson.surahId}
              surahName={surah.nameAr}
              ayahNumber={
                activeLessonVerseNumbers[
                  Math.min(reviseAyahOffset, Math.max(0, activeLessonVerseNumbers.length - 1))
                ] ?? activeReviseLesson.startVerse
              }
              onPrevAyah={
                reviseAyahOffset > 0 ? () => setReviseAyahOffset((i) => Math.max(0, i - 1)) : undefined
              }
              onNextAyah={
                reviseAyahOffset + 1 < activeLessonVerseNumbers.length
                  ? () => setReviseAyahOffset((i) => i + 1)
                  : undefined
              }
            />

            <Pressable
              disabled={submittingRevise}
              onPress={() => void handleSubmitReviseLesson()}
              style={[
                styles.primaryBtn,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  backgroundColor: theme.primary,
                  opacity: submittingRevise ? 0.55 : 1,
                },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                {reviseLessonIdx + 1 < surahPlan.allLessons.length
                  ? 'أتممت المراجعة • الدرس التالي'
                  : 'أتممت المراجعة • بدء الحفظ'}
              </Text>
              <Ionicons name={dirArrow} size={18} color={theme.primaryForeground} />
            </Pressable>
          </View>
        ) : null}

        {/* STEP 2: Memorize (Verse by Verse, no preference clutter) */}
        {currentPhase === 'memorize' ? (
          <View style={styles.stack}>
            {plannerSuggestion ? (
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.secondary, borderColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.stepSubBold,
                    { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                  ]}
                >
                  {plannerSuggestion.kind === 'lighter_portion'
                    ? `بعد انقطاع، هل تفضّل ورداً أخف اليوم (${toArabicDigits(plannerSuggestion.suggestedTarget)} آيات بدل ${toArabicDigits(plannerSuggestion.normalTarget)})؟`
                    : `لديك آيات تحتاج تثبيتاً، هل تخفف الورد اليوم إلى ${toArabicDigits(plannerSuggestion.suggestedTarget)} آيات؟`}
                </Text>
                <View style={[styles.evalGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  <Pressable
                    onPress={() => {
                      setAcceptedTarget(plannerSuggestion.suggestedTarget);
                      setMemOffset(0);
                    }}
                    style={[styles.compactBtn, { backgroundColor: theme.primary }]}
                  >
                    <Text style={[styles.compactBtnText, { color: theme.primaryForeground }]}>
                      نعم، ورد أخف
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setDismissedSuggestionId(plannerSuggestion.id)}
                    style={[
                      styles.compactBtn,
                      { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 },
                    ]}
                  >
                    <Text style={[styles.compactBtnText, { color: theme.foreground }]}>
                      إبقاء خطتي المعتادة
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <View
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                  <Text style={[styles.stepHeading, { color: theme.foreground }]}>
                    الحفظ
                  </Text>
                  <Text style={[styles.stepSub, { color: theme.mutedForeground }]}>
                    الآية {toArabicDigits(memOffset + 1)} من{' '}
                    {toArabicDigits(portionAyahs.length || 1)} في ورد اليوم
                  </Text>
                </View>

                <Pressable
                  onPress={handleManualRepeatTap}
                  style={[
                    styles.hideBtn,
                    {
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      borderColor: verseRepeatCount > 0 ? theme.primary : theme.border,
                      backgroundColor: verseRepeatCount > 0 ? theme.primary : theme.background,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="تدرّج إخفاء الآية"
                >
                  <Ionicons
                    name={
                      verseRepeatCount >= state.mandatoryRepeats
                        ? 'checkmark-circle'
                        : 'repeat-outline'
                    }
                    size={16}
                    color={verseRepeatCount > 0 ? theme.primaryForeground : theme.foreground}
                  />
                  <Text
                    style={[
                      styles.hideBtnText,
                      { color: verseRepeatCount > 0 ? theme.primaryForeground : theme.foreground },
                    ]}
                  >
                    تدرّج: {formatNum(verseRepeatCount, language)} /{' '}
                    {formatNum(state.mandatoryRepeats, language)}
                  </Text>
                </Pressable>
              </View>

              {surah.id !== 1 && surah.id !== 9 && activeMemAyah?.number === 1 ? (
                <QuranText
                  align="center"
                  fontSize={Math.max(18, state.quranFontSize - 4)}
                  color={theme.mutedForeground}
                >
                  بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
                </QuranText>
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
                    <QuranText align="center" ayahNumber={activeMemAyah.number}>
                      {maskVerseDynamic(activeMemAyah.textAr, {
                        repeatCount: verseRepeatCount,
                        targetRepeats: state.mandatoryRepeats,
                        ayahNumber: activeMemAyah.number,
                      })}
                    </QuranText>
                  </View>

                  {state.showTranslation ? (
                    <View style={[styles.tafsirBody, { backgroundColor: theme.muted }]}>
                      <Text style={[styles.transText, { color: theme.foreground }]}>
                        {tafsirMap[activeMemAyah.number] ??
                          (loadingTafsir
                            ? 'جاري تحميل التفسير الميسّر...'
                            : 'التفسير الميسّر غير متوفر حالياً دون اتصال.')}
                      </Text>
                    </View>
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
                      التفسير الميسّر للآية
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
                        {tafsirMap[activeMemAyah.number] ??
                          (loadingTafsir
                            ? 'جاري تحميل التفسير الميسّر...'
                            : 'التفسير الميسّر غير متوفر حالياً دون اتصال.')}
                      </Text>
                    </View>
                  ) : null}

                  <View style={[styles.evalGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <Pressable
                      disabled={memOffset === 0}
                      onPress={handleMemPrevAyah}
                      style={[
                        styles.compactBtn,
                        {
                          borderWidth: 1,
                          borderColor: theme.border,
                          backgroundColor: theme.background,
                          opacity: memOffset === 0 ? 0.4 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.compactBtnText, { color: theme.foreground }]}>
                        الآية السابقة
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={memOffset + 1 >= portionAyahs.length}
                      onPress={() => void handleMemNextAyah()}
                      style={[
                        styles.compactBtn,
                        {
                          borderWidth: 1,
                          borderColor: theme.border,
                          backgroundColor: theme.background,
                          opacity: memOffset + 1 >= portionAyahs.length ? 0.4 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.compactBtnText, { color: theme.foreground }]}>
                        الآية التالية
                      </Text>
                    </Pressable>
                  </View>
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
              externalRepeatCount={verseRepeatCount}
              onRepeatProgress={() => {
                setVerseRepeatCount((prev) => advanceRepeatCount(prev, state.mandatoryRepeats));
              }}
            />

            <Pressable
              disabled={!activeMemAyah || highestLearnedOffset + 1 < portionAyahs.length}
              onPress={() => void handleReadyToTest()}
              style={[
                styles.primaryBtn,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  backgroundColor: theme.primary,
                  opacity:
                    activeMemAyah && highestLearnedOffset + 1 >= portionAyahs.length ? 1 : 0.45,
                },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.primaryForeground} />
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                {highestLearnedOffset + 1 >= portionAyahs.length
                  ? 'أنا جاهز للتسميع'
                  : 'أكمل المرور على جميع الآيات أولاً'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* STEP 3: Test New Portion Together */}
        {currentPhase === 'test' && portionAyahs.length > 0 ? (
          <View style={styles.stack}>
            <View
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.stepHeading, { color: theme.foreground }]}>
                  التسميع
                </Text>
                <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
                  <Text style={[styles.badgeText, { color: theme.primary }]}>
                    الآيات {toArabicDigits(portionAyahs[0]?.number ?? 1)} -{' '}
                    {toArabicDigits(portionAyahs[portionAyahs.length - 1]?.number ?? 1)}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.dashedBox,
                  { borderColor: theme.border, backgroundColor: theme.secondary },
                ]}
              >
                {testRevealed ? (
                  <View style={styles.versesStack}>
                    {portionAyahs.map((a, idx) => (
                      <Pressable
                        key={a.number}
                        onPress={() => setTestAudioOffset(idx)}
                        style={[
                          styles.clickableVerse,
                          idx === safeTestAudioIdx ? { backgroundColor: `${theme.primary}1A` } : null,
                        ]}
                      >
                        <QuranText ayahNumber={a.number}>
                          {a.textAr}
                        </QuranText>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <View style={styles.loadingBox}>
                    <Ionicons name="eye-off-outline" size={28} color={theme.mutedForeground} />
                    <Text style={[styles.hiddenHint, { color: theme.mutedForeground }]}>
                      [ نص الورد محجوب للتسميع معاً ]
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

            {activeTestAudioAyah ? (
              <AudioPlayerBar
                mode="reference"
                surahId={surah.id}
                surahName={surah.nameAr}
                ayahNumber={activeTestAudioAyah.number}
                onPrevAyah={
                  safeTestAudioIdx > 0
                    ? () => setTestAudioOffset((i) => Math.max(0, i - 1))
                    : undefined
                }
                onNextAyah={
                  safeTestAudioIdx + 1 < portionAyahs.length
                    ? () => setTestAudioOffset((i) => i + 1)
                    : undefined
                }
              />
            ) : null}

            {!hasLinkStep ? lessonRatingCard : null}

            {hasLinkStep ? (
              <Pressable
                onPress={() => void advanceToNextStep()}
                style={[
                  styles.primaryBtn,
                  {
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                  أتممت التسميع • الانتقال للربط
                </Text>
                <Ionicons name={dirArrow} size={18} color={theme.primaryForeground} />
              </Pressable>
            ) : (
              <Pressable
                disabled={!testRating}
                onPress={() => void submitFinalLessonRating(false)}
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
                  تثبيت التقييم وإنهاء الجلسة
                </Text>
                <Ionicons name={dirArrow} size={18} color={theme.primaryForeground} />
              </Pressable>
            )}
          </View>
        ) : null}

        {/* STEP 4: Link */}
        {currentPhase === 'link' ? (
          <View style={styles.stack}>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.stepHeading, { color: theme.foreground }]}>
                  ربط الآيات
                </Text>
                <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
                  <Text style={[styles.badgeText, { color: theme.primary }]}>
                    {linkAnchor.oldVerseCount > 0
                      ? `آخر ${formatNum(linkAnchor.oldVerseCount, language)} آيات + ورد اليوم`
                      : 'ورد اليوم'}
                  </Text>
                </View>
              </View>

              <Animated.View
                style={[
                  styles.verseSurface,
                  {
                    backgroundColor: theme.secondary,
                    position: 'relative',
                    opacity: linkFadeAnim,
                  },
                ]}
              >
                {linkAnchor.ayahs.map((a, idx) => {
                  const isLinkHidden = linkViewMode === 'hidden';
                  const showAnchorDivider =
                    linkAnchor.oldVerseCount > 0 && idx === linkAnchor.oldVerseCount;
                  return (
                    <View key={a.number}>
                      {showAnchorDivider ? (
                        <View
                          style={[
                            styles.rowBetween,
                            {
                              flexDirection: isRtl ? 'row-reverse' : 'row',
                              paddingVertical: 6,
                              marginVertical: 4,
                              borderTopWidth: 1,
                              borderTopColor: `${theme.primary}30`,
                            },
                            isLinkHidden ? styles.hiddenTextMask : null,
                          ]}
                        >
                          <Text style={[styles.stepSub, { color: theme.primary }]}>
                            ورد اليوم
                          </Text>
                        </View>
                      ) : null}
                      <Pressable
                        disabled={isLinkHidden}
                        onPress={() => setLinkAudioIdx(idx)}
                        style={[
                          styles.clickableVerse,
                          !isLinkHidden && idx === linkAudioIdx
                            ? { backgroundColor: `${theme.primary}1A` }
                            : null,
                        ]}
                      >
                        <View style={isLinkHidden ? styles.hiddenTextMask : undefined}>
                          <QuranText ayahNumber={a.number}>
                            {a.textAr}
                          </QuranText>
                        </View>
                      </Pressable>
                    </View>
                  );
                })}

                {linkViewMode === 'hidden' ? (
                  <View style={styles.hiddenOverlay} pointerEvents="none">
                    <View
                      style={[
                        styles.hiddenPill,
                        { backgroundColor: theme.card, borderColor: theme.border },
                      ]}
                    >
                      <Ionicons name="eye-off-outline" size={20} color={theme.primary} />
                      <Text style={[styles.hiddenPillText, { color: theme.foreground }]}>
                        سمّع المقطع متصلاً غيباً
                      </Text>
                    </View>
                  </View>
                ) : null}
              </Animated.View>

              <SegmentedControl
                options={
                  [
                    { id: 'hidden', label: 'إخفاء كامل', icon: 'eye-off-outline' },
                    { id: 'revealed', label: 'إظهار', icon: 'eye-outline' },
                  ] as const
                }
                value={linkViewMode}
                onChange={handleLinkModeChange}
              />
            </View>

            {linkAnchor.ayahs.length > 0 ? (
              <AudioPlayerBar
                mode="reference"
                surahId={surah.id}
                surahName={getSurahDisplayName(surah, language)}
                ayahNumber={
                  linkAnchor.ayahs[Math.min(linkAudioIdx, linkAnchor.ayahs.length - 1)]?.number ?? 1
                }
                onPrevAyah={
                  linkAudioIdx > 0 ? () => setLinkAudioIdx((i) => Math.max(0, i - 1)) : undefined
                }
                onNextAyah={
                  linkAudioIdx + 1 < linkAnchor.ayahs.length
                    ? () => setLinkAudioIdx((i) => i + 1)
                    : undefined
                }
              />
            ) : null}

            {lessonRatingCard}

            <Pressable
              disabled={!testRating}
              onPress={() => void submitFinalLessonRating(true)}
              style={[
                styles.primaryBtn,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  backgroundColor: theme.primary,
                  opacity: testRating ? 1 : 0.45,
                },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.primaryForeground} />
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                تثبيت التقييم وإنهاء الجلسة
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Finish Early */}
        {endPhase === 'active' ? (
          <Pressable
            onPress={() => void handleFinishEarly()}
            style={[
              styles.outlineBtn,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
          >
            <Ionicons name="pause-circle-outline" size={16} color={theme.mutedForeground} />
            <Text style={[styles.outlineBtnText, { color: theme.mutedForeground }]}>
              إنهاء الجلسة الآن وحفظ ما أتممته
            </Text>
          </Pressable>
        ) : null}

        {/* SESSION COMPLETE OR FINISHED EARLY */}
        {endPhase !== 'active' ? (() => {
          const { memorizedCount: memorizedInSurah, percent: surahPct } = computeSurahProgress({
            surahId: surah.id,
            totalAyahs: surah.totalAyahs,
            verseRecords: state.verseRecords,
            lessons: state.lessons,
          });
          const latestSurahLesson = [...state.lessons]
            .filter((l) => l.surahId === surah.id)
            .sort(
              (a, b) =>
                b.lastReviewedSession - a.lastReviewedSession ||
                b.endVerse - a.endVerse,
            )[0];
          const lessonStateLabel =
            latestSurahLesson?.state === 'done'
              ? 'متقن'
              : latestSurahLesson?.state === 'strengthening'
                ? 'تثبيت'
                : 'قيد التعلّم';

          return (
            <View style={styles.stack}>
              {/* Editorial Hero Summary */}
              <View style={[styles.doneHeroCard, { backgroundColor: theme.heroBg }]}>
                <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row', width: '100%' }]}>
                  <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                    <Text style={styles.doneHeroPillText}>
                      {endPhase === 'finished_early' ? 'توقّف مؤقت' : 'جلسة مكتملة'}
                    </Text>
                  </View>
                  <View style={styles.doneGlassPill}>
                    <Text style={styles.doneGlassText}>
                      {surah.nameAr} • جلسة {formatNum(Math.max(1, state.surahSessions[surah.id] ?? activeSessionNum), language)}
                    </Text>
                  </View>
                </View>

                <View style={styles.doneMedal}>
                  <Ionicons
                    name={endPhase === 'finished_early' ? 'bookmark' : 'checkmark-done'}
                    size={30}
                    color={theme.isDark ? theme.accentForeground : '#073d35'}
                  />
                </View>

                <Text style={styles.doneHeroTitle}>
                  {endPhase === 'finished_early'
                    ? 'بارك الله فيك، حُفظ تقدّمك'
                    : language === 'en'
                      ? 'Well done, keep going'
                      : language === 'fr'
                        ? 'Bravo, continuez ainsi'
                        : 'أحسنت، واصل'}
                </Text>
                <Text style={styles.doneHeroSub}>
                  {endPhase === 'finished_early'
                    ? 'تم حفظ ما أتممته اليوم. يمكنك المتابعة في أي وقت.'
                    : justFinishedSurah
                      ? `أتممت بفضل الله ${surah.nameAr}. اختر السورة التالية للبدء بها.`
                      : `الآيات ${formatNum(completedRange?.start ?? firstPortionNum, language)} - ${formatNum(completedRange?.end ?? lastPortionNum, language)} من ${surah.nameAr}`}
                </Text>

                {/* Surah Progress Bar */}
                <View style={styles.doneProgressWrap}>
                  <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <Text style={styles.doneProgressLbl}>
                      تقدّم {surah.nameAr}: {formatNum(memorizedInSurah, language)} / {formatNum(surah.totalAyahs, language)}
                    </Text>
                    <Text style={[styles.doneProgressPct, { color: theme.accent }]}>
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
              </View>

              {/* Session Metrics & Completed Steps */}
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.doneStatsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.doneStatBox, { backgroundColor: theme.secondary }]}>
                    <Text style={[styles.doneStatVal, { color: theme.primary }]}>
                      {formatNum(completedRange?.count ?? portionAyahs.length, language)}
                    </Text>
                    <Text style={[styles.doneStatLbl, { color: theme.mutedForeground }]}>آيات الورد</Text>
                  </View>
                  <View style={[styles.doneStatBox, { backgroundColor: theme.secondary }]}>
                    <Text style={[styles.doneStatVal, { color: theme.primary }]}>
                      {lessonStateLabel}
                    </Text>
                    <Text style={[styles.doneStatLbl, { color: theme.mutedForeground }]}>حالة الدرس</Text>
                  </View>
                  <View style={[styles.doneStatBox, { backgroundColor: theme.secondary }]}>
                    <Text style={[styles.doneStatVal, { color: theme.primary }]}>
                      {formatNum(currentAyah, language)}
                    </Text>
                    <Text style={[styles.doneStatLbl, { color: theme.mutedForeground }]}>الموضع القادم</Text>
                  </View>
                </View>

                <View style={[styles.badgesRow, { flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'center' }]}>
                  {sessionSteps.map((s, idx) => {
                    const completed = endPhase === 'completed' || idx < stepIndex;
                    return (
                      <View
                        key={s.id}
                        style={[
                          styles.badge,
                          {
                            backgroundColor: completed ? theme.secondary : theme.muted,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: completed ? theme.primary : theme.mutedForeground },
                          ]}
                        >
                          {completed ? `✓ ${s.label}` : s.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {justFinishedSurah && endPhase === 'completed' ? (
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
                      label: `${formatNum(s.id, language)}. ${getSurahDisplayName(s, language)}`,
                      description: `${formatNum(s.totalAyahs, language)} ${copy.versesUnit}`,
                      keywords: `${s.nameEn} ${s.nameFr} ${s.nameAr}`,
                    }))}
                  />
                </View>
              ) : null}

              {/* Actions */}
              <View style={styles.doneActions}>
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
                    {endPhase === 'finished_early' ? 'استئناف الجلسة' : 'بدء الجلسة التالية الآن'}
                  </Text>
                  <Ionicons name={dirArrow} size={18} color={theme.primaryForeground} />
                </Pressable>

                <Pressable
                  onPress={() => router.replace('/memorize')}
                  style={[
                    styles.outlineBtn,
                    {
                      width: '100%',
                      borderColor: theme.border,
                      backgroundColor: theme.card,
                    },
                  ]}
                >
                  <Ionicons name="book-outline" size={16} color={theme.foreground} />
                  <Text style={[styles.outlineBtnText, { color: theme.foreground }]}>
                    العودة إلى لوحة الحفظ
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })() : null}
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
  rowBetween: { alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  backPill: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    gap: 6,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  backPillText: { fontSize: 12, fontWeight: '700' },
  badgesRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  badge: { borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  progressTitle: { fontSize: 13, fontWeight: '700' },
  progressCount: { fontSize: 12 },
  stepsGrid: { gap: 6 },
  stepCol: { flex: 1, alignItems: 'center', gap: 4 },
  stepBar: { width: '100%', height: 6, borderRadius: 3 },
  stepLbl: { fontSize: 10, textAlign: 'center' },
  stepNavRow: { gap: 8, marginTop: 4 },
  stepNavBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stepNavBtnText: { fontSize: 12, fontWeight: '700' },
  stepHeading: { fontSize: 17, fontWeight: '700' },
  stepSub: { fontSize: 12, marginTop: 2 },
  stepSubBold: { fontSize: 13, fontWeight: '700' },
  verseSurface: { borderRadius: RADII.control, padding: SPACING.lg, gap: 10 },
  versesStack: { gap: 10, width: '100%' },
  clickableVerse: { borderRadius: RADII.control, padding: 8 },
  quranText: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 46 },
  quranTextCenter: { textAlign: 'center', writingDirection: 'rtl', lineHeight: 48 },
  basmalah: { textAlign: 'center', fontSize: 18, paddingVertical: 4 },
  hiddenHint: { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  hiddenTextMask: { opacity: 0 },
  hiddenOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  hiddenPillText: { fontSize: 13, fontWeight: '700' },
  segmentedWrap: {
    borderRadius: RADII.control,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentedItem: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control - 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  segmentedText: { fontSize: 12, fontWeight: '700' },
  loadingBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  outlineBtn: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  outlineBtnText: { fontSize: 13, fontWeight: '600' },
  evalGrid: { flexDirection: 'row-reverse', gap: 8 },
  evalTile: {
    flex: 1,
    minHeight: 56,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  evalTitle: { fontSize: 13, fontWeight: '700' },
  evalSub: { fontSize: 10, marginTop: 2 },
  hardBox: {
    borderRadius: RADII.control,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  hardChip: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  hardChipText: { fontSize: 12, fontWeight: '600' },
  compactBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  compactBtnText: { fontSize: 13, fontWeight: '700' },
  primaryBtn: {
    minHeight: 52,
    borderRadius: RADII.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700' },
  hideBtn: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  hideBtnText: { fontSize: 12, fontWeight: '600' },
  transText: { fontSize: 14, lineHeight: 22 },
  tafsirToggle: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tafsirToggleText: { fontSize: 13, fontWeight: '600' },
  tafsirBody: { borderRadius: RADII.control, padding: 12 },
  tipBox: {
    borderRadius: RADII.card,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 10,
  },
  tipText: { flex: 1, fontSize: 12, lineHeight: 19 },
  promptText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  dashedBox: {
    minHeight: 150,
    borderRadius: RADII.control,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneHeroCard: {
    borderRadius: RADII.hero,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: 12,
  },
  doneHeroPillText: { fontSize: 11, fontWeight: '700', color: '#073d35' },
  doneGlassPill: {
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  doneGlassText: { fontSize: 11, fontWeight: '600', color: '#ffffff' },
  doneMedal: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f7f5ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  doneHeroTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff', textAlign: 'center' },
  doneHeroSub: { fontSize: 13, color: 'rgba(255,255,255,0.88)', textAlign: 'center', lineHeight: 20 },
  doneProgressWrap: { width: '100%', gap: 6, marginTop: 4 },
  doneProgressLbl: { fontSize: 12, color: 'rgba(255,255,255,0.86)' },
  doneProgressPct: { fontSize: 12, fontWeight: '700' },
  doneTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  doneFill: { height: '100%', borderRadius: 4 },
  doneStatsRow: { gap: 8 },
  doneStatBox: {
    flex: 1,
    borderRadius: RADII.control,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  doneStatVal: { fontSize: 16, fontWeight: '700' },
  doneStatLbl: { fontSize: 11, textAlign: 'center' },
  doneActions: { gap: 10 },
});
