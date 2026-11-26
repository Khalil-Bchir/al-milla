import type { AyahEntry } from './quran-metadata.js';
import type { MemorizedVerseRecord, SelfEvalRating } from './revision-queues.js';
import type { StrengtheningHideLevel } from './verse-masking.js';

export type SessionInterval = 1 | 3 | 7 | 14 | 30;
export type LinkRating = 'smooth' | 'needs_work';
export type LessonState = 'learning' | 'strengthening' | 'done';

export interface LessonRecord {
  id: string;
  surahId: number;
  startVerse: number;
  endVerse: number;
  state: LessonState;
  hidingLevel: StrengtheningHideLevel;
  consecutiveDifficultCount: number;
  sessionLearned: number;
  lastReviewedSession: number;
  learnedDate: string;
  lastReviewedDate: string;
  interval: SessionInterval;
  nextReviewSession: number;
  lastEvaluation?: SelfEvalRating;
  reviewCount: number;
}

export interface SurahRevisionPlan {
  surahId: number;
  lastSessionLessons: LessonRecord[];
  earlierSessionLessons: LessonRecord[];
  safetyNetLessons: LessonRecord[];
  allLessons: LessonRecord[];
}

export interface MultiSurahRevisionGroup {
  surahId: number;
  lessons: LessonRecord[];
  isCurrentSurah: boolean;
}

export interface PlannerSuggestion {
  id: string;
  kind: 'lighter_portion' | 'anchor_weak';
  suggestedTarget: number;
  normalTarget: number;
  daysSinceLastSession: number;
  weakCount: number;
}

export interface LinkAnchorResult {
  ayahs: AyahEntry[];
  hasOldVerses: boolean;
  oldVerseCount: number;
}

export interface SurahProgressSummary {
  memorizedCount: number;
  totalAyahs: number;
  percent: number;
}

/**
 * Computes memorized verse count and percentage for a surah from both
 * `verseRecords` (`memorized` | `weak`) and `lessons` (`strengthening` | `done`).
 */
export function computeSurahProgress(params: {
  surahId: number;
  totalAyahs: number;
  verseRecords: Record<string, MemorizedVerseRecord>;
  lessons: readonly LessonRecord[];
}): SurahProgressSummary {
  const covered = new Set<number>();

  for (const rec of Object.values(params.verseRecords)) {
    if (rec.surahId === params.surahId && (rec.status === 'memorized' || rec.status === 'weak')) {
      covered.add(rec.ayahNumber);
    }
  }

  for (const lesson of params.lessons) {
    if (lesson.surahId === params.surahId && (lesson.state === 'strengthening' || lesson.state === 'done')) {
      for (let v = lesson.startVerse; v <= lesson.endVerse; v += 1) {
        covered.add(v);
      }
    }
  }

  const total = Math.max(1, params.totalAyahs);
  const memorizedCount = Math.min(total, covered.size);
  const percent =
    memorizedCount === 0
      ? 0
      : Math.min(100, Math.max(1, Math.round((memorizedCount / total) * 100)));

  return {
    memorizedCount,
    totalAyahs: total,
    percent,
  };
}

export const SESSION_INTERVAL_LADDER: readonly SessionInterval[] = [1, 3, 7, 14, 30];
export const SAFETY_NET_DAYS = 30;
export const LONG_BREAK_DAYS = 14;

/**
 * Returns the active session number for a specific surah.
 * Sessions are numbered per surah (1 for the first visit in that surah).
 */
export function getSurahActiveSessionNumber(
  surahSessions: Record<number, number>,
  surahId: number,
): number {
  return Math.max(1, (surahSessions[surahId] ?? 0) + 1);
}

/**
 * Computes the next session-based interval on the `[1, 3, 7, 14, 30]` ladder.
 */
export function nextSessionInterval(
  current: SessionInterval,
  rating: SelfEvalRating,
): SessionInterval {
  if (rating === 'difficult') return 1;
  const idx = SESSION_INTERVAL_LADDER.indexOf(current);
  const step = rating === 'easy' ? 2 : 1;
  const nextIdx = Math.min(SESSION_INTERVAL_LADDER.length - 1, Math.max(0, idx) + step);
  return SESSION_INTERVAL_LADDER[nextIdx] ?? 1;
}

