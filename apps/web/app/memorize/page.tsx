'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
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
import { MILLA_COPY, formatNum, getSurahDisplayName } from '@/lib/milla-i18n';
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
  const surahCursors = useMillaStore((s) => s.surahCursors);
  const dailyTarget = useMillaStore((s) => s.dailyTarget);
  const setCurrentPosition = useMillaStore((s) => s.setCurrentPosition);
  const setLastCompletedSession = useMillaStore((s) => s.setLastCompletedSession);
  const setVerseStatus = useMillaStore((s) => s.setVerseStatus);
  const recordEvaluation = useMillaStore((s) => s.recordEvaluation);
  const setDailyStage = useMillaStore((s) => s.setDailyStage);
  const verseRecords = useMillaStore((s) => s.verseRecords);
  const lastSessionKeys = useMillaStore((s) => s.lastSessionKeys);
  const lastSessionCompletedAt = useMillaStore((s) => s.lastSessionCompletedAt);
  const language = useMillaStore((s) => s.language);
  const showTranslation = useMillaStore((s) => s.showTranslation);

  const copy = MILLA_COPY[language];
  const DirArrow = language === 'ar' ? ArrowLeft : ArrowRight;
  const surah = getSurahById(currentSurahId);

  const [ayahs, setAyahs] = useState<AyahEntry[]>(surah.ayahs);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Snapshot initial revision queues once per session
  const [initialQueues, setInitialQueues] = useState(() =>
    computeRevisionQueues(verseRecords, {
      lastSessionKeys,
      lastSessionCompletedAt,
    }),
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
      steps.push({
        id: 'yesterdayReview',
        label: language === 'en' ? 'Yesterday' : language === 'fr' ? 'Hier' : 'مراجعة الأمس',
      });
    }
    if (olderQueue.length > 0) {
      steps.push({
        id: 'olderReview',
        label: language === 'en' ? 'Older' : language === 'fr' ? 'Ancien' : 'المراجعة السابقة',
      });
    }
    steps.push(
      {
        id: 'newMemorization',
        label: language === 'en' ? 'Memorize' : language === 'fr' ? 'Mémoriser' : 'الحفظ الجديد',
      },
      {
        id: 'selfTest',
        label: language === 'en' ? 'Self-Test' : language === 'fr' ? 'Auto-test' : 'التسميع',
      },
      {
        id: 'verseConnection',
        label: language === 'en' ? 'Connect' : language === 'fr' ? 'Relier' : 'ربط الآيات',
      },
    );
    return steps;
  }, [yesterdayQueue.length, olderQueue.length, language]);

  const [stepIndex, setStepIndex] = useState(0);
  const [isSessionDone, setIsSessionDone] = useState(false);

  // Per-surah isolation + per-verse indices inside Yesterday Review & Older Review queues
  const [yesterdaySurahId, setYesterdaySurahId] = useState<number | null>(null);
  const [olderSurahId, setOlderSurahId] = useState<number | null>(null);
  const [yesterdayIdx, setYesterdayIdx] = useState(0);
  const [olderIdx, setOlderIdx] = useState(0);
  const [reviewHidden, setReviewHidden] = useState(false);

  const yesterdaySurahIds = useMemo(
    () => Array.from(new Set(yesterdayQueue.map((item) => item.surahId))).sort((a, b) => a - b),
    [yesterdayQueue],
  );
  const activeYesterdaySurahId =
    yesterdaySurahId !== null && yesterdaySurahIds.includes(yesterdaySurahId)
      ? yesterdaySurahId
      : (yesterdaySurahIds[0] ?? null);
  const activeYesterdayQueue = useMemo(
    () =>
      activeYesterdaySurahId === null
        ? []
        : yesterdayQueue.filter((item) => item.surahId === activeYesterdaySurahId),
    [yesterdayQueue, activeYesterdaySurahId],
  );

  const olderSurahIds = useMemo(
    () => Array.from(new Set(olderQueue.map((item) => item.surahId))).sort((a, b) => a - b),
    [olderQueue],
  );
  const activeOlderSurahId =
    olderSurahId !== null && olderSurahIds.includes(olderSurahId)
      ? olderSurahId
      : (olderSurahIds[0] ?? null);
  const activeOlderQueue = useMemo(
    () =>
      activeOlderSurahId === null
        ? []
        : olderQueue.filter((item) => item.surahId === activeOlderSurahId),
    [olderQueue, activeOlderSurahId],
  );

  const safeYesterdayIdx = yesterdayIdx < activeYesterdayQueue.length ? yesterdayIdx : 0;
  const safeOlderIdx = olderIdx < activeOlderQueue.length ? olderIdx : 0;

  const yesterdayTarget = activeYesterdayQueue[safeYesterdayIdx];
  const yesterdaySurah = yesterdayTarget ? getSurahById(yesterdayTarget.surahId) : null;
  const olderTarget = activeOlderQueue[safeOlderIdx];
  const olderSurah = olderTarget ? getSurahById(olderTarget.surahId) : null;

  const [reviewAyahTexts, setReviewAyahTexts] = useState<Record<string, string>>({});
  const [loadingReviewText, setLoadingReviewText] = useState(false);

  // Sub-state for New Memorization step (0: full, 1: light hide, 2: medium hide, 3: first-word cue)
  const [memOffset, setMemOffset] = useState(0);
  const [hideLevel, setHideLevel] = useState<0 | 1 | 2 | 3>(0);
  const [showTafsirBox, setShowTafsirBox] = useState(false);

  // Sub-state for Yesterday & Older Review per-Surah evaluation
  const [yesterdayRating, setYesterdayRating] = useState<SelfEvalRating>('good');
  const [olderRating, setOlderRating] = useState<SelfEvalRating>('good');
  const [doneYesterdaySurahs, setDoneYesterdaySurahs] = useState<number[]>([]);
  const [doneOlderSurahs, setDoneOlderSurahs] = useState<number[]>([]);

  // Sub-state for Self-Test & Connect steps
  const [testOffset, setTestOffset] = useState(0);
  const [testRevealed, setTestRevealed] = useState(false);
  const [testRating, setTestRating] = useState<SelfEvalRating | null>(null);
  const [connectIdx, setConnectIdx] = useState(0);

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

  // Load all yesterday & older review verse texts from IndexedDB / verified API
  useEffect(() => {
    const uniqueSurahIds = Array.from(
      new Set([
        ...yesterdayQueue.map((item) => item.surahId),
        ...olderQueue.map((item) => item.surahId),
      ]),
    );
    if (uniqueSurahIds.length === 0) return;

    let cancelled = false;
    setLoadingReviewText(true);

    void Promise.all(
      uniqueSurahIds.map(async (sid) => {
        const res = await loadVerifiedSurahAyahs(sid);
        return { sid, ayahs: res.ayahs };
      }),
    ).then((results) => {
      if (cancelled) return;
      const nextMap: Record<string, string> = {};
      for (const { sid, ayahs: surahAyahs } of results) {
        for (const a of surahAyahs) {
          nextMap[`${sid}:${a.number}`] = a.textAr;
        }
      }
      setReviewAyahTexts(nextMap);
      setLoadingReviewText(false);
    });

    return () => {
      cancelled = true;
    };
  }, [yesterdayQueue, olderQueue]);

  // Compute today's portion slice in the current Surah
  const startIdx = Math.max(
    0,
    ayahs.findIndex((a) => a.number === currentAyah),
  );
  const portionAyahs = ayahs.slice(startIdx, startIdx + dailyTarget);
  const activeMemAyah = portionAyahs[memOffset] ?? portionAyahs[0];
  const activeTestAyah = portionAyahs[testOffset] ?? portionAyahs[0];

  // Connected range (includes preceding verse only if it is actually memorized/weak)
  const prevAyahEntry = startIdx > 0 ? ayahs[startIdx - 1] : null;
  const prevAyahRecord = prevAyahEntry
    ? verseRecords[`${surah.id}:${prevAyahEntry.number}`]
    : undefined;
  const hasMemorizedPrevAyah =
    prevAyahRecord?.status === 'memorized' || prevAyahRecord?.status === 'weak';
  const connectStartIdx = hasMemorizedPrevAyah ? startIdx - 1 : startIdx;
  const connectAyahs = ayahs.slice(connectStartIdx, startIdx + dailyTarget);

  const currentStep: SessionStepId = isSessionDone
    ? 'completed'
    : (sessionSteps[stepIndex]?.id ?? 'newMemorization');

  const [justFinishedSurah, setJustFinishedSurah] = useState(false);

  const advanceNextWirdPosition = () => {
    const lastCompletedAyah = portionAyahs[portionAyahs.length - 1]?.number ?? currentAyah;
    if (lastCompletedAyah < surah.totalAyahs) {
      setJustFinishedSurah(false);
      setCurrentPosition(surah.id, lastCompletedAyah + 1);
    } else {
      setJustFinishedSurah(true);
    }
  };

  const advanceStep = (completedKey: keyof DailyStagesState) => {
    setDailyStage(completedKey, true);
    setReviewHidden(false);
    setHideLevel(0);
    setTestRevealed(false);
    setTestRating(null);
    setConnectIdx(0);

    if (stepIndex + 1 < sessionSteps.length) {
      setStepIndex((i) => i + 1);
    } else {
      setLastCompletedSession(portionAyahs.map((a) => `${surah.id}:${a.number}`));
      advanceNextWirdPosition();
      setIsSessionDone(true);
    }
  };

  const handleCompleteYesterdayReview = () => {
    if (activeYesterdaySurahId === null) {
      advanceStep('yesterdayReview');
      return;
    }
    for (const item of activeYesterdayQueue) {
      recordEvaluation(item.key, yesterdayRating);
    }
    const nextDone = Array.from(new Set([...doneYesterdaySurahs, activeYesterdaySurahId]));
    const remaining = yesterdaySurahIds.filter((id) => !nextDone.includes(id));
    if (remaining.length > 0) {
      setDoneYesterdaySurahs(nextDone);
      setYesterdaySurahId(remaining[0]);
      setYesterdayIdx(0);
      setYesterdayRating('good');
      return;
    }
    setDoneYesterdaySurahs([]);
    advanceStep('yesterdayReview');
  };

  const handleCompleteOlderReview = () => {
    if (activeOlderSurahId === null) {
      advanceStep('olderReview');
      return;
    }
    for (const item of activeOlderQueue) {
      recordEvaluation(item.key, olderRating);
    }
    const nextDone = Array.from(new Set([...doneOlderSurahs, activeOlderSurahId]));
    const remaining = olderSurahIds.filter((id) => !nextDone.includes(id));
    if (remaining.length > 0) {
      setDoneOlderSurahs(nextDone);
      setOlderSurahId(remaining[0]);
      setOlderIdx(0);
      setOlderRating('good');
      return;
    }
    setDoneOlderSurahs([]);
    advanceStep('olderReview');
  };

  const handleStartNextSession = () => {
    setInitialQueues(
      computeRevisionQueues(verseRecords, {
        lastSessionKeys,
        lastSessionCompletedAt,
      }),
    );
    setYesterdayIdx(0);
    setOlderIdx(0);
    setYesterdaySurahId(null);
    setOlderSurahId(null);
    setDoneYesterdaySurahs([]);
    setDoneOlderSurahs([]);
    setYesterdayRating('good');
    setOlderRating('good');
    setMemOffset(0);
    setTestOffset(0);
    setConnectIdx(0);
    setReviewHidden(false);
    setHideLevel(0);
    setTestRevealed(false);
    setTestRating(null);
    setJustFinishedSurah(false);
    setStepIndex(0);
    setIsSessionDone(false);
  };

  const handleSurahChange = (nextSurahId: number) => {
    const savedAyah = surahCursors[nextSurahId] ?? 1;
    setCurrentPosition(nextSurahId, savedAyah);
    setMemOffset(0);
    setTestOffset(0);
    setConnectIdx(0);
    setJustFinishedSurah(false);
    setIsSessionDone(false);
    const memIdx = sessionSteps.findIndex((s) => s.id === 'newMemorization');
    setStepIndex(memIdx >= 0 ? memIdx : 0);
  };

  const handleCompleteMemorizeAyah = () => {
    if (!activeMemAyah) return;
    setVerseStatus(`${surah.id}:${activeMemAyah.number}`, 'in_progress');
    setHideLevel(0);
    if (memOffset + 1 < portionAyahs.length) {
      setMemOffset((o) => o + 1);
    } else {
      setTestOffset(0);
      advanceStep('newMemorization');
    }
  };

  const handleCompleteTestAyah = () => {
    if (!activeTestAyah || !testRating) return;
    recordEvaluation(`${surah.id}:${activeTestAyah.number}`, testRating, true);
    setTestRevealed(false);
    setTestRating(null);
    if (testOffset + 1 < portionAyahs.length) {
      setTestOffset((o) => o + 1);
    } else {
      setConnectIdx(0);
      advanceStep('selfTest');
    }
  };

  const renderMaskedText = (text: string) => {
    if (hideLevel === 0) return text;
    return text
      .split(' ')
      .map((w, idx) => {
        if (hideLevel === 1 && idx > 0 && idx % 3 === 1) return '•••••';
        if (hideLevel === 2 && idx > 0 && idx % 3 !== 0) return '•••••';
        if (hideLevel === 3 && idx > 0) return '•••••';
        return w;
      })
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

        {/* STEP 1: Yesterday's Review (Single Surah at a time) */}
        {currentStep === 'yesterdayReview' && yesterdayTarget && yesterdaySurah && (
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-lg font-bold text-foreground">مراجعة الأمس</h1>
                <p className="text-xs text-muted-foreground">
                  مراجعة {toArabicDigits(activeYesterdayQueue.length)}{' '}
                  {activeYesterdayQueue.length === 1 ? 'آية' : 'آيات'} من {yesterdaySurah.nameAr}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                {yesterdaySurah.nameAr} •{' '}
                {activeYesterdayQueue.length > 1
                  ? `الآيات ${toArabicDigits(activeYesterdayQueue[0].ayahNumber)}–${toArabicDigits(activeYesterdayQueue[activeYesterdayQueue.length - 1].ayahNumber)}`
                  : `الآية ${toArabicDigits(yesterdayTarget.ayahNumber)}`}
              </span>
            </div>

            {yesterdaySurahIds.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {yesterdaySurahIds.map((sid) => {
                  const s = getSurahById(sid);
                  const selected = sid === activeYesterdaySurahId;
                  return (
                    <button
                      key={sid}
                      type="button"
                      onClick={() => {
                        setYesterdaySurahId(sid);
                        setYesterdayIdx(0);
                      }}
                      aria-pressed={selected}
                      className={cn(
                        'rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-secondary',
                      )}
                    >
                      {s.nameAr}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              راجع آيات الأمس متصلةً قراءةً أو استماعاً مرجعياً قبل البدء بالآيات الجديدة. اضغط على
              أي آية للاستماع إليها.
            </p>

            <div className="rounded-2xl bg-secondary/50 p-4 text-justify" dir="rtl" lang="ar">
              {reviewHidden ? (
                <p className="py-4 text-center text-sm font-medium text-muted-foreground">
                  [ النص مخفي: سمّع الآيات غيباً ثم أظهرها للتحقق ]
                </p>
              ) : loadingReviewText && !reviewAyahTexts[yesterdayTarget.key] ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  <span>جاري تحميل نص الآيات...</span>
                </div>
              ) : (
                <p className="quran-text leading-[2.3] text-foreground">
                  {activeYesterdayQueue.map((item, idx) => {
                    const isSelected = idx === safeYesterdayIdx;
                    return (
                      <span
                        key={item.key}
                        role="button"
                        tabIndex={0}
                        onClick={() => setYesterdayIdx(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setYesterdayIdx(idx);
                          }
                        }}
                        className={cn(
                          'cursor-pointer rounded-lg transition-colors',
                          isSelected ? 'bg-primary/10 px-1' : 'hover:bg-secondary/80',
                        )}
                      >
                        {reviewAyahTexts[item.key] ?? 'تعذّر تحميل نص الآية'}{' '}
                        <span className="mx-1 font-quran text-primary">
                          ﴿{toArabicDigits(item.ayahNumber)}﴾
                        </span>{' '}
                      </span>
                    );
                  })}
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
              onPrevAyah={
                safeYesterdayIdx > 0 ? () => setYesterdayIdx((i) => Math.max(0, i - 1)) : undefined
              }
              onNextAyah={
                safeYesterdayIdx + 1 < activeYesterdayQueue.length
                  ? () => setYesterdayIdx((i) => i + 1)
                  : undefined
              }
            />

            <div className="rounded-xl border border-border bg-background/70 p-3">
              <p className="mb-2 text-xs font-bold text-foreground">
                {copy.revisionEvalPrompt} ({getSurahDisplayName(yesterdaySurah, language)})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'difficult', label: copy.evalDifficult },
                    { id: 'good', label: copy.evalGood },
                    { id: 'easy', label: copy.evalEasy },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setYesterdayRating(opt.id)}
                    aria-pressed={yesterdayRating === opt.id}
                    className={cn(
                      'min-h-[42px] rounded-xl border text-xs font-bold transition-colors',
                      yesterdayRating === opt.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:bg-secondary',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompleteYesterdayReview}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-base font-bold text-primary-foreground hover:opacity-95"
            >
              <span>
                {yesterdaySurahIds.filter((id) => !doneYesterdaySurahs.includes(id)).length > 1
                  ? `${copy.revisionCompleteBtn} (${getSurahDisplayName(yesterdaySurah, language)})`
                  : language === 'en'
                    ? "Finish Yesterday's Review • Continue"
                    : language === 'fr'
                      ? 'Terminer la révision d’hier • Continuer'
                      : 'أتممت مراجعة الأمس • المتابعة'}
              </span>
              <DirArrow className="h-5 w-5" aria-hidden="true" />
            </button>
          </section>
        )}

        {/* STEP 2: Older / Weak Material Review (Single Surah at a time) */}
        {currentStep === 'olderReview' && olderTarget && olderSurah && (
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-lg font-bold text-foreground">المراجعة السابقة</h1>
                <p className="text-xs text-muted-foreground">
                  مراجعة {toArabicDigits(activeOlderQueue.length)}{' '}
                  {activeOlderQueue.length === 1 ? 'آية' : 'آيات'} من {olderSurah.nameAr}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                {olderSurah.nameAr} • الآية {toArabicDigits(olderTarget.ayahNumber)}
              </span>
            </div>

            {olderSurahIds.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {olderSurahIds.map((sid) => {
                  const s = getSurahById(sid);
                  const selected = sid === activeOlderSurahId;
                  return (
                    <button
                      key={sid}
                      type="button"
                      onClick={() => {
                        setOlderSurahId(sid);
                        setOlderIdx(0);
                      }}
                      aria-pressed={selected}
                      className={cn(
                        'rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-secondary',
                      )}
                    >
                      {s.nameAr}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              تدوير المحفوظ القديم ومواضع العناية يحفظ القرآن غضّاً في الصدر. اضغط على أي آية
              للاستماع إليها.
            </p>

            <div className="rounded-2xl bg-secondary/50 p-4 text-justify" dir="rtl" lang="ar">
              {reviewHidden ? (
                <p className="py-4 text-center text-sm font-medium text-muted-foreground">
                  [ النص مخفي: سمّع الآيات غيباً ثم أظهرها للتحقق ]
                </p>
              ) : loadingReviewText && !reviewAyahTexts[olderTarget.key] ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  <span>جاري تحميل نص الآيات...</span>
                </div>
              ) : (
                <p className="quran-text leading-[2.3] text-foreground">
                  {activeOlderQueue.map((item, idx) => {
                    const isSelected = idx === safeOlderIdx;
                    return (
                      <span
                        key={item.key}
                        role="button"
                        tabIndex={0}
                        onClick={() => setOlderIdx(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setOlderIdx(idx);
                          }
                        }}
                        className={cn(
                          'cursor-pointer rounded-lg transition-colors',
                          isSelected ? 'bg-primary/10 px-1' : 'hover:bg-secondary/80',
                        )}
                      >
                        {reviewAyahTexts[item.key] ?? 'تعذّر تحميل نص الآية'}{' '}
                        <span className="mx-1 font-quran text-primary">
                          ﴿{toArabicDigits(item.ayahNumber)}﴾
                        </span>{' '}
                      </span>
                    );
                  })}
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
              onPrevAyah={
                safeOlderIdx > 0 ? () => setOlderIdx((i) => Math.max(0, i - 1)) : undefined
              }
              onNextAyah={
                safeOlderIdx + 1 < activeOlderQueue.length
                  ? () => setOlderIdx((i) => i + 1)
                  : undefined
              }
            />

            <div className="rounded-xl border border-border bg-background/70 p-3">
              <p className="mb-2 text-xs font-bold text-foreground">
                {copy.revisionEvalPrompt} ({getSurahDisplayName(olderSurah, language)})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'difficult', label: copy.evalDifficult },
                    { id: 'good', label: copy.evalGood },
                    { id: 'easy', label: copy.evalEasy },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOlderRating(opt.id)}
                    aria-pressed={olderRating === opt.id}
                    className={cn(
                      'min-h-[42px] rounded-xl border text-xs font-bold transition-colors',
                      olderRating === opt.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:bg-secondary',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompleteOlderReview}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-base font-bold text-primary-foreground hover:opacity-95"
            >
              <span>
                {olderSurahIds.filter((id) => !doneOlderSurahs.includes(id)).length > 1
                  ? `${copy.revisionCompleteBtn} (${getSurahDisplayName(olderSurah, language)})`
                  : language === 'en'
                    ? 'Finish Older Review • Start New'
                    : language === 'fr'
                      ? 'Terminer la révision • Mémoriser'
                      : 'أتممت المراجعة السابقة • بدء الحفظ الجديد'}
              </span>
              <DirArrow className="h-5 w-5" aria-hidden="true" />
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
                  onClick={() => setHideLevel((lvl) => ((lvl + 1) % 4) as 0 | 1 | 2 | 3)}
                  aria-pressed={hideLevel > 0}
                  className={cn(
                    'inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold transition-colors',
                    hideLevel > 0
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-secondary',
                  )}
                >
                  {hideLevel > 0 ? (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>
                    {hideLevel === 0
                      ? language === 'en'
                        ? 'Hide words'
                        : language === 'fr'
                          ? 'Masquer'
                          : 'إخفاء تدريجي'
                      : hideLevel === 3
                        ? language === 'en'
                          ? 'Show all'
                          : language === 'fr'
                            ? 'Tout afficher'
                            : 'إظهار الكل'
                        : `${language === 'en' ? 'Hide' : language === 'fr' ? 'Masqué' : 'إخفاء'} ${formatNum(hideLevel, language)}/${formatNum(3, language)}`}
                  </span>
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
                    { id: 'easy', title: 'سهلة', sub: 'ثابتة بيسر' },
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
                  ? language === 'en'
                    ? 'Save Rating • Next Verse'
                    : language === 'fr'
                      ? 'Valider • Verset suivant'
                      : 'تثبيت التقييم • الآية التالية'
                  : language === 'en'
                    ? 'Finish Self-Test • Connect Verses'
                    : language === 'fr'
                      ? 'Auto-test terminé • Relier les versets'
                      : 'أتممت التسميع • الانتقال لربط الآيات'}
              </span>
              <DirArrow className="h-5 w-5" aria-hidden="true" />
            </button>
          </section>
        )}

        {/* STEP 5: Connecting Verses */}
        {currentStep === 'verseConnection' && (
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-foreground">
                {language === 'en'
                  ? 'Connect Verses'
                  : language === 'fr'
                    ? 'Relier les versets'
                    : 'ربط الآيات'}
              </h1>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                {language === 'en'
                  ? 'Full Passage'
                  : language === 'fr'
                    ? 'Passage complet'
                    : 'المقطع الكامل'}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {language === 'en'
                ? 'Read and listen to the passage connected from its beginning to lock verse transitions.'
                : language === 'fr'
                  ? 'Lisez et écoutez le passage en continu pour ancrer les enchaînements entre versets.'
                  : 'اقرأ الآيات متصلة من بدايتها لتثبيت الانتقال بين نهايات الآيات وبداياتها. اضغط على أي آية للاستماع.'}
            </p>

            {surah.id !== 1 && surah.id !== 9 && connectAyahs[0]?.number === 1 && (
              <p className="text-center font-quran text-xl text-muted-foreground" dir="rtl" lang="ar">
                بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
              </p>
            )}

            <div className="rounded-2xl bg-secondary/50 p-4 text-justify" dir="rtl" lang="ar">
              <p className="quran-text leading-[2.3] text-foreground">
                {connectAyahs.map((a, idx) => {
                  const selected = idx === Math.min(connectIdx, Math.max(0, connectAyahs.length - 1));
                  return (
                    <span
                      key={a.number}
                      role="button"
                      tabIndex={0}
                      onClick={() => setConnectIdx(idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setConnectIdx(idx);
                        }
                      }}
                      className={cn(
                        'cursor-pointer rounded-lg transition-colors',
                        selected ? 'bg-primary/10 px-1' : 'hover:bg-secondary/80',
                      )}
                    >
                      {a.textAr}{' '}
                      <span className="mx-1 font-quran text-primary">
                        ﴿{toArabicDigits(a.number)}﴾
                      </span>{' '}
                    </span>
                  );
                })}
              </p>
            </div>

            {connectAyahs.length > 0 && (
              <AudioPlayerBar
                mode="reference"
                surahId={surah.id}
                surahName={getSurahDisplayName(surah, language)}
                ayahNumber={
                  connectAyahs[Math.min(connectIdx, connectAyahs.length - 1)]?.number ??
                  connectAyahs[0].number
                }
                onPrevAyah={
                  connectIdx > 0 ? () => setConnectIdx((i) => Math.max(0, i - 1)) : undefined
                }
                onNextAyah={
                  connectIdx + 1 < connectAyahs.length
                    ? () => setConnectIdx((i) => i + 1)
                    : undefined
                }
              />
            )}

            <button
              type="button"
              onClick={() => advanceStep('verseConnection')}
              className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-base font-bold text-primary-foreground hover:opacity-95"
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span>
                {language === 'en'
                  ? 'Finish Verse Connection & Complete Session'
                  : language === 'fr'
                    ? 'Terminer la liaison et la séance'
                    : 'أتممت ربط الآيات وإنهاء الجلسة'}
              </span>
            </button>
          </section>
        )}

        {/* SESSION COMPLETE */}
        {currentStep === 'completed' && (
          <section className="space-y-4 rounded-2xl border border-primary/30 bg-card p-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-bold text-primary">
              {language === 'en'
                ? 'Well done, keep going'
                : language === 'fr'
                  ? 'Bravo, continuez ainsi'
                  : 'أحسنت، واصل'}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              {justFinishedSurah
                ? language === 'en'
                  ? `You have reached the end of ${getSurahDisplayName(surah, language)}. Choose your next Surah below whenever you are ready.`
                  : language === 'fr'
                    ? `Vous avez terminé ${getSurahDisplayName(surah, language)}. Choisissez votre prochaine sourate ci-dessous.`
                    : `أتممت بفضل الله ${surah.nameAr}. اختر السورة التالية التي تودّ البدء بها.`
                : language === 'en'
                  ? `Portion completed! Your next position is ${getSurahDisplayName(surah, language)} • Verse ${formatNum(currentAyah, language)}.`
                  : language === 'fr'
                    ? `Séance terminée ! Prochaine position : ${getSurahDisplayName(surah, language)} • Verset ${formatNum(currentAyah, language)}.`
                    : `تمّ حفظ الورد بنجاح وتحديث موضعك القادم إلى ${surah.nameAr} • الآية ${toArabicDigits(currentAyah)}.`}
            </p>
            {justFinishedSurah && (
              <div className="mx-auto max-w-xs pt-1">
                <MillaPicker
                  searchable
                  value={String(surah.id)}
                  onChange={(val) => {
                    const nextId = Number(val);
                    setCurrentPosition(nextId, surahCursors[nextId] ?? 1);
                    handleStartNextSession();
                  }}
                  title={
                    language === 'en'
                      ? 'Choose next Surah'
                      : language === 'fr'
                        ? 'Choisir la prochaine sourate'
                        : 'اختر السورة التالية'
                  }
                  ariaLabel={
                    language === 'en'
                      ? 'Choose next Surah'
                      : language === 'fr'
                        ? 'Choisir la prochaine sourate'
                        : 'اختر السورة التالية'
                  }
                  icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
                  options={SURAHS.map((s) => ({
                    value: String(s.id),
                    label: `${toArabicDigits(s.id)}. ${getSurahDisplayName(s, language)}`,
                    description: `${formatNum(s.totalAyahs, language)} ${copy.versesUnit}`,
                    keywords: `${s.nameEn} ${s.nameFr} ${s.nameAr}`,
                  }))}
                />
              </div>
            )}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleStartNextSession}
                className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
              >
                <span>
                  {language === 'en'
                    ? 'Start Next Portion'
                    : language === 'fr'
                      ? 'Portion suivante'
                      : 'بدء الورد التالي الآن'}
                </span>
                <DirArrow className="h-4 w-4" aria-hidden="true" />
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
