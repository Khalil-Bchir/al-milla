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
