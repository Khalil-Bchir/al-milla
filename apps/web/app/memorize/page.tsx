'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Home,
  Info,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { AudioPlayerBar } from '@/components/milla/AudioPlayerBar';
import { MillaPicker } from '@/components/milla/MillaPicker';
import { cn } from '@/lib/utils';
import { MILLA_COPY } from '@/lib/milla-i18n';
import {
  SURAHS,
  getSurahById,
  loadVerifiedSurahAyahs,
  toArabicDigits,
  type AyahEntry,
} from '@/lib/quran-data';
import {
  computeRevisionQueues,
  useMillaStore,
  type DailyStagesState,
  type SelfEvalRating,
} from '@/store/milla-store';

type SessionStepId = keyof DailyStagesState | 'completed';

interface GuidedStepDef {
  id: keyof DailyStagesState;
  label: string;
}

export default function MemorizePage() {
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const currentAyah = useMillaStore((s) => s.currentAyah);
  const dailyTarget = useMillaStore((s) => s.dailyTarget);
  const setCurrentPosition = useMillaStore((s) => s.setCurrentPosition);
  const setVerseStatus = useMillaStore((s) => s.setVerseStatus);
  const recordEvaluation = useMillaStore((s) => s.recordEvaluation);
  const setDailyStage = useMillaStore((s) => s.setDailyStage);
  const verseRecords = useMillaStore((s) => s.verseRecords);
  const language = useMillaStore((s) => s.language);
  const showTranslation = useMillaStore((s) => s.showTranslation);

  const copy = MILLA_COPY[language];
  const surah = getSurahById(currentSurahId);

  const [ayahs, setAyahs] = useState<AyahEntry[]>(surah.ayahs);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Snapshot initial revision queues once per session
  const [initialQueues, setInitialQueues] = useState(() =>
    computeRevisionQueues(verseRecords),
  );

  const yesterdayQueue = useMemo(
    () =>
      [...initialQueues.yesterdayItems].sort(
        (a, b) => a.surahId - b.surahId || a.ayahNumber - b.ayahNumber,
      ),
    [initialQueues.yesterdayItems],
  );

  const olderQueue = useMemo(() => {
    const merged = [...initialQueues.weakItems, ...initialQueues.olderDueItems];
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });
  }, [initialQueues.weakItems, initialQueues.olderDueItems]);

  const sessionSteps = useMemo<GuidedStepDef[]>(() => {
    const steps: GuidedStepDef[] = [];
    if (yesterdayQueue.length > 0) {
      steps.push({ id: 'yesterdayReview', label: 'مراجعة الأمس' });
    }
    if (olderQueue.length > 0) {
      steps.push({ id: 'olderReview', label: 'المراجعة السابقة' });
    }
    steps.push(
      { id: 'newMemorization', label: 'الحفظ الجديد' },
      { id: 'selfTest', label: 'التسميع' },
      { id: 'verseConnection', label: 'ربط الآيات' },
    );
    return steps;
  }, [yesterdayQueue.length, olderQueue.length]);

  const [stepIndex, setStepIndex] = useState(0);
  const [isSessionDone, setIsSessionDone] = useState(false);

  // Per-verse indices inside Yesterday Review & Older Review queues
  const [yesterdayIdx, setYesterdayIdx] = useState(0);
  const [olderIdx, setOlderIdx] = useState(0);
  const [reviewHidden, setReviewHidden] = useState(false);

  const yesterdayTarget = yesterdayQueue[yesterdayIdx];
  const yesterdaySurah = yesterdayTarget ? getSurahById(yesterdayTarget.surahId) : null;
  const olderTarget = olderQueue[olderIdx];
  const olderSurah = olderTarget ? getSurahById(olderTarget.surahId) : null;

  const [yesterdayAyahText, setYesterdayAyahText] = useState<string | null>(null);
  const [olderAyahText, setOlderAyahText] = useState<string | null>(null);
  const [loadingReviewText, setLoadingReviewText] = useState(false);

  // Sub-state for New Memorization step (within today's dailyTarget range)
  const [memOffset, setMemOffset] = useState(0);
  const [hideWordsMode, setHideWordsMode] = useState(false);
  const [showTafsirBox, setShowTafsirBox] = useState(false);

  // Sub-state for Self-Test step
  const [testOffset, setTestOffset] = useState(0);
  const [testRevealed, setTestRevealed] = useState(false);
  const [testRating, setTestRating] = useState<SelfEvalRating | null>(null);

  // Load current Surah ayahs
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

  // Load yesterday review verse text from IndexedDB / verified API
  useEffect(() => {
    if (!yesterdayTarget) return;
    let cancelled = false;
    setLoadingReviewText(true);
    void loadVerifiedSurahAyahs(yesterdayTarget.surahId).then((res) => {
      if (cancelled) return;
      const found = res.ayahs.find((a) => a.number === yesterdayTarget.ayahNumber);
      setYesterdayAyahText(found?.textAr ?? null);
      setLoadingReviewText(false);
    });
    return () => {
      cancelled = true;
    };
  }, [yesterdayTarget]);

  // Load older review verse text from IndexedDB / verified API
  useEffect(() => {
    if (!olderTarget) return;
    let cancelled = false;
    setLoadingReviewText(true);
    void loadVerifiedSurahAyahs(olderTarget.surahId).then((res) => {
      if (cancelled) return;
      const found = res.ayahs.find((a) => a.number === olderTarget.ayahNumber);
      setOlderAyahText(found?.textAr ?? null);
      setLoadingReviewText(false);
    });
    return () => {
      cancelled = true;
    };
  }, [olderTarget]);

  // Compute today's portion slice in the current Surah
  const startIdx = Math.max(
    0,
    ayahs.findIndex((a) => a.number === currentAyah),
  );
  const portionAyahs = ayahs.slice(startIdx, startIdx + dailyTarget);
  const activeMemAyah = portionAyahs[memOffset] ?? portionAyahs[0];
  const activeTestAyah = portionAyahs[testOffset] ?? portionAyahs[0];

  // Connected range (includes preceding verse if available)
  const connectStartIdx = Math.max(0, startIdx - 1);
  const connectAyahs = ayahs.slice(connectStartIdx, startIdx + dailyTarget);

  const currentStep: SessionStepId = isSessionDone
    ? 'completed'
    : (sessionSteps[stepIndex]?.id ?? 'newMemorization');

  const advanceNextWirdPosition = () => {
    const lastCompletedAyah = portionAyahs[portionAyahs.length - 1]?.number ?? currentAyah;
    if (lastCompletedAyah < surah.totalAyahs) {
      setCurrentPosition(surah.id, lastCompletedAyah + 1);
    } else if (surah.id < 114) {
      setCurrentPosition(surah.id + 1, 1);
    } else {
      setCurrentPosition(1, 1);
    }
  };

  const advanceStep = (completedKey: keyof DailyStagesState) => {
    setDailyStage(completedKey, true);
    setReviewHidden(false);
    setHideWordsMode(false);
    setTestRevealed(false);
    setTestRating(null);

    if (stepIndex + 1 < sessionSteps.length) {
      setStepIndex((i) => i + 1);
    } else {
      advanceNextWirdPosition();
      setIsSessionDone(true);
    }
  };

  const handleCompleteYesterdayAyah = () => {
    if (!yesterdayTarget) return;
    setVerseStatus(yesterdayTarget.key, 'memorized');
    setReviewHidden(false);
    if (yesterdayIdx + 1 < yesterdayQueue.length) {
      setYesterdayIdx((i) => i + 1);
    } else {
      advanceStep('yesterdayReview');
    }
  };

  const handleCompleteOlderAyah = () => {
    if (!olderTarget) return;
    setVerseStatus(olderTarget.key, 'memorized');
    setReviewHidden(false);
    if (olderIdx + 1 < olderQueue.length) {
      setOlderIdx((i) => i + 1);
    } else {
      advanceStep('olderReview');
    }
  };

  const handleStartNextSession = () => {
    setInitialQueues(computeRevisionQueues(verseRecords));
    setYesterdayIdx(0);
    setOlderIdx(0);
    setMemOffset(0);
    setTestOffset(0);
    setReviewHidden(false);
    setHideWordsMode(false);
    setTestRevealed(false);
    setTestRating(null);
    setStepIndex(0);
    setIsSessionDone(false);
  };

  const handleSurahChange = (nextSurahId: number) => {
    setCurrentPosition(nextSurahId, 1);
    setMemOffset(0);
    setTestOffset(0);
    setIsSessionDone(false);
    const memIdx = sessionSteps.findIndex((s) => s.id === 'newMemorization');
    setStepIndex(memIdx >= 0 ? memIdx : 0);
  };

  const handleCompleteMemorizeAyah = () => {
    if (!activeMemAyah) return;
    setVerseStatus(`${surah.id}:${activeMemAyah.number}`, 'memorized');
    setHideWordsMode(false);
    if (memOffset + 1 < portionAyahs.length) {
      setMemOffset((o) => o + 1);
    } else {
      setTestOffset(0);
      advanceStep('newMemorization');
    }
  };

  const handleCompleteTestAyah = () => {
    if (!activeTestAyah || !testRating) return;
    recordEvaluation(`${surah.id}:${activeTestAyah.number}`, testRating);
    setTestRevealed(false);
    setTestRating(null);
    if (testOffset + 1 < portionAyahs.length) {
      setTestOffset((o) => o + 1);
    } else {
      advanceStep('selfTest');
    }
  };

  const renderMaskedText = (text: string) => {
    if (!hideWordsMode) return text;
    return text
      .split(' ')
      .map((w, idx) => (idx % 2 === 1 ? '•••••' : w))
      .join(' ');
  };

  return (
    <AppShell
      title="الحفظ الموجّه"
      subtitle={`${surah.nameAr} • الآيات ${toArabicDigits(currentAyah)} - ${toArabicDigits(
        Math.min(surah.totalAyahs, currentAyah + dailyTarget - 1),
      )}`}
    >
      <div className="space-y-4">
        {/* Top Surah Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3">
          <MillaPicker
            searchable
            value={String(surah.id)}
            onChange={(val) => handleSurahChange(Number(val))}
            title="اختر السورة للحفظ"
            ariaLabel="اختر السورة"
            icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
            options={SURAHS.map((s) => ({
              value: String(s.id),
              label: `${toArabicDigits(s.id)}. ${s.nameAr}`,
              description: `${toArabicDigits(s.totalAyahs)} آية • ${s.revelationTypeAr}`,
              keywords: `${s.nameEn} ${s.nameFr}`,
            }))}
          />
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            حفص عن عاصم
          </span>
        </div>

        {/* Read-Only Guided Session Progress Bar */}
        <section
          aria-label="مراحل جلسة المِلّة"
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">مسار الجلسة الموجّهة</span>
            <span className="text-muted-foreground">
              {isSessionDone
                ? 'اكتملت الجلسة ✓'
                : `الخطوة ${toArabicDigits(stepIndex + 1)} من ${toArabicDigits(sessionSteps.length)}`}
            </span>
          </div>

          <ol
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${sessionSteps.length}, minmax(0, 1fr))` }}
          >
            {sessionSteps.map((step, idx) => {
              const isDone = isSessionDone || idx < stepIndex;
              const isCurrent = !isSessionDone && idx === stepIndex;
              return (
                <li
                  key={step.id}
                  aria-current={isCurrent ? 'step' : undefined}
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <span
                    className={cn(
                      'h-2 w-full rounded-full transition-colors',
                      isDone ? 'bg-primary' : isCurrent ? 'bg-accent' : 'bg-muted',
                    )}
                  />
                  <span
                    className={cn(
                      'text-[11px] leading-tight',
                      isCurrent
                        ? 'font-bold text-foreground'
                        : isDone
                          ? 'font-semibold text-primary'
                          : 'text-muted-foreground',
                    )}
                  >
                    {isDone ? `✓ ${step.label}` : step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* STEP 1: Yesterday's Review (Iterates all yesterdayQueue verses) */}
        {currentStep === 'yesterdayReview' && yesterdayTarget && yesterdaySurah && (
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-lg font-bold text-foreground">مراجعة الأمس</h1>
                <p className="text-xs text-muted-foreground">
                  الآية {toArabicDigits(yesterdayIdx + 1)} من{' '}
                  {toArabicDigits(yesterdayQueue.length)} في مراجعة الأمس
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                {yesterdaySurah.nameAr} • الآية {toArabicDigits(yesterdayTarget.ayahNumber)}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              راجع محفوظ الأمس قراءةً أو استماعاً مرجعياً قبل البدء بالآيات الجديدة.
            </p>

            <div className="rounded-2xl bg-secondary/50 p-4 text-center">
              {reviewHidden ? (
                <p className="py-4 text-sm font-medium text-muted-foreground">
                  [ النص مخفي — سمّع غيباً ثم أظهره للتحقق ]
                </p>
              ) : loadingReviewText && !yesterdayAyahText ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  <span>جاري تحميل نص الآية...</span>
                </div>
              ) : (
                <p className="quran-text text-foreground" dir="rtl" lang="ar">
                  {yesterdayAyahText ?? 'تعذّر تحميل نص الآية دون اتصال'}{' '}
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card font-sans text-xs font-bold text-primary">
                    {toArabicDigits(yesterdayTarget.ayahNumber)}
                  </span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setReviewHidden((v) => !v)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-secondary"
            >
              {reviewHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span>{reviewHidden ? 'إظهار النص للتحقق' : 'إخفاء النص للتسميع'}</span>
            </button>

            <AudioPlayerBar
              mode="reference"
              surahId={yesterdayTarget.surahId}
              surahName={yesterdaySurah.nameAr}
              ayahNumber={yesterdayTarget.ayahNumber}
            />

            <button
              type="button"
              onClick={handleCompleteYesterdayAyah}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-base font-bold text-primary-foreground hover:opacity-95"
            >
              <span>
                {yesterdayIdx + 1 < yesterdayQueue.length
                  ? 'راجعت هذه الآية • الآية التالية'
                  : 'أتممت مراجعة الأمس • المتابعة'}
              </span>
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </section>
        )}

        {/* STEP 2: Older / Weak Material Review (Iterates all olderQueue verses) */}
        {currentStep === 'olderReview' && olderTarget && olderSurah && (
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-lg font-bold text-foreground">المراجعة السابقة</h1>
                <p className="text-xs text-muted-foreground">
                  الآية {toArabicDigits(olderIdx + 1)} من {toArabicDigits(olderQueue.length)}{' '}
                  المستحقة للمراجعة
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                {olderSurah.nameAr} • الآية {toArabicDigits(olderTarget.ayahNumber)}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              تدوير المحفوظ القديم ومواضع العناية يحفظ القرآن غضّاً في الصدر.
            </p>

            <div className="rounded-2xl bg-secondary/50 p-4 text-center">
              {reviewHidden ? (
                <p className="py-4 text-sm font-medium text-muted-foreground">
                  [ النص مخفي — سمّع غيباً ثم أظهره للتحقق ]
                </p>
              ) : loadingReviewText && !olderAyahText ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  <span>جاري تحميل نص الآية...</span>
                </div>
              ) : (
                <p className="quran-text text-foreground" dir="rtl" lang="ar">
                  {olderAyahText ?? 'تعذّر تحميل نص الآية دون اتصال'}{' '}
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card font-sans text-xs font-bold text-primary">
                    {toArabicDigits(olderTarget.ayahNumber)}
                  </span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setReviewHidden((v) => !v)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-secondary"
            >
              {reviewHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span>{reviewHidden ? 'إظهار النص للتحقق' : 'إخفاء النص للتسميع'}</span>
            </button>

            <AudioPlayerBar
              mode="reference"
              surahId={olderTarget.surahId}
              surahName={olderSurah.nameAr}
              ayahNumber={olderTarget.ayahNumber}
            />

            <button
              type="button"
              onClick={handleCompleteOlderAyah}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-base font-bold text-primary-foreground hover:opacity-95"
            >
              <span>
                {olderIdx + 1 < olderQueue.length
                  ? 'راجعت هذه الآية • الآية التالية'
                  : 'أتممت المراجعة السابقة • بدء الحفظ الجديد'}
              </span>
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </section>
        )}

        {/* STEP 3: New Memorization (Uses mode="memorize" 5x repeat player) */}
        {currentStep === 'newMemorization' && (
          <>
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h1 className="text-base font-bold text-foreground">الحفظ الجديد</h1>
                  <p className="text-xs text-muted-foreground">
                    الآية {toArabicDigits(memOffset + 1)} من {toArabicDigits(portionAyahs.length || 1)}{' '}
                    في ورد اليوم
                  </p>
                </div>

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

              {surah.id !== 1 && surah.id !== 9 && activeMemAyah?.number === 1 && (
                <p className="mb-4 text-center font-quran text-xl text-muted-foreground">
                  بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
                </p>
              )}

              {loadingAyahs && !activeMemAyah ? (
                <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl bg-secondary/40 p-6 text-sm text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
                  <span>جاري تحميل آيات {surah.nameAr} وحفظها محلياً...</span>
                </div>
              ) : activeMemAyah ? (
                <>
                  <div className="rounded-2xl bg-secondary/50 p-4 text-center">
                    <p className="quran-text text-foreground" dir="rtl" lang="ar">
                      {renderMaskedText(activeMemAyah.textAr)}{' '}
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card font-sans text-xs font-bold text-primary">
                        {toArabicDigits(activeMemAyah.number)}
                      </span>
                    </p>
                  </div>

                  {showTranslation && (
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground" dir="ltr">
                      {language === 'fr' ? activeMemAyah.translationFr : activeMemAyah.translationEn}
                    </p>
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
                      <div className="mt-2 rounded-xl bg-muted/60 p-3.5 text-sm leading-relaxed text-foreground">
                        <p dir="ltr">
                          {language === 'fr'
                            ? activeMemAyah.translationFr
                            : activeMemAyah.translationEn}
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

            <AudioPlayerBar
              mode="memorize"
              surahId={surah.id}
              surahName={surah.nameAr}
              ayahNumber={activeMemAyah?.number ?? 1}
            />

            <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-secondary/40 p-3.5 text-sm leading-relaxed text-foreground">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <p>استمع للآية وكررها بهدوء، وعندما تثبت في ذهنك انتقل للخطوة التالية.</p>
            </div>

            <button
              type="button"
              disabled={!activeMemAyah}
              onClick={handleCompleteMemorizeAyah}
              className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-base font-bold text-primary-foreground hover:opacity-95 disabled:opacity-45"
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span>
                {memOffset + 1 < portionAyahs.length
                  ? 'حفظت هذه الآية • الآية التالية'
                  : 'أتممت حفظ الورد • الانتقال للتسميع'}
              </span>
            </button>
          </>
        )}

        {/* STEP 4: Guided Blind Self-Test (Uses mode="reference" single-play audio) */}
        {currentStep === 'selfTest' && activeTestAyah && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <div className="mb-3 flex items-center justify-between">
                <h1 className="text-base font-bold text-foreground">التسميع الغيبي</h1>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                  الآية {toArabicDigits(testOffset + 1)} من {toArabicDigits(portionAyahs.length)}
                </span>
              </div>

              <p className="mb-4 text-sm text-muted-foreground">
                اقرأ الآية {toArabicDigits(activeTestAyah.number)} من {surah.nameAr} غيباً دون النظر،
                ثم اكشف النص للمطابقة.
              </p>

              <div className="flex min-h-[130px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/40 p-5">
                {testRevealed ? (
                  <p className="quran-text text-foreground" dir="rtl" lang="ar">
                    {activeTestAyah.textAr} ({toArabicDigits(activeTestAyah.number)})
                  </p>
                ) : (
                  <div className="space-y-2 py-3">
                    <EyeOff className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm font-medium text-muted-foreground">
                      [ نص الآية محجوب للتسميع ]
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setTestRevealed((v) => !v)}
                className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-4 text-sm font-bold text-secondary-foreground"
              >
                {testRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{testRevealed ? 'إخفاء النص' : 'كشف النص للتحقق والمطابقة'}</span>
              </button>
            </div>

            <AudioPlayerBar
              mode="reference"
              surahId={surah.id}
              surahName={surah.nameAr}
              ayahNumber={activeTestAyah.number}
            />

            <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-secondary/40 p-3.5 text-xs leading-relaxed text-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p>{copy.selfEvalDisclaimer}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-bold text-foreground">قيّم استحضارك للآية:</h2>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'difficult', title: 'صعبة', sub: 'إعادة غداً' },
                    { id: 'good', title: 'جيدة', sub: 'بتأنٍّ' },
                    { id: 'easy', title: 'متقنة', sub: 'راسخة' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTestRating(item.id)}
                    aria-pressed={testRating === item.id}
                    className={cn(
                      'flex min-h-[76px] flex-col items-center justify-center rounded-xl border p-2 text-center transition-colors',
                      testRating === item.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:bg-secondary',
                    )}
                  >
                    <span className="text-sm font-bold">{item.title}</span>
                    <span className="text-[11px] opacity-85">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!testRating}
              onClick={handleCompleteTestAyah}
              className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-base font-bold text-primary-foreground disabled:opacity-45"
            >
              <span>
                {testOffset + 1 < portionAyahs.length
                  ? 'تثبيت التقييم • الآية التالية'
                  : 'أتممت التسميع • الانتقال لربط الآيات'}
              </span>
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </section>
        )}

        {/* STEP 5: Connecting Verses */}
        {currentStep === 'verseConnection' && (
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">ربط الآيات</h1>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                المقطع الكامل
              </span>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              اقرأ الآيات متصلة من بدايتها لتثبيت الانتقال بين نهايات الآيات وبداياتها.
            </p>

            <div className="rounded-2xl bg-secondary/50 p-4 text-justify" dir="rtl" lang="ar">
              <p className="quran-text leading-[2.3] text-foreground">
                {connectAyahs.map((a) => (
                  <span key={a.number}>
                    {a.textAr}{' '}
                    <span className="mx-1 font-quran text-primary">
                      ﴿{toArabicDigits(a.number)}﴾
                    </span>{' '}
                  </span>
                ))}
              </p>
            </div>

            <button
              type="button"
              onClick={() => advanceStep('verseConnection')}
              className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-base font-bold text-primary-foreground hover:opacity-95"
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span>أتممت ربط الآيات وإنهاء الجلسة</span>
            </button>
          </section>
        )}

        {/* SESSION COMPLETE */}
        {currentStep === 'completed' && (
          <section className="space-y-4 rounded-2xl border border-primary/30 bg-card p-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-bold text-primary">أحسنت، واصل</h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              تمّ حفظ الورد بنجاح وتحديث موضعك القادم إلى {surah.nameAr} • الآية{' '}
              {toArabicDigits(currentAyah)}.
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleStartNextSession}
                className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
              >
                <span>بدء الورد التالي الآن</span>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <Link
                href="/"
                className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground hover:bg-secondary"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                <span>العودة للرئيسية</span>
              </Link>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
