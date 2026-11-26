import {
  computeSurahProgress,
  getSurahActiveSessionNumber,
  type LessonRecord,
} from './lesson-planner.js';
import { getSurahById } from './quran-metadata.js';
import type { MemorizedVerseRecord } from './revision-queues.js';
import type { StrengtheningHideLevel } from './verse-masking.js';

export type RevisionTimePreset = 5 | 10 | 20;

export type RevisionSessionMode =
  | 'smart'
  | 'care'
  | 'surah_flow'
  | 'surah_connections'
  | 'surah_random';

export interface RevisionCardItem {
  id: string;
  surahId: number;
  startVerse: number;
  endVerse: number;
  lessonId: string | null;
  kind: 'lesson' | 'connection' | 'random_prompt';
  recommendedView: 'partial' | 'hidden';
  hidingLevel: StrengtheningHideLevel;
  cueLabelAr: string;
  priorityScore: number;
}

export interface SurahRevisionCardSummary {
  surahId: number;
  memorizedCount: number;
  totalAyahs: number;
  percent: number;
  lessonCount: number;
  careCount: number;
  dueCount: number;
  hasConnections: boolean;
  readiness: 'care' | 'ready' | 'fresh';
}

function nextSeededInt(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function clampHidingLevel(level: number): StrengtheningHideLevel {
  if (level <= 1) return 1;
  if (level === 2) return 2;
  return 3;
}

function lessonCueLabel(lesson: LessonRecord): string {
  if (lesson.lastEvaluation === 'difficult' || lesson.consecutiveDifficultCount > 0) {
    return 'عناية خاصة لتثبيت المقطع';
  }
  if (lesson.state === 'learning') {
    return 'مقطع قيد التعلّم يحتاج استرجاعاً';
  }
  if (lesson.state === 'strengthening') {
    return 'ترسيخ متدرج للذاكرة';
  }
  return 'تثبيت الذاكرة طويلة المدى';
}

function buildLessonCardItem(lesson: LessonRecord, priorityScore: number): RevisionCardItem {
  const recommendedView: 'partial' | 'hidden' =
    lesson.state === 'strengthening' && lesson.hidingLevel < 3 ? 'partial' : 'hidden';

  return {
    id: `lesson:${lesson.id}`,
    surahId: lesson.surahId,
    startVerse: lesson.startVerse,
    endVerse: lesson.endVerse,
    lessonId: lesson.id,
    kind: 'lesson',
    recommendedView,
    hidingLevel: clampHidingLevel(lesson.hidingLevel),
    cueLabelAr: lessonCueLabel(lesson),
    priorityScore,
  };
}

function countLessonWeakVerses(
  lesson: LessonRecord,
  verseRecords?: Record<string, MemorizedVerseRecord>,
): number {
  if (!verseRecords) return 0;
  let weakCount = 0;
  for (let ayah = lesson.startVerse; ayah <= lesson.endVerse; ayah += 1) {
    const rec = verseRecords[`${lesson.surahId}:${ayah}`];
    if (rec && (rec.status === 'weak' || rec.lastEvaluation === 'difficult')) {
      weakCount += 1;
    }
  }
  return weakCount;
}

/**
 * Scores a lesson's revision urgency purely from memorization state, ratings,
 * per-ayah difficulty flags, hiding level, and per-surah session progression—without calendar date filters.
 */
export function scoreLessonRevisionPriority(
  lesson: LessonRecord,
  activeSurahSession: number,
  verseRecords?: Record<string, MemorizedVerseRecord>,
): number {
  let score = 0;

  if (lesson.lastEvaluation === 'difficult') {
    score += 45;
  } else if (lesson.lastEvaluation === 'good') {
    score += 20;
  } else if (lesson.lastEvaluation === 'easy') {
    score += 6;
  }

  score += lesson.consecutiveDifficultCount * 22;

  const weakCount = countLessonWeakVerses(lesson, verseRecords);
  if (weakCount > 0) {
    score += Math.min(36, weakCount * 12);
  }

  if (lesson.state === 'learning') {
    score += 34;
  } else if (lesson.state === 'strengthening') {
    score += 24 + (4 - lesson.hidingLevel) * 5;
  } else {
    score += 8;
  }

  const sessionDelta = activeSurahSession - lesson.nextReviewSession;
  if (sessionDelta >= 0) {
    score += 18 + Math.min(30, sessionDelta * 5);
  } else {
    score += Math.max(-10, sessionDelta * 3);
  }

  if (lesson.interval >= 14) {
    score += 6;
  }
  if (lesson.reviewCount <= 1) {
    score += 5;
  }

  return Math.round(score);
}

/**
 * Builds an auto-curated Smart Revision queue grouped strictly by surah
 * (never mixing verses or alternating between different surahs inside a card)
 * and sized to the user's selected time preset (`5 | 10 | 20` minutes).
 */
export function buildSmartRevisionQueue(
  lessons: readonly LessonRecord[],
  options: {
    surahSessions: Record<number, number>;
    currentSurahId: number;
    timePreset: RevisionTimePreset;
    verseRecords?: Record<string, MemorizedVerseRecord>;
  },
): RevisionCardItem[] {
  if (lessons.length === 0) return [];

  const maxItems = options.timePreset === 5 ? 2 : options.timePreset === 10 ? 4 : 8;
  const bySurah = new Map<number, RevisionCardItem[]>();

  for (const lesson of lessons) {
    const activeSession = getSurahActiveSessionNumber(options.surahSessions, lesson.surahId);
    const score = scoreLessonRevisionPriority(lesson, activeSession, options.verseRecords);
    const item = buildLessonCardItem(lesson, score);
    const list = bySurah.get(lesson.surahId) ?? [];
    list.push(item);
    bySurah.set(lesson.surahId, list);
  }

  const surahGroups = Array.from(bySurah.entries()).map(([surahId, items]) => {
    const orderedItems = [...items].sort(
      (a, b) => b.priorityScore - a.priorityScore || a.startVerse - b.startVerse,
    );
    const topScore = orderedItems[0]?.priorityScore ?? 0;
    return {
      surahId,
      topScore,
      items: orderedItems,
    };
  });

  surahGroups.sort((a, b) => {
    if (b.topScore !== a.topScore) return b.topScore - a.topScore;
    if (a.surahId === options.currentSurahId) return -1;
    if (b.surahId === options.currentSurahId) return 1;
    return a.surahId - b.surahId;
  });

  const queue: RevisionCardItem[] = [];
  for (const group of surahGroups) {
    for (const item of group.items) {
      queue.push(item);
      if (queue.length >= maxItems) return queue;
    }
  }

  return queue;
}

/**
 * Selects gentle-care passages (`difficult`, repeated difficulty, or `learning`)
 * grouped cleanly by surah without touching the user's forward memorization cursor.
 */
export function buildCareRevisionQueue(
  lessons: readonly LessonRecord[],
  surahSessions: Record<number, number>,
  verseRecords?: Record<string, MemorizedVerseRecord>,
): RevisionCardItem[] {
  const candidates = lessons.filter(
    (l) =>
      l.lastEvaluation === 'difficult' ||
      l.consecutiveDifficultCount > 0 ||
      l.state === 'learning' ||
      countLessonWeakVerses(l, verseRecords) > 0,
  );

  const bySurah = new Map<number, RevisionCardItem[]>();
  for (const lesson of candidates) {
    const activeSession = getSurahActiveSessionNumber(surahSessions, lesson.surahId);
    const score = scoreLessonRevisionPriority(lesson, activeSession, verseRecords);
    const item = buildLessonCardItem(lesson, score);
    const list = bySurah.get(lesson.surahId) ?? [];
    list.push(item);
    bySurah.set(lesson.surahId, list);
  }

  const surahIds = Array.from(bySurah.keys()).sort((a, b) => {
    const topA = Math.max(...(bySurah.get(a) ?? []).map((x) => x.priorityScore));
    const topB = Math.max(...(bySurah.get(b) ?? []).map((x) => x.priorityScore));
    return topB - topA || a - b;
  });

  const queue: RevisionCardItem[] = [];
  for (const surahId of surahIds) {
    const list = (bySurah.get(surahId) ?? []).sort(
      (a, b) => b.priorityScore - a.priorityScore || a.startVerse - b.startVerse,
    );
    queue.push(...list);
  }

  return queue;
}

function getSurahFallbackChunks(
  verseRecords: Record<string, MemorizedVerseRecord>,
  surahId: number,
): RevisionCardItem[] {
  const nums = Object.values(verseRecords)
    .filter(
      (r) =>
        r.surahId === surahId &&
        (r.status === 'memorized' || r.status === 'weak' || r.status === 'in_progress'),
    )
    .map((r) => r.ayahNumber)
    .sort((a, b) => a - b);

  if (nums.length === 0) return [];

  const chunks: RevisionCardItem[] = [];
  let start = nums[0]!;
  let prev = nums[0]!;

  const pushContiguous = (rangeStart: number, rangeEnd: number) => {
    for (let v = rangeStart; v <= rangeEnd; v += 3) {
      const end = Math.min(rangeEnd, v + 2);
      chunks.push({
        id: `chunk:${surahId}:${v}-${end}`,
        surahId,
        startVerse: v,
        endVerse: end,
        lessonId: null,
        kind: 'lesson',
        recommendedView: 'hidden',
        hidingLevel: 1,
        cueLabelAr: 'تسميع متّصل للمحفوظ',
        priorityScore: 20,
      });
    }
  };

  for (let i = 1; i < nums.length; i += 1) {
    const cur = nums[i]!;
    if (cur === prev + 1) {
      prev = cur;
    } else {
      pushContiguous(start, prev);
      start = cur;
      prev = cur;
    }
  }
  pushContiguous(start, prev);

  return chunks;
}

/**
 * Builds guided revision items strictly for a single surah (`options.surahId`)
 * across three cognitive modes:
 * - `surah_flow`: sequential recall across saved lessons (or 3-verse fallback chunks)
 * - `surah_connections`: transition drills at boundaries between adjacent lessons
 * - `surah_random`: randomized mid-surah recall prompts breaking sequential cues
 */
export function buildSurahRevisionItems(
  lessons: readonly LessonRecord[],
  verseRecords: Record<string, MemorizedVerseRecord>,
  options: {
    surahId: number;
    mode: 'surah_flow' | 'surah_connections' | 'surah_random';
    seed?: number;
  },
): RevisionCardItem[] {
  const surahLessons = lessons
    .filter((l) => l.surahId === options.surahId)
    .sort((a, b) => a.startVerse - b.startVerse || a.endVerse - b.endVerse);

  if (options.mode === 'surah_connections') {
    const seams: RevisionCardItem[] = [];
    for (let i = 0; i + 1 < surahLessons.length; i += 1) {
      const prev = surahLessons[i]!;
      const next = surahLessons[i + 1]!;
      if (prev.endVerse + 1 !== next.startVerse) continue;
      const startVerse = Math.max(prev.startVerse, prev.endVerse - 1);
      const endVerse = Math.min(next.endVerse, next.startVerse + 1);
      seams.push({
        id: `connection:${options.surahId}:${prev.endVerse}-${next.startVerse}`,
        surahId: options.surahId,
        startVerse,
        endVerse,
        lessonId: null,
        kind: 'connection',
        recommendedView: 'hidden',
        hidingLevel: 2,
        cueLabelAr: 'اختبار الوصل بين نهاية المقطع وبداية المقطع التالي',
        priorityScore: 30,
      });
    }
    return seams;
  }

  const baseItems: RevisionCardItem[] =
    surahLessons.length > 0
      ? surahLessons.map((lesson, idx) =>
          buildLessonCardItem(lesson, Math.max(1, surahLessons.length - idx)),
        )
      : getSurahFallbackChunks(verseRecords, options.surahId);

  if (options.mode === 'surah_flow') {
    return baseItems.map((item) => ({
      ...item,
      cueLabelAr: 'تسميع متّصل ضمن السورة',
    }));
  }

  // surah_random: deterministic Fisher-Yates shuffle within this single surah
  const shuffled = baseItems.map((item) => ({
    ...item,
    id: `random:${item.id}`,
    kind: 'random_prompt' as const,
    recommendedView: 'hidden' as const,
    cueLabelAr: 'استدعاء عشوائي من منتصف السورة',
  }));

  let seed = ((options.seed ?? 1) + options.surahId * 997) >>> 0;
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    seed = nextSeededInt(seed);
    const j = seed % (i + 1);
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j]!;
    shuffled[j] = tmp!;
  }

  return shuffled;
}

