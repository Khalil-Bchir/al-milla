export {
  MIN_SESSION_GAP_MS,
  applyVerseEvaluation,
  computeProgressMetrics,
  computeRevisionQueues,
  formatVerseKey,
  nextRevisionInterval,
  type ComputeRevisionQueuesOptions,
  type MemorizedVerseRecord,
  type ProgressMetrics,
  type RevisionIntervalDays,
  type RevisionQueuesSummary,
  type SelfEvalRating,
  type SurahMasteryDynamicItem,
  type VerseStatus,
} from './revision-queues.js';

export {
  formatCueText,
  maskVerseByLevel,
  maskVerseDynamic,
  maskVerseForStrengthening,
  type ProgressiveHideLevel,
  type StrengtheningHideLevel,
} from './verse-masking.js';

export {
  BUNDLED_VERIFIED_AYAHS,
  KAHF_TAFSIR_WORDS,
  MUTASHABIHAT_DRILLS,
  RECITERS,
  SURAHS,
  getEveryAyahAudioUrl,
  getSurahById,
  stripLeadingBasmalah,
  toArabicDigits,
  type AyahEntry,
  type MushafPageAyah,
  type MutashabihatDrill,
  type NarrationId,
  type ReciterId,
  type ReciterInfo,
  type SurahInfo,
  type TafsirWordNote,
} from './quran-metadata.js';

export {
  MILLA_COPY,
  formatDigitsInText,
  formatNum,
  getSurahDisplayName,
  type AppLanguage,
  type MillaCopy,
} from './milla-i18n.js';

export {
  mergePortfolioStates,
  mergeVerseRecords,
  type PortfolioSyncState,
} from './sync-merge.js';

export {
  LONG_BREAK_DAYS,
  SAFETY_NET_DAYS,
  SESSION_INTERVAL_LADDER,
  applyLessonReviewRating,
  applyStep3TestRating,
  computeLinkAnchorRange,
  computeMultiSurahRevisionGroups,
  computePortionSuggestion,
  computeSurahProgress,
  computeSurahRevisionPlan,
  createLearningLesson,
  daysBetweenIsoDates,
  findActiveLearningLesson,
  formatLessonId,
  getSurahActiveSessionNumber,
  nextSessionInterval,
  type LessonRecord,
  type LessonState,
  type LinkAnchorResult,
  type LinkRating,
  type MultiSurahRevisionGroup,
  type PlannerSuggestion,
  type SessionInterval,
  type SurahProgressSummary,
  type SurahRevisionPlan,
} from './lesson-planner.js';

export {
  buildCareRevisionQueue,
  buildSmartRevisionQueue,
  buildSurahRevisionItems,
  computeSurahRevisionSummaries,
  scoreLessonRevisionPriority,
  type RevisionCardItem,
  type RevisionSessionMode,
  type RevisionTimePreset,
  type SurahRevisionCardSummary,
} from './revision-engine.js';
