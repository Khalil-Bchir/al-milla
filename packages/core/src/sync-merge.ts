import type { NarrationId } from './quran-metadata.js';
import type { MemorizedVerseRecord, VerseStatus } from './revision-queues.js';

export interface PortfolioSyncState {
  syncKey: string;
  narration: NarrationId;
  dailyTarget: number;
  currentSurahId: number;
  currentAyah: number;
  bookmarks: string[];
  activityDates: string[];
  verses: MemorizedVerseRecord[];
  version: number;
  updatedAt: string;
}

const STATUS_PRIORITY: Record<VerseStatus, number> = {
  memorized: 3,
  weak: 2,
  in_progress: 1,
};

function parseTimestampMs(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

function pickNewerVerseRecord(
  a: MemorizedVerseRecord,
  b: MemorizedVerseRecord,
): MemorizedVerseRecord {
  const aReviewedMs = parseTimestampMs(a.lastReviewedAt);
  const bReviewedMs = parseTimestampMs(b.lastReviewedAt);

  if (bReviewedMs > aReviewedMs) return b;
  if (aReviewedMs > bReviewedMs) return a;

  if (b.reviewCount > a.reviewCount) return b;
  if (a.reviewCount > b.reviewCount) return a;

  return STATUS_PRIORITY[b.status] > STATUS_PRIORITY[a.status] ? b : a;
}

/**
 * Deterministic, conflict-free merge of verse records across devices.
 * Never drops a verse present on one side and missing on the other.
 */
export function mergeVerseRecords(
  existing: MemorizedVerseRecord[],
  incoming: MemorizedVerseRecord[],
): MemorizedVerseRecord[] {
  const merged = new Map<string, MemorizedVerseRecord>();

  for (const record of existing) {
    merged.set(record.key, record);
  }

  for (const record of incoming) {
    const prev = merged.get(record.key);
    if (!prev) {
      merged.set(record.key, record);
      continue;
    }
    merged.set(record.key, pickNewerVerseRecord(prev, record));
  }

  return Array.from(merged.values()).sort((a, b) => {
    if (a.surahId !== b.surahId) return a.surahId - b.surahId;
    return a.ayahNumber - b.ayahNumber;
  });
}

/**
 * Merges a server portfolio with an incoming client portfolio deterministically.
 * An empty or stale client device will never wipe newer cloud progress.
 */
export function mergePortfolioStates(
  server: PortfolioSyncState | null,
  client: PortfolioSyncState,
): PortfolioSyncState {
  const mergedVerses = mergeVerseRecords(server?.verses ?? [], client.verses);

  const bookmarkSet = new Set<string>([
    ...(server?.bookmarks ?? []),
    ...client.bookmarks,
  ]);
  const mergedBookmarks = Array.from(bookmarkSet).slice(-200);

  const activitySet = new Set<string>([
    ...(server?.activityDates ?? []),
    ...client.activityDates,
  ]);
  const mergedActivityDates = Array.from(activitySet).sort().slice(-365);

  const serverUpdatedMs = server ? parseTimestampMs(server.updatedAt) : 0;
  const clientUpdatedMs = parseTimestampMs(client.updatedAt);
  const clientHasContent =
    client.verses.length > 0 ||
    client.bookmarks.length > 0 ||
    client.activityDates.length > 0;
  const serverHasContent =
    server !== null &&
    (server.verses.length > 0 ||
      server.bookmarks.length > 0 ||
      server.activityDates.length > 0);

  // If server already has progress and a fresh empty client connects, preserve server cursor/settings
  const preferServerMeta =
    server !== null &&
    serverHasContent &&
    !clientHasContent &&
    serverUpdatedMs >= clientUpdatedMs;

  const chosenMeta = preferServerMeta && server ? server : client;

  return {
    syncKey: client.syncKey.trim(),
    narration: chosenMeta.narration,
    dailyTarget: chosenMeta.dailyTarget,
    currentSurahId: chosenMeta.currentSurahId,
    currentAyah: chosenMeta.currentAyah,
    bookmarks: mergedBookmarks,
    activityDates: mergedActivityDates,
    verses: mergedVerses,
    version: Math.max(server?.version ?? 0, client.version) + 1,
    updatedAt: new Date().toISOString(),
  };
}
