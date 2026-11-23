import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  applyVerseEvaluation,
  formatVerseKey,
  type MemorizedVerseRecord,
  type ReciterId,
  type SelfEvalRating,
} from '@al-milla/core';
import {
  loadAppStateFromDb,
  recordActivityDateInDb,
  saveSettingToDb,
  setBookmarkInDb,
  upsertVerseRecordToDb,
  type DailyStageKey,
  type MobileAppState,
  type PlaybackSpeed,
} from '../db/database';
import {
  restorePortfolioFromCloud,
  syncPortfolioWithCloud,
  type SyncOutcome,
} from '../services/sync';

interface MillaContextValue {
  state: MobileAppState | null;
  isLoading: boolean;
  isSyncing: boolean;
  syncError: string | null;
  setCursor: (surahId: number, ayahNumber: number) => Promise<void>;
  markVerseInProgress: (surahId: number, ayahNumber: number) => Promise<void>;
  evaluateVerse: (
    surahId: number,
    ayahNumber: number,
    rating: SelfEvalRating,
    markSelfTest?: boolean,
  ) => Promise<void>;
  toggleDailyStage: (stage: DailyStageKey) => Promise<void>;
  completeSession: (keys: string[]) => Promise<void>;
  toggleBookmark: (surahId: number, ayahNumber: number) => Promise<void>;
  setDailyTarget: (target: number) => Promise<void>;
  setQuranFontSize: (size: number) => Promise<void>;
  setReciter: (reciter: ReciterId) => Promise<void>;
  setPlaybackSpeed: (speed: PlaybackSpeed) => Promise<void>;
  syncNow: () => Promise<SyncOutcome>;
  restoreBySyncKey: (syncKey: string) => Promise<SyncOutcome>;
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
      setState(loaded);
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

  const setCursor = useCallback(async (surahId: number, ayahNumber: number) => {
    await saveSettingToDb('currentSurahId', String(surahId));
    await saveSettingToDb('currentAyah', String(ayahNumber));
    setState((prev) =>
      prev ? { ...prev, currentSurahId: surahId, currentAyah: ayahNumber } : prev,
    );
  }, []);

  const markVerseInProgress = useCallback(
    async (surahId: number, ayahNumber: number) => {
      if (!state) return;
      const key = formatVerseKey(surahId, ayahNumber);
      const existing = state.verseRecords[key];
      if (existing && existing.status === 'memorized') return;

      const nowIso = new Date().toISOString();
      const nextRecord: MemorizedVerseRecord = {
        key,
        surahId,
        ayahNumber,
        status: 'in_progress',
        firstMemorizedAt: existing?.firstMemorizedAt ?? nowIso,
        lastReviewedAt: nowIso,
        nextReviewAt: existing?.nextReviewAt ?? new Date(Date.now() + 86_400_000).toISOString(),
        intervalDays: existing?.intervalDays ?? 1,
        lastEvaluation: existing?.lastEvaluation,
        reviewCount: existing?.reviewCount ?? 0,
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

  const toggleDailyStage = useCallback(
    async (stage: DailyStageKey) => {
      if (!state) return;
      const nextStages = { ...state.dailyStages, [stage]: !state.dailyStages[stage] };
      await saveSettingToDb('dailyStages', JSON.stringify(nextStages));
      await recordTodayActivity();
      setState((prev) => (prev ? { ...prev, dailyStages: nextStages } : prev));
    },
    [state, recordTodayActivity],
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
      const completedAt = new Date().toISOString();
      const nextStages = { ...state.dailyStages, verseConnection: true };
      await saveSettingToDb('lastSessionKeys', JSON.stringify(keys));
      await saveSettingToDb('lastSessionCompletedAt', completedAt);
      await saveSettingToDb('dailyStages', JSON.stringify(nextStages));
      await recordTodayActivity();

      const updatedState: MobileAppState = {
        ...state,
        lastSessionKeys: keys,
        lastSessionCompletedAt: completedAt,
        dailyStages: nextStages,
      };
      setState(updatedState);

      // Best-effort background sync after session completion (never blocks offline usage)
      void syncPortfolioWithCloud(updatedState).then((outcome) => {
        if (outcome.ok) {
          void reloadFromDb();
        }
      });
    },
    [state, recordTodayActivity, reloadFromDb],
  );

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
    const clamped = Math.max(1, Math.min(20, target));
    await saveSettingToDb('dailyTarget', String(clamped));
    setState((prev) => (prev ? { ...prev, dailyTarget: clamped } : prev));
  }, []);

  const setQuranFontSize = useCallback(async (size: number) => {
    const clamped = Math.max(20, Math.min(44, size));
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

  return (
    <MillaContext.Provider
      value={{
        state,
        isLoading,
        isSyncing,
        syncError,
        setCursor,
        markVerseInProgress,
        evaluateVerse,
        toggleDailyStage,
        completeSession,
        toggleBookmark,
        setDailyTarget,
        setQuranFontSize,
        setReciter,
        setPlaybackSpeed,
        syncNow,
        restoreBySyncKey,
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
