import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  applyLessonReviewRating,
  applyStep3TestRating,
  applyVerseEvaluation,
  createLearningLesson,
  formatVerseKey,
  getSurahActiveSessionNumber,
  getSurahById,
  type AppLanguage,
  type LessonRecord,
  type MemorizedVerseRecord,
  type ReciterId,
  type SelfEvalRating,
  type VerseStatus,
} from '@al-milla/core';
import {
  loadAppStateFromDb,
  recordActivityDateInDb,
  resetLocalProgressInDb,
  saveSettingToDb,
  setBookmarkInDb,
  upsertLessonToDb,
  upsertVerseRecordToDb,
  type ActiveSessionDraft,
  type DailyStageKey,
  type MobileAppState,
  type MushafViewMode,
  type PlaybackSpeed,
} from '../db/database';
import {
  restorePortfolioFromCloud,
  syncPortfolioWithCloud,
  type SyncOutcome,
} from '../services/sync';
import { getTheme, type MillaTheme } from '../theme/tokens';

interface MillaContextValue {
  state: MobileAppState | null;
  theme: MillaTheme;
  isLoading: boolean;
  isSyncing: boolean;
  syncError: string | null;
  setLanguage: (language: AppLanguage) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setNightMode: (enabled: boolean) => Promise<void>;
  setLargeUiMode: (enabled: boolean) => Promise<void>;
  setShowTranslation: (enabled: boolean) => Promise<void>;
  setShowTransliteration: (enabled: boolean) => Promise<void>;
  setMandatoryRepeats: (repeats: number) => Promise<void>;
  setMushafViewMode: (mode: MushafViewMode) => Promise<void>;
  setCurrentMushafPage: (page: number) => Promise<void>;
  setMutashabihatMastered: (id: string, mastered: boolean) => Promise<void>;
  setCursor: (surahId: number, ayahNumber: number) => Promise<void>;
  setVerseStatus: (surahId: number, ayahNumber: number, status: VerseStatus) => Promise<void>;
  evaluateVerse: (
    surahId: number,
    ayahNumber: number,
    rating: SelfEvalRating,
    markSelfTest?: boolean,
  ) => Promise<void>;
  setDailyStage: (stage: DailyStageKey, done: boolean) => Promise<void>;
  toggleDailyStage: (stage: DailyStageKey) => Promise<void>;
  completeSession: (keys: string[]) => Promise<void>;
  saveLearningLesson: (params: {
    surahId: number;
    startVerse: number;
    endVerse: number;
  }) => Promise<void>;
  recordLessonTest: (params: {
    surahId: number;
    startVerse: number;
    endVerse: number;
    rating: SelfEvalRating;
    hardAyahNumbers: number[];
  }) => Promise<void>;
  evaluateLessonReview: (params: {
    lessonId: string;
    rating: SelfEvalRating;
    hardAyahNumbers: number[];
  }) => Promise<void>;
  finishSessionEarly: () => Promise<void>;
  saveSessionDraft: (draft: ActiveSessionDraft | null) => Promise<void>;
  toggleBookmark: (surahId: number, ayahNumber: number) => Promise<void>;
  setDailyTarget: (target: number) => Promise<void>;
  setQuranFontSize: (size: number) => Promise<void>;
  setReciter: (reciter: ReciterId) => Promise<void>;
  setPlaybackSpeed: (speed: PlaybackSpeed) => Promise<void>;
  syncNow: () => Promise<SyncOutcome>;
  restoreBySyncKey: (syncKey: string) => Promise<SyncOutcome>;
  resetLocalProgress: () => Promise<void>;
}

