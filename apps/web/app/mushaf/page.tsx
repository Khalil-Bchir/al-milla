'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, BookOpen, CheckCircle2, Minus, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { AudioPlayerBar } from '@/components/milla/AudioPlayerBar';
import { cn } from '@/lib/utils';
import {
  SURAHS,
  getSurahById,
  loadVerifiedSurahAyahs,
  type AyahEntry,
} from '@/lib/quran-data';
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
  const language = useMillaStore((s) => s.language);

  const surah = getSurahById(currentSurahId);
  const [selectedAyah, setSelectedAyah] = useState(currentAyah);
  const [ayahs, setAyahs] = useState<AyahEntry[]>(surah.ayahs);
  const [loading, setLoading] = useState(false);
  const [cachedOffline, setCachedOffline] = useState(surah.ayahs.length === surah.totalAyahs);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErrorMsg(null);
      const res = await loadVerifiedSurahAyahs(currentSurahId);
      if (cancelled) return;
      if (res.ayahs.length > 0) {
        setAyahs(res.ayahs);
        setCachedOffline(true);
      }
      setErrorMsg(res.error);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [currentSurahId]);

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
              className="min-h-[48px] rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground"
            >
              {SURAHS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. {s.nameAr} ({s.totalAyahs} آية)
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5">
              {cachedOffline && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>محفوظة أوفلاين</span>
                </span>
              )}
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                {narration === 'qalun' ? 'قالون' : narration === 'warsh' ? 'ورش' : 'حفص'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuranFontSize(quranFontSize - 2)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-secondary"
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
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-secondary"
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
                  'inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold',
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
                  'inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold',
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
              آياتها {surah.totalAyahs} • {surah.revelationTypeAr} • الجزء {surah.juz}
            </p>
          </div>

          {surah.id !== 1 && surah.id !== 9 && (
            <p className="mb-4 text-center font-quran text-xl text-foreground" dir="rtl" lang="ar">
              بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
            </p>
          )}

          {loading && ayahs.length === 0 ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
              <span>جاري تحميل نص {surah.nameAr} الموثّق وحفظه للاستخدام دون اتصال...</span>
            </div>
          ) : ayahs.length > 0 ? (
            <div className="space-y-4">
              {ayahs.map((ayah) => {
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
                      <p className="mt-2 font-latin text-sm leading-relaxed text-muted-foreground" dir="ltr">
                        {language === 'fr' ? ayah.translationFr : ayah.translationEn}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
              {errorMsg ?? 'تعذّر تحميل السورة حالياً. يرجى التحقق من الاتصال بالإنترنت.'}
            </div>
          )}
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
            <span>حفظ آيات هذه السورة</span>
          </Link>
        </div>

        {/* Audio Bar */}
        <AudioPlayerBar
          surahId={surah.id}
          surahName={surah.nameAr}
          ayahNumber={selectedAyah}
        />
      </div>
    </AppShell>
  );
}
