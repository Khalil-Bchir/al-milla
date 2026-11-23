import { SURAHS } from './quran-metadata.js';

export type VerseStatus = 'memorized' | 'in_progress' | 'weak';
export type SelfEvalRating = 'difficult' | 'good' | 'easy';
export type RevisionIntervalDays = 1 | 3 | 7 | 14 | 30;

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

export interface RevisionQueuesSummary {
  yesterdayItems: MemorizedVerseRecord[];
  olderDueItems: MemorizedVerseRecord[];
  weakItems: MemorizedVerseRecord[];
  totalDueCount: number;
}

export interface ComputeRevisionQueuesOptions {
  lastSessionKeys?: string[];
  lastSessionCompletedAt?: string | null;
  nowMs?: number;
}

/** Minimum gap after a session finishes before its verses surface as "previous lesson" review. */
export const MIN_SESSION_GAP_MS = 4 * 3_600_000;

const INTERVAL_LADDER: RevisionIntervalDays[] = [1, 3, 7, 14, 30];

export function nextRevisionInterval(
  current: RevisionIntervalDays,
  rating: SelfEvalRating,
): RevisionIntervalDays {
  if (rating === 'difficult') return 1;
  const idx = INTERVAL_LADDER.indexOf(current);
  const step = rating === 'easy' ? 2 : 1;
  const nextIdx = Math.min(INTERVAL_LADDER.length - 1, Math.max(0, idx) + step);
  return INTERVAL_LADDER[nextIdx] ?? 1;
}

export function formatVerseKey(surahId: number, ayahNumber: number): string {
  return `${surahId}:${ayahNumber}`;
}

export function applyVerseEvaluation(
  existing: MemorizedVerseRecord | undefined,
  params: {
    surahId: number;
    ayahNumber: number;
    rating: SelfEvalRating;
    nowIso?: string;
  },
): MemorizedVerseRecord {
  const nowIso = params.nowIso ?? new Date().toISOString();
  const parsedNowMs = Date.parse(nowIso);
  const baseMs = Number.isFinite(parsedNowMs) ? parsedNowMs : Date.now();
  const intervalDays = nextRevisionInterval(existing?.intervalDays ?? 1, params.rating);
  const status: VerseStatus = params.rating === 'difficult' ? 'weak' : 'memorized';
  const nextReviewAt = new Date(baseMs + intervalDays * 86_400_000).toISOString();

  return {
    key: existing?.key ?? formatVerseKey(params.surahId, params.ayahNumber),
    surahId: params.surahId,
    ayahNumber: params.ayahNumber,
    status,
    firstMemorizedAt: existing?.firstMemorizedAt ?? nowIso,
    lastReviewedAt: nowIso,
    nextReviewAt,
    intervalDays,
    lastEvaluation: params.rating,
    reviewCount: (existing?.reviewCount ?? 0) + 1,
  };
}

export function computeRevisionQueues(
  verseRecords: Record<string, MemorizedVerseRecord>,
  options: ComputeRevisionQueuesOptions = {},
): RevisionQueuesSummary {
  const nowMs = options.nowMs ?? Date.now();
  const lastSessionSet = new Set(options.lastSessionKeys ?? []);
  const sessionCompletedMs = options.lastSessionCompletedAt
    ? Date.parse(options.lastSessionCompletedAt)
    : Number.NaN;

  const all = Object.values(verseRecords);
  const weakItems: MemorizedVerseRecord[] = [];
  const yesterdayItems: MemorizedVerseRecord[] = [];
  const olderDueItems: MemorizedVerseRecord[] = [];

  for (const record of all) {
    // Verses still in Step 3 learning ('in_progress') are never queued for revision yet
    if (record.status === 'in_progress') continue;

    // 1. Weak / difficult verses always go exclusively to weakItems
    if (record.status === 'weak' || record.lastEvaluation === 'difficult') {
      weakItems.push(record);
      continue;
    }

    // 2. Previous completed session ("Yesterday's / Previous Lesson Review")
    const isFromLastSession = lastSessionSet.has(record.key);
    if (isFromLastSession && Number.isFinite(sessionCompletedMs)) {
      const elapsedSinceSessionMs = nowMs - sessionCompletedMs;
      const lastReviewedMs = Date.parse(record.lastReviewedAt);
      const reviewedAfterSession =
        Number.isFinite(lastReviewedMs) && lastReviewedMs > sessionCompletedMs + 10_000;

      if (elapsedSinceSessionMs >= MIN_SESSION_GAP_MS && !reviewedAfterSession) {
        yesterdayItems.push(record);
        continue;
      }
    }

    // 3. Older due items (exclude anything from the current un-elapsed session)
    if (isFromLastSession && Number.isFinite(sessionCompletedMs)) {
      const elapsedSinceSessionMs = nowMs - sessionCompletedMs;
      if (elapsedSinceSessionMs < MIN_SESSION_GAP_MS) {
        continue;
      }
    }

    const nextMs = Date.parse(record.nextReviewAt);
    if (!Number.isFinite(nextMs) || nextMs <= nowMs) {
      olderDueItems.push(record);
    }
  }

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

export interface ProgressMetrics {
  totalMemorizedVerses: number;
  completedSurahsCount: number;
  practicedDaysCount: number;
  retentionPercent: number;
  surahMasteryList: SurahMasteryDynamicItem[];
  last7Days: { date: string; dayLabelAr: string; active: boolean }[];
}

const ARABIC_WEEKDAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'] as const;

export function computeProgressMetrics(
  verseRecords: Record<string, MemorizedVerseRecord>,
  activityDates: string[],
  currentSurahId: number,
): ProgressMetrics {
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
    const dayLabelAr = ARABIC_WEEKDAYS[d.getDay()] ?? 'أحد';
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
