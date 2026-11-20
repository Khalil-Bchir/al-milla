'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bookmark, BookOpen, Minus, Plus, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { AudioPlayerBar } from '@/components/milla/AudioPlayerBar';
import { cn } from '@/lib/utils';
import { SURAHS, getSurahById } from '@/lib/quran-data';
import { useMillaStore } from '@/store/milla-store';

export default function MushafPage() {
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const currentAyah = useMillaStore((s) => s.currentAyah);
  const setCurrentPosition = useMillaStore((s) => s.setCurrentPosition);
  const quranFontSize = useMillaStore((s) => s.quranFontSize);
  const setQuranFontSize = useMillaStore((s) => s.setQuranFontSize);
  const bookmarks = useMillaStore((s) => s.bookmarks);
  const toggleBookmark = useMillaStore((s) => s.toggleBookmark);
  const showTranslation = useMillaStore((s) => s.showTranslation);
  const setShowTranslation = useMillaStore((s) => s.setShowTranslation);
  const narration = useMillaStore((s) => s.narration);

  const [selectedAyah, setSelectedAyah] = useState(currentAyah);
  const surah = getSurahById(currentSurahId);
  const bookmarkKey = `${surah.id}:${selectedAyah}`;
  const isBookmarked = bookmarks.includes(bookmarkKey);

  return (
    <AppShell title="المصحف الشريف" subtitle={`صفحة ${surah.pageStart} • الحزب ${surah.hizb}`}>
      <div className="space-y-4">
        {/* Surah Selector & Controls */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="surah-select" className="sr-only">
              اختر السورة
            </label>
            <select
              id="surah-select"
              value={surah.id}
              onChange={(e) => {
                const nextId = Number(e.target.value);
                setCurrentPosition(nextId, 1);
                setSelectedAyah(1);
              }}
              className="min-h-[44px] rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground"
            >
              {SURAHS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameAr} ({s.totalAyahs} آية)
                </option>
              ))}
            </select>

            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {narration === 'qalun' ? 'رواية قالون عن نافع' : narration === 'warsh' ? 'رواية ورش' : 'رواية حفص'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuranFontSize(quranFontSize - 2)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-secondary"
                aria-label="تصغير خط المصحف"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="min-w-[44px] text-center text-xs font-bold text-muted-foreground">
                {quranFontSize}px
              </span>
              <button
                type="button"
                onClick={() => setQuranFontSize(quranFontSize + 2)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-secondary"
                aria-label="تكبير خط المصحف"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTranslation(!showTranslation)}
                aria-pressed={showTranslation}
                className={cn(
                  'inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold',
                  showTranslation
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-secondary',
                )}
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>الترجمة</span>
              </button>

              <button
                type="button"
                onClick={() => toggleBookmark(bookmarkKey)}
                aria-pressed={isBookmarked}
                className={cn(
                  'inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold',
                  isBookmarked
                    ? 'border-accent bg-accent/25 text-foreground'
                    : 'border-border bg-background text-foreground hover:bg-secondary',
                )}
              >
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                <span>{isBookmarked ? 'محفوظة' : 'علامة'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Mushaf Reading Page */}
        <article className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 rounded-xl border border-border bg-secondary/50 py-3 text-center">
            <h1 className="font-quran text-2xl font-bold text-primary">{surah.nameAr}</h1>
            <p className="text-xs text-muted-foreground">
              آياتها {surah.totalAyahs} • {surah.revelationTypeAr}
            </p>
          </div>

          {surah.id !== 1 && (
            <p className="mb-4 text-center font-quran text-xl text-foreground" dir="rtl" lang="ar">
              بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
            </p>
          )}

          <div className="space-y-4">
            {surah.ayahs.map((ayah) => {
              const active = selectedAyah === ayah.number;
              return (
                <div
                  key={ayah.number}
                  onClick={() => {
                    setSelectedAyah(ayah.number);
                    setCurrentPosition(surah.id, ayah.number);
                  }}
                  className={cn(
                    'cursor-pointer rounded-xl p-3 transition-colors',
                    active ? 'bg-secondary/80' : 'hover:bg-muted/40',
                  )}
                >
                  <p className="quran-text text-foreground" dir="rtl" lang="ar">
                    {ayah.textAr}{' '}
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background font-sans text-xs font-bold text-primary">
                      {ayah.number}
                    </span>
                  </p>
                  {showTranslation && (
                    <p className="mt-2 font-latin text-xs leading-relaxed text-muted-foreground" dir="ltr">
                      {ayah.translationEn}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </article>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/tafsir"
            className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-secondary"
          >
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>التفسير وأصول قالون</span>
          </Link>
          <Link
            href="/memorize"
            className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground hover:opacity-95"
          >
            <span>حفظ آيات هذا الورد</span>
          </Link>
        </div>

        {/* Audio Bar */}
        <AudioPlayerBar surahName={surah.nameAr} ayahNumber={selectedAyah} />
      </div>
    </AppShell>
  );
}
