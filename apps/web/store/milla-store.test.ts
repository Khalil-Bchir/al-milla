import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeProgressMetrics, useMillaStore } from './milla-store.ts';

describe('milla-store', () => {
  beforeEach(() => {
    useMillaStore.getState().resetLocalProgress();
  });

  it('preserves per-Surah cursors when switching Surahs', () => {
    const store = useMillaStore.getState();
    store.setCurrentPosition(2, 21);
    store.setCurrentPosition(67, 5);

    const state = useMillaStore.getState();
    assert.equal(state.currentSurahId, 67);
    assert.equal(state.currentAyah, 5);
    assert.equal(state.surahCursors[2], 21);
    assert.equal(state.surahCursors[67], 5);

    // Resuming Surah 2 restores Ayah 21
    store.setCurrentPosition(2, state.surahCursors[2] ?? 1);
    assert.equal(useMillaStore.getState().currentAyah, 21);
  });

  it('marks new verses as in_progress during learning and promotes only on self-test', () => {
    const store = useMillaStore.getState();
    store.setVerseStatus('2:1', 'in_progress');

    let state = useMillaStore.getState();
    assert.equal(state.verseRecords['2:1']?.status, 'in_progress');
    assert.equal(state.dailyStages.selfTest, false);

    // Revision rating (markSelfTest = false) must NOT mark dailyStages.selfTest = true
    store.recordEvaluation('2:1', 'good');
    state = useMillaStore.getState();
    assert.equal(state.verseRecords['2:1']?.status, 'memorized');
    assert.equal(state.dailyStages.selfTest, false);

    // Self-test rating (markSelfTest = true) DOES mark dailyStages.selfTest = true
    store.recordEvaluation('2:2', 'easy', true);
    state = useMillaStore.getState();
    assert.equal(state.verseRecords['2:2']?.status, 'memorized');
    assert.equal(state.verseRecords['2:2']?.intervalDays, 7);
    assert.equal(state.dailyStages.selfTest, true);
  });

  it('marks difficult evaluations as weak with interval reset to 1 day', () => {
    const store = useMillaStore.getState();
    store.recordEvaluation('1:1', 'easy', true);
    assert.equal(useMillaStore.getState().verseRecords['1:1']?.intervalDays, 7);

    store.recordEvaluation('1:1', 'difficult', false);
    const updated = useMillaStore.getState().verseRecords['1:1'];
    assert.equal(updated?.status, 'weak');
    assert.equal(updated?.intervalDays, 1);
  });

  it('records last completed session keys and timestamp', () => {
    useMillaStore.getState().setLastCompletedSession(['1:1', '1:2', '1:3']);
    const state = useMillaStore.getState();
    assert.deepEqual(state.lastSessionKeys, ['1:1', '1:2', '1:3']);
    assert.ok(state.lastSessionCompletedAt !== null);
  });

  it('toggles bookmarks and mutashabihat mastery', () => {
    const store = useMillaStore.getState();
    store.toggleBookmark('2:255');
    assert.deepEqual(useMillaStore.getState().bookmarks, ['2:255']);
    store.toggleBookmark('2:255');
    assert.deepEqual(useMillaStore.getState().bookmarks, []);

    store.setMutashabihatMastered('drill-1', true);
    assert.equal(useMillaStore.getState().mutashabihatMastered['drill-1'], true);
  });

  it('imports backup data and resets progress cleanly', () => {
    const store = useMillaStore.getState();
    store.importBackupData({
      dailyTarget: 5,
      currentSurahId: 18,
      currentAyah: 10,
      bookmarks: ['18:10'],
    });

    let state = useMillaStore.getState();
    assert.equal(state.dailyTarget, 5);
    assert.equal(state.currentSurahId, 18);
    assert.equal(state.currentAyah, 10);
    assert.deepEqual(state.bookmarks, ['18:10']);

    store.resetLocalProgress();
    state = useMillaStore.getState();
    assert.equal(state.currentSurahId, 1);
    assert.equal(state.currentAyah, 1);
    assert.deepEqual(state.verseRecords, {});
    assert.deepEqual(state.surahCursors, {});
  });

  it('computes progress metrics accurately', () => {
    const store = useMillaStore.getState();
    // Complete all 7 verses of Surah 1 (Al-Fatihah)
    for (let i = 1; i <= 7; i++) {
      store.recordEvaluation(`1:${i}`, 'good', true);
    }
    const state = useMillaStore.getState();
    const metrics = computeProgressMetrics(state.verseRecords, state.activityDates, 1);

    assert.equal(metrics.totalMemorizedVerses, 7);
    assert.equal(metrics.completedSurahsCount, 1);
    assert.equal(metrics.retentionPercent, 100);
    assert.equal(metrics.last7Days.length, 7);
    assert.equal(metrics.surahMasteryList[0]?.percent, 100);
  });
});
