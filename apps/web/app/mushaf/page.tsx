'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  FileText,
  List,
  Minus,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { AudioPlayerBar } from '@/components/milla/AudioPlayerBar';
import { MillaPicker } from '@/components/milla/MillaPicker';
import { cn } from '@/lib/utils';
import {
  SURAHS,
  getSurahById,
  loadMushafPage,
  loadVerifiedSurahAyahs,
  toArabicDigits,
  type AyahEntry,
  type MushafPageAyah,
} from '@/lib/quran-data';
import { useMillaStore } from '@/store/milla-store';

export default function MushafPage() {
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const currentAyah = useMillaStore((s) => s.currentAyah);
  const setCurrentPosition = useMillaStore((s) => s.setCurrentPosition);
  const mushafViewMode = useMillaStore((s) => s.mushafViewMode);
  const setMushafViewMode = useMillaStore((s) => s.setMushafViewMode);
  const currentMushafPage = useMillaStore((s) => s.currentMushafPage);
  const setCurrentMushafPage = useMillaStore((s) => s.setCurrentMushafPage);
  const quranFontSize = useMillaStore((s) => s.quranFontSize);
  const setQuranFontSize = useMillaStore((s) => s.setQuranFontSize);
  const bookmarks = useMillaStore((s) => s.bookmarks);
  const toggleBookmark = useMillaStore((s) => s.toggleBookmark);
  const showTranslation = useMillaStore((s) => s.showTranslation);
  const setShowTranslation = useMillaStore((s) => s.setShowTranslation);
  const language = useMillaStore((s) => s.language);

  const surah = getSurahById(currentSurahId);
  const [selectedSurahForAudio, setSelectedSurahForAudio] = useState(currentSurahId);
  const [selectedAyah, setSelectedAyah] = useState(currentAyah);

  const [ayahs, setAyahs] = useState<AyahEntry[]>(surah.ayahs);
  const [pageAyahs, setPageAyahs] = useState<MushafPageAyah[]>([]);
  const [loading, setLoading] = useState(false);
  const [cachedOffline, setCachedOffline] = useState(surah.ayahs.length === surah.totalAyahs);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load verse-by-verse surah data
  useEffect(() => {
    if (mushafViewMode !== 'verses') return;
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
  }, [currentSurahId, mushafViewMode]);

  // Load real Mushaf page (1..604)
  useEffect(() => {
    if (mushafViewMode !== 'page') return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErrorMsg(null);
      const res = await loadMushafPage(currentMushafPage);
      if (cancelled) return;
      if (res.ayahs.length > 0) {
        setPageAyahs(res.ayahs);
        setCachedOffline(true);
        setSelectedSurahForAudio(res.ayahs[0].surahId);
        setSelectedAyah(res.ayahs[0].ayahNumber);
      }
      setErrorMsg(res.error);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [currentMushafPage, mushafViewMode]);

  const activeSurahId = mushafViewMode === 'page' ? selectedSurahForAudio : surah.id;
  const activeSurahObj = getSurahById(activeSurahId);
  const bookmarkKey = `${activeSurahId}:${selectedAyah}`;
  const isBookmarked = bookmarks.includes(bookmarkKey);

  const pageJuz = pageAyahs[0]?.juz ?? surah.juz;
  const pageHeaderSurah = pageAyahs[0]?.surahNameAr ?? surah.nameAr;

  return (
    <AppShell
      title="المصحف الشريف"
      subtitle={
        mushafViewMode === 'page'
          ? `صفحة ${toArabicDigits(currentMushafPage)} من ٦٠٤ • الجزء ${toArabicDigits(pageJuz)}`
          : `صفحة ${surah.pageStart} • الحزب ${surah.hizb}`
      }
    >
      <div className="space-y-4">
        {/* View Mode Switcher: Verse Cards vs Real Mushaf Pages */}
        <section className="rounded-2xl border border-border bg-card p-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMushafViewMode('verses')}
              aria-pressed={mushafViewMode === 'verses'}
              className={cn(
                'flex min-h-[48px] items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-colors',
                mushafViewMode === 'verses'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-secondary',
              )}
            >
              <List className="h-4 w-4" aria-hidden="true" />
              <span>وضع الآيات</span>
            </button>

            <button
              type="button"
              onClick={() => setMushafViewMode('page')}
              aria-pressed={mushafViewMode === 'page'}
              className={cn(
                'flex min-h-[48px] items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-colors',
                mushafViewMode === 'page'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-secondary',
              )}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>صفحات المصحف (١-٦٠٤)</span>
            </button>
          </div>
        </section>

        {/* Surah / Page Selector & Controls */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <MillaPicker
                searchable
                value={String(surah.id)}
                onChange={(val) => {
                  const nextId = Number(val);
                  setCurrentPosition(nextId, 1);
                  setSelectedSurahForAudio(nextId);
                  setSelectedAyah(1);
                }}
                title="اختر السورة من المصحف"
                ariaLabel="اختر السورة"
                icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
                options={SURAHS.map((s) => ({
                  value: String(s.id),
                  label: `${toArabicDigits(s.id)}. ${s.nameAr}`,
                  description: `${toArabicDigits(s.totalAyahs)} آية • ${s.revelationTypeAr} • صفحة ${toArabicDigits(s.pageStart)}`,
                  keywords: `${s.nameEn} ${s.nameFr}`,
                }))}
              />

              {mushafViewMode === 'page' && (
                <div className="flex items-center gap-1.5">
                  <label htmlFor="mushaf-page-input" className="text-xs font-semibold text-muted-foreground">
                    صفحة:
                  </label>
                  <input
                    id="mushaf-page-input"
                    type="number"
                    min={1}
                    max={604}
                    value={currentMushafPage}
                    onChange={(e) => setCurrentMushafPage(Number(e.target.value) || 1)}
                    className="min-h-[48px] w-20 rounded-xl border border-border bg-background px-2.5 text-center text-sm font-bold text-foreground"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {cachedOffline && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>محفوظة أوفلاين</span>
                </span>
              )}
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                حفص عن عاصم
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
              {mushafViewMode === 'verses' && (
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
              )}

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

        {/* Reading Surface */}
        {mushafViewMode === 'page' ? (
          <article className="rounded-2xl border-2 border-primary/20 bg-card p-5 shadow-xs">
            {/* Classic Mushaf Page Header */}
            <div className="mb-4 flex items-center justify-between border-b border-border pb-2.5 text-xs font-semibold text-muted-foreground">
              <span>{pageHeaderSurah}</span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-primary">
                الجزء {toArabicDigits(pageJuz)}
              </span>
            </div>

            {loading ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
                <span>جاري تحميل صفحة {toArabicDigits(currentMushafPage)} من المصحف الشريف...</span>
              </div>
            ) : pageAyahs.length > 0 ? (
              <div className="space-y-4">
                <div
                  className="quran-text text-justify leading-[2.35] text-foreground"
                  dir="rtl"
                  lang="ar"
                >
                  {pageAyahs.map((item, index) => {
                    const isNewSurahOnPage =
                      item.ayahNumber === 1 &&
                      (index === 0 || pageAyahs[index - 1].surahId !== item.surahId);
                    const isSelected =
                      selectedSurahForAudio === item.surahId && selectedAyah === item.ayahNumber;

                    return (
                      <span key={`${item.surahId}:${item.ayahNumber}`}>
                        {isNewSurahOnPage && (
                          <span className="my-3 block rounded-xl border border-border bg-secondary/60 py-2 text-center font-quran text-2xl font-bold text-primary">
                            {item.surahNameAr}
                            {item.surahId !== 1 && item.surahId !== 9 && (
                              <span className="mt-1 block text-lg font-normal text-foreground">
                                بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
                              </span>
                            )}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSurahForAudio(item.surahId);
                            setSelectedAyah(item.ayahNumber);
                          }}
                          className={cn(
                            'inline rounded-lg px-0.5 text-start transition-colors',
                            isSelected ? 'bg-secondary text-foreground' : 'hover:bg-muted/50',
                          )}
                        >
                          {item.textAr}{' '}
                          <span className="mx-1 inline-block font-quran text-primary">
                            ﴿{toArabicDigits(item.ayahNumber)}﴾
                          </span>
                        </button>{' '}
                      </span>
                    );
                  })}
                </div>

                {/* Classic Mushaf Page Footer & Prev/Next Page Controls */}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <button
                    type="button"
                    disabled={currentMushafPage <= 1}
                    onClick={() => setCurrentMushafPage(currentMushafPage - 1)}
                    className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40"
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    <span>الصفحة السابقة</span>
                  </button>

                  <span className="text-sm font-bold text-primary">
                    {toArabicDigits(currentMushafPage)} / ٦٠٤
                  </span>

                  <button
                    type="button"
                    disabled={currentMushafPage >= 604}
                    onClick={() => setCurrentMushafPage(currentMushafPage + 1)}
                    className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40"
                  >
                    <span>الصفحة التالية</span>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                {errorMsg ?? 'تعذّر تحميل صفحة المصحف حالياً. يرجى التحقق من الاتصال بالإنترنت.'}
              </div>
            )}
          </article>
        ) : (
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
                        setSelectedSurahForAudio(surah.id);
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
        )}

        {/* Quick Action to Memorize */}
        <Link
          href="/memorize"
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-95"
        >
          حفظ آيات {activeSurahObj.nameAr}
        </Link>

        {/* Audio Bar */}
        <AudioPlayerBar
          surahId={activeSurahId}
          surahName={activeSurahObj.nameAr}
          ayahNumber={selectedAyah}
        />
      </div>
    </AppShell>
  );
}
