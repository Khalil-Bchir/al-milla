import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppLanguage } from '@/lib/milla-i18n';
import { SURAHS, type NarrationId, type ReciterId } from '@/lib/quran-data';

export type VerseStatus = 'memorized' | 'in_progress' | 'weak';
export type SelfEvalRating = 'difficult' | 'good' | 'easy';
export type PlaybackSpeed = 0.75 | 1.0 | 1.25;
export type RevisionIntervalDays = 1 | 3 | 7 | 14 | 30;
export type MushafViewMode = 'verses' | 'page';

const INTERVAL_LADDER: RevisionIntervalDays[] = [1, 3, 7, 14, 30];

export interface MemorizedVerseRecord {
  key: string;
  surahId: number;
  ayahNumber: number;
  status: VerseStatus;
  firstMemorizedAt: string;
  lastReviewedAt: string;
  nextReviewAt: string;
  intervalDays: RevisionIntervalDays;
  lastEvaluation?: SelfEvalRating;
  reviewCount: number;
}

export interface DailyStagesState {
  yesterdayReview: boolean;
  olderReview: boolean;
  newMemorization: boolean;
  selfTest: boolean;
  verseConnection: boolean;
}

export interface ReminderSettings {
  fajrEnabled: boolean;
  fajrTime: string;
  eveningEnabled: boolean;
  eveningTime: string;
}

export interface MillaPersistedState {
  language: AppLanguage;
  narration: NarrationId;
  dailyTarget: number;
  quranFontSize: number;
  largeUiMode: boolean;
  nightMode: boolean;
  showTranslation: boolean;
  showTransliteration: boolean;
  threePillarsEnabled: boolean;
  autoMutashabihatHighlight: boolean;
  mandatoryRepeats: number;
  reciter: ReciterId;
  playbackSpeed: PlaybackSpeed;
  reminders: ReminderSettings;
  onboardingCompleted: boolean;
  currentSurahId: number;
  currentAyah: number;
  mushafViewMode: MushafViewMode;
  currentMushafPage: number;
  memorizedAyahs: Record<string, VerseStatus>;
  evaluations: Record<string, SelfEvalRating>;
  verseRecords: Record<string, MemorizedVerseRecord>;
  activityDates: string[];
  bookmarks: string[];
  dailyStages: DailyStagesState;
  mutashabihatMastered: Record<string, boolean>;
  syncKey: string;
  lastSyncedAt: string | null;
}

export interface BackupImportPayload {
  language?: AppLanguage;
  narration?: NarrationId;
  dailyTarget?: number;
  quranFontSize?: number;
  currentSurahId?: number;
  currentAyah?: number;
  bookmarks?: string[];
  activityDates?: string[];
  verseRecords?: Record<string, MemorizedVerseRecord>;
  verses?: MemorizedVerseRecord[];
}

export interface MillaStoreActions {
  setLanguage: (language: AppLanguage) => void;
  setNarration: (narration: NarrationId) => void;
  setDailyTarget: (target: number) => void;
  setQuranFontSize: (size: number) => void;
  setLargeUiMode: (enabled: boolean) => void;
  setNightMode: (enabled: boolean) => void;
  setShowTranslation: (enabled: boolean) => void;
  setShowTransliteration: (enabled: boolean) => void;
  setThreePillarsEnabled: (enabled: boolean) => void;
  setAutoMutashabihatHighlight: (enabled: boolean) => void;
  setMandatoryRepeats: (repeats: number) => void;
  setReciter: (reciter: ReciterId) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  updateReminders: (patch: Partial<ReminderSettings>) => void;
  completeOnboarding: () => void;
  setCurrentPosition: (surahId: number, ayah: number) => void;
  setMushafViewMode: (mode: MushafViewMode) => void;
  setCurrentMushafPage: (page: number) => void;
  setVerseStatus: (key: string, status: VerseStatus) => void;
  recordEvaluation: (key: string, rating: SelfEvalRating) => void;
  toggleBookmark: (key: string) => void;
  setDailyStage: (stage: keyof DailyStagesState, done: boolean) => void;
  toggleDailyStage: (stage: keyof DailyStagesState) => void;
  setMutashabihatMastered: (id: string, mastered: boolean) => void;
  setSyncKey: (syncKey: string) => void;
  setLastSyncedAt: (iso: string | null) => void;
  importBackupData: (payload: BackupImportPayload) => void;
  resetLocalProgress: () => void;
}

