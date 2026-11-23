import { z } from 'zod';
import type { PortfolioSyncState } from '@al-milla/core';
import { applyMergedPortfolioToDb, type MobileAppState } from '../db/database';

const syncedVerseSchema = z.object({
  key: z.string(),
  surahId: z.number().int().min(1).max(114),
  ayahNumber: z.number().int().min(1).max(286),
  status: z.enum(['memorized', 'in_progress', 'weak']),
  firstMemorizedAt: z.string(),
  lastReviewedAt: z.string(),
  nextReviewAt: z.string(),
  intervalDays: z.number().int().min(1).max(365),
  lastEvaluation: z.enum(['difficult', 'good', 'easy']).optional(),
  reviewCount: z.number().int().min(0),
});

const syncSuccessResponseSchema = z.object({
  data: z.object({
    syncKey: z.string(),
    narration: z.enum(['qalun', 'warsh', 'hafs']),
    dailyTarget: z.number().int().min(1).max(20),
    currentSurahId: z.number().int().min(1).max(114),
    currentAyah: z.number().int().min(1).max(286),
    bookmarks: z.array(z.string()),
    activityDates: z.array(z.string()),
    verses: z.array(syncedVerseSchema),
    version: z.number().int().min(1).default(1),
    updatedAt: z.string(),
  }),
});

export interface SyncOutcome {
  ok: boolean;
  mergedState: PortfolioSyncState | null;
  error: string | null;
}

export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured && configured.trim().length > 0) {
    return configured.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

function toIntervalDays(days: number): 1 | 3 | 7 | 14 | 30 {
  if (days === 3 || days === 7 || days === 14 || days === 30) return days;
  return 1;
}

function parseSyncData(rawJson: string): PortfolioSyncState {
  const parsed = syncSuccessResponseSchema.safeParse(JSON.parse(rawJson));
  if (!parsed.success) {
    throw new Error('استجابة غير صالحة من خادم المزامنة');
  }
  const d = parsed.data.data;
  return {
    syncKey: d.syncKey,
    narration: d.narration,
    dailyTarget: d.dailyTarget,
    currentSurahId: d.currentSurahId,
    currentAyah: d.currentAyah,
    bookmarks: d.bookmarks,
    activityDates: d.activityDates,
    verses: d.verses.map((v) => ({
      ...v,
      intervalDays: toIntervalDays(v.intervalDays),
    })),
    version: d.version,
    updatedAt: d.updatedAt,
  };
}

export async function syncPortfolioWithCloud(state: MobileAppState): Promise<SyncOutcome> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncKey: state.syncKey,
        narration: state.narration,
        dailyTarget: state.dailyTarget,
        currentSurahId: state.currentSurahId,
        currentAyah: state.currentAyah,
        bookmarks: state.bookmarks.slice(-200),
        activityDates: state.activityDates.slice(-365),
        verses: Object.values(state.verseRecords),
        version: state.syncVersion,
        clientUpdatedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    const merged = parseSyncData(text);
    await applyMergedPortfolioToDb(merged);

    return { ok: true, mergedState: merged, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'تعذّر الاتصال بخادم المزامنة';
    return { ok: false, mergedState: null, error: message };
  }
}

export async function restorePortfolioFromCloud(
  syncKey: string,
  currentState: MobileAppState,
): Promise<SyncOutcome> {
  const cleanKey = syncKey.trim();
  if (cleanKey.length < 8) {
    return { ok: false, mergedState: null, error: 'مفتاح المزامنة يجب أن يكون 8 أحرف على الأقل' };
  }

  try {
    const baseUrl = getApiBaseUrl();
    const getRes = await fetch(
      `${baseUrl}/api/v1/sync?syncKey=${encodeURIComponent(cleanKey)}`,
    );

    if (getRes.status === 404) {
      // No cloud backup yet for this key; push local state to initialize it
      return await syncPortfolioWithCloud({ ...currentState, syncKey: cleanKey });
    }

    if (!getRes.ok) {
      throw new Error(`HTTP ${getRes.status}`);
    }

    const text = await getRes.text();
    const cloudState = parseSyncData(text);
    await applyMergedPortfolioToDb(cloudState);
    return { ok: true, mergedState: cloudState, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'تعذّر استعادة النسخة السحابية';
    return { ok: false, mergedState: null, error: message };
  }
}
