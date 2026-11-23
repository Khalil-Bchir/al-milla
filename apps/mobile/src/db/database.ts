import * as SQLite from 'expo-sqlite';
import { z } from 'zod';
import type {
  AyahEntry,
  MemorizedVerseRecord,
  NarrationId,
  PortfolioSyncState,
  ReciterId,
  RevisionIntervalDays,
  SelfEvalRating,
  VerseStatus,
} from '@al-milla/core';

export type PlaybackSpeed = 0.75 | 1.0 | 1.25;

export type DailyStageKey =
  | 'yesterdayReview'
  | 'olderReview'
  | 'newMemorization'
  | 'selfTest'
  | 'verseConnection';

export type DailyStagesMap = Record<DailyStageKey, boolean>;

export interface MobileAppState {
  syncKey: string;
  syncVersion: number;
  lastSyncedAt: string | null;
  narration: NarrationId;
  dailyTarget: number;
  quranFontSize: number;
  reciter: ReciterId;
  playbackSpeed: PlaybackSpeed;
  currentSurahId: number;
  currentAyah: number;
  lastSessionKeys: string[];
  lastSessionCompletedAt: string | null;
  dailyStages: DailyStagesMap;
  verseRecords: Record<string, MemorizedVerseRecord>;
  bookmarks: string[];
  activityDates: string[];
}

const ayahEntrySchema = z.object({
  number: z.number().int().min(1),
  textAr: z.string(),
  translationEn: z.string(),
  translationFr: z.string(),
  transliteration: z.string(),
});

const cachedAyahsSchema = z.array(ayahEntrySchema);

interface SettingRow {
  key: string;
  value: string;
}

interface VerseRow {
  verse_key: string;
  surah_id: number;
  ayah_number: number;
  status: string;
  first_memorized_at: string;
  last_reviewed_at: string;
  next_review_at: string;
  interval_days: number;
  last_evaluation: string | null;
  review_count: number;
}

interface BookmarkRow {
  verse_key: string;
}

interface ActivityRow {
  date_iso: string;
}

interface CachedSurahRow {
  payload_json: string;
}

const DEFAULT_DAILY_STAGES: DailyStagesMap = {
  yesterdayReview: false,
  olderReview: false,
  newMemorization: false,
  selfTest: false,
  verseConnection: false,
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function generateSyncKey(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36).slice(-4);
  return `milla-${rand}-${stamp}`;
}

function toNarrationId(val: string | undefined): NarrationId {
  if (val === 'warsh' || val === 'hafs') return val;
  return 'qalun';
}

function toReciterId(val: string | undefined): ReciterId {
  const valid: ReciterId[] = [
    'hudhaify',
    'husary',
    'minshawi',
    'afasy',
    'abdulbasit',
    'maher',
    'dosari',
    'sudais',
  ];
  const found = valid.find((item) => item === val);
  return found ?? 'hudhaify';
}

function toPlaybackSpeed(val: string | undefined): PlaybackSpeed {
  if (val === '0.75') return 0.75;
  if (val === '1.25') return 1.25;
  return 1.0;
}

function toVerseStatus(val: string): VerseStatus {
  if (val === 'weak' || val === 'in_progress') return val;
  return 'memorized';
}

function toIntervalDays(val: number): RevisionIntervalDays {
  if (val === 3 || val === 7 || val === 14 || val === 30) return val;
  return 1;
}

function toEvalRating(val: string | null): SelfEvalRating | undefined {
  if (val === 'difficult' || val === 'good' || val === 'easy') return val;
  return undefined;
}