/**
 * Summarizes every started or completed surah for the Revision Dashboard,
 * ordered by need (`care` first, then `ready`, then `fresh`) without date filters.
 */
export function computeSurahRevisionSummaries(
  lessons: readonly LessonRecord[],
  verseRecords: Record<string, MemorizedVerseRecord>,
  surahSessions: Record<number, number>,
  currentSurahId: number,
): SurahRevisionCardSummary[] {
  const surahIds = new Set<number>();

  for (const lesson of lessons) {
    surahIds.add(lesson.surahId);
  }
  for (const rec of Object.values(verseRecords)) {
    if (rec.status === 'memorized' || rec.status === 'weak' || rec.status === 'in_progress') {
      surahIds.add(rec.surahId);
    }
  }

  const summaries: SurahRevisionCardSummary[] = Array.from(surahIds).map((surahId) => {
    const surah = getSurahById(surahId);
    const { memorizedCount, percent } = computeSurahProgress({
      surahId,
      totalAyahs: surah.totalAyahs,
      verseRecords,
      lessons,
    });

    const surahLessons = lessons
      .filter((l) => l.surahId === surahId)
      .sort((a, b) => a.startVerse - b.startVerse || a.endVerse - b.endVerse);

    const activeSession = getSurahActiveSessionNumber(surahSessions, surahId);
    const careCount = surahLessons.filter(
      (l) =>
        l.lastEvaluation === 'difficult' ||
        l.consecutiveDifficultCount > 0 ||
        l.state === 'learning',
    ).length;

    const dueCount = surahLessons.filter(
      (l) => l.nextReviewSession <= activeSession && l.lastReviewedSession < activeSession,
    ).length;

    let hasConnections = false;
    for (let i = 0; i + 1 < surahLessons.length; i += 1) {
      if (surahLessons[i]!.endVerse + 1 === surahLessons[i + 1]!.startVerse) {
        hasConnections = true;
        break;
      }
    }

    const readiness: SurahRevisionCardSummary['readiness'] =
      careCount > 0 ? 'care' : dueCount > 0 ? 'ready' : 'fresh';

    return {
      surahId,
      memorizedCount,
      totalAyahs: surah.totalAyahs,
      percent,
      lessonCount: surahLessons.length,
      careCount,
      dueCount,
      hasConnections,
      readiness,
    };
  });

  const rank: Record<SurahRevisionCardSummary['readiness'], number> = {
    care: 3,
    ready: 2,
    fresh: 1,
  };

  return summaries.sort((a, b) => {
    if (rank[b.readiness] !== rank[a.readiness]) return rank[b.readiness] - rank[a.readiness];
    if (a.surahId === currentSurahId) return -1;
    if (b.surahId === currentSurahId) return 1;
    return b.memorizedCount - a.memorizedCount || a.surahId - b.surahId;
  });
}
