import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  KAHF_TAFSIR_WORDS,
  MUTASHABIHAT_DRILLS,
  RECITERS,
  SURAHS,
  getEveryAyahAudioUrl,
  getSurahById,
  toArabicDigits,
} from './quran-data.ts';

describe('quran-data', () => {
  it('contains all 114 Surahs in sequential order with valid metadata', () => {
    assert.equal(SURAHS.length, 114);
    for (let i = 0; i < SURAHS.length; i++) {
      const surah = SURAHS[i];
      assert.equal(surah.id, i + 1);
      assert.ok(surah.totalAyahs >= 3);
      assert.ok(surah.pageStart >= 1 && surah.pageStart <= 604);
      assert.ok(surah.juz >= 1 && surah.juz <= 30);
      assert.ok(surah.hizb >= 1 && surah.hizb <= 60);
      assert.ok(surah.nameAr.length > 0);
      assert.ok(surah.nameEn.length > 0);
      assert.ok(surah.nameFr.length > 0);
    }
  });

  it('resolves Surahs by ID and falls back to Surah 18 (Al-Kahf) for out-of-range IDs', () => {
    assert.equal(getSurahById(2).id, 2);
    assert.equal(getSurahById(114).id, 114);
    assert.equal(getSurahById(999).id, 18);
    assert.equal(getSurahById(0).id, 18);
  });

  it('converts numbers to Arabic-Indic digits', () => {
    assert.equal(toArabicDigits(0), '٠');
    assert.equal(toArabicDigits(114), '١١٤');
    assert.equal(toArabicDigits(604), '٦٠٤');
  });

  it('builds zero-padded EveryAyah audio URLs for all 8 reciters', () => {
    assert.equal(RECITERS.length, 8);
    const url = getEveryAyahAudioUrl('hudhaify', 2, 255);
    assert.equal(url, 'https://everyayah.com/data/Hudhaify_128kbps/002255.mp3');

    const fatihah = getEveryAyahAudioUrl('husary', 1, 1);
    assert.equal(fatihah, 'https://everyayah.com/data/Husary_128kbps/001001.mp3');
  });

  it('provides non-empty tafsir notes and mutashabihat drills', () => {
    assert.ok(KAHF_TAFSIR_WORDS.length > 0);
    for (const note of KAHF_TAFSIR_WORDS) {
      assert.ok(note.word.length > 0);
      assert.ok(note.meaningAr.length > 0);
      assert.ok(note.meaningEn.length > 0);
      assert.ok(note.meaningFr.length > 0);
    }

    assert.ok(MUTASHABIHAT_DRILLS.length > 0);
    for (const drill of MUTASHABIHAT_DRILLS) {
      assert.ok(drill.id.length > 0);
      assert.ok(drill.primarySurahId >= 1 && drill.primarySurahId <= 114);
    }
  });
});
