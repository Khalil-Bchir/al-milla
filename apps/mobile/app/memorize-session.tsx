import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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
import { animateLayout } from '../src/theme/motion';
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
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [showFirstTimeTip, setShowFirstTimeTip] = useState(true);

  // Step 4 (Link) state
  const [linkAudioIdx, setLinkAudioIdx] = useState(0);
  const [linkViewMode, setLinkViewMode] = useState<'hidden' | 'revealed'>('revealed');
  const linkFadeAnim = useRef(new Animated.Value(1)).current;

  // Session progression
  const [stepIndex, setStepIndex] = useState(0);
  const [highestStepIndex, setHighestStepIndex] = useState(0);
  const [endPhase, setEndPhase] = useState<'active' | 'completed'>('active');
  const [justFinishedSurah, setJustFinishedSurah] = useState(false);
  const [nextSurahId, setNextSurahId] = useState<number | null>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [completionOverlayActive, setCompletionOverlayActive] = useState(false);
  const heroCardRef = useRef<React.ComponentRef<typeof View> | null>(null);
  const heroTargetRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const overlayTop = useRef(new Animated.Value(0)).current;
  const overlayLeft = useRef(new Animated.Value(0)).current;
  const overlayWidth = useRef(new Animated.Value(screenWidth)).current;
  const overlayHeight = useRef(new Animated.Value(screenHeight)).current;
  const overlayRadius = useRef(new Animated.Value(0)).current;
  const overlayContentOpacity = useRef(new Animated.Value(1)).current;
  const doneMedalScale = useRef(new Animated.Value(0.3)).current;
  const doneRingScale = useRef(new Animated.Value(0.85)).current;
  const doneRingOpacity = useRef(new Animated.Value(0)).current;
  const doneRestOpacity = useRef(new Animated.Value(0)).current;
  const doneRestY = useRef(new Animated.Value(20)).current;
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        reduceMotionRef.current = enabled;
      })
      .catch(() => {
        reduceMotionRef.current = false;
      });
  }, []);

  useEffect(() => {
    if (endPhase !== 'completed') {
      setCompletionOverlayActive(false);
      heroTargetRectRef.current = null;
      return undefined;
    }

    if (reduceMotionRef.current) {
      setCompletionOverlayActive(false);
      doneMedalScale.setValue(1);
      doneRingOpacity.setValue(0);
      doneRestOpacity.setValue(1);
      doneRestY.setValue(0);
      return undefined;
    }

    setCompletionOverlayActive(true);
    overlayTop.setValue(0);
    overlayLeft.setValue(0);
    overlayWidth.setValue(screenWidth);
    overlayHeight.setValue(screenHeight);
    overlayRadius.setValue(0);
    overlayContentOpacity.setValue(1);
    doneMedalScale.setValue(0.3);
    doneRingScale.setValue(0.85);
    doneRingOpacity.setValue(0.65);
    doneRestOpacity.setValue(0);
    doneRestY.setValue(20);

    let cancelled = false;

    const medalAnim = Animated.parallel([
      Animated.spring(doneMedalScale, {
        toValue: 1,
        friction: 6,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.timing(doneRingScale, {
        toValue: 1.75,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(doneRingOpacity, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    const runZoomOut = () => {
      if (cancelled) return;
      const rect = heroTargetRectRef.current;
      if (!rect || rect.w <= 0 || rect.h <= 0) {
        doneRestOpacity.setValue(1);
        doneRestY.setValue(0);
        setCompletionOverlayActive(false);
        return;
      }

      Animated.parallel([
        Animated.timing(overlayTop, {
          toValue: rect.y,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(overlayLeft, {
          toValue: rect.x,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(overlayWidth, {
          toValue: rect.w,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(overlayHeight, {
          toValue: rect.h,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(overlayRadius, {
          toValue: RADII.hero,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(overlayContentOpacity, {
          toValue: 0,
          duration: 180,
          delay: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(doneRestOpacity, {
          toValue: 1,
          duration: 260,
          delay: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(doneRestY, {
          toValue: 0,
          duration: 280,
          delay: 90,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!cancelled) {
          setCompletionOverlayActive(false);
        }
      });
    };

    medalAnim.start(() => {
      if (cancelled) return;
      if (heroTargetRectRef.current) {
        runZoomOut();
      } else if (heroCardRef.current) {
        heroCardRef.current.measureInWindow((x, y, w, h) => {
          if (w > 0 && h > 0) {
            heroTargetRectRef.current = { x, y, w, h };
          }
          runZoomOut();
        });
      } else {
        runZoomOut();
      }
    });

    const safetyTimer = setTimeout(() => {
      if (!cancelled) {
        doneRestOpacity.setValue(1);
        doneRestY.setValue(0);
        setCompletionOverlayActive(false);
      }
    }, 1200);

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      medalAnim.stop();
    };
  }, [
    endPhase,
    screenWidth,
    screenHeight,
    overlayTop,
    overlayLeft,
    overlayWidth,
    overlayHeight,
    overlayRadius,
    overlayContentOpacity,
    doneMedalScale,
    doneRingScale,
    doneRingOpacity,
    doneRestOpacity,
    doneRestY,
  ]);
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

  const linkAnchor = useMemo(() => {
    const computed = computeLinkAnchorRange({
      ayahs,
      startIdx,
      portionCount: portionAyahs.length,
      verseRecords: state?.verseRecords ?? {},
      lessons: state?.lessons ?? [],
      surahId: surah.id,
      maxOldVerses: 5,
    });
    if (computed.hasOldVerses || surahPlan.allLessons.length === 0 || startIdx <= 0) {
      return computed;
    }
    const fallbackOldStart = Math.max(0, startIdx - 5);
    const fallbackOldCount = startIdx - fallbackOldStart;
    const fallbackEnd = startIdx + Math.max(1, portionAyahs.length);
    return {
      ayahs: ayahs.slice(fallbackOldStart, fallbackEnd),
      hasOldVerses: fallbackOldCount > 0,
      oldVerseCount: fallbackOldCount,
    };
  }, [
    ayahs,
    startIdx,
    portionAyahs.length,
    state?.verseRecords,
    state?.lessons,
    surah.id,
    surahPlan.allLessons.length,
  ]);

  const liveSessionSteps = useMemo<GuidedStepDef[]>(() => {
    const steps: GuidedStepDef[] = [];
    if (surahPlan.allLessons.length > 0) {
      steps.push({ id: 'revise', label: 'المراجعة' });
    }
    steps.push({ id: 'memorize', label: 'الحفظ' }, { id: 'test', label: 'التسميع' });
    if (linkAnchor.hasOldVerses) {
      steps.push({ id: 'link', label: 'الربط' });
    }
    return steps;
  }, [surahPlan.allLessons.length, linkAnchor.hasOldVerses]);

  const lockedStepsRef = useRef<GuidedStepDef[] | null>(null);
  if (stepIndex === 0 || endPhase !== 'active') {
    lockedStepsRef.current = null;
  } else if (!lockedStepsRef.current) {
    lockedStepsRef.current = liveSessionSteps;
  }
  const sessionSteps =
    stepIndex > 0 && endPhase === 'active' && lockedStepsRef.current
      ? lockedStepsRef.current
      : liveSessionSteps;

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
      return 'الدرس السابق';
    }
    return 'دروس سابقة';
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
    const hasNextInSurah = last < surah.totalAyahs;
    if (advanceCursor) {
      setJustFinishedSurah(!hasNextInSurah);
    }
    const nextCursor =
      advanceCursor && hasNextInSurah
        ? { surahId: surah.id, ayahNumber: last + 1 }
        : undefined;
    await completeSession(
      portionAyahs.map((a) => `${surah.id}:${a.number}`),
      nextCursor,
    );
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
      animateLayout();
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
    animateLayout();
    setVerseRepeatCount(0);
    setShowTafsirBox(false);
    setMemOffset((o) => Math.max(0, o - 1));
  };

  const handleMemNextAyah = async () => {
    if (!activeMemAyah) return;
    await setVerseStatus(surah.id, activeMemAyah.number, 'in_progress');
    animateLayout();
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
    if (!testRating || portionAyahs.length === 0 || submittingRating) return;
    const first = portionAyahs[0];
    const last = portionAyahs[portionAyahs.length - 1];
    if (!first || !last) return;

    setSubmittingRating(true);
    try {
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

      setRatingModalVisible(false);
      const shouldAdvance = testRating !== 'difficult';
      await advanceToNextStep(shouldAdvance);
    } finally {
      setSubmittingRating(false);
    }
  };

  const executePauseAndExit = async () => {
    if (isPausing) return;
    setIsPausing(true);
    try {
      isEndingSessionRef.current = true;
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
      setPauseModalVisible(false);
      router.replace('/memorize');
    } finally {
      setIsPausing(false);
    }
  };

  const handleFinishEarly = () => {
    setPauseModalVisible(true);
  };

  useEffect(() => {
    if (endPhase !== 'active') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleFinishEarly();
      return true;
    });
    return () => sub.remove();
  });

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
    setNextSurahId(null);
    setCompletedRange(null);
    setStepIndex(0);
    setHighestStepIndex(0);
    lockedStepsRef.current = null;
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
                animateLayout();
                setTestRating(item.id);
                if (item.id !== 'difficult') setTestHardAyahs([]);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
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
    <View style={{ flex: 1 }}>
      <AppShell
        title={`${surah.nameAr} • الدرس ${toArabicDigits(activeSessionNum)}`}
        subtitle={`الآيات ${toArabicDigits(firstPortionNum)} - ${toArabicDigits(lastPortionNum)}`}
        hideBottomNav
      >
      <View style={styles.stack}>
        {endPhase === 'active' ? (
          <>
            {/* Back to Memorize Dashboard + Active Learning Notice */}
            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Pressable
                onPress={handleFinishEarly}
                accessibilityRole="button"
                accessibilityLabel="العودة إلى الحفظ"
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
                  مراحل الدرس
                </Text>
                <Text style={[styles.progressCount, { color: theme.mutedForeground }]}>
                  {`الخطوة ${toArabicDigits(stepIndex + 1)} من ${toArabicDigits(sessionSteps.length)}`}
                </Text>
              </View>

              <View style={[styles.stepsGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                {sessionSteps.map((step, idx) => {
                  const isCurrent = idx === stepIndex;
                  const isDone = idx < highestStepIndex && !isCurrent;
                  const isUnlocked = idx <= highestStepIndex;
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

              {stepIndex > 0 || stepIndex < highestStepIndex ? (
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
          </>
        ) : null}

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
                    <View style={styles.hiddenPill}>
                      <Ionicons name="eye-off-outline" size={24} color={theme.mutedForeground} />
                      <Text style={[styles.hiddenPillText, { color: theme.mutedForeground }]}>
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
                    : `لديك آيات تحتاج تثبيتاً، هل تخفف الدرس اليوم إلى ${toArabicDigits(plannerSuggestion.suggestedTarget)} آيات؟`}
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
                <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                  <Text style={[styles.stepHeading, { color: theme.foreground }]}>
                    الحفظ
                  </Text>
                  <Text style={[styles.stepSub, { color: theme.mutedForeground }]}>
                    الآية {toArabicDigits(memOffset + 1)} من{' '}
                    {toArabicDigits(portionAyahs.length || 1)} • استمع أو كرّر{' '}
                    {formatNum(state.mandatoryRepeats, language)} مرات لتختفي الكلمات تدريجياً
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
                  accessibilityLabel="تكرار الآية وإخفاء الكلمات تدريجياً"
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
                    التكرار: {formatNum(verseRepeatCount, language)} /{' '}
                    {formatNum(state.mandatoryRepeats, language)}
                  </Text>
                </Pressable>
              </View>

              {activeSessionNum === 1 && memOffset === 0 && showFirstTimeTip ? (
                <View
                  style={[
                    styles.tipBanner,
                    {
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      backgroundColor: theme.secondary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Ionicons name="bulb-outline" size={18} color={theme.primary} />
                  <Text
                    style={[
                      styles.tipBannerText,
                      { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                    ]}
                  >
                    اضغط تشغيل للاستماع والتكرار التلقائي، أو انقر على زر التكرار بعد كل قراءة.
                  </Text>
                  <Pressable
                    onPress={() => {
                      animateLayout();
                      setShowFirstTimeTip(false);
                    }}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="إخفاء التلميح"
                  >
                    <Ionicons name="close" size={16} color={theme.mutedForeground} />
                  </Pressable>
                </View>
              ) : null}

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

            {activeMemAyah ? (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Pressable
                  onPress={() => {
                    animateLayout();
                    setShowTafsirBox((v) => !v);
                  }}
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
              </View>
            ) : null}

            <View style={[styles.evalGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              {memOffset > 0 ? (
                <Pressable
                  onPress={handleMemPrevAyah}
                  style={[
                    styles.outlineBtn,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.card,
                      paddingHorizontal: 16,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="الآية السابقة"
                >
                  <Text style={[styles.outlineBtnText, { color: theme.foreground }]}>
                    الآية السابقة
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                disabled={!activeMemAyah}
                onPress={() => {
                  if (memOffset + 1 < portionAyahs.length) {
                    void handleMemNextAyah();
                  } else {
                    void handleReadyToTest();
                  }
                }}
                style={[
                  styles.primaryBtn,
                  {
                    flex: 1,
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    backgroundColor: theme.primary,
                    opacity: activeMemAyah ? 1 : 0.45,
                  },
                ]}
                accessibilityRole="button"
              >
                <Ionicons
                  name={
                    memOffset + 1 < portionAyahs.length
                      ? dirArrow
                      : 'checkmark-circle-outline'
                  }
                  size={20}
                  color={theme.primaryForeground}
                />
                <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                  {memOffset + 1 < portionAyahs.length
                    ? `الآية التالية (${toArabicDigits(memOffset + 2)} من ${toArabicDigits(portionAyahs.length)})`
                    : 'أنا جاهز للتسميع'}
                </Text>
              </Pressable>
            </View>
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
                      الآيات مخفية — سمّعها غيباً ثم اكشفها للتحقق
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={() => {
                  animateLayout();
                  setTestRevealed((v) => !v);
                }}
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
                onPress={() => setRatingModalVisible(true)}
                style={[
                  styles.primaryBtn,
                  {
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                  تقييم وإتمام الدرس
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
                      ? `آخر ${formatNum(linkAnchor.oldVerseCount, language)} آيات + درس اليوم`
                      : 'درس اليوم'}
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
                            درس اليوم
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
                    <View style={styles.hiddenPill}>
                      <Ionicons name="eye-off-outline" size={24} color={theme.mutedForeground} />
                      <Text style={[styles.hiddenPillText, { color: theme.mutedForeground }]}>
                        سمّع الدرس متصلاً غيباً
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

            <Pressable
              onPress={() => setRatingModalVisible(true)}
              style={[
                styles.primaryBtn,
                {
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.primaryForeground} />
              <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                تقييم وإتمام الدرس
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Finish Early */}
        {endPhase === 'active' ? (
          <Pressable
            onPress={handleFinishEarly}
            style={[
              styles.outlineBtn,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
          >
            <Ionicons name="pause-circle-outline" size={16} color={theme.mutedForeground} />
            <Text style={[styles.outlineBtnText, { color: theme.mutedForeground }]}>
              حفظ التقدّم والخروج مؤقتاً
            </Text>
          </Pressable>
        ) : null}

        {/* SESSION COMPLETE */}
        {endPhase === 'completed' ? (() => {
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
              ? 'حفظ قوي'
              : latestSurahLesson?.state === 'strengthening'
                ? 'تثبيت'
                : 'قيد الحفظ';

          return (
            <View style={[styles.stack, { paddingTop: SPACING.sm }]}>
              {/* Editorial Hero Summary */}
              <View
                ref={heroCardRef}
                onLayout={() => {
                  heroCardRef.current?.measureInWindow((x, y, w, h) => {
                    if (w > 0 && h > 0) {
                      heroTargetRectRef.current = { x, y, w, h };
                    }
                  });
                }}
                style={[
                  styles.doneHeroCard,
                  {
                    backgroundColor: theme.heroBg,
                    paddingVertical: SPACING.xl,
                    borderWidth: 1,
                    borderColor: theme.isDark ? theme.border : 'rgba(255,255,255,0.08)',
                    opacity: completionOverlayActive ? 0 : 1,
                  },
                ]}
              >
                <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row', width: '100%' }]}>
                  <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                    <Text style={styles.doneHeroPillText}>
                      درس مكتمل
                    </Text>
                  </View>
                  <View style={styles.doneGlassPill}>
                    <Text style={styles.doneGlassText}>
                      {surah.nameAr} • الدرس {formatNum(Math.max(1, state.surahSessions[surah.id] ?? activeSessionNum), language)}
                    </Text>
                  </View>
                </View>

                <View style={styles.doneMedalWrap}>
                  <View style={styles.doneMedal}>
                    <Ionicons
                      name="checkmark-done"
                      size={30}
                      color={theme.isDark ? theme.accentForeground : '#073d35'}
                    />
                  </View>
                </View>

                <Text style={styles.doneHeroTitle}>
                  بارك الله فيك! أحسنت
                </Text>
                <Text style={styles.doneHeroSub}>
                  {justFinishedSurah
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

              <Animated.View
                style={[
                  styles.stack,
                  {
                    opacity: doneRestOpacity,
                    transform: [{ translateY: doneRestY }],
                  },
                ]}
              >
              {/* Session Metrics & Completed Steps */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.card, borderColor: theme.border, gap: SPACING.md },
                ]}
              >
                <View style={[styles.doneStatsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  <View
                    style={[
                      styles.doneStatBox,
                      {
                        backgroundColor: theme.secondary,
                        borderWidth: 1,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.doneStatVal,
                        { color: theme.isDark ? theme.foreground : theme.primary },
                      ]}
                    >
                      {formatNum(completedRange?.count ?? portionAyahs.length, language)}
                    </Text>
                    <Text style={[styles.doneStatLbl, { color: theme.mutedForeground }]}>آيات اليوم</Text>
                  </View>
                  <View
                    style={[
                      styles.doneStatBox,
                      {
                        backgroundColor: theme.secondary,
                        borderWidth: 1,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.doneStatVal,
                        { color: theme.isDark ? theme.foreground : theme.primary },
                      ]}
                    >
                      {lessonStateLabel}
                    </Text>
                    <Text style={[styles.doneStatLbl, { color: theme.mutedForeground }]}>مستوى الحفظ</Text>
                  </View>
                  <View
                    style={[
                      styles.doneStatBox,
                      {
                        backgroundColor: theme.secondary,
                        borderWidth: 1,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.doneStatVal,
                        { color: theme.isDark ? theme.foreground : theme.primary },
                      ]}
                    >
                      {formatNum(currentAyah, language)}
                    </Text>
                    <Text style={[styles.doneStatLbl, { color: theme.mutedForeground }]}>الآية القادمة</Text>
                  </View>
                </View>

                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                    paddingTop: SPACING.sm,
                  }}
                >
                  <View
                    style={[
                      styles.badgesRow,
                      { flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'center' },
                    ]}
                  >
                    {sessionSteps.map((s, idx) => {
                      const completed = endPhase === 'completed' || idx < stepIndex;
                      return (
                        <View
                          key={s.id}
                          style={[
                            styles.badge,
                            {
                              backgroundColor: completed ? theme.secondary : theme.muted,
                              borderWidth: 1,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color: completed
                                  ? theme.isDark
                                    ? theme.foreground
                                    : theme.primary
                                  : theme.mutedForeground,
                              },
                            ]}
                          >
                            {completed ? `✓ ${s.label}` : s.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {justFinishedSurah && endPhase === 'completed' ? (
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <MillaPicker
                    searchable
                    fullWidth
                    placeholder="ابحث واختر السورة التالية..."
                    value={nextSurahId !== null ? String(nextSurahId) : ''}
                    onChange={(val) => {
                      const nextId = Number(val);
                      setNextSurahId(nextId);
                      void setCursor(nextId, state.surahCursors[nextId] ?? 1);
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
                  disabled={justFinishedSurah && nextSurahId === null}
                  onPress={handleStartNextSession}
                  style={[
                    styles.primaryBtn,
                    {
                      width: '100%',
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      backgroundColor: theme.primary,
                      opacity: justFinishedSurah && nextSurahId === null ? 0.45 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                    {justFinishedSurah && nextSurahId === null
                      ? 'اختر السورة التالية أولاً'
                      : 'بدء الدرس التالي الآن'}
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
              </Animated.View>
            </View>
          );
        })() : null}
      </View>

      {/* Required Lesson Rating Popup */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!submittingRating) setRatingModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.background, borderColor: theme.border, maxHeight: '85%' },
            ]}
          >
            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <View style={[styles.modalTitleGroup, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                  <Text style={[styles.stepHeading, { color: theme.foreground }]}>
                    قيّم حفظك لإتمام الدرس
                  </Text>
                  <Text style={[styles.stepSub, { color: theme.mutedForeground }]}>
                    {surah.nameAr} • الآيات {toArabicDigits(firstPortionNum)} - {toArabicDigits(lastPortionNum)}
                  </Text>
                </View>
              </View>
              <Pressable
                disabled={submittingRating}
                onPress={() => setRatingModalVisible(false)}
                style={[styles.modalCloseBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                accessibilityRole="button"
                accessibilityLabel="إغلاق"
              >
                <Ionicons name="close" size={20} color={theme.foreground} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: SPACING.md }}
            >
              <Text
                style={[
                  styles.stepSub,
                  { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left', lineHeight: 20 },
                ]}
              >
                كيف كان حفظك اليوم؟ اختيارك يساعدنا نرتّب لك المراجعة المناسبة.
              </Text>

              {lessonRatingCard}

              {testRating === 'difficult' ? (
                <View
                  style={[
                    styles.tipBanner,
                    {
                      flexDirection: isRtl ? 'row-reverse' : 'row',
                      backgroundColor: theme.secondary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tipBannerText,
                      { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                    ]}
                  >
                    ممتاز أنك قيّمت بصدق — سنعيدها لك في المراجعة القادمة حتى تثبت بسهولة.
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={[styles.evalGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Pressable
                disabled={submittingRating}
                onPress={() => setRatingModalVisible(false)}
                style={[
                  styles.outlineBtn,
                  { borderColor: theme.border, backgroundColor: theme.card, paddingHorizontal: 16 },
                ]}
              >
                <Text style={[styles.outlineBtnText, { color: theme.foreground }]}>
                  عودة
                </Text>
              </Pressable>

              <Pressable
                disabled={!testRating || submittingRating}
                onPress={() => void submitFinalLessonRating(hasLinkStep)}
                style={[
                  styles.primaryBtn,
                  {
                    flex: 1,
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    backgroundColor: theme.primary,
                    opacity: testRating && !submittingRating ? 1 : 0.45,
                  },
                ]}
              >
                {submittingRating ? (
                  <ActivityIndicator size="small" color={theme.primaryForeground} />
                ) : (
                  <Ionicons name="checkmark-circle-outline" size={20} color={theme.primaryForeground} />
                )}
                <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                  {submittingRating
                    ? 'جاري الحفظ...'
                    : testRating
                      ? 'حفظ التقييم وإتمام الدرس'
                      : 'اختر تقييمك أولاً'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pause & Save Progress Confirmation Modal */}
      <Modal
        visible={pauseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isPausing) setPauseModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <View style={[styles.rowBetween, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <View style={[styles.modalTitleGroup, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <View style={[styles.modalIconBox, { backgroundColor: theme.secondary }]}>
                  <Ionicons name="bookmark-outline" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                  <Text style={[styles.stepHeading, { color: theme.foreground }]}>
                    حفظ التقدّم والخروج مؤقتاً؟
                  </Text>
                  <Text style={[styles.stepSub, { color: theme.mutedForeground }]}>
                    الخطوة {toArabicDigits(stepIndex + 1)} من {toArabicDigits(sessionSteps.length)} •{' '}
                    {sessionSteps[stepIndex]?.label ?? 'الحفظ'}
                  </Text>
                </View>
              </View>
              <Pressable
                disabled={isPausing}
                onPress={() => setPauseModalVisible(false)}
                style={[styles.modalCloseBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                accessibilityRole="button"
                accessibilityLabel="إغلاق"
              >
                <Ionicons name="close" size={20} color={theme.foreground} />
              </Pressable>
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border, gap: 10 },
              ]}
            >
              <View style={[styles.stepsGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                {sessionSteps.map((s, idx) => {
                  const isCurrent = idx === stepIndex;
                  const isDone = idx < stepIndex;
                  return (
                    <View key={s.id} style={styles.stepCol}>
                      <View
                        style={[
                          styles.stepBar,
                          {
                            backgroundColor: isCurrent
                              ? theme.accent
                              : isDone
                                ? theme.primary
                                : theme.border,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.stepLbl,
                          {
                            color: isCurrent ? theme.foreground : theme.mutedForeground,
                            fontWeight: isCurrent ? '700' : '500',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {s.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.stepSubBold,
                  { color: theme.foreground, textAlign: isRtl ? 'right' : 'left' },
                ]}
              >
                موضعك المحفوظ: {sessionSteps[stepIndex]?.label ?? 'الحفظ'}
                {currentPhase === 'memorize' && portionAyahs.length > 0
                  ? ` — الآية ${toArabicDigits(memOffset + 1)} من ${toArabicDigits(portionAyahs.length)}`
                  : ''}
              </Text>
              <Text
                style={[
                  styles.stepSub,
                  { color: theme.mutedForeground, textAlign: isRtl ? 'right' : 'left', lineHeight: 20 },
                ]}
              >
                لن يُحتسب الدرس مكتملاً بعد، وعند عودتك ستستأنف مباشرة من هذه الخطوة.
              </Text>
            </View>

            <View style={[styles.evalGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Pressable
                disabled={isPausing}
                onPress={() => setPauseModalVisible(false)}
                style={[
                  styles.outlineBtn,
                  {
                    flex: 1,
                    borderColor: theme.border,
                    backgroundColor: theme.card,
                    paddingHorizontal: 14,
                  },
                ]}
              >
                <Text style={[styles.outlineBtnText, { color: theme.foreground }]}>
                  متابعة الدرس
                </Text>
              </Pressable>

              <Pressable
                disabled={isPausing}
                onPress={() => void executePauseAndExit()}
                style={[
                  styles.primaryBtn,
                  {
                    flex: 1,
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    backgroundColor: theme.primary,
                    opacity: isPausing ? 0.6 : 1,
                  },
                ]}
              >
                {isPausing ? (
                  <ActivityIndicator size="small" color={theme.primaryForeground} />
                ) : (
                  <Ionicons name="bookmark-outline" size={18} color={theme.primaryForeground} />
                )}
                <Text style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
                  {isPausing ? 'جاري الحفظ...' : 'حفظ والخروج'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppShell>

      {endPhase === 'completed' && completionOverlayActive ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.completionOverlay,
            {
              backgroundColor: theme.heroBg,
              top: overlayTop,
              left: overlayLeft,
              width: overlayWidth,
              height: overlayHeight,
              borderRadius: overlayRadius,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.completionOverlayInner,
              { opacity: overlayContentOpacity },
            ]}
          >
            <View style={styles.doneMedalWrap}>
              <Animated.View
                style={[
                  styles.doneMedalRing,
                  {
                    borderColor: theme.accent,
                    opacity: doneRingOpacity,
                    transform: [{ scale: doneRingScale }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.doneMedal,
                  { transform: [{ scale: doneMedalScale }] },
                ]}
              >
                <Ionicons
                  name="checkmark-done"
                  size={34}
                  color={theme.isDark ? theme.accentForeground : '#073d35'}
                />
              </Animated.View>
            </View>
            <Text style={styles.doneHeroTitle}>بارك الله فيك! أحسنت</Text>
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
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
  stepLbl: { fontSize: 12, textAlign: 'center' },
  stepNavRow: { gap: 8, marginTop: 4 },
  stepNavBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  hiddenPillText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
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
  evalGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  evalTile: {
    flex: 1,
    minWidth: 86,
    minHeight: 56,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  evalTitle: { fontSize: 13, fontWeight: '700' },
  evalSub: { fontSize: 12, marginTop: 2 },
  tipBanner: {
    borderRadius: RADII.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 8,
  },
  tipBannerText: { flex: 1, fontSize: 12, lineHeight: 18 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    borderRadius: RADII.hero,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  modalTitleGroup: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADII.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: RADII.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  completionOverlay: {
    position: 'absolute',
    zIndex: 50,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionOverlayInner: {
    alignItems: 'center',
    justifyContent: 'center',
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
  doneMedalWrap: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  doneMedalRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
  },
  doneMedal: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f7f5ed',
    alignItems: 'center',
    justifyContent: 'center',
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