export function formatLessonId(
  surahId: number,
  startVerse: number,
  endVerse: number,
  sessionLearned: number,
): string {
  return `${surahId}:${startVerse}-${endVerse}:s${sessionLearned}`;
}

/**
 * Whole calendar days between two `YYYY-MM-DD` date strings.
 */
export function daysBetweenIsoDates(fromIso: string, toIso: string): number {
  const fromMs = Date.parse(`${fromIso.slice(0, 10)}T00:00:00Z`);
  const toMs = Date.parse(`${toIso.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return 0;
  return Math.max(0, Math.floor((toMs - fromMs) / 86_400_000));
}

/**
 * Creates a new lesson as `learning` when Step 2 (Memorize) ends
 * ("I'm ready to test") or when the user closes/finishes early.
 */
export function createLearningLesson(params: {
  surahId: number;
  startVerse: number;
  endVerse: number;
  sessionNumber: number;
  todayIso: string;
}): LessonRecord {
  return {
    id: formatLessonId(
      params.surahId,
      params.startVerse,
      params.endVerse,
      params.sessionNumber,
    ),
    surahId: params.surahId,
    startVerse: params.startVerse,
    endVerse: params.endVerse,
    state: 'learning',
    hidingLevel: 1,
    consecutiveDifficultCount: 0,
    sessionLearned: params.sessionNumber,
    lastReviewedSession: params.sessionNumber,
    learnedDate: params.todayIso,
    lastReviewedDate: params.todayIso,
    interval: 1,
    nextReviewSession: params.sessionNumber + 1,
    reviewCount: 0,
  };
}

/**
 * Applies the Step 3 ("Test the new portion") rating to a lesson:
 * - Difficult -> Learning (interval 1, due next session)
 * - Good -> Strengthening (level 1, interval 1)
 * - Easy -> Done (level 3, interval 7)
 */
export function applyStep3TestRating(
  lesson: LessonRecord,
  params: {
    rating: SelfEvalRating;
    sessionNumber: number;
    todayIso: string;
  },
): LessonRecord {
  if (params.rating === 'difficult') {
    return {
      ...lesson,
      state: 'learning',
      hidingLevel: 1,
      consecutiveDifficultCount: lesson.consecutiveDifficultCount + 1,
      lastReviewedSession: params.sessionNumber,
      lastReviewedDate: params.todayIso,
      interval: 1,
      nextReviewSession: params.sessionNumber + 1,
      lastEvaluation: 'difficult',
      reviewCount: lesson.reviewCount + 1,
    };
  }

  if (params.rating === 'good') {
    return {
      ...lesson,
      state: 'strengthening',
      hidingLevel: 1,
      consecutiveDifficultCount: 0,
      lastReviewedSession: params.sessionNumber,
      lastReviewedDate: params.todayIso,
      interval: 1,
      nextReviewSession: params.sessionNumber + 1,
      lastEvaluation: 'good',
      reviewCount: lesson.reviewCount + 1,
    };
  }

  const interval = nextSessionInterval(1, 'easy');
  return {
    ...lesson,
    state: 'done',
    hidingLevel: 3,
    consecutiveDifficultCount: 0,
    lastReviewedSession: params.sessionNumber,
    lastReviewedDate: params.todayIso,
    interval,
    nextReviewSession: params.sessionNumber + interval,
    lastEvaluation: 'easy',
    reviewCount: lesson.reviewCount + 1,
  };
}

/**
 * Applies a Step 1 ("Revise") rating to an existing lesson:
 * - Strengthening:
 *   - Easy: up one hiding level; Easy at level 3 -> Done
 *   - Good: same hiding level
 *   - Difficult: down one hiding level, or back to Learning after 2 in a row
 * - Learning:
 *   - Difficult -> stays Learning
 *   - Good -> Strengthening (level 1)
 *   - Easy -> Done (level 3)
 * - Done:
 *   - Easy/Good -> stays Done, advances session interval
 *   - Difficult -> Strengthening (level 3)
 */
export function applyLessonReviewRating(
  lesson: LessonRecord,
  params: {
    rating: SelfEvalRating;
    sessionNumber: number;
    todayIso: string;
  },
): LessonRecord {
  const interval = nextSessionInterval(lesson.interval, params.rating);

  if (lesson.state === 'learning') {
    if (params.rating === 'difficult') {
      return {
        ...lesson,
        state: 'learning',
        hidingLevel: 1,
        consecutiveDifficultCount: lesson.consecutiveDifficultCount + 1,
        lastReviewedSession: params.sessionNumber,
        lastReviewedDate: params.todayIso,
        interval: 1,
        nextReviewSession: params.sessionNumber + 1,
        lastEvaluation: 'difficult',
        reviewCount: lesson.reviewCount + 1,
      };
    }
    if (params.rating === 'good') {
      return {
        ...lesson,
        state: 'strengthening',
        hidingLevel: 1,
        consecutiveDifficultCount: 0,
        lastReviewedSession: params.sessionNumber,
        lastReviewedDate: params.todayIso,
        interval: 1,
        nextReviewSession: params.sessionNumber + 1,
        lastEvaluation: 'good',
        reviewCount: lesson.reviewCount + 1,
      };
    }
    return {
      ...lesson,
      state: 'done',
      hidingLevel: 3,
      consecutiveDifficultCount: 0,
      lastReviewedSession: params.sessionNumber,
      lastReviewedDate: params.todayIso,
      interval,
      nextReviewSession: params.sessionNumber + interval,
      lastEvaluation: 'easy',
      reviewCount: lesson.reviewCount + 1,
    };
  }

  if (lesson.state === 'strengthening') {
    if (params.rating === 'easy') {
      if (lesson.hidingLevel >= 3) {
        return {
          ...lesson,
          state: 'done',
          hidingLevel: 3,
          consecutiveDifficultCount: 0,
          lastReviewedSession: params.sessionNumber,
          lastReviewedDate: params.todayIso,
          interval,
          nextReviewSession: params.sessionNumber + interval,
          lastEvaluation: 'easy',
          reviewCount: lesson.reviewCount + 1,
        };
      }
      const nextLevel = (lesson.hidingLevel + 1) as StrengtheningHideLevel;
      return {
        ...lesson,
        state: 'strengthening',
        hidingLevel: nextLevel,
        consecutiveDifficultCount: 0,
        lastReviewedSession: params.sessionNumber,
        lastReviewedDate: params.todayIso,
        interval: 1,
        nextReviewSession: params.sessionNumber + 1,
        lastEvaluation: 'easy',
        reviewCount: lesson.reviewCount + 1,
      };
    }

    if (params.rating === 'good') {
      return {
        ...lesson,
        state: 'strengthening',
        hidingLevel: lesson.hidingLevel,
        consecutiveDifficultCount: 0,
        lastReviewedSession: params.sessionNumber,
        lastReviewedDate: params.todayIso,
        interval,
        nextReviewSession: params.sessionNumber + interval,
        lastEvaluation: 'good',
        reviewCount: lesson.reviewCount + 1,
      };
    }

    const nextDifficultCount = lesson.consecutiveDifficultCount + 1;
    if (nextDifficultCount >= 2) {
      return {
        ...lesson,
        state: 'learning',
        hidingLevel: 1,
        consecutiveDifficultCount: nextDifficultCount,
        lastReviewedSession: params.sessionNumber,
        lastReviewedDate: params.todayIso,
        interval: 1,
        nextReviewSession: params.sessionNumber + 1,
        lastEvaluation: 'difficult',
        reviewCount: lesson.reviewCount + 1,
      };
    }
    const downLevel = (Math.max(1, lesson.hidingLevel - 1)) as StrengtheningHideLevel;
    return {
      ...lesson,
      state: 'strengthening',
      hidingLevel: downLevel,
      consecutiveDifficultCount: nextDifficultCount,
      lastReviewedSession: params.sessionNumber,
      lastReviewedDate: params.todayIso,
      interval: 1,
      nextReviewSession: params.sessionNumber + 1,
      lastEvaluation: 'difficult',
      reviewCount: lesson.reviewCount + 1,
    };
  }

  // state === 'done'
  if (params.rating === 'difficult') {
    return {
      ...lesson,
      state: 'strengthening',
      hidingLevel: 3,
      consecutiveDifficultCount: 1,
      lastReviewedSession: params.sessionNumber,
      lastReviewedDate: params.todayIso,
      interval: 1,
      nextReviewSession: params.sessionNumber + 1,
      lastEvaluation: 'difficult',
      reviewCount: lesson.reviewCount + 1,
    };
  }

  return {
    ...lesson,
    state: 'done',
    hidingLevel: 3,
    consecutiveDifficultCount: 0,
    lastReviewedSession: params.sessionNumber,
    lastReviewedDate: params.todayIso,
    interval,
    nextReviewSession: params.sessionNumber + interval,
    lastEvaluation: params.rating,
    reviewCount: lesson.reviewCount + 1,
  };
}

/**
 * Finds the active `learning` lesson for a surah (if any) so Step 2
 * repeats that exact range unless the user taps "Continue anyway".
 */
export function findActiveLearningLesson(
  lessons: readonly LessonRecord[],
  surahId: number,
): LessonRecord | null {
  const candidates = lessons
    .filter((l) => l.surahId === surahId && l.state === 'learning')
    .sort((a, b) => b.lastReviewedSession - a.lastReviewedSession || a.startVerse - b.startVerse);
  return candidates[0] ?? null;
}

/**
 * Computes Step 1 ("Revise") lessons for the active surah only,
 * separated into Last session and Earlier sessions (+ 30-day safety net).
 */
export function computeSurahRevisionPlan(
  lessons: readonly LessonRecord[],
  options: {
    surahId: number;
    activeSessionNumber: number;
    todayIso: string;
    safetyNetDays?: number;
  },
): SurahRevisionPlan {
  const safetyNetDays = options.safetyNetDays ?? SAFETY_NET_DAYS;
  const sessionNum = options.activeSessionNumber;

  const lastSessionLessons: LessonRecord[] = [];
  const earlierSessionLessons: LessonRecord[] = [];
  const safetyNetLessons: LessonRecord[] = [];

  for (const lesson of lessons) {
    if (lesson.surahId !== options.surahId) continue;
    if (lesson.lastReviewedSession >= sessionNum && sessionNum > 0) continue;

    const daysSinceReview = daysBetweenIsoDates(lesson.lastReviewedDate, options.todayIso);
    const hitSafetyNet = daysSinceReview >= safetyNetDays;
    const isDueBySession = lesson.nextReviewSession <= sessionNum;

    if (!hitSafetyNet && !isDueBySession) continue;

    if (hitSafetyNet) {
      safetyNetLessons.push(lesson);
    } else if (lesson.lastReviewedSession === sessionNum - 1) {
      lastSessionLessons.push(lesson);
    } else {
      earlierSessionLessons.push(lesson);
    }
  }

  const sortByVerse = (a: LessonRecord, b: LessonRecord): number =>
    a.startVerse - b.startVerse || a.sessionLearned - b.sessionLearned;
  const sortMostRecentFirst = (a: LessonRecord, b: LessonRecord): number =>
    b.sessionLearned - a.sessionLearned || b.endVerse - a.endVerse;
  safetyNetLessons.sort(sortByVerse);
  lastSessionLessons.sort(sortMostRecentFirst);
  earlierSessionLessons.sort(sortByVerse);

  return {
    surahId: options.surahId,
    lastSessionLessons,
    earlierSessionLessons,
    safetyNetLessons,
    allLessons: [...lastSessionLessons, ...earlierSessionLessons, ...safetyNetLessons],
  };
}

/**
 * Orders due lessons across surahs for the Revision tab:
 * current surah first, then other surahs (oldest first, cap of 2 lessons per other surah).
 * Active surah uses its session count; idle/finished surahs use 30-day date rule.
 */
export function computeMultiSurahRevisionGroups(
  lessons: readonly LessonRecord[],
  options: {
    currentSurahId: number;
    surahSessions: Record<number, number>;
    todayIso: string;
    safetyNetDays?: number;
  },
): MultiSurahRevisionGroup[] {
  const safetyNetDays = options.safetyNetDays ?? SAFETY_NET_DAYS;
  const activePlan = computeSurahRevisionPlan(lessons, {
    surahId: options.currentSurahId,
    activeSessionNumber: getSurahActiveSessionNumber(options.surahSessions, options.currentSurahId),
    todayIso: options.todayIso,
    safetyNetDays,
  });

  const groups: MultiSurahRevisionGroup[] = [];
  if (activePlan.allLessons.length > 0) {
    groups.push({
      surahId: options.currentSurahId,
      lessons: activePlan.allLessons,
      isCurrentSurah: true,
    });
  }

  const otherSurahMap = new Map<number, LessonRecord[]>();
  for (const lesson of lessons) {
    if (lesson.surahId === options.currentSurahId) continue;
    const daysSince = daysBetweenIsoDates(lesson.lastReviewedDate, options.todayIso);
    if (daysSince < safetyNetDays && lesson.state !== 'learning') continue;
    const list = otherSurahMap.get(lesson.surahId) ?? [];
    list.push(lesson);
    otherSurahMap.set(lesson.surahId, list);
  }

  const otherGroups = Array.from(otherSurahMap.entries())
    .map(([surahId, surahLessons]) => {
      const sorted = [...surahLessons].sort((a, b) =>
        a.lastReviewedDate.localeCompare(b.lastReviewedDate),
      );
      return {
        surahId,
        lessons: sorted.slice(0, 2),
        isCurrentSurah: false,
        oldestDate: sorted[0]?.lastReviewedDate ?? options.todayIso,
      };
    })
    .sort((a, b) => a.oldestDate.localeCompare(b.oldestDate))
    .map(({ surahId, lessons: capped, isCurrentSurah }) => ({
      surahId,
      lessons: capped,
      isCurrentSurah,
    }));

  return [...groups, ...otherGroups];
}

/**
 * Offline Layer 1 planner: suggests a lighter new portion after a long break
 * or when weak verses accumulate. The user always chooses with one tap.
 */
export function computePortionSuggestion(params: {
  normalTarget: number;
  lastSessionDate: string | null;
  todayIso: string;
  weakVerseCount: number;
}): PlannerSuggestion | null {
  if (params.normalTarget <= 2) return null;

  const daysSince = params.lastSessionDate
    ? daysBetweenIsoDates(params.lastSessionDate, params.todayIso)
    : 0;

  if (daysSince >= LONG_BREAK_DAYS) {
    const lighter = Math.max(1, Math.ceil(params.normalTarget / 2));
    if (lighter < params.normalTarget) {
      return {
        id: `break-${params.todayIso}`,
        kind: 'lighter_portion',
        suggestedTarget: lighter,
        normalTarget: params.normalTarget,
        daysSinceLastSession: daysSince,
        weakCount: params.weakVerseCount,
      };
    }
  }

  if (params.weakVerseCount >= 4) {
    const lighter = Math.max(2, params.normalTarget - 1);
    if (lighter < params.normalTarget) {
      return {
        id: `weak-${params.todayIso}`,
        kind: 'anchor_weak',
        suggestedTarget: lighter,
        normalTarget: params.normalTarget,
        daysSinceLastSession: daysSince,
        weakCount: params.weakVerseCount,
      };
    }
  }

  return null;
}

/**
 * Builds Step 4 ("Link") passage: up to `maxOldVerses` (3–5) contiguous memorized
 * verses immediately preceding today's portion + today's portion.
 * Returns `hasOldVerses: false` if no memorized verse sits right before `startIdx`.
 */
export function computeLinkAnchorRange(params: {
  ayahs: readonly AyahEntry[];
  startIdx: number;
  portionCount: number;
  verseRecords: Record<string, MemorizedVerseRecord>;
  lessons?: readonly LessonRecord[];
  surahId: number;
  maxOldVerses?: number;
}): LinkAnchorResult {
  const maxOld = Math.max(1, Math.min(5, params.maxOldVerses ?? 5));
  const lessonMemorizedVerses = new Set<number>();
  if (params.lessons) {
    for (const lesson of params.lessons) {
      if (lesson.surahId === params.surahId) {
        for (let v = lesson.startVerse; v <= lesson.endVerse; v += 1) {
          lessonMemorizedVerses.add(v);
        }
      }
    }
  }

  let oldStartIdx = params.startIdx;

  while (oldStartIdx > 0 && params.startIdx - oldStartIdx < maxOld) {
    const prevAyah = params.ayahs[oldStartIdx - 1];
    if (!prevAyah) break;
    const rec = params.verseRecords[`${params.surahId}:${prevAyah.number}`];
    const isMemorized =
      rec?.status === 'memorized' ||
      rec?.status === 'weak' ||
      lessonMemorizedVerses.has(prevAyah.number);
    if (!isMemorized) {
      break;
    }
    oldStartIdx -= 1;
  }

  const oldVerseCount = params.startIdx - oldStartIdx;
  const endIdx = params.startIdx + Math.max(1, params.portionCount);
  const ayahs = params.ayahs.slice(oldStartIdx, endIdx);

  return {
    ayahs,
    hasOldVerses: oldVerseCount > 0,
    oldVerseCount,
  };
}
