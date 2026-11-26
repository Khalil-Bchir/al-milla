import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyLessonReviewRating,
  applyStep3TestRating,
  computeLinkAnchorRange,
  computeMultiSurahRevisionGroups,
  computeSurahRevisionPlan,
  createLearningLesson,
  findActiveLearningLesson,
  getSurahActiveSessionNumber,
  nextSessionInterval,
} from './lesson-planner.js';
import { maskVerseDynamic, maskVerseForStrengthening } from './verse-masking.js';
import type { AyahEntry } from './quran-metadata.js';
import type { MemorizedVerseRecord } from './revision-queues.js';

test('getSurahActiveSessionNumber numbers sessions independently per surah', () => {
  const surahSessions: Record<number, number> = { 67: 2 };
  assert.equal(getSurahActiveSessionNumber(surahSessions, 67), 3);
  assert.equal(getSurahActiveSessionNumber(surahSessions, 18), 1);
});

test('Step 3 rating transitions: Difficult -> Learning, Good -> Strengthening(1), Easy -> Done(3)', () => {
  const base = createLearningLesson({
    surahId: 67,
    startVerse: 1,
    endVerse: 3,
    sessionNumber: 1,
    todayIso: '2026-11-25',
  });
  assert.equal(base.state, 'learning');

  const diff = applyStep3TestRating(base, {
    rating: 'difficult',
    sessionNumber: 1,
    todayIso: '2026-11-25',
  });
  assert.equal(diff.state, 'learning');
  assert.equal(diff.nextReviewSession, 2);

  const good = applyStep3TestRating(base, {
    rating: 'good',
    sessionNumber: 1,
    todayIso: '2026-11-25',
  });
  assert.equal(good.state, 'strengthening');
  assert.equal(good.hidingLevel, 1);
  assert.equal(good.nextReviewSession, 2);

  const easy = applyStep3TestRating(base, {
    rating: 'easy',
    sessionNumber: 1,
    todayIso: '2026-11-25',
  });
  assert.equal(easy.state, 'done');
  assert.equal(easy.hidingLevel, 3);
});

test('Strengthening review rules: Easy levels up to Done at 3, Good keeps level, 2x Difficult -> Learning', () => {
  const start = applyStep3TestRating(
    createLearningLesson({
      surahId: 67,
      startVerse: 1,
      endVerse: 3,
      sessionNumber: 1,
      todayIso: '2026-11-25',
    }),
    { rating: 'good', sessionNumber: 1, todayIso: '2026-11-25' },
  );

  // Good keeps level 1
  const stay1 = applyLessonReviewRating(start, {
    rating: 'good',
    sessionNumber: 2,
    todayIso: '2026-11-25',
  });
  assert.equal(stay1.state, 'strengthening');
  assert.equal(stay1.hidingLevel, 1);

  // Easy moves 1 -> 2 -> 3 -> Done
  const lvl2 = applyLessonReviewRating(stay1, {
    rating: 'easy',
    sessionNumber: 3,
    todayIso: '2026-11-25',
  });
  assert.equal(lvl2.state, 'strengthening');
  assert.equal(lvl2.hidingLevel, 2);

  const lvl3 = applyLessonReviewRating(lvl2, {
    rating: 'easy',
    sessionNumber: 4,
    todayIso: '2026-11-25',
  });
  assert.equal(lvl3.state, 'strengthening');
  assert.equal(lvl3.hidingLevel, 3);

  const done = applyLessonReviewRating(lvl3, {
    rating: 'easy',
    sessionNumber: 5,
    todayIso: '2026-11-25',
  });
  assert.equal(done.state, 'done');

  // Two Difficult in a row -> back to Learning
  const diffOnce = applyLessonReviewRating(lvl2, {
    rating: 'difficult',
    sessionNumber: 4,
    todayIso: '2026-11-25',
  });
  assert.equal(diffOnce.state, 'strengthening');
  assert.equal(diffOnce.hidingLevel, 1);

  const diffTwice = applyLessonReviewRating(diffOnce, {
    rating: 'difficult',
    sessionNumber: 5,
    todayIso: '2026-11-25',
  });
  assert.equal(diffTwice.state, 'learning');
});

test('computeSurahRevisionPlan filters to active surah and splits Last session vs Earlier sessions', () => {
  const s1 = applyStep3TestRating(
    createLearningLesson({
      surahId: 67,
      startVerse: 1,
      endVerse: 3,
      sessionNumber: 1,
      todayIso: '2026-11-25',
    }),
    { rating: 'good', sessionNumber: 1, todayIso: '2026-11-25' },
  );
  const otherSurah = createLearningLesson({
    surahId: 18,
    startVerse: 1,
    endVerse: 3,
    sessionNumber: 1,
    todayIso: '2026-11-25',
  });

  const plan = computeSurahRevisionPlan([s1, otherSurah], {
    surahId: 67,
    activeSessionNumber: 2,
    todayIso: '2026-11-25',
  });

  assert.equal(plan.allLessons.length, 1);
  assert.equal(plan.lastSessionLessons.length, 1);
  assert.equal(plan.earlierSessionLessons.length, 0);
  assert.equal(findActiveLearningLesson([s1, otherSurah], 67), null);
  assert.equal(findActiveLearningLesson([s1, otherSurah], 18)?.id, otherSurah.id);
});