export type MillaStore = MillaPersistedState & MillaStoreActions;

function todayDateString(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function isoWithOffsetDays(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString();
}

function nextInterval(current: RevisionIntervalDays, rating: SelfEvalRating): RevisionIntervalDays {
  if (rating === 'difficult') return 1;
  const idx = INTERVAL_LADDER.indexOf(current);
  const step = rating === 'easy' ? 2 : 1;
  const nextIdx = Math.min(INTERVAL_LADDER.length - 1, Math.max(0, idx) + step);
  return INTERVAL_LADDER[nextIdx];
}

const INITIAL_STATE: MillaPersistedState = {
  language: 'ar',
  narration: 'hafs',
  dailyTarget: 3,
  quranFontSize: 26,
  largeUiMode: false,
  nightMode: false,
  showTranslation: false,
  showTransliteration: false,
  threePillarsEnabled: true,
  autoMutashabihatHighlight: true,
  mandatoryRepeats: 5,
  reciter: 'hudhaify',
  playbackSpeed: 1.0,
  reminders: {
    fajrEnabled: false,
    fajrTime: '05:15',
    eveningEnabled: false,
    eveningTime: '21:30',
  },
  onboardingCompleted: false,
  currentSurahId: 1,
  currentAyah: 1,
  mushafViewMode: 'verses',
  currentMushafPage: 1,
  memorizedAyahs: {},
  evaluations: {},
  verseRecords: {},
  activityDates: [],
  bookmarks: [],
  dailyStages: {
    yesterdayReview: false,
    olderReview: false,
    newMemorization: false,
    selfTest: false,
    verseConnection: false,
  },
  mutashabihatMastered: {},
  syncKey: 'milla-local-portfolio-v1',
  lastSyncedAt: null,
};

const STORAGE_KEY = 'almilla.local.v3';

type MillaStoredSlice = Pick<
  MillaPersistedState,
  | 'language'
  | 'dailyTarget'
  | 'quranFontSize'
  | 'largeUiMode'
  | 'nightMode'
  | 'showTranslation'
  | 'showTransliteration'
  | 'mandatoryRepeats'
  | 'reciter'
  | 'playbackSpeed'
  | 'onboardingCompleted'
  | 'currentSurahId'
  | 'currentAyah'
  | 'mushafViewMode'
  | 'currentMushafPage'
  | 'verseRecords'
  | 'bookmarks'
  | 'mutashabihatMastered'
>;

const safeStorage =
  typeof window !== 'undefined'
    ? createJSONStorage<MillaStoredSlice>(() => localStorage)
    : undefined;

function parseVerseKey(key: string): { surahId: number; ayahNumber: number } {
  const [s, a] = key.split(':').map(Number);
  return {
    surahId: Number.isFinite(s) && s > 0 ? s : 1,
    ayahNumber: Number.isFinite(a) && a > 0 ? a : 1,
  };
}

function appendTodayActivity(dates: string[]): string[] {
  const today = todayDateString(0);
  return dates.includes(today) ? dates : [...dates, today];
}

export const useMillaStore = create<MillaStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setLanguage: (language) => set({ language }),
      setNarration: (narration) => set({ narration }),
      setDailyTarget: (dailyTarget) => set({ dailyTarget: Math.max(1, Math.min(20, dailyTarget)) }),
      setQuranFontSize: (quranFontSize) =>
        set({ quranFontSize: Math.max(18, Math.min(36, quranFontSize)) }),
      setLargeUiMode: (largeUiMode) => set({ largeUiMode }),
      setNightMode: (nightMode) => set({ nightMode }),
      setShowTranslation: (showTranslation) => set({ showTranslation }),
      setShowTransliteration: (showTransliteration) => set({ showTransliteration }),
      setThreePillarsEnabled: (threePillarsEnabled) => set({ threePillarsEnabled }),
      setAutoMutashabihatHighlight: (autoMutashabihatHighlight) =>
        set({ autoMutashabihatHighlight }),
      setMandatoryRepeats: (mandatoryRepeats) =>
        set({ mandatoryRepeats: Math.max(1, Math.min(15, mandatoryRepeats)) }),
      setReciter: (reciter) => set({ reciter }),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
      updateReminders: (patch) =>
        set((state) => ({ reminders: { ...state.reminders, ...patch } })),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      setCurrentPosition: (currentSurahId, currentAyah) => {
        const surah = SURAHS.find((s) => s.id === currentSurahId);
        set({
          currentSurahId,
          currentAyah,
          currentMushafPage: surah?.pageStart ?? 1,
        });
      },
      setMushafViewMode: (mushafViewMode) => set({ mushafViewMode }),
      setCurrentMushafPage: (page) =>
        set({ currentMushafPage: Math.max(1, Math.min(604, page)) }),
      setVerseStatus: (key, status) =>
        set((state) => {
          const { surahId, ayahNumber } = parseVerseKey(key);
          const nowIso = new Date().toISOString();
          const prev = state.verseRecords[key];
          const updatedRecord: MemorizedVerseRecord = {
            key,
            surahId,
            ayahNumber,
            status,
            firstMemorizedAt: prev?.firstMemorizedAt ?? nowIso,
            lastReviewedAt: nowIso,
            nextReviewAt: prev?.nextReviewAt ?? isoWithOffsetDays(1),
            intervalDays: prev?.intervalDays ?? 1,
            lastEvaluation: prev?.lastEvaluation,
            reviewCount: (prev?.reviewCount ?? 0) + 1,
          };
          return {
            memorizedAyahs: { ...state.memorizedAyahs, [key]: status },
            verseRecords: { ...state.verseRecords, [key]: updatedRecord },
            activityDates: appendTodayActivity(state.activityDates),
            dailyStages:
              status === 'memorized'
                ? { ...state.dailyStages, newMemorization: true }
                : state.dailyStages,
          };
        }),
      recordEvaluation: (key, rating) =>
        set((state) => {
          const { surahId, ayahNumber } = parseVerseKey(key);
          const nowIso = new Date().toISOString();
          const prev = state.verseRecords[key];
          const intervalDays = nextInterval(prev?.intervalDays ?? 1, rating);
          const status: VerseStatus = rating === 'difficult' ? 'weak' : 'memorized';
          const updatedRecord: MemorizedVerseRecord = {
            key,
            surahId,
            ayahNumber,
            status,
            firstMemorizedAt: prev?.firstMemorizedAt ?? nowIso,
            lastReviewedAt: nowIso,
            nextReviewAt: isoWithOffsetDays(intervalDays),
            intervalDays,
            lastEvaluation: rating,
            reviewCount: (prev?.reviewCount ?? 0) + 1,
          };
          return {
            evaluations: { ...state.evaluations, [key]: rating },
            memorizedAyahs: { ...state.memorizedAyahs, [key]: status },
            verseRecords: { ...state.verseRecords, [key]: updatedRecord },
            activityDates: appendTodayActivity(state.activityDates),
            dailyStages: { ...state.dailyStages, selfTest: true },
          };
        }),
      toggleBookmark: (key) =>
        set((state) => {
          const exists = state.bookmarks.includes(key);
          return {
            bookmarks: exists
              ? state.bookmarks.filter((item) => item !== key)
              : [...state.bookmarks, key],
          };
        }),
      setDailyStage: (stage, done) =>
        set((state) => ({
          dailyStages: {
            ...state.dailyStages,
            [stage]: done,
          },
          activityDates: done ? appendTodayActivity(state.activityDates) : state.activityDates,
        })),
      toggleDailyStage: (stage) =>
        set((state) => ({
          dailyStages: {
            ...state.dailyStages,
            [stage]: !state.dailyStages[stage],
          },
          activityDates: appendTodayActivity(state.activityDates),
        })),
      setMutashabihatMastered: (id, mastered) =>
        set((state) => ({
          mutashabihatMastered: { ...state.mutashabihatMastered, [id]: mastered },
          activityDates: appendTodayActivity(state.activityDates),
        })),
      setSyncKey: (syncKey) => set({ syncKey: syncKey.trim() || 'milla-local-portfolio-v1' }),
      setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
      importBackupData: (payload) =>
        set((state) => {
          const nextRecords = { ...state.verseRecords };
          if (payload.verseRecords) {
            Object.assign(nextRecords, payload.verseRecords);
          }
          if (Array.isArray(payload.verses)) {
            for (const v of payload.verses) {
              nextRecords[v.key] = v;
            }
          }
          return {
            onboardingCompleted: true,
            language: payload.language ?? state.language,
            narration: payload.narration ?? state.narration,
            dailyTarget: payload.dailyTarget ?? state.dailyTarget,
            quranFontSize: payload.quranFontSize ?? state.quranFontSize,
            currentSurahId: payload.currentSurahId ?? state.currentSurahId,
            currentAyah: payload.currentAyah ?? state.currentAyah,
            bookmarks: Array.isArray(payload.bookmarks) ? payload.bookmarks : state.bookmarks,
            activityDates: Array.isArray(payload.activityDates)
              ? payload.activityDates
              : state.activityDates,
            verseRecords: nextRecords,
            memorizedAyahs: Object.fromEntries(
              Object.values(nextRecords).map((r) => [r.key, r.status]),
            ),
          };
        }),
      resetLocalProgress: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: STORAGE_KEY,
      storage: safeStorage,
      partialize: (state): MillaStoredSlice => ({
        language: state.language,
        dailyTarget: state.dailyTarget,
        quranFontSize: state.quranFontSize,
        largeUiMode: state.largeUiMode,
        nightMode: state.nightMode,
        showTranslation: state.showTranslation,
        showTransliteration: state.showTransliteration,
        mandatoryRepeats: state.mandatoryRepeats,
        reciter: state.reciter,
        playbackSpeed: state.playbackSpeed,
        onboardingCompleted: state.onboardingCompleted,
        currentSurahId: state.currentSurahId,
        currentAyah: state.currentAyah,
        mushafViewMode: state.mushafViewMode,
        currentMushafPage: state.currentMushafPage,
        verseRecords: state.verseRecords,
        bookmarks: state.bookmarks,
        mutashabihatMastered: state.mutashabihatMastered,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const records = state.verseRecords ?? {};
        state.memorizedAyahs = Object.fromEntries(
          Object.values(records).map((r) => [r.key, r.status]),
        );
        state.evaluations = Object.fromEntries(
          Object.values(records)
            .filter((r) => Boolean(r.lastEvaluation))
            .map((r) => [r.key, r.lastEvaluation as SelfEvalRating]),
        );
      },
    },
  ),
);

