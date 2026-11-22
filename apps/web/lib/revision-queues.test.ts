import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_SESSION_GAP_MS,
  computeRevisionQueues,
  type MemorizedVerseRecord,
} from './revision-queues.ts';

function makeRecord(
  key: string,
  overrides: Partial<MemorizedVerseRecord> = {},
): MemorizedVerseRecord {
  const [s, a] = key.split(':').map(Number);
  return {
    key,
    surahId: s,
    ayahNumber: a,
    status: 'memorized',
    firstMemorizedAt: '2026-11-20T20:00:00.000Z',
    lastReviewedAt: '2026-11-20T20:00:00.000Z',
    nextReviewAt: '2026-11-21T20:00:00.000Z',
    intervalDays: 1,
    lastEvaluation: 'good',
    reviewCount: 1,
    ...overrides,
  };
}

describe('computeRevisionQueues', () => {
  it('excludes verses learned in the just-completed session ("learned today")', () => {
    const sessionCompletedAt = '2026-11-22T12:00:00.000Z';
    const nowMs = Date.parse('2026-11-22T12:10:00.000Z'); // 10 minutes later

    const records: Record<string, MemorizedVerseRecord> = {
      '2:1': makeRecord('2:1', {
        firstMemorizedAt: sessionCompletedAt,
        lastReviewedAt: sessionCompletedAt,
        nextReviewAt: '2026-11-23T12:00:00.000Z',
      }),
    };

    const result = computeRevisionQueues(records, {
      lastSessionKeys: ['2:1'],
      lastSessionCompletedAt: sessionCompletedAt,
      nowMs,
    });

    assert.equal(result.yesterdayItems.length, 0);
    assert.equal(result.olderDueItems.length, 0);
    assert.equal(result.weakItems.length, 0);
    assert.equal(result.totalDueCount, 0);
  });

  it('clears yesterdayItems immediately after the user reviews them today ("reviewed today")', () => {
    const sessionCompletedAt = '2026-11-21T21:00:00.000Z'; // Last night
    const reviewedTodayAt = '2026-11-22T09:00:00.000Z';
    const nowMs = Date.parse('2026-11-22T09:05:00.000Z');

    const records: Record<string, MemorizedVerseRecord> = {
      '2:1': makeRecord('2:1', {
        firstMemorizedAt: sessionCompletedAt,
        lastReviewedAt: reviewedTodayAt,
        nextReviewAt: '2026-11-25T09:00:00.000Z',
      }),
    };

    const result = computeRevisionQueues(records, {
      lastSessionKeys: ['2:1'],
      lastSessionCompletedAt: sessionCompletedAt,
      nowMs,
    });

    assert.equal(result.yesterdayItems.length, 0);
    assert.equal(result.olderDueItems.length, 0);
    assert.equal(result.totalDueCount, 0);
  });

  it('preserves previous lesson in yesterdayItems even if the user skipped a day ("skipped a day")', () => {
    const sessionCompletedAt = '2026-11-19T21:30:00.000Z'; // 3 days ago (e.g. after Isha)
    const nowMs = Date.parse('2026-11-22T10:00:00.000Z'); // Skipped 2 days

    const records: Record<string, MemorizedVerseRecord> = {
      '67:1': makeRecord('67:1', {
        firstMemorizedAt: sessionCompletedAt,
        lastReviewedAt: sessionCompletedAt,
        nextReviewAt: '2026-11-20T21:30:00.000Z',
      }),
    };

    const result = computeRevisionQueues(records, {
      lastSessionKeys: ['67:1'],
      lastSessionCompletedAt: sessionCompletedAt,
      nowMs,
    });

    assert.equal(result.yesterdayItems.length, 1);
    assert.equal(result.yesterdayItems[0].key, '67:1');
    assert.equal(result.olderDueItems.length, 0);
    assert.equal(result.totalDueCount, 1);
  });

  it('places difficult-but-memorized verses in weakItems only without double-counting', () => {
    const sessionCompletedAt = '2026-11-20T18:00:00.000Z';
    const nowMs = Date.parse('2026-11-22T12:00:00.000Z');

    const records: Record<string, MemorizedVerseRecord> = {
      '2:2': makeRecord('2:2', {
        status: 'memorized',
        lastEvaluation: 'difficult',
        nextReviewAt: '2026-11-21T18:00:00.000Z',
      }),
      '2:3': makeRecord('2:3', {
        status: 'weak',
        lastEvaluation: 'difficult',
        nextReviewAt: '2026-11-21T18:00:00.000Z',
      }),
    };

    const result = computeRevisionQueues(records, {
      lastSessionKeys: ['2:2'],
      lastSessionCompletedAt: sessionCompletedAt,
      nowMs,
    });

    assert.equal(result.yesterdayItems.length, 0);
    assert.equal(result.olderDueItems.length, 0);
    assert.equal(result.weakItems.length, 2);
    assert.equal(result.totalDueCount, 2);
  });

  it('never queues in_progress verses that have not passed self-test', () => {
    const nowMs = Date.parse('2026-11-22T12:00:00.000Z');
    const records: Record<string, MemorizedVerseRecord> = {
      '2:5': makeRecord('2:5', {
        status: 'in_progress',
        nextReviewAt: '2026-11-21T12:00:00.000Z',
      }),
    };

    const result = computeRevisionQueues(records, {
      lastSessionKeys: ['2:5'],
      lastSessionCompletedAt: new Date(nowMs - MIN_SESSION_GAP_MS - 1000).toISOString(),
      nowMs,
    });

    assert.equal(result.totalDueCount, 0);
  });
});