function parseInteger(val: string | undefined, fallback: number, min: number, max: number): number {
  if (!val) return fallback;
  const parsed = Number.parseInt(val, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('al_milla.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS verse_records (
          verse_key TEXT PRIMARY KEY NOT NULL,
          surah_id INTEGER NOT NULL,
          ayah_number INTEGER NOT NULL,
          status TEXT NOT NULL,
          first_memorized_at TEXT NOT NULL,
          last_reviewed_at TEXT NOT NULL,
          next_review_at TEXT NOT NULL,
          interval_days INTEGER NOT NULL,
          last_evaluation TEXT,
          review_count INTEGER NOT NULL DEFAULT 0,
          dirty INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS bookmarks (
          verse_key TEXT PRIMARY KEY NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS activity_dates (
          date_iso TEXT PRIMARY KEY NOT NULL
        );
        CREATE TABLE IF NOT EXISTS cached_surahs (
          surah_id INTEGER PRIMARY KEY NOT NULL,
          payload_json TEXT NOT NULL,
          cached_at TEXT NOT NULL,
          source TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

export async function loadAppStateFromDb(): Promise<MobileAppState> {
  const db = await getDatabase();
  const settingRows = await db.getAllAsync<SettingRow>('SELECT key, value FROM settings');
  const settingsMap = new Map<string, string>(settingRows.map((r) => [r.key, r.value]));

  let syncKey = settingsMap.get('syncKey');
  if (!syncKey || syncKey.trim().length < 8) {
    syncKey = generateSyncKey();
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'syncKey',
      syncKey,
    ]);
  }

  const verseRows = await db.getAllAsync<VerseRow>(
    'SELECT verse_key, surah_id, ayah_number, status, first_memorized_at, last_reviewed_at, next_review_at, interval_days, last_evaluation, review_count FROM verse_records',
  );
  const verseRecords: Record<string, MemorizedVerseRecord> = {};
  for (const row of verseRows) {
    verseRecords[row.verse_key] = {
      key: row.verse_key,
      surahId: row.surah_id,
      ayahNumber: row.ayah_number,
      status: toVerseStatus(row.status),
      firstMemorizedAt: row.first_memorized_at,
      lastReviewedAt: row.last_reviewed_at,
      nextReviewAt: row.next_review_at,
      intervalDays: toIntervalDays(row.interval_days),
      lastEvaluation: toEvalRating(row.last_evaluation),
      reviewCount: row.review_count,
    };
  }

  const bookmarkRows = await db.getAllAsync<BookmarkRow>(
    'SELECT verse_key FROM bookmarks ORDER BY created_at ASC',
  );
  const activityRows = await db.getAllAsync<ActivityRow>(
    'SELECT date_iso FROM activity_dates ORDER BY date_iso ASC',
  );

  const rawStages = settingsMap.get('dailyStages');
  let dailyStages: DailyStagesMap = { ...DEFAULT_DAILY_STAGES };
  if (rawStages) {
    try {
      const parsed = z
        .object({
          yesterdayReview: z.boolean().default(false),
          olderReview: z.boolean().default(false),
          newMemorization: z.boolean().default(false),
          selfTest: z.boolean().default(false),
          verseConnection: z.boolean().default(false),
        })
        .safeParse(JSON.parse(rawStages));
      if (parsed.success) {
        dailyStages = parsed.data;
      }
    } catch {
      dailyStages = { ...DEFAULT_DAILY_STAGES };
    }
  }

  let lastSessionKeys: string[] = [];
  const rawSessionKeys = settingsMap.get('lastSessionKeys');
  if (rawSessionKeys) {
    try {
      const parsed = z.array(z.string()).safeParse(JSON.parse(rawSessionKeys));
      if (parsed.success) lastSessionKeys = parsed.data;
    } catch {
      lastSessionKeys = [];
    }
  }

  return {
    syncKey,
    syncVersion: parseInteger(settingsMap.get('syncVersion'), 0, 0, 1_000_000),
    lastSyncedAt: settingsMap.get('lastSyncedAt') ?? null,
    narration: toNarrationId(settingsMap.get('narration')),
    dailyTarget: parseInteger(settingsMap.get('dailyTarget'), 4, 1, 20),
    quranFontSize: parseInteger(settingsMap.get('quranFontSize'), 28, 20, 44),
    reciter: toReciterId(settingsMap.get('reciter')),
    playbackSpeed: toPlaybackSpeed(settingsMap.get('playbackSpeed')),
    currentSurahId: parseInteger(settingsMap.get('currentSurahId'), 18, 1, 114),
    currentAyah: parseInteger(settingsMap.get('currentAyah'), 1, 1, 286),
    lastSessionKeys,
    lastSessionCompletedAt: settingsMap.get('lastSessionCompletedAt') ?? null,
    dailyStages,
    verseRecords,
    bookmarks: bookmarkRows.map((b) => b.verse_key),
    activityDates: activityRows.map((a) => a.date_iso),
  };
}

export async function saveSettingToDb(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}

export async function upsertVerseRecordToDb(
  record: MemorizedVerseRecord,
  dirty = 1,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO verse_records
      (verse_key, surah_id, ayah_number, status, first_memorized_at, last_reviewed_at, next_review_at, interval_days, last_evaluation, review_count, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.key,
      record.surahId,
      record.ayahNumber,
      record.status,
      record.firstMemorizedAt,
      record.lastReviewedAt,
      record.nextReviewAt,
      record.intervalDays,
      record.lastEvaluation ?? null,
      record.reviewCount,
      dirty,
    ],
  );
}

export async function setBookmarkInDb(verseKey: string, enabled: boolean): Promise<void> {
  const db = await getDatabase();
  if (enabled) {
    await db.runAsync(
      'INSERT OR REPLACE INTO bookmarks (verse_key, created_at) VALUES (?, ?)',
      [verseKey, new Date().toISOString()],
    );
  } else {
    await db.runAsync('DELETE FROM bookmarks WHERE verse_key = ?', [verseKey]);
  }
}

export async function recordActivityDateInDb(dateIso: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO activity_dates (date_iso) VALUES (?)', [dateIso]);
}

export async function applyMergedPortfolioToDb(merged: PortfolioSyncState): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'syncKey',
      merged.syncKey,
    ]);
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'syncVersion',
      String(merged.version),
    ]);
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'lastSyncedAt',
      merged.updatedAt,
    ]);
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'narration',
      merged.narration,
    ]);
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'dailyTarget',
      String(merged.dailyTarget),
    ]);
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'currentSurahId',
      String(merged.currentSurahId),
    ]);
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'currentAyah',
      String(merged.currentAyah),
    ]);

    for (const v of merged.verses) {
      await db.runAsync(
        `INSERT OR REPLACE INTO verse_records
          (verse_key, surah_id, ayah_number, status, first_memorized_at, last_reviewed_at, next_review_at, interval_days, last_evaluation, review_count, dirty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          v.key,
          v.surahId,
          v.ayahNumber,
          v.status,
          v.firstMemorizedAt,
          v.lastReviewedAt,
          v.nextReviewAt,
          v.intervalDays,
          v.lastEvaluation ?? null,
          v.reviewCount,
        ],
      );
    }

    const nowIso = new Date().toISOString();
    for (const key of merged.bookmarks) {
      await db.runAsync(
        'INSERT OR IGNORE INTO bookmarks (verse_key, created_at) VALUES (?, ?)',
        [key, nowIso],
      );
    }
    for (const dateIso of merged.activityDates) {
      await db.runAsync('INSERT OR IGNORE INTO activity_dates (date_iso) VALUES (?)', [
        dateIso,
      ]);
    }
  });
}

export async function getCachedSurahFromDb(surahId: number): Promise<AyahEntry[] | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<CachedSurahRow>(
      'SELECT payload_json FROM cached_surahs WHERE surah_id = ?',
      [surahId],
    );
    if (!row) return null;
    const parsed = cachedAyahsSchema.safeParse(JSON.parse(row.payload_json));
    if (!parsed.success || parsed.data.length === 0) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export async function saveCachedSurahToDb(
  surahId: number,
  ayahs: AyahEntry[],
  source: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO cached_surahs (surah_id, payload_json, cached_at, source) VALUES (?, ?, ?, ?)',
    [surahId, JSON.stringify(ayahs), new Date().toISOString(), source],
  );
}
