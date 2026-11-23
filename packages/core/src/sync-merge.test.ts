import assert from 'node:assert/strict';
import test from 'node:test';
import { applyVerseEvaluation, computeRevisionQueues } from './revision-queues.js';
import { mergePortfolioStates, type PortfolioSyncState } from './sync-merge.js';
import { formatCueText, maskVerseByLevel } from './verse-masking.js';

function makeVerse(
  surahId: number,
  ayahNumber: number,
  lastReviewedAt: string,
  reviewCount = 1,
  status: 'memorized' | 'weak' | 'in_progress' = 'memorized',
) {
  return {
    key: `${surahId}:${ayahNumber}`,
    surahId,
    ayahNumber,
    status,
    firstMemorizedAt: '2026-11-01T10:00:00.000Z',
    lastReviewedAt,
    nextReviewAt: '2026-11-25T10:00:00.000Z',
    intervalDays: 3 as const,
    lastEvaluation: 'good' as const,
    reviewCount,
  };
}

test('empty fresh device pushing to existing cloud portfolio does not wipe server verses', () => {
  const server: PortfolioSyncState = {
    syncKey: 'milla-test-key',
    narration: 'hafs',
    dailyTarget: 5,
    currentSurahId: 18,
    currentAyah: 7,
    bookmarks: ['18:10'],
    activityDates: ['2026-11-20', '2026-11-21'],
    verses: [makeVerse(18, 1, '2026-11-21T12:00:00.000Z', 2)],
    version: 3,
    updatedAt: '2026-11-21T12:00:00.000Z',
  };

  const freshClient: PortfolioSyncState = {
    syncKey: 'milla-test-key',
    narration: 'qalun',
    dailyTarget: 4,
    currentSurahId: 1,
    currentAyah: 1,
    bookmarks: [],
    activityDates: [],
    verses: [],
    version: 0,
    updatedAt: '2026-11-21T10:00:00.000Z',
  };

  const merged = mergePortfolioStates(server, freshClient);
  assert.equal(merged.verses.length, 1);
  assert.equal(merged.verses[0]?.key, '18:1');
  assert.deepEqual(merged.bookmarks, ['18:10']);
  assert.equal(merged.currentSurahId, 18);
  assert.equal(merged.currentAyah, 7);
  assert.equal(merged.version, 4);
});

test('concurrent edits from iOS and Android on different verses merge cleanly', () => {
  const iosState: PortfolioSyncState = {
    syncKey: 'milla-test-key',
    narration: 'hafs',
    dailyTarget: 4,
    currentSurahId: 112,
    currentAyah: 4,
    bookmarks: ['112:1'],
    activityDates: ['2026-11-22'],
    verses: [makeVerse(112, 1, '2026-11-22T09:00:00.000Z', 1)],
    version: 2,
    updatedAt: '2026-11-22T09:00:00.000Z',
  };

  const androidState: PortfolioSyncState = {
    syncKey: 'milla-test-key',
    narration: 'hafs',
    dailyTarget: 4,
    currentSurahId: 113,
    currentAyah: 2,
    bookmarks: ['113:1'],
    activityDates: ['2026-11-23'],
    verses: [makeVerse(113, 1, '2026-11-23T08:00:00.000Z', 1)],
    version: 2,
    updatedAt: '2026-11-23T08:00:00.000Z',
  };

  const merged = mergePortfolioStates(iosState, androidState);
  assert.equal(merged.verses.length, 2);
  assert.deepEqual(
    merged.verses.map((v) => v.key),
    ['112:1', '113:1'],
  );
  assert.deepEqual(merged.bookmarks, ['112:1', '113:1']);
  assert.deepEqual(merged.activityDates, ['2026-11-22', '2026-11-23']);
  assert.equal(merged.version, 3);
});

test('same-verse conflict resolves to newer lastReviewedAt and higher reviewCount', () => {
  const olderServer: PortfolioSyncState = {
    syncKey: 'milla-test-key',
    narration: 'hafs',
    dailyTarget: 4,
    currentSurahId: 1,
    currentAyah: 2,
    bookmarks: [],
    activityDates: [],
    verses: [makeVerse(1, 2, '2026-11-22T08:00:00.000Z', 1, 'weak')],
    version: 1,
    updatedAt: '2026-11-22T08:00:00.000Z',
  };

  const newerClient: PortfolioSyncState = {
    syncKey: 'milla-test-key',
    narration: 'hafs',
    dailyTarget: 4,
    currentSurahId: 1,
    currentAyah: 2,
    bookmarks: [],
    activityDates: [],
    verses: [makeVerse(1, 2, '2026-11-23T08:00:00.000Z', 2, 'memorized')],
    version: 1,
    updatedAt: '2026-11-23T08:00:00.000Z',
  };

  const merged = mergePortfolioStates(olderServer, newerClient);
  assert.equal(merged.verses.length, 1);
  assert.equal(merged.verses[0]?.status, 'memorized');
  assert.equal(merged.verses[0]?.reviewCount, 2);
});

test('applyVerseEvaluation and computeRevisionQueues handle weak and due verses', () => {
  const rec = applyVerseEvaluation(undefined, {
    surahId: 112,
    ayahNumber: 1,
    rating: 'difficult',
    nowIso: '2026-11-23T10:00:00.000Z',
  });
  assert.equal(rec.status, 'weak');
  assert.equal(rec.intervalDays, 1);

  const summary = computeRevisionQueues({ [rec.key]: rec });
  assert.equal(summary.weakItems.length, 1);
  assert.equal(formatCueText('قُلْ هُوَ اللَّهُ أَحَدٌ'), 'قُلْ هُوَ ...');
  assert.ok(maskVerseByLevel('قُلْ هُوَ اللَّهُ أَحَدٌ', 3).includes('•••••'));
});