test('computeMultiSurahRevisionGroups puts current surah first and caps other surahs at 2', () => {
  const l1 = createLearningLesson({
    surahId: 18,
    startVerse: 1,
    endVerse: 3,
    sessionNumber: 1,
    todayIso: '2026-10-01',
  });
  const l2 = createLearningLesson({
    surahId: 18,
    startVerse: 4,
    endVerse: 6,
    sessionNumber: 2,
    todayIso: '2026-10-02',
  });
  const l3 = createLearningLesson({
    surahId: 18,
    startVerse: 7,
    endVerse: 9,
    sessionNumber: 3,
    todayIso: '2026-10-03',
  });
  const current = createLearningLesson({
    surahId: 67,
    startVerse: 1,
    endVerse: 3,
    sessionNumber: 1,
    todayIso: '2026-11-25',
  });

  const groups = computeMultiSurahRevisionGroups([l1, l2, l3, current], {
    currentSurahId: 67,
    surahSessions: { 67: 1, 18: 3 },
    todayIso: '2026-11-25',
  });

  assert.equal(groups[0]?.surahId, 67);
  assert.equal(groups[1]?.surahId, 18);
  assert.equal(groups[1]?.lessons.length, 2);
});

test('maskVerseForStrengthening hides last words (1), half (2), and everything (3)', () => {
  const sample = 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ';
  const lvl1 = maskVerseForStrengthening(sample, 1);
  const lvl2 = maskVerseForStrengthening(sample, 2);
  const lvl3 = maskVerseForStrengthening(sample, 3);

  assert.ok(lvl1.startsWith('تَبَارَكَ'));
  assert.ok(lvl1.endsWith('•••••'));
  assert.ok(lvl2.startsWith('تَبَارَكَ'));
  assert.ok(lvl2.split(' ').filter((w) => w === '•••••').length >= 4);
  assert.equal(lvl3.split(' ').every((w) => w === '•••••'), true);
});

test('maskVerseDynamic scales hidden word count by repeatCount and verse length', () => {
  const sample = 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ';
  const totalWords = sample.split(' ').length;

  const r1 = maskVerseDynamic(sample, { repeatCount: 1, targetRepeats: 5, ayahNumber: 1 });
  assert.equal(r1, sample);

  const r2 = maskVerseDynamic(sample, { repeatCount: 2, targetRepeats: 5, ayahNumber: 1 });
  const r4 = maskVerseDynamic(sample, { repeatCount: 4, targetRepeats: 5, ayahNumber: 1 });
  const r5 = maskVerseDynamic(sample, { repeatCount: 5, targetRepeats: 5, ayahNumber: 1 });

  const hidden2 = r2.split(' ').filter((w) => w === '•••••').length;
  const hidden4 = r4.split(' ').filter((w) => w === '•••••').length;
  const hidden5 = r5.split(' ').filter((w) => w === '•••••').length;

  assert.ok(hidden2 >= 1 && hidden2 < hidden4);
  assert.ok(hidden4 < totalWords);
  assert.equal(hidden5, totalWords);
});

test('nextSessionInterval and computeLinkAnchorRange behave as expected', () => {
  assert.equal(nextSessionInterval(1, 'good'), 3);
  const ayahs: AyahEntry[] = Array.from({ length: 8 }, (_, idx) => ({
    number: idx + 1,
    textAr: `آية ${idx + 1}`,
    translationEn: '',
    translationFr: '',
    transliteration: '',
  }));
  const verseRecords: Record<string, MemorizedVerseRecord> = {};
  for (let n = 1; n <= 3; n += 1) {
    verseRecords[`67:${n}`] = {
      key: `67:${n}`,
      surahId: 67,
      ayahNumber: n,
      status: 'memorized',
      firstMemorizedAt: '2026-11-25T00:00:00Z',
      lastReviewedAt: '2026-11-25T00:00:00Z',
      nextReviewAt: '2026-11-26T00:00:00Z',
      intervalDays: 1,
      reviewCount: 1,
    };
  }
  const link = computeLinkAnchorRange({
    ayahs,
    startIdx: 3,
    portionCount: 3,
    verseRecords,
    surahId: 67,
  });
  assert.equal(link.hasOldVerses, true);
  assert.equal(link.oldVerseCount, 3);
  assert.equal(link.ayahs[0]?.number, 1);
  assert.equal(link.ayahs[link.ayahs.length - 1]?.number, 6);
});
