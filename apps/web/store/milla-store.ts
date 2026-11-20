import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppLanguage } from '@/lib/milla-i18n';
import type { NarrationId } from '@/lib/quran-data';

export type VerseStatus = 'memorized' | 'in_progress' | 'weak';
export type SelfEvalRating = 'difficult' | 'good' | 'easy';
export type ReciterId = 'hudhaify' | 'husary' | 'minshawi';
export type PlaybackSpeed = 0.75 | 1.0 | 1.25;

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
  memorizedAyahs: Record<string, VerseStatus>;
  evaluations: Record<string, SelfEvalRating>;
  bookmarks: string[];
  dailyStages: DailyStagesState;
  mutashabihatMastered: Record<string, boolean>;
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
  setVerseStatus: (key: string, status: VerseStatus) => void;
  recordEvaluation: (key: string, rating: SelfEvalRating) => void;
  toggleBookmark: (key: string) => void;
  toggleDailyStage: (stage: keyof DailyStagesState) => void;
  setMutashabihatMastered: (id: string, mastered: boolean) => void;
  resetLocalProgress: () => void;
}

export type MillaStore = MillaPersistedState & MillaStoreActions;

const INITIAL_STATE: MillaPersistedState = {
  language: 'ar',
  narration: 'qalun',
  dailyTarget: 4,
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
    fajrEnabled: true,
    fajrTime: '05:15',
    eveningEnabled: true,
    eveningTime: '21:30',
  },
  onboardingCompleted: true,
  currentSurahId: 18,
  currentAyah: 1,
  memorizedAyahs: {
    '18:1': 'memorized',
    '18:2': 'memorized',
    '18:3': 'memorized',
    '18:4': 'in_progress',
  },
  evaluations: {
    '18:1': 'easy',
    '18:2': 'good',
    '56:75': 'difficult',
  },
  bookmarks: ['18:1'],
  dailyStages: {
    yesterdayReview: true,
    olderReview: true,
    newMemorization: false,
    selfTest: false,
    verseConnection: false,
  },
  mutashabihatMastered: {},
};

const STORAGE_KEY = 'almilla.local.v1';

const safeStorage =
  typeof window !== 'undefined'
    ? createJSONStorage<MillaPersistedState>(() => localStorage)
    : undefined;

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
      setCurrentPosition: (currentSurahId, currentAyah) => set({ currentSurahId, currentAyah }),
      setVerseStatus: (key, status) =>
        set((state) => ({
          memorizedAyahs: { ...state.memorizedAyahs, [key]: status },
        })),
      recordEvaluation: (key, rating) =>
        set((state) => ({
          evaluations: { ...state.evaluations, [key]: rating },
          memorizedAyahs: {
            ...state.memorizedAyahs,
            [key]: rating === 'difficult' ? 'weak' : 'memorized',
          },
        })),
      toggleBookmark: (key) =>
        set((state) => {
          const exists = state.bookmarks.includes(key);
          return {
            bookmarks: exists
              ? state.bookmarks.filter((item) => item !== key)
              : [...state.bookmarks, key],
          };
        }),
      toggleDailyStage: (stage) =>
        set((state) => ({
          dailyStages: {
            ...state.dailyStages,
            [stage]: !state.dailyStages[stage],
          },
        })),
      setMutashabihatMastered: (id, mastered) =>
        set((state) => ({
          mutashabihatMastered: { ...state.mutashabihatMastered, [id]: mastered },
        })),
      resetLocalProgress: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: STORAGE_KEY,
      storage: safeStorage,
      partialize: (state): MillaPersistedState => ({
        language: state.language,
        narration: state.narration,
        dailyTarget: state.dailyTarget,
        quranFontSize: state.quranFontSize,
        largeUiMode: state.largeUiMode,
        nightMode: state.nightMode,
        showTranslation: state.showTranslation,
        showTransliteration: state.showTransliteration,
        threePillarsEnabled: state.threePillarsEnabled,
        autoMutashabihatHighlight: state.autoMutashabihatHighlight,
        mandatoryRepeats: state.mandatoryRepeats,
        reciter: state.reciter,
        playbackSpeed: state.playbackSpeed,
        reminders: state.reminders,
        onboardingCompleted: state.onboardingCompleted,
        currentSurahId: state.currentSurahId,
        currentAyah: state.currentAyah,
        memorizedAyahs: state.memorizedAyahs,
        evaluations: state.evaluations,
        bookmarks: state.bookmarks,
        dailyStages: state.dailyStages,
        mutashabihatMastered: state.mutashabihatMastered,
      }),
    },
  ),
);
