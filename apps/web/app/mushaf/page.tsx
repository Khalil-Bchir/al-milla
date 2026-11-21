'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileText,
  List,
  Minus,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { AudioPlayerBar } from '@/components/milla/AudioPlayerBar';
import { MillaPicker } from '@/components/milla/MillaPicker';
import { cn } from '@/lib/utils';
import { MILLA_COPY, formatNum } from '@/lib/milla-i18n';
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

interface ActiveVerseTarget {
  surahId: number;
  surahNameAr: string;
  ayahNumber: number;
  textAr: string;
  translationEn?: string;
  translationFr?: string;
}

export default function MushafPage() {
  const router = useRouter();
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const setCurrentPosition = useMillaStore((s) => s.setCurrentPosition);
  const mushafViewMode = useMillaStore((s) => s.mushafViewMode);
  const setMushafViewMode = useMillaStore((s) => s.setMushafViewMode);
  const currentMushafPage = useMillaStore((s) => s.currentMushafPage);
  const setCurrentMushafPage = useMillaStore((s) => s.setCurrentMushafPage);
  const quranFontSize = useMillaStore((s) => s.quranFontSize);
  const setQuranFontSize = useMillaStore((s) => s.setQuranFontSize);
  const bookmarks = useMillaStore((s) => s.bookmarks);
  const toggleBookmark = useMillaStore((s) => s.toggleBookmark);
  const language = useMillaStore((s) => s.language);
  const copy = MILLA_COPY[language];

  const surah = getSurahById(currentSurahId);
  const [ayahs, setAyahs] = useState<AyahEntry[]>(surah.ayahs);
  const [pageAyahs, setPageAyahs] = useState<MushafPageAyah[]>([]);
  const [loading, setLoading] = useState(false);
  const [cachedOffline, setCachedOffline] = useState(surah.ayahs.length === surah.totalAyahs);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Specific-verse popover state (opened via long-press, right-click, or tap)
  const [verseMenuTarget, setVerseMenuTarget] = useState<ActiveVerseTarget | null>(null);
  const [showVerseTranslation, setShowVerseTranslation] = useState(false);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

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
      }
      setErrorMsg(res.error);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [currentMushafPage, mushafViewMode]);

  // Escape closes verse popover
  useEffect(() => {
    if (!verseMenuTarget) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVerseMenuTarget(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [verseMenuTarget]);

  // Outside click & Escape close Mushaf settings popup
  useEffect(() => {
    if (!settingsOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [settingsOpen]);

  const openVerseMenu = (target: ActiveVerseTarget) => {
    setShowVerseTranslation(false);
    setVerseMenuTarget(target);
  };

  const startLongPress = (target: ActiveVerseTarget) => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = window.setTimeout(() => {
      openVerseMenu(target);
      longPressTimerRef.current = null;
    }, 420);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleToggleTranslationInModal = async () => {
    if (!verseMenuTarget) return;
    if (showVerseTranslation) {
      setShowVerseTranslation(false);
      return;
    }
    if (verseMenuTarget.translationEn || verseMenuTarget.translationFr) {
      setShowVerseTranslation(true);
      return;
    }
    setLoadingTranslation(true);
    const res = await loadVerifiedSurahAyahs(verseMenuTarget.surahId);
    const matched = res.ayahs.find((a) => a.number === verseMenuTarget.ayahNumber);
    setVerseMenuTarget((prev) =>
      prev
        ? {
            ...prev,
            translationEn: matched?.translationEn ?? 'Translation unavailable offline.',
            translationFr: matched?.translationFr ?? 'Traduction indisponible hors ligne.',
          }
        : null,
    );
    setLoadingTranslation(false);
    setShowVerseTranslation(true);
  };

  const pageJuz = pageAyahs[0]?.juz ?? surah.juz;
  const pageHeaderSurah = pageAyahs[0]?.surahNameAr ?? surah.nameAr;

  const isTargetBookmarked = verseMenuTarget
    ? bookmarks.includes(`${verseMenuTarget.surahId}:${verseMenuTarget.ayahNumber}`)
    : false;

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
        {/* Compact Mushaf Toolbar + Settings Popup */}
        <section className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-2.5 sm:p-3">
          <div className="min-w-0 flex-1">
            <MillaPicker
              searchable
              value={String(surah.id)}
              onChange={(val) => {
                const nextId = Number(val);
                setCurrentPosition(nextId, 1);
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
          </div>

          <div ref={settingsMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              aria-haspopup="dialog"
              aria-expanded={settingsOpen}
              className={cn(
                'inline-flex h-12 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors',
                settingsOpen
                  ? 'border-primary bg-secondary text-primary'
                  : 'border-border bg-background text-foreground hover:bg-secondary',
              )}
            >
              <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>
                {language === 'en' ? 'Display' : language === 'fr' ? 'Affichage' : 'العرض'}
              </span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-muted-foreground transition-transform',
                  settingsOpen && 'rotate-180',
                )}
                aria-hidden="true"
              />
            </button>

            {settingsOpen && (
              <div
                role="dialog"
                aria-label={
                  language === 'en'
                    ? 'Mushaf settings'
                    : language === 'fr'
                      ? 'Paramètres du Mushaf'
                      : 'إعدادات المصحف'
                }
                className="absolute end-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] space-y-4 rounded-2xl border border-border bg-card p-4 shadow-xl"
              >
                {/* View Mode */}
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-bold text-muted-foreground">
                    {language === 'en'
                      ? 'Reading mode'
                      : language === 'fr'
                        ? 'Mode de lecture'
                        : 'وضع القراءة'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMushafViewMode('verses')}
                      aria-pressed={mushafViewMode === 'verses'}
                      className={cn(
                        'flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition-colors',
                        mushafViewMode === 'verses'
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-secondary',
                      )}
                    >
                      <List className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {language === 'en' ? 'Verses' : language === 'fr' ? 'Versets' : 'الآيات'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMushafViewMode('page')}
                      aria-pressed={mushafViewMode === 'page'}
                      className={cn(
                        'flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition-colors',
                        mushafViewMode === 'page'
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-secondary',
                      )}
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {language === 'en'
                          ? 'Pages (1-604)'
                          : language === 'fr'
                            ? 'Pages (1-604)'
                            : 'الصفحات (١-٦٠٤)'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Page Jump */}
                {mushafViewMode === 'page' && (
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="mushaf-page-input"
                      className="text-xs font-semibold text-foreground"
                    >
                      {language === 'en'
                        ? 'Go to page'
                        : language === 'fr'
                          ? 'Aller à la page'
                          : 'الانتقال إلى صفحة'}
                    </label>
                    <input
                      id="mushaf-page-input"
                      type="number"
                      min={1}
                      max={604}
                      value={currentMushafPage}
                      onChange={(e) => setCurrentMushafPage(Number(e.target.value) || 1)}
                      className="h-10 w-20 rounded-xl border border-border bg-background px-2.5 text-center text-sm font-bold text-foreground"
                    />
                  </div>
                )}

                {/* Font Size */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-foreground">
                    {language === 'en'
                      ? 'Quran text size'
                      : language === 'fr'
                        ? 'Taille du texte'
                        : 'حجم خط المصحف'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuranFontSize(quranFontSize - 2)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-secondary"
                      aria-label="-"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-[36px] text-center text-xs font-bold text-muted-foreground">
                      {formatNum(quranFontSize, language)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuranFontSize(quranFontSize + 2)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-secondary"
                      aria-label="+"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Badges & Tap Hint */}
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {cachedOffline && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-primary">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        <span>{copy.mushafCachedText}</span>
                      </span>
                    )}
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                      {copy.hafsBadge}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {copy.mushafTapHint}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Reading Surface */}
        {mushafViewMode === 'page' ? (
          <article className="rounded-2xl border-2 border-primary/20 bg-card p-5 shadow-xs">
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
                  className="mushaf-quran-text select-none text-justify text-foreground"
                  dir="rtl"
                  lang="ar"
                >
                  {pageAyahs.map((item, index) => {
                    const isNewSurahOnPage =
                      item.ayahNumber === 1 &&
                      (index === 0 || pageAyahs[index - 1].surahId !== item.surahId);
                    const bookmarked = bookmarks.includes(`${item.surahId}:${item.ayahNumber}`);
                    const target: ActiveVerseTarget = {
                      surahId: item.surahId,
                      surahNameAr: item.surahNameAr,
                      ayahNumber: item.ayahNumber,
                      textAr: item.textAr,
                    };

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
                        <span
                          role="button"
                          tabIndex={0}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            openVerseMenu(target);
                          }}
                          onTouchStart={() => startLongPress(target)}
                          onTouchEnd={cancelLongPress}
                          onTouchMove={cancelLongPress}
                          onClick={() => openVerseMenu(target)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openVerseMenu(target);
                            }
                          }}
                          className={cn(
                            'cursor-pointer rounded-lg px-0.5 transition-colors hover:bg-secondary/60',
                            bookmarked && 'bg-accent/20',
                          )}
                        >
                          {item.textAr}{' '}
                          <span className="mx-1 inline-block font-quran text-primary">
                            ﴿{toArabicDigits(item.ayahNumber)}﴾
                          </span>
                          {bookmarked && (
                            <Bookmark
                              className="mx-0.5 inline h-3.5 w-3.5 text-primary"
                              aria-label="علامة مرجعية"
                            />
                          )}
                        </span>{' '}
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
                آياتها {toArabicDigits(surah.totalAyahs)} • {surah.revelationTypeAr} • الجزء{' '}
                {toArabicDigits(surah.juz)}
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
              <div className="space-y-3 select-none">
                {ayahs.map((ayah) => {
                  const bookmarked = bookmarks.includes(`${surah.id}:${ayah.number}`);
                  const target: ActiveVerseTarget = {
                    surahId: surah.id,
                    surahNameAr: surah.nameAr,
                    ayahNumber: ayah.number,
                    textAr: ayah.textAr,
                    translationEn: ayah.translationEn,
                    translationFr: ayah.translationFr,
                  };

                  return (
                    <div
                      key={ayah.number}
                      role="button"
                      tabIndex={0}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        openVerseMenu(target);
                      }}
                      onTouchStart={() => startLongPress(target)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      onClick={() => openVerseMenu(target)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openVerseMenu(target);
                        }
                      }}
                      className={cn(
                        'cursor-pointer rounded-xl p-3 transition-colors hover:bg-secondary/60',
                        bookmarked && 'border border-accent bg-accent/15',
                      )}
                    >
                      <p className="quran-text text-foreground" dir="rtl" lang="ar">
                        {ayah.textAr}{' '}
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background font-sans text-xs font-bold text-primary">
                          {toArabicDigits(ayah.number)}
                        </span>
                        {bookmarked && (
                          <Bookmark
                            className="ms-1.5 inline h-4 w-4 text-primary"
                            aria-label="علامة مرجعية"
                          />
                        )}
                      </p>
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
      </div>

      {/* Verse-Specific Options Popover / Action Sheet */}
      {verseMenuTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`خيارات ${verseMenuTarget.surahNameAr} الآية ${verseMenuTarget.ayahNumber}`}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={() => setVerseMenuTarget(null)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-t-3xl border border-border bg-card p-4 shadow-lg sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-primary">
                  {verseMenuTarget.surahNameAr} • الآية {toArabicDigits(verseMenuTarget.ayahNumber)}
                </h2>
                <p className="text-xs text-muted-foreground">خيارات الآية المحددة</p>
              </div>
              <button
                type="button"
                onClick={() => setVerseMenuTarget(null)}
                aria-label="إغلاق"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Verse Text Preview */}
            <div className="rounded-xl bg-secondary/50 p-3.5 text-center">
              <p className="font-quran text-xl leading-[2] text-foreground" dir="rtl" lang="ar">
                {verseMenuTarget.textAr}
              </p>
            </div>

            {/* Specific Verse Audio Player */}
            <AudioPlayerBar
              surahId={verseMenuTarget.surahId}
              surahName={verseMenuTarget.surahNameAr}
              ayahNumber={verseMenuTarget.ayahNumber}
            />

            {/* Specific Verse Actions: Translation, Bookmark, Memorize */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void handleToggleTranslationInModal()}
                aria-pressed={showVerseTranslation}
                className={cn(
                  'flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors',
                  showVerseTranslation
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-secondary',
                )}
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>{showVerseTranslation ? 'إخفاء الترجمة' : 'ترجمة الآية'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  toggleBookmark(`${verseMenuTarget.surahId}:${verseMenuTarget.ayahNumber}`)
                }
                aria-pressed={isTargetBookmarked}
                className={cn(
                  'flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors',
                  isTargetBookmarked
                    ? 'border-accent bg-accent/25 text-foreground'
                    : 'border-border bg-background text-foreground hover:bg-secondary',
                )}
              >
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                <span>{isTargetBookmarked ? 'إزالة العلامة' : 'وضع علامة'}</span>
              </button>
            </div>

            {loadingTranslation && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                <span>جاري تحميل الترجمة...</span>
              </div>
            )}

            {showVerseTranslation && !loadingTranslation && (
              <div className="rounded-xl border border-border bg-muted/50 p-3.5 text-sm leading-relaxed text-foreground" dir="ltr">
                {language === 'fr'
                  ? verseMenuTarget.translationFr
                  : verseMenuTarget.translationEn}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setCurrentPosition(verseMenuTarget.surahId, verseMenuTarget.ayahNumber);
                setVerseMenuTarget(null);
                router.push('/memorize');
              }}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-95"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>حفظ هذه الآية</span>
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
