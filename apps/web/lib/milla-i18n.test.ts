import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MILLA_COPY,
  formatDigitsInText,
  formatNum,
  getSurahDisplayName,
  type AppLanguage,
} from './milla-i18n.ts';
import { getSurahById } from './quran-data.ts';

describe('milla-i18n', () => {
  it('formats numbers according to active language', () => {
    assert.equal(formatNum(25, 'ar'), '٢٥');
    assert.equal(formatNum(25, 'en'), '25');
    assert.equal(formatNum(25, 'fr'), '25');
  });

  it('formats embedded digits inside text for Arabic only', () => {
    assert.equal(formatDigitsInText('Page 12 of 604', 'ar'), 'Page ١٢ of ٦٠٤');
    assert.equal(formatDigitsInText('Page 12 of 604', 'en'), 'Page 12 of 604');
    assert.equal(formatDigitsInText('Page 12 of 604', 'fr'), 'Page 12 of 604');
  });

  it('formats Surah display names for ar, en, and fr', () => {
    const baqarah = getSurahById(2);
    assert.equal(getSurahDisplayName(baqarah, 'ar'), baqarah.nameAr);
    assert.equal(getSurahDisplayName(baqarah, 'en'), `${baqarah.nameEn} (${baqarah.nameAr})`);
    assert.equal(getSurahDisplayName(baqarah, 'fr'), `${baqarah.nameFr} (${baqarah.nameAr})`);
  });

  it('has complete, non-empty copy keys across ar, en, and fr', () => {
    const langs: AppLanguage[] = ['ar', 'en', 'fr'];
    const arKeys = Object.keys(MILLA_COPY.ar);

    for (const lang of langs) {
      const copy = MILLA_COPY[lang];
      assert.deepEqual(Object.keys(copy).sort(), [...arKeys].sort());
      for (const key of arKeys) {
        const val = copy[key as keyof typeof copy];
        assert.equal(typeof val, 'string', `${lang}.${key} should be a string`);
        assert.ok(val.trim().length > 0, `${lang}.${key} should not be empty`);
      }
    }
  });
});
