'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, ChevronDown, Eye, EyeOff, Lightbulb, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { AudioPlayerBar } from '@/components/milla/AudioPlayerBar';
import { MillaPicker } from '@/components/milla/MillaPicker';
import { cn } from '@/lib/utils';
import {
  SURAHS,
  getSurahById,
  loadVerifiedSurahAyahs,
  type AyahEntry,
} from '@/lib/quran-data';
import { useMillaStore, type DailyStagesState } from '@/store/milla-store';

const STANDARD_FIVE_STAGES: {
  key: keyof DailyStagesState;
  label: string;
}[] = [
  { key: 'yesterdayReview', label: 'مراجعة الأمس' },
  { key: 'olderReview', label: 'المراجعة السابقة' },
  { key: 'newMemorization', label: 'الحفظ الجديد' },
  { key: 'selfTest', label: 'التسميع' },
  { key: 'verseConnection', label: 'ربط الآيات' },
];

export default function MemorizePage() {
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const currentAyah = useMillaStore((s) => s.currentAyah);
  const setCurrentPosition = useMillaStore((s) => s.setCurrentPosition);
  const setVerseStatus = useMillaStore((s) => s.setVerseStatus);
  const dailyStages = useMillaStore((s) => s.dailyStages);
  const toggleDailyStage = useMillaStore((s) => s.toggleDailyStage);
  const setDailyStage = useMillaStore((s) => s.setDailyStage);
  const language = useMillaStore((s) => s.language);
  const showTranslation = useMillaStore((s) => s.showTranslation);
  const showTransliteration = useMillaStore((s) => s.showTransliteration);

  const surah = getSurahById(currentSurahId);
  const [ayahs, setAyahs] = useState<AyahEntry[]>(surah.ayahs);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hideWordsMode, setHideWordsMode] = useState(false);
  const [showTafsirBox, setShowTafsirBox] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchSurah = async () => {
      setLoadingAyahs(true);
      setLoadError(null);
      const res = await loadVerifiedSurahAyahs(currentSurahId);
      if (cancelled) return;
      if (res.ayahs.length > 0) {
        setAyahs(res.ayahs);
      }
      setLoadError(res.error);
      setLoadingAyahs(false);
    };
    void fetchSurah();
    return () => {
      cancelled = true;
    };
  }, [currentSurahId]);

  const ayahIndex = Math.max(
    0,
    ayahs.findIndex((a) => a.number === currentAyah),
  );
  const activeAyah = ayahs[ayahIndex] ?? ayahs[0];
  const nextAyah = ayahs[ayahIndex + 1];

  const completedStagesCount = STANDARD_FIVE_STAGES.filter((s) => dailyStages[s.key]).length;
  const activeStageKey =
    STANDARD_FIVE_STAGES.find((s) => !dailyStages[s.key])?.key ?? 'verseConnection';

  const handlePrev = () => {
    if (ayahIndex > 0) {
      setCurrentPosition(surah.id, ayahs[ayahIndex - 1].number);
    }
  };

  const handleNext = () => {
    if (nextAyah) {
      setCurrentPosition(surah.id, nextAyah.number);
    }
  };

  const handleMarkMastered = () => {
    if (!activeAyah) return;
    setVerseStatus(`${surah.id}:${activeAyah.number}`, 'memorized');
    setDailyStage('newMemorization', true);
    if (nextAyah) {
      setCurrentPosition(surah.id, nextAyah.number);
    } else {
      setDailyStage('verseConnection', true);
    }
  };

  const renderMaskedText = (text: string) => {
    if (!hideWordsMode) return text;
    const words = text.split(' ');
    return words.map((w, idx) => (idx % 2 === 1 ? '•••••' : w)).join(' ');
  };

  return (
    <AppShell title="الحفظ الموجه" subtitle={`${surah.nameAr} • الحزب ${surah.hizb}`}>
      <div className="space-y-4">
        {/* Top Surah Selector & Narration Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3">
          <MillaPicker
            searchable
            value={String(surah.id)}
            onChange={(val) => setCurrentPosition(Number(val), 1)}
            title="اختر السورة للحفظ"
            ariaLabel="اختر السورة"
            icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
            options={SURAHS.map((s) => ({
              value: String(s.id),
              label: `${s.id}. ${s.nameAr}`,
              description: `${s.totalAyahs} آية • ${s.revelationTypeAr}`,
              keywords: `${s.nameEn} ${s.nameFr}`,
            }))}
          />
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            رواية حفص عن عاصم
          </span>
        </div>

        {/* Dynamic 5-Stage Daily Method */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">مراحل جلسة المِلّة (اضغط للتبديل)</span>
            <span className="text-muted-foreground">{completedStagesCount} من ٥ مكتملة</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {STANDARD_FIVE_STAGES.map((stage) => {
              const isDone = dailyStages[stage.key];
              const isCurrent = stage.key === activeStageKey;
              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() => toggleDailyStage(stage.key)}
                  aria-pressed={isDone}
                  className="flex min-h-[48px] flex-col items-center justify-center gap-1.5 rounded-lg px-1 text-center"
                >
                  <span
                    className={cn(
                      'h-2 w-full rounded-full transition-colors',
                      isDone ? 'bg-primary' : isCurrent ? 'bg-accent' : 'bg-muted',
                    )}
                  />
                  <span
                    className={cn(
                      'text-[11px] leading-tight font-medium',
                      isDone || isCurrent ? 'font-bold text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Quran Verse Card */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {surah.nameAr} • الآية {activeAyah?.number ?? 1} من {surah.totalAyahs}
            </span>
            <button
              type="button"
              onClick={() => setHideWordsMode((v) => !v)}
              aria-pressed={hideWordsMode}
              className={cn(
                'inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold transition-colors',
                hideWordsMode
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-secondary',
              )}
            >
              {hideWordsMode ? (
                <Eye className="h-4 w-4" aria-hidden="true" />
              ) : (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{hideWordsMode ? 'إظهار الآية' : 'إخفاء كلمات'}</span>
            </button>
          </div>

          {surah.id !== 1 && surah.id !== 9 && (
            <p className="mb-4 text-center font-quran text-xl text-muted-foreground">
              بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
            </p>
          )}

          {loadingAyahs && !activeAyah ? (
            <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl bg-secondary/40 p-6 text-sm text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
              <span>جاري تحميل آيات {surah.nameAr} وحفظها محلياً...</span>
            </div>
          ) : activeAyah ? (
            <>
              <div className="rounded-2xl bg-secondary/50 p-4 text-center">
                <p className="quran-text text-foreground" dir="rtl" lang="ar">
                  {renderMaskedText(activeAyah.textAr)}{' '}
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card font-sans text-xs font-bold text-primary">
                    {activeAyah.number}
                  </span>
                </p>
              </div>

              {showTranslation && (
                <p className="mt-3 text-base leading-relaxed text-muted-foreground" dir="ltr">
                  {language === 'fr' ? activeAyah.translationFr : activeAyah.translationEn}
                </p>
              )}
              {showTransliteration && activeAyah.transliteration && (
                <p className="mt-2 font-latin text-sm italic text-muted-foreground" dir="ltr">
                  {activeAyah.transliteration}
                </p>
              )}

              {nextAyah && (
                <div className="mt-4 rounded-xl border border-dashed border-border p-3 text-center opacity-80">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">الآية التالية للربط</p>
                  <p className="font-quran text-lg text-foreground" dir="rtl" lang="ar">
                    {nextAyah.textAr} ({nextAyah.number})
                  </p>
                </div>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowTafsirBox((v) => !v)}
                  className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-border bg-background px-3.5 text-sm font-semibold text-foreground hover:bg-secondary"
                  aria-expanded={showTafsirBox}
                >
                  <span>المعنى والترجمة الميسرة</span>
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', showTafsirBox && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>
                {showTafsirBox && (
                  <div className="mt-2 space-y-2 rounded-xl bg-muted/60 p-3.5 text-sm leading-relaxed text-foreground">
                    <p dir="ltr">
                      {language === 'fr' ? activeAyah.translationFr : activeAyah.translationEn}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-muted/40 p-5 text-center text-sm text-muted-foreground">
              {loadError ?? 'اتصل بالإنترنت لمرة واحدة لتحميل هذه السورة وحفظها في ذاكرة الجهاز.'}
            </div>
          )}
        </section>

        {/* Audio & Repeat Control */}
        <AudioPlayerBar
          surahId={surah.id}
          surahName={surah.nameAr}
          ayahNumber={activeAyah?.number ?? 1}
          onPrevAyah={ayahIndex > 0 ? handlePrev : undefined}
          onNextAyah={nextAyah ? handleNext : undefined}
          onRepeatCycleComplete={() => setDailyStage('newMemorization', true)}
        />

        {/* Calm Tip */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-secondary/40 p-3.5 text-sm leading-relaxed text-foreground">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p>ثبّت موضع الوقف في الآية الحالية قبل الانتقال لربطها بالآية التالية.</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleMarkMastered}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-base font-bold text-primary-foreground hover:opacity-95"
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <span>تمّ الحفظ • الآية التالية</span>
          </button>

          <Link
            href="/self-test"
            className="flex min-h-[52px] items-center justify-center rounded-2xl border border-border bg-card px-4 py-3 text-base font-bold text-foreground hover:bg-secondary"
          >
            الانتقال للتسميع الذاتي
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