export interface RevisionQueuesSummary {
  yesterdayItems: MemorizedVerseRecord[];
  olderDueItems: MemorizedVerseRecord[];
  weakItems: MemorizedVerseRecord[];
  totalDueCount: number;
}

export function computeRevisionQueues(
  verseRecords: Record<string, MemorizedVerseRecord>,
): RevisionQueuesSummary {
  const nowMs = Date.now();
  const twoDaysAgoMs = nowMs - 2 * 86_400_000;
  const all = Object.values(verseRecords);

  const yesterdayItems = all.filter((r) => {
    const firstMs = Date.parse(r.firstMemorizedAt);
    return Number.isFinite(firstMs) && firstMs >= twoDaysAgoMs && r.status !== 'weak';
  });

  const olderDueItems = all.filter((r) => {
    const firstMs = Date.parse(r.firstMemorizedAt);
    const nextMs = Date.parse(r.nextReviewAt);
    return (
      r.status === 'memorized' &&
      (!Number.isFinite(firstMs) || firstMs < twoDaysAgoMs) &&
      (!Number.isFinite(nextMs) || nextMs <= nowMs + 86_400_000)
    );
  });

  const weakItems = all.filter((r) => r.status === 'weak' || r.lastEvaluation === 'difficult');

  return {
    yesterdayItems,
    olderDueItems,
    weakItems,
    totalDueCount: yesterdayItems.length + olderDueItems.length + weakItems.length,
  };
}

