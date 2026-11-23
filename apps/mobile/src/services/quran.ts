import { z } from 'zod';
import {
  getSurahById,
  stripLeadingBasmalah,
  type AyahEntry,
  type MushafPageAyah,
} from '@al-milla/core';
import {
  getCachedMushafPageFromDb,
  getCachedSurahFromDb,
  saveCachedMushafPageToDb,
  saveCachedSurahToDb,
} from '../db/database';

const alQuranCloudResponseSchema = z.object({
  code: z.number(),
  data: z
    .array(
      z.object({
        ayahs: z.array(
          z.object({
            numberInSurah: z.number().int().min(1),
            text: z.string(),
          }),
        ),
      }),
    )
    .optional(),
});

const alQuranCloudPageResponseSchema = z.object({
  code: z.number(),
  data: z
    .object({
      number: z.number().int(),
      ayahs: z.array(
        z.object({
          numberInSurah: z.number().int().min(1),
          text: z.string(),
          juz: z.number().int().min(1),
          page: z.number().int().min(1),
          surah: z.object({
            number: z.number().int().min(1).max(114),
            name: z.string(),
          }),
        }),
      ),
    })
    .optional(),
});

export interface SurahLoadResult {
  ayahs: AyahEntry[];
  fromCache: boolean;
  error: string | null;
}

export interface MushafPageLoadResult {
  ayahs: MushafPageAyah[];
  fromCache: boolean;
  error: string | null;
}

export async function loadVerifiedSurahAyahs(surahId: number): Promise<SurahLoadResult> {
  const surah = getSurahById(surahId);

  try {
    const cached = await getCachedSurahFromDb(surahId);
    if (cached && cached.length >= surah.totalAyahs) {
      return {
        ayahs: cached.map((a) => ({
          ...a,
          textAr: stripLeadingBasmalah(surahId, a.number, a.textAr),
        })),
        fromCache: true,
        error: null,
      };
    }
  } catch {
    // Fall through to bundled or network
  }

  if (surah.ayahs.length === surah.totalAyahs && surah.ayahs.length > 0) {
    try {
      await saveCachedSurahToDb(surahId, surah.ayahs, 'bundled-verified-uthmani');
    } catch {
      // Non-fatal cache write failure
    }
    return { ayahs: surah.ayahs, fromCache: true, error: null };
  }

  try {
    const response = await fetch(
      `https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,en.sahih,fr.hamidullah`,
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const rawText = await response.text();
    const parsed = alQuranCloudResponseSchema.safeParse(JSON.parse(rawText));
    if (!parsed.success || parsed.data.code !== 200 || !parsed.data.data || parsed.data.data.length < 3) {
      throw new Error('استجابة غير مكتملة من مصدر المصحف');
    }

    const arEd = parsed.data.data[0];
    const enEd = parsed.data.data[1];
    const frEd = parsed.data.data[2];
    if (!arEd || !enEd || !frEd) {
      throw new Error('بيانات السورة ناقصة');
    }

    const bundledByNumber = new Map<number, AyahEntry>(surah.ayahs.map((a) => [a.number, a]));
    const ayahs: AyahEntry[] = arEd.ayahs.map((arAyah, idx) => {
      const existing = bundledByNumber.get(arAyah.numberInSurah);
      return {
        number: arAyah.numberInSurah,
        textAr: stripLeadingBasmalah(surahId, arAyah.numberInSurah, arAyah.text),
        translationEn: enEd.ayahs[idx]?.text ?? existing?.translationEn ?? '',
        translationFr: frEd.ayahs[idx]?.text ?? existing?.translationFr ?? '',
        transliteration: existing?.transliteration ?? '',
      };
    });

    await saveCachedSurahToDb(
      surahId,
      ayahs,
      'api.alquran.cloud (Tanzil Uthmani verified dataset)',
    );

    return { ayahs, fromCache: false, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'تعذّر تحميل آيات السورة';
    return {
      ayahs: surah.ayahs,
      fromCache: surah.ayahs.length > 0,
      error: message,
    };
  }
}

export async function loadMushafPage(pageNumber: number): Promise<MushafPageLoadResult> {
  const clampedPage = Math.max(1, Math.min(604, pageNumber));

  try {
    const cached = await getCachedMushafPageFromDb(clampedPage);
    if (cached && cached.length > 0) {
      return {
        ayahs: cached.map((a) => ({
          ...a,
          textAr: stripLeadingBasmalah(a.surahId, a.ayahNumber, a.textAr),
        })),
        fromCache: true,
        error: null,
      };
    }
  } catch {
    // Fall through to network
  }

  try {
    const response = await fetch(
      `https://api.alquran.cloud/v1/page/${clampedPage}/quran-uthmani`,
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const rawText = await response.text();
    const parsed = alQuranCloudPageResponseSchema.safeParse(JSON.parse(rawText));
    if (!parsed.success || parsed.data.code !== 200 || !parsed.data.data) {
      throw new Error('تعذّر قراءة بيانات صفحة المصحف');
    }

    const ayahs: MushafPageAyah[] = parsed.data.data.ayahs.map((a) => ({
      surahId: a.surah.number,
      surahNameAr: a.surah.name,
      ayahNumber: a.numberInSurah,
      textAr: stripLeadingBasmalah(a.surah.number, a.numberInSurah, a.text),
      juz: a.juz,
      page: a.page,
    }));

    await saveCachedMushafPageToDb(
      clampedPage,
      ayahs,
      'api.alquran.cloud (Madinah Mushaf 1-604 Uthmani)',
    );

    return { ayahs, fromCache: false, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'تعذّر تحميل صفحة المصحف';
    return { ayahs: [], fromCache: false, error: message };
  }
}