const MillaContext = createContext<MillaContextValue | null>(null);

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MillaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MobileAppState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const reloadFromDb = useCallback(async () => {
    try {
      const loaded = await loadAppStateFromDb();
      setState({ ...loaded, language: 'ar' });
    } catch {
      // Keep previous state if DB read fails transiently
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadFromDb();
  }, [reloadFromDb]);

  const recordTodayActivity = useCallback(async () => {
    const today = todayIsoDate();
    await recordActivityDateInDb(today);
    setState((prev) => {
      if (!prev || prev.activityDates.includes(today)) return prev;
      return { ...prev, activityDates: [...prev.activityDates, today] };
    });
  }, []);

  const setLanguage = useCallback(async (language: AppLanguage) => {
    await saveSettingToDb('language', language);
    setState((prev) => (prev ? { ...prev, language } : prev));
  }, []);

  const completeOnboarding = useCallback(async () => {
    await saveSettingToDb('onboardingCompleted', 'true');
    setState((prev) => (prev ? { ...prev, onboardingCompleted: true } : prev));
  }, []);

  const setNightMode = useCallback(async (enabled: boolean) => {
    await saveSettingToDb('nightMode', String(enabled));
    setState((prev) => (prev ? { ...prev, nightMode: enabled } : prev));
  }, []);

  const setLargeUiMode = useCallback(async (enabled: boolean) => {
    await saveSettingToDb('largeUiMode', String(enabled));
    setState((prev) => (prev ? { ...prev, largeUiMode: enabled } : prev));
  }, []);

  const setShowTranslation = useCallback(async (enabled: boolean) => {
    await saveSettingToDb('showTranslation', String(enabled));
    setState((prev) => (prev ? { ...prev, showTranslation: enabled } : prev));
  }, []);

  const setShowTransliteration = useCallback(async (enabled: boolean) => {
    await saveSettingToDb('showTransliteration', String(enabled));
    setState((prev) => (prev ? { ...prev, showTransliteration: enabled } : prev));
  }, []);

  const setMandatoryRepeats = useCallback(async (repeats: number) => {
    const snapped = repeats <= 3 ? 3 : repeats <= 5 ? 5 : 7;
    await saveSettingToDb('mandatoryRepeats', String(snapped));
    setState((prev) => (prev ? { ...prev, mandatoryRepeats: snapped } : prev));
  }, []);

  const setMushafViewMode = useCallback(async (mode: MushafViewMode) => {
    await saveSettingToDb('mushafViewMode', mode);
    setState((prev) => (prev ? { ...prev, mushafViewMode: mode } : prev));
  }, []);

  const setCurrentMushafPage = useCallback(async (page: number) => {
    const clamped = Math.max(1, Math.min(604, page));
    await saveSettingToDb('currentMushafPage', String(clamped));
    setState((prev) => (prev ? { ...prev, currentMushafPage: clamped } : prev));
  }, []);

  const setMutashabihatMastered = useCallback(
    async (id: string, mastered: boolean) => {
      if (!state) return;
      const nextMap = { ...state.mutashabihatMastered, [id]: mastered };
      await saveSettingToDb('mutashabihatMastered', JSON.stringify(nextMap));
      await recordTodayActivity();
      setState((prev) => (prev ? { ...prev, mutashabihatMastered: nextMap } : prev));
    },
    [state, recordTodayActivity],
  );

  const setCursor = useCallback(
    async (surahId: number, ayahNumber: number) => {
      const surah = getSurahById(surahId);
      const clampedAyah = Math.max(1, Math.min(surah.totalAyahs, ayahNumber));
      const nextCursors = { ...(state?.surahCursors ?? {}), [surahId]: clampedAyah };
      await saveSettingToDb('currentSurahId', String(surahId));
      await saveSettingToDb('currentAyah', String(clampedAyah));
      await saveSettingToDb('currentMushafPage', String(surah.pageStart));
      await saveSettingToDb('surahCursors', JSON.stringify(nextCursors));
      setState((prev) =>
        prev
          ? {
              ...prev,
              currentSurahId: surahId,
              currentAyah: clampedAyah,
              currentMushafPage: surah.pageStart,
              surahCursors: nextCursors,
            }
          : prev,
      );
    },
    [state?.surahCursors],
  );

  const setVerseStatus = useCallback(
    async (surahId: number, ayahNumber: number, status: VerseStatus) => {
      if (!state) return;
      const key = formatVerseKey(surahId, ayahNumber);
      const existing = state.verseRecords[key];
      const nowIso = new Date().toISOString();
      const nextRecord: MemorizedVerseRecord = {
        key,
        surahId,
        ayahNumber,
        status,
        firstMemorizedAt: existing?.firstMemorizedAt ?? nowIso,
        lastReviewedAt: nowIso,
        nextReviewAt: existing?.nextReviewAt ?? new Date(Date.now() + 86_400_000).toISOString(),
        intervalDays: existing?.intervalDays ?? 1,
        lastEvaluation: existing?.lastEvaluation,
        reviewCount: (existing?.reviewCount ?? 0) + 1,
      };
      await upsertVerseRecordToDb(nextRecord, 1);
      await recordTodayActivity();
      setState((prev) =>
        prev
          ? {
              ...prev,
              verseRecords: { ...prev.verseRecords, [key]: nextRecord },
            }
          : prev,
      );
    },
    [state, recordTodayActivity],
  );

  const evaluateVerse = useCallback(
    async (
      surahId: number,
      ayahNumber: number,
      rating: SelfEvalRating,
      markSelfTest = false,
    ) => {
      if (!state) return;
      const key = formatVerseKey(surahId, ayahNumber);
      const updated = applyVerseEvaluation(state.verseRecords[key], {
        surahId,
        ayahNumber,
        rating,
      });

      await upsertVerseRecordToDb(updated, 1);
      await recordTodayActivity();

      if (markSelfTest) {
        const nextStages = { ...state.dailyStages, selfTest: true };
        await saveSettingToDb('dailyStages', JSON.stringify(nextStages));
        setState((prev) =>
          prev
            ? {
                ...prev,
                verseRecords: { ...prev.verseRecords, [key]: updated },
                dailyStages: nextStages,
              }
            : prev,
        );
        return;
      }

      setState((prev) =>
        prev
          ? {
              ...prev,
              verseRecords: { ...prev.verseRecords, [key]: updated },
            }
          : prev,
      );
    },
    [state, recordTodayActivity],
  );

  const setDailyStage = useCallback(
    async (stage: DailyStageKey, done: boolean) => {
      if (!state) return;
      const nextStages = { ...state.dailyStages, [stage]: done };
      await saveSettingToDb('dailyStages', JSON.stringify(nextStages));
      if (done) await recordTodayActivity();
      setState((prev) => (prev ? { ...prev, dailyStages: nextStages } : prev));
    },
    [state, recordTodayActivity],
  );

  const toggleDailyStage = useCallback(
    async (stage: DailyStageKey) => {
      if (!state) return;
      await setDailyStage(stage, !state.dailyStages[stage]);
    },
    [state, setDailyStage],
  );

  const syncNow = useCallback(async (): Promise<SyncOutcome> => {
    if (!state) {
      return { ok: false, mergedState: null, error: 'التطبيق لا يزال قيد التهيئة' };
    }
    setIsSyncing(true);
    setSyncError(null);
    try {
      const outcome = await syncPortfolioWithCloud(state);
      if (outcome.ok) {
        await reloadFromDb();
      } else {
        setSyncError(outcome.error);
      }
      return outcome;
    } finally {
      setIsSyncing(false);
    }
  }, [state, reloadFromDb]);

  const completeSession = useCallback(
    async (keys: string[]) => {
      if (!state) return;
      const today = todayIsoDate();
      const completedAt = new Date().toISOString();
      const nextSurahSession = getSurahActiveSessionNumber(
        state.surahSessions,
        state.currentSurahId,
      );
      const nextSurahSessions = {
        ...state.surahSessions,
        [state.currentSurahId]: nextSurahSession,
      };
      const completedSessionNum = state.currentSessionNumber + 1;
      const nextStages = { ...state.dailyStages, verseConnection: true };
      await saveSettingToDb('lastSessionKeys', JSON.stringify(keys));
      await saveSettingToDb('lastSessionCompletedAt', completedAt);
      await saveSettingToDb('currentSessionNumber', String(completedSessionNum));
      await saveSettingToDb('currentSessionDate', today);
      await saveSettingToDb('surahSessions', JSON.stringify(nextSurahSessions));
      await saveSettingToDb('activeSessionDraft', '');
      await saveSettingToDb('dailyStages', JSON.stringify(nextStages));
      await recordTodayActivity();

      setState((prev) =>
        prev
          ? {
              ...prev,
              lastSessionKeys: keys,
              lastSessionCompletedAt: completedAt,
              currentSessionNumber: completedSessionNum,
              currentSessionDate: today,
              surahSessions: {
                ...prev.surahSessions,
                [prev.currentSurahId]: getSurahActiveSessionNumber(
                  prev.surahSessions,
                  prev.currentSurahId,
                ),
              },
              activeSessionDraft: null,
              dailyStages: { ...prev.dailyStages, verseConnection: true },
            }
          : prev,
      );

      void syncPortfolioWithCloud({
        ...state,
        lastSessionKeys: keys,
        lastSessionCompletedAt: completedAt,
        currentSessionNumber: completedSessionNum,
        currentSessionDate: today,
        surahSessions: nextSurahSessions,
        activeSessionDraft: null,
        dailyStages: nextStages,
      }).then((outcome) => {
        if (outcome.ok) void reloadFromDb();
      });
    },
    [state, recordTodayActivity, reloadFromDb],
  );

  const saveLearningLesson = useCallback(
    async (params: { surahId: number; startVerse: number; endVerse: number }) => {
      if (!state) return;
      const today = todayIsoDate();
      const sessionNumber = getSurahActiveSessionNumber(state.surahSessions, params.surahId);
      const existing = state.lessons.find(
        (l) =>
          l.surahId === params.surahId &&
          l.startVerse === params.startVerse &&
          l.endVerse === params.endVerse &&
          l.state === 'learning',
      );
      const saved: LessonRecord = existing
        ? {
            ...existing,
            lastReviewedSession: sessionNumber,
            lastReviewedDate: today,
          }
        : createLearningLesson({
            surahId: params.surahId,
            startVerse: params.startVerse,
            endVerse: params.endVerse,
            sessionNumber,
            todayIso: today,
          });

      await upsertLessonToDb(saved);
      await recordTodayActivity();
      setState((prev) => {
        if (!prev) return prev;
        const existsIdx = prev.lessons.findIndex((l) => l.id === saved.id);
        const nextLessons =
          existsIdx >= 0
            ? prev.lessons.map((l, idx) => (idx === existsIdx ? saved : l))
            : [...prev.lessons, saved];
        return { ...prev, lessons: nextLessons };
      });
    },
    [state, recordTodayActivity],
  );

  const recordLessonTest = useCallback(
    async (params: {
      surahId: number;
      startVerse: number;
      endVerse: number;
      rating: SelfEvalRating;
      hardAyahNumbers: number[];
    }) => {
      if (!state) return;
      const today = todayIsoDate();
      const sessionNumber = getSurahActiveSessionNumber(state.surahSessions, params.surahId);
      const hardSet = new Set(params.rating === 'difficult' ? params.hardAyahNumbers : []);

      const nextVerseRecords = { ...state.verseRecords };
      for (let ayah = params.startVerse; ayah <= params.endVerse; ayah += 1) {
        const key = formatVerseKey(params.surahId, ayah);
        const existingRec = nextVerseRecords[key];
        if (params.rating === 'difficult') {
          const status: VerseStatus = hardSet.has(ayah) ? 'weak' : 'in_progress';
          const updated: MemorizedVerseRecord = {
            key,
            surahId: params.surahId,
            ayahNumber: ayah,
            status,
            firstMemorizedAt: existingRec?.firstMemorizedAt ?? new Date().toISOString(),
            lastReviewedAt: new Date().toISOString(),
            nextReviewAt: new Date(Date.now() + 86_400_000).toISOString(),
            intervalDays: 1,
            lastEvaluation: hardSet.has(ayah) ? 'difficult' : existingRec?.lastEvaluation,
            reviewCount: (existingRec?.reviewCount ?? 0) + 1,
          };
          nextVerseRecords[key] = updated;
          await upsertVerseRecordToDb(updated, 1);
        } else {
          const updated = applyVerseEvaluation(existingRec, {
            surahId: params.surahId,
            ayahNumber: ayah,
            rating: params.rating,
          });
          nextVerseRecords[key] = updated;
          await upsertVerseRecordToDb(updated, 1);
        }
      }

      const existingLesson = state.lessons.find(
        (l) =>
          l.surahId === params.surahId &&
          l.startVerse === params.startVerse &&
          l.endVerse === params.endVerse &&
          l.state === 'learning',
      );
      const baseLesson =
        existingLesson ??
        createLearningLesson({
          surahId: params.surahId,
          startVerse: params.startVerse,
          endVerse: params.endVerse,
          sessionNumber,
          todayIso: today,
        });
      const savedLesson = applyStep3TestRating(baseLesson, {
        rating: params.rating,
        sessionNumber,
        todayIso: today,
      });

      await upsertLessonToDb(savedLesson);
      const existingIdx = state.lessons.findIndex((l) => l.id === savedLesson.id);
      const nextLessons =
        existingIdx >= 0
          ? state.lessons.map((l, idx) => (idx === existingIdx ? savedLesson : l))
          : [...state.lessons, savedLesson];

      const nextStages = { ...state.dailyStages, selfTest: true };
      await saveSettingToDb('dailyStages', JSON.stringify(nextStages));
      await recordTodayActivity();

      setState((prev) => {
        if (!prev) return prev;
        const idx = prev.lessons.findIndex((l) => l.id === savedLesson.id);
        const mergedLessons =
          idx >= 0
            ? prev.lessons.map((l, i) => (i === idx ? savedLesson : l))
            : [...prev.lessons, savedLesson];
        return {
          ...prev,
          verseRecords: { ...prev.verseRecords, ...nextVerseRecords },
          lessons: mergedLessons,
          dailyStages: { ...prev.dailyStages, selfTest: true },
        };
      });
    },
    [state, recordTodayActivity],
  );

  const evaluateLessonReview = useCallback(
    async (params: {
      lessonId: string;
      rating: SelfEvalRating;
      hardAyahNumbers: number[];
    }) => {
      if (!state) return;
      const target = state.lessons.find((l) => l.id === params.lessonId);
      if (!target) return;

      const today = todayIsoDate();
      const sessionNumber = getSurahActiveSessionNumber(state.surahSessions, target.surahId);
      const updatedLesson = applyLessonReviewRating(target, {
        rating: params.rating,
        sessionNumber,
        todayIso: today,
      });
      await upsertLessonToDb(updatedLesson);

      const hardSet = new Set(params.rating === 'difficult' ? params.hardAyahNumbers : []);
      const nextVerseRecords = { ...state.verseRecords };
      for (let ayah = target.startVerse; ayah <= target.endVerse; ayah += 1) {
        if (!hardSet.has(ayah)) continue;
        const key = formatVerseKey(target.surahId, ayah);
        const updatedVerse = applyVerseEvaluation(nextVerseRecords[key], {
          surahId: target.surahId,
          ayahNumber: ayah,
          rating: 'difficult',
        });
        nextVerseRecords[key] = updatedVerse;
        await upsertVerseRecordToDb(updatedVerse, 1);
      }

      await recordTodayActivity();
      setState((prev) =>
        prev
          ? {
              ...prev,
              lessons: prev.lessons.map((l) => (l.id === updatedLesson.id ? updatedLesson : l)),
              verseRecords: nextVerseRecords,
            }
          : prev,
      );
    },
    [state, recordTodayActivity],
  );

  const saveSessionDraft = useCallback(async (draft: ActiveSessionDraft | null) => {
    await saveSettingToDb('activeSessionDraft', draft ? JSON.stringify(draft) : '');
    setState((prev) => (prev ? { ...prev, activeSessionDraft: draft } : prev));
  }, []);

  const finishSessionEarly = useCallback(async () => {
    if (!state) return;
    const today = todayIsoDate();
    const nextSurahSession = getSurahActiveSessionNumber(
      state.surahSessions,
      state.currentSurahId,
    );
    const nextSurahSessions = {
      ...state.surahSessions,
      [state.currentSurahId]: nextSurahSession,
    };
    const completedSessionNum = state.currentSessionNumber + 1;
    await saveSettingToDb('currentSessionNumber', String(completedSessionNum));
    await saveSettingToDb('currentSessionDate', today);
    await saveSettingToDb('surahSessions', JSON.stringify(nextSurahSessions));
    await saveSettingToDb('activeSessionDraft', '');
    await recordTodayActivity();

    setState((prev) =>
      prev
        ? {
            ...prev,
            currentSessionNumber: completedSessionNum,
            currentSessionDate: today,
            surahSessions: {
              ...prev.surahSessions,
              [prev.currentSurahId]: getSurahActiveSessionNumber(
                prev.surahSessions,
                prev.currentSurahId,
              ),
            },
            activeSessionDraft: null,
          }
        : prev,
    );

    void syncPortfolioWithCloud({
      ...state,
      currentSessionNumber: completedSessionNum,
      currentSessionDate: today,
      surahSessions: nextSurahSessions,
      activeSessionDraft: null,
    }).then((outcome) => {
      if (outcome.ok) void reloadFromDb();
    });
  }, [state, recordTodayActivity, reloadFromDb]);

  const toggleBookmark = useCallback(
    async (surahId: number, ayahNumber: number) => {
      if (!state) return;
      const key = formatVerseKey(surahId, ayahNumber);
      const exists = state.bookmarks.includes(key);
      await setBookmarkInDb(key, !exists);
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          bookmarks: exists
            ? prev.bookmarks.filter((item) => item !== key)
            : [...prev.bookmarks, key],
        };
      });
    },
    [state],
  );

  const setDailyTarget = useCallback(async (target: number) => {
    const clamped = Math.max(3, Math.min(5, Math.round(target)));
    await saveSettingToDb('dailyTarget', String(clamped));
    setState((prev) => (prev ? { ...prev, dailyTarget: clamped } : prev));
  }, []);

  const setQuranFontSize = useCallback(async (size: number) => {
    const clamped = Math.max(18, Math.min(36, size));
    await saveSettingToDb('quranFontSize', String(clamped));
    setState((prev) => (prev ? { ...prev, quranFontSize: clamped } : prev));
  }, []);

  const setReciter = useCallback(async (reciter: ReciterId) => {
    await saveSettingToDb('reciter', reciter);
    setState((prev) => (prev ? { ...prev, reciter } : prev));
  }, []);

  const setPlaybackSpeed = useCallback(async (speed: PlaybackSpeed) => {
    await saveSettingToDb('playbackSpeed', String(speed));
    setState((prev) => (prev ? { ...prev, playbackSpeed: speed } : prev));
  }, []);

  const restoreBySyncKey = useCallback(
    async (syncKey: string): Promise<SyncOutcome> => {
      if (!state) {
        return { ok: false, mergedState: null, error: 'التطبيق لا يزال قيد التهيئة' };
      }
      setIsSyncing(true);
      setSyncError(null);
      try {
        const outcome = await restorePortfolioFromCloud(syncKey, state);
        if (outcome.ok) {
          await reloadFromDb();
        } else {
          setSyncError(outcome.error);
        }
        return outcome;
      } finally {
        setIsSyncing(false);
      }
    },
    [state, reloadFromDb],
  );

  const resetLocalProgress = useCallback(async () => {
    await resetLocalProgressInDb();
    await reloadFromDb();
  }, [reloadFromDb]);

  const theme = getTheme(state?.nightMode ?? false);

  return (
    <MillaContext.Provider
      value={{
        state,
        theme,
        isLoading,
        isSyncing,
        syncError,
        setLanguage,
        completeOnboarding,
        setNightMode,
        setLargeUiMode,
        setShowTranslation,
        setShowTransliteration,
        setMandatoryRepeats,
        setMushafViewMode,
        setCurrentMushafPage,
        setMutashabihatMastered,
        setCursor,
        setVerseStatus,
        evaluateVerse,
        setDailyStage,
        toggleDailyStage,
        completeSession,
        saveLearningLesson,
        recordLessonTest,
        evaluateLessonReview,
        finishSessionEarly,
        saveSessionDraft,
        toggleBookmark,
        setDailyTarget,
        setQuranFontSize,
        setReciter,
        setPlaybackSpeed,
        syncNow,
        restoreBySyncKey,
        resetLocalProgress,
      }}
    >
      {children}
    </MillaContext.Provider>
  );
}

export function useMilla(): MillaContextValue {
  const ctx = useContext(MillaContext);
  if (!ctx) {
    throw new Error('useMilla must be used within a MillaProvider');
  }
  return ctx;
}