export interface SurahMasteryDynamicItem {
  surahId: number;
  nameAr: string;
  totalAyahs: number;
  memorizedCount: number;
  hizb: number;
  percent: number;
  statusLabelAr: string;
  lastActivityAr: string;
  needsCare: boolean;
}

export interface ProgressMetricsSummary {
  totalMemorizedVerses: number;
  completedSurahsCount: number;
  practicedDaysCount: number;
  retentionPercent: number;
  surahMasteryList: SurahMasteryDynamicItem[];
  last7Days: { date: string; dayLabelAr: string; active: boolean }[];
}

const ARABIC_WEEKDAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] as const;

export function computeProgressMetrics(
  verseRecords: Record<string, MemorizedVerseRecord>,
  activityDates: string[],
  currentSurahId: number,
): ProgressMetricsSummary {
  const all = Object.values(verseRecords);
  const memorizedOrWeak = all.filter((r) => r.status === 'memorized' || r.status === 'weak');
  const totalMemorizedVerses = memorizedOrWeak.length;
  const weakCount = all.filter((r) => r.status === 'weak').length;
  const retentionPercent =
    totalMemorizedVerses > 0
      ? Math.max(70, Math.round(((totalMemorizedVerses - weakCount) / totalMemorizedVerses) * 100))
      : 0;

  const bySurah = new Map<number, MemorizedVerseRecord[]>();
  for (const rec of memorizedOrWeak) {
    const list = bySurah.get(rec.surahId) ?? [];
    list.push(rec);
    bySurah.set(rec.surahId, list);
  }
  if (totalMemorizedVerses > 0 && !bySurah.has(currentSurahId)) {
    bySurah.set(currentSurahId, []);
  }

  const surahMasteryList: SurahMasteryDynamicItem[] = [];
  let completedSurahsCount = 0;

  for (const [surahId, recs] of bySurah.entries()) {
    const surah = SURAHS.find((s) => s.id === surahId);
    if (!surah) continue;
    const memorizedCount = recs.length;
    const percent = Math.min(100, Math.round((memorizedCount / surah.totalAyahs) * 100));
    const isComplete = memorizedCount >= surah.totalAyahs;
    if (isComplete) completedSurahsCount += 1;
    const hasWeak = recs.some((r) => r.status === 'weak');

    surahMasteryList.push({
      surahId,
      nameAr: surah.nameAr,
      totalAyahs: surah.totalAyahs,
      memorizedCount,
      hizb: surah.hizb,
      percent,
      statusLabelAr: isComplete
        ? 'مكتملة'
        : hasWeak
          ? `${percent}٪ يحتاج عناية`
          : `${percent}٪ الحفظ الجاري`,
      lastActivityAr: isComplete
        ? 'سورة مكتملة في محفظتك المحلية'
        : hasWeak
          ? 'يوجد موضع يحتاج لتكرار في المراجعة'
          : `تم حفظ ${memorizedCount} من ${surah.totalAyahs} آية`,
      needsCare: hasWeak,
    });
  }

  surahMasteryList.sort((a, b) => b.percent - a.percent);

  const last7Days: { date: string; dayLabelAr: string; active: boolean }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86_400_000);
    const isoDate = d.toISOString().slice(0, 10);
    const dayLabelAr = ARABIC_WEEKDAYS[d.getDay()];
    last7Days.push({
      date: isoDate,
      dayLabelAr,
      active: activityDates.includes(isoDate),
    });
  }

  return {
    totalMemorizedVerses,
    completedSurahsCount,
    practicedDaysCount: activityDates.length,
    retentionPercent,
    surahMasteryList,
    last7Days,
  };
}
