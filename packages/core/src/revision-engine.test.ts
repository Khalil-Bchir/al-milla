import test from 'node:test';
import assert from 'node:assert/strict';
import { createLearningLesson, applyStep3TestRating } from './lesson-planner.js';
import {
  buildCareRevisionQueue,
  buildSmartRevisionQueue,
  buildSurahRevisionItems,
  computeSurahRevisionSummaries,
  scoreLessonRevisionPriority,
} from './revision-engine.js';

test('rating and session priority work on the same calendar date with no date filter', () => {
  const easyLesson = applyStep3TestRating(
    createLearningLesson({
      surahId: 67,
      startVerse: 1,
      endVerse: 3,
      sessionNumber: 1,
      todayIso: '2026-11-26',
    }),
    { rating: 'easy', sessionNumber: 1, todayIso: '2026-11-26' },
  );

  const difficultLesson = applyStep3TestRating(
    createLearningLesson({
      surahId: 67,
      startVerse: 4,
      endVerse: 6,
      sessionNumber: 2,
      todayIso: '2026-11-26',
    }),
    { rating: 'difficult', sessionNumber: 2, todayIso: '2026-11-26' },
  );

  const easyScore = scoreLessonRevisionPriority(easyLesson, 3);
  const difficultScore = scoreLessonRevisionPriority(difficultLesson, 3);
  assert.ok(difficultScore > easyScore);

  const care = buildCareRevisionQueue([easyLesson, difficultLesson], { 67: 2 });
  assert.equal(care.length, 1);
  assert.equal(care[0]?.startVerse, 4);
});

test('smart queue groups strictly by surah without interleaving and respects time presets', () => {
  const m1 = applyStep3TestRating(
    createLearningLesson({
      surahId: 67,
      startVerse: 1,
      endVerse: 3,
      sessionNumber: 1,
      todayIso: '2026-11-26',
    }),
    { rating: 'difficult', sessionNumber: 1, todayIso: '2026-11-26' },
  );
  const m2 = applyStep3TestRating(
    createLearningLesson({
      surahId: 67,
      startVerse: 4,
      endVerse: 6,
      sessionNumber: 2,
      todayIso: '2026-11-26',
    }),
    { rating: 'good', sessionNumber: 2, todayIso: '2026-11-26' },
  );
  const m3 = applyStep3TestRating(
    createLearningLesson({
      surahId: 67,
      startVerse: 7,
      endVerse: 9,
      sessionNumber: 3,
      todayIso: '2026-11-26',
    }),
    { rating: 'easy', sessionNumber: 3, todayIso: '2026-11-26' },
  );
  const k1 = applyStep3TestRating(
    createLearningLesson({
      surahId: 18,
      startVerse: 1,
      endVerse: 3,
      sessionNumber: 1,
      todayIso: '2026-11-26',
    }),
    { rating: 'good', sessionNumber: 1, todayIso: '2026-11-26' },
  );

  const q5 = buildSmartRevisionQueue([k1, m1, m2, m3], {
    surahSessions: { 67: 3, 18: 1 },
    currentSurahId: 67,
    timePreset: 5,
  });
  assert.equal(q5.length, 2);
  assert.equal(q5[0]?.surahId, 67);
  assert.equal(q5[1]?.surahId, 67);

  const q10 = buildSmartRevisionQueue([k1, m1, m2, m3], {
    surahSessions: { 67: 3, 18: 1 },
    currentSurahId: 67,
    timePreset: 10,
  });
  assert.equal(q10.length, 4);
  assert.deepEqual(
    q10.map((x) => x.surahId),
    [67, 67, 67, 18],
  );
});

test('surah_connections bridges adjacent lessons within the same surah only', () => {
  const l1 = applyStep3TestRating(
    createLearningLesson({
      surahId: 18,
      startVerse: 1,
      endVerse: 4,
      sessionNumber: 1,
      todayIso: '2026-11-26',
    }),
    { rating: 'good', sessionNumber: 1, todayIso: '2026-11-26' },
  );
  const l2 = applyStep3TestRating(
    createLearningLesson({
      surahId: 18,
      startVerse: 5,
      endVerse: 8,
      sessionNumber: 2,
      todayIso: '2026-11-26',
    }),
    { rating: 'good', sessionNumber: 2, todayIso: '2026-11-26' },
  );
  const otherSurah = applyStep3TestRating(
    createLearningLesson({
      surahId: 67,
      startVerse: 9,
      endVerse: 12,
      sessionNumber: 1,
      todayIso: '2026-11-26',
    }),
    { rating: 'good', sessionNumber: 1, todayIso: '2026-11-26' },
  );

  const connections = buildSurahRevisionItems([l1, l2, otherSurah], {}, {
    surahId: 18,
    mode: 'surah_connections',
  });
  assert.equal(connections.length, 1);
  assert.equal(connections[0]?.surahId, 18);
  assert.equal(connections[0]?.startVerse, 3);
  assert.equal(connections[0]?.endVerse, 6);
  assert.equal(connections[0]?.kind, 'connection');
});

test('surah_random and summaries stay strictly scoped per surah', () => {
  const l1 = applyStep3TestRating(
    createLearningLesson({
      surahId: 18,
      startVerse: 1,
      endVerse: 3,
      sessionNumber: 1,
      todayIso: '2026-11-26',
    }),
    { rating: 'good', sessionNumber: 1, todayIso: '2026-11-26' },
  );
  const l2 = applyStep3TestRating(
    createLearningLesson({
      surahId: 18,
      startVerse: 4,
      endVerse: 6,
      sessionNumber: 2,
      todayIso: '2026-11-26',
    }),
    { rating: 'good', sessionNumber: 2, todayIso: '2026-11-26' },
  );
  const other = applyStep3TestRating(
    createLearningLesson({
      surahId: 67,
      startVerse: 1,
      endVerse: 3,
      sessionNumber: 1,
      todayIso: '2026-11-26',
    }),
    { rating: 'difficult', sessionNumber: 1, todayIso: '2026-11-26' },
  );

  const randomItems = buildSurahRevisionItems([l1, l2, other], {}, {
    surahId: 18,
    mode: 'surah_random',
    seed: 42,
  });
  assert.equal(randomItems.length, 2);
  assert.equal(randomItems.every((i) => i.surahId === 18 && i.kind === 'random_prompt'), true);

  const summaries = computeSurahRevisionSummaries([l1, l2, other], {}, { 18: 2, 67: 1 }, 18);
  assert.equal(summaries[0]?.surahId, 67);
  assert.equal(summaries[0]?.readiness, 'care');
  assert.equal(summaries[1]?.surahId, 18);
  assert.equal(summaries[1]?.hasConnections, true);
});
