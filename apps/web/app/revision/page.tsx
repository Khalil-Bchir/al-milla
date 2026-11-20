'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  HelpCircle,
  Layers,
  PlayCircle,
  RefreshCw,
  Shuffle,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { AudioPlayerBar } from '@/components/milla/AudioPlayerBar';
import { MillaPicker, type MillaPickerOption } from '@/components/milla/MillaPicker';
import { cn } from '@/lib/utils';
import {
  SURAHS,
  getSurahById,
  loadVerifiedSurahAyahs,
  toArabicDigits,
} from '@/lib/quran-data';
import {
  computeRevisionQueues,
  useMillaStore,
  type MemorizedVerseRecord,
  type SelfEvalRating,
} from '@/store/milla-store';

type RevisionPlanId =
  | 'daily_srs'
  | 'weekly_harvest'
  | 'whole_surah'
  | 'weak_spots'
  | 'interleaved_mix'
  | 'monthly_deep';

type PlanCategory = 'all' | 'scheduled' | 'focused';
type RecallViewMode = 'full' | 'cue' | 'hidden';

interface RevisionTargetItem {
  key: string;
  surahId: number;
  ayahNumber: number;
}

interface RevisionPlanMeta {
  id: RevisionPlanId;
  category: Exclude<PlanCategory, 'all'>;
  title: string;
  badge: string;
  scienceTag: string;
  shortDesc: string;
  scienceNote: string;
  icon: typeof Brain;
  items: RevisionTargetItem[];
}

const ONE_DAY_MS = 86_400_000;

function sortVerseTargets(items: RevisionTargetItem[]): RevisionTargetItem[] {
  return [...items].sort((a, b) => a.surahId - b.surahId || a.ayahNumber - b.ayahNumber);
}

function toTargetItems(records: MemorizedVerseRecord[]): RevisionTargetItem[] {
  return sortVerseTargets(
    records.map((r) => ({
      key: r.key,
      surahId: r.surahId,
      ayahNumber: r.ayahNumber,
    })),
  );
}

function deterministicShuffle(
  items: RevisionTargetItem[],
  seed: number,
): RevisionTargetItem[] {
  const arr = [...items];
  let s = seed + 1;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function formatCueText(textAr: string): string {
  const words = textAr.trim().split(/\s+/);
  if (words.length <= 2) return textAr;
  return `${words.slice(0, 2).join(' ')} ...`;
}

export default function RevisionPage() {
  const verseRecords = useMillaStore((s) => s.verseRecords);
  const activityDates = useMillaStore((s) => s.activityDates);
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const recordEvaluation = useMillaStore((s) => s.recordEvaluation);
  const setDailyStage = useMillaStore((s) => s.setDailyStage);

  const queues = useMemo(() => computeRevisionQueues(verseRecords), [verseRecords]);
  const totalMemorizedCount = Object.keys(verseRecords).length;

  // Plan filter & Surah selector
  const [categoryFilter, setCategoryFilter] = useState<PlanCategory>('all');
  const [selectedSurahId, setSelectedSurahId] = useState<number>(currentSurahId);
  const [shuffleSeed, setShuffleSeed] = useState<number>(1);

  // Active focused revision session state
  const [activePlanId, setActivePlanId] = useState<RevisionPlanId | null>(null);
  const [activeAudioIdx, setActiveAudioIdx] = useState<number>(0);
  const [recallMode, setRecallMode] = useState<RecallViewMode>('full');
  const [showScienceTip, setShowScienceTip] = useState<boolean>(false);
  const [planRating, setPlanRating] = useState<SelfEvalRating>('good');
  const [completedPlanTitle, setCompletedPlanTitle] = useState<string | null>(null);

  // Loaded Arabic verse text map keyed by "surahId:ayahNumber"
  const [ayahTextMap, setAyahTextMap] = useState<Record<string, string>>({});
  const [loadingTexts, setLoadingTexts] = useState<boolean>(false);

  const surahOptions: MillaPickerOption[] = useMemo(
    () =>
      SURAHS.map((s) => {
        const memorizedInSurah = Object.values(verseRecords).filter(
          (r) => r.surahId === s.id,
        ).length;
        return {
          value: String(s.id),
          label: `${toArabicDigits(s.id)}. ${s.nameAr}`,
          description:
            memorizedInSurah > 0
              ? `محفوظ ${toArabicDigits(memorizedInSurah)} من ${toArabicDigits(s.totalAyahs)} آية`
              : `${toArabicDigits(s.totalAyahs)} آية`,
          keywords: `${s.nameAr} ${s.nameEn} ${s.id}`,
        };
      }),
    [verseRecords],
  );

  const plans = useMemo<RevisionPlanMeta[]>(() => {
    const nowMs = Date.now();
    const allRecords = Object.values(verseRecords);

    // 1. Daily SRS
    const srsMap = new Map<string, RevisionTargetItem>();
    for (const r of [...queues.weakItems, ...queues.yesterdayItems, ...queues.olderDueItems]) {
      srsMap.set(r.key, { key: r.key, surahId: r.surahId, ayahNumber: r.ayahNumber });
    }
    const dailySrsItems = sortVerseTargets(Array.from(srsMap.values()));

    // 2. Last 7 Days Cumulative Harvest
    const sevenDaysAgoMs = nowMs - 7 * ONE_DAY_MS;
    const weeklyItems = toTargetItems(
      allRecords.filter((r) => {
        const ms = Date.parse(r.firstMemorizedAt);
        return Number.isFinite(ms) && ms >= sevenDaysAgoMs;
      }),
    );

    // 3. Whole Surah Sweep
    const chosenSurah = getSurahById(selectedSurahId);
    const wholeSurahItems: RevisionTargetItem[] = Array.from(
      { length: chosenSurah.totalAyahs },
      (_, idx) => {
        const ayahNumber = idx + 1;
        return {
          key: `${chosenSurah.id}:${ayahNumber}`,
          surahId: chosenSurah.id,
          ayahNumber,
        };
      },
    );

    // 4. Targeted Weak Spots
    const weakItems = toTargetItems(queues.weakItems);

    // 5. Interleaved Mixed Recall
    const allTargets = toTargetItems(allRecords);
    const interleavedItems = deterministicShuffle(allTargets, shuffleSeed).slice(0, 10);

    // 6. 30-Day Deep Consolidation
    const thirtyDaysAgoMs = nowMs - 30 * ONE_DAY_MS;
    const monthlyItems = toTargetItems(
      allRecords.filter((r) => {
        const ms = Date.parse(r.firstMemorizedAt);
        return Number.isFinite(ms) && ms >= thirtyDaysAgoMs;
      }),
    );

    return [
      {
        id: 'daily_srs',
        category: 'scheduled',
        title: 'خطة التكرار المتباعد اليومية',
        badge: '١ – ٣ – ٧ – ١٤ – ٣٠ يوماً',
        scienceTag: 'منحنى النسيان (Ebbinghaus)',
        shortDesc: 'مراجعة الآيات المستحقة اليوم قبل تلاشيها من الذاكرة.',
        scienceNote:
          'تستهدف الآيات المستحقة اليوم في اللحظة الحرجة قبل نسيانها، وهو التوقيت المثالي لرفع قوة الاسترجاع بأقل جهد.',
        icon: Clock,
        items: dailySrsItems,
      },
      {
        id: 'weekly_harvest',
        category: 'scheduled',
        title: 'مراجعة حصاد الأسبوع',
        badge: 'آخر ٧ أيام',
        scienceTag: 'التثبيت التراكمي الأسبوعي',
        shortDesc: 'جمع ومراجعة كل ما حفظته خلال الأيام السبعة الماضية.',
        scienceNote:
          'دمج ما حُفظ خلال الأسبوع في جلسة متصلة واحدة ينقله من الذاكرة قصيرة المدى إلى التثبيت طويل المدى.',
        icon: CalendarDays,
        items: weeklyItems,
      },
      {
        id: 'whole_surah',
        category: 'focused',
        title: `مراجعة سورة كاملة`,
        badge: chosenSurah.nameAr,
        scienceTag: 'التجميع السياقي (Chunking)',
        shortDesc: 'سرد سورة كاملة متصلة لضبط انتقالات الآيات وبداياتها.',
        scienceNote:
          'سرد السورة كاملةً يبني روابط تسلسلية متينة بين نهايات الآيات وبداياتها ويمنع الانقطاع أثناء التلاوة.',
        icon: Layers,
        items: wholeSurahItems,
      },
      {
        id: 'weak_spots',
        category: 'focused',
        title: 'استهداف مواضع العناية',
        badge: 'أولوية قصوى',
        scienceTag: 'الصعوبة المرغوبة (Leitner)',
        shortDesc: 'تركيز المراجعة على الآيات المتعثرة أو التي قُيّمت كصعبة.',
        scienceNote:
          'تخصيص وقت مركّز للآيات الصعبة يعالج نقاط الضعف مباشرة بدل إضاعة الوقت في الآيات المتقنة.',
        icon: Target,
        items: weakItems,
      },
      {
        id: 'interleaved_mix',
        category: 'focused',
        title: 'المراجعة المتداخلة العشوائية',
        badge: 'حتى ١٠ آيات',
        scienceTag: 'التداخل المعرفي (Interleaving)',
        shortDesc: 'اختبار الاسترجاع عبر آيات متفرقة من سور مختلفة دون ترتيب.',
        scienceNote:
          'الانتقال غير المتوقع بين سور ومواضع مختلفة يقوّي الاسترجاع المستقل للآية دون الاعتماد على سياق الحفظ.',
        icon: Shuffle,
        items: interleavedItems,
      },
      {
        id: 'monthly_deep',
        category: 'scheduled',
        title: 'خطة التثبيت الشهري',
        badge: 'آخر ٣٠ يوماً',
        scienceTag: 'ترسيخ الذاكرة بعيدة المدى',
        shortDesc: 'مراجعة شاملة لمحفوظ الشهر الأخير لترسيخ البنية الكاملة.',
        scienceNote:
          'مراجعة شاملة لمحفوظ الشهر تحفظ القاعدة القرآنية راسخة وتكشف الآيات التي بدأت تضعف مع الوقت.',
        icon: Brain,
        items: monthlyItems,
      },
    ];
  }, [verseRecords, queues, selectedSurahId, shuffleSeed]);

  const recommendedPlanId: RevisionPlanId =
    queues.totalDueCount > 0 ? 'daily_srs' : 'whole_surah';

  const visiblePlans = useMemo(
    () =>
      categoryFilter === 'all'
        ? plans
        : plans.filter((p) => p.category === categoryFilter),
    [plans, categoryFilter],
  );

  const activePlan = useMemo(
    () => plans.find((p) => p.id === activePlanId) ?? null,
    [plans, activePlanId],
  );

  // Load Arabic texts for active plan
  useEffect(() => {
    if (!activePlan || activePlan.items.length === 0) return;

    const uniqueSurahIds = Array.from(new Set(activePlan.items.map((item) => item.surahId)));
    const missingSurahs = uniqueSurahIds.filter((sid) => {
      const firstOfSurah = activePlan.items.find((i) => i.surahId === sid);
      return firstOfSurah ? !ayahTextMap[firstOfSurah.key] : false;
    });

    if (missingSurahs.length === 0) return;

    let cancelled = false;
    setLoadingTexts(true);

    void Promise.all(
      missingSurahs.map(async (sid) => {
        const res = await loadVerifiedSurahAyahs(sid);
        return { sid, ayahs: res.ayahs };
      }),
    ).then((results) => {
      if (cancelled) return;
      setAyahTextMap((prev) => {
        const next = { ...prev };
        for (const { sid, ayahs } of results) {
          for (const a of ayahs) {
            next[`${sid}:${a.number}`] = a.textAr;
          }
        }
        return next;
      });
      setLoadingTexts(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activePlan, ayahTextMap]);

  const startPlan = (planId: RevisionPlanId) => {
    setActivePlanId(planId);
    setActiveAudioIdx(0);
    setRecallMode('full');
    setShowScienceTip(false);
    setPlanRating('good');
    setCompletedPlanTitle(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCompletePlan = () => {
    if (!activePlan) return;

    for (const item of activePlan.items) {
      if (verseRecords[item.key]) {
        recordEvaluation(item.key, planRating);
      }
    }

    if (activePlan.id === 'daily_srs') {
      if (queues.yesterdayItems.length > 0) setDailyStage('yesterdayReview', true);
      if (queues.olderDueItems.length > 0 || queues.weakItems.length > 0) {
        setDailyStage('olderReview', true);
      }
    }

    setCompletedPlanTitle(activePlan.title);
    setActivePlanId(null);
  };

  const evalOptions: { id: SelfEvalRating; label: string; hint: string }[] = [
    { id: 'difficult', label: 'صعبة', hint: 'إعادة غداً' },
    { id: 'good', label: 'جيدة', hint: 'توسيع الفاصل' },
    { id: 'easy', label: 'متقنة وثابتة', hint: 'رسوخ طويل المدى' },
  ];

  const activeTarget = activePlan?.items[activeAudioIdx] ?? activePlan?.items[0] ?? null;
  const activeSurah = activeTarget ? getSurahById(activeTarget.surahId) : null;

  // FOCUSED REVISION SESSION VIEW
  if (activePlan && activeTarget && activeSurah) {
    return (
      <AppShell title={activePlan.title} subtitle={activePlan.scienceTag}>
        <div className="space-y-4">
          {/* Top Focus Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setActivePlanId(null)}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-bold text-foreground hover:bg-secondary"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              <span>العودة إلى خطط المراجعة</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-primary">
                الآية {toArabicDigits(activeAudioIdx + 1)} من{' '}
                {toArabicDigits(activePlan.items.length)}
              </span>
              <button
                type="button"
                onClick={() => setShowScienceTip((v) => !v)}
                aria-expanded={showScienceTip}
                aria-label="الأساس العلمي للخطة"
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors',
                  showScienceTip
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary',
                )}
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Collapsible Scientific Rationale */}
          {showScienceTip && (
            <div className="rounded-2xl border border-primary/20 bg-secondary/50 p-3.5 text-xs leading-relaxed text-foreground">
              <span className="font-bold text-primary">{activePlan.scienceTag}: </span>
              {activePlan.scienceNote}
            </div>
          )}

          {/* 3-State Active Recall Selector */}
          <div
            role="group"
            aria-label="وضع عرض النص للاسترجاع"
            className="grid grid-cols-3 gap-1.5 rounded-2xl border border-border bg-card p-1.5"
          >
            {(
              [
                { id: 'full', label: 'النص الكامل', icon: Eye },
                { id: 'cue', label: 'كلمات البداية', icon: Sparkles },
                { id: 'hidden', label: 'إخفاء للتسميع', icon: EyeOff },
              ] as const
            ).map((mode) => {
              const Icon = mode.icon;
              const selected = recallMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setRecallMode(mode.id)}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition-colors',
                    selected
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Connected Mushaf Passage Container */}
          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-2.5 text-xs text-muted-foreground">
              <span className="font-bold text-foreground">
                {activePlan.id === 'whole_surah'
                  ? activeSurah.nameAr
                  : `${activeSurah.nameAr} • الآية ${toArabicDigits(activeTarget.ayahNumber)}`}
              </span>
              <span>اضغط على أي آية للاستماع إليها</span>
            </div>

            <div
              className="max-h-[380px] overflow-y-auto rounded-xl bg-secondary/40 p-4 text-justify"
              dir="rtl"
              lang="ar"
            >
              {recallMode === 'hidden' ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <EyeOff className="h-7 w-7 text-primary/60" aria-hidden="true" />
                  <p className="text-sm font-semibold text-foreground">
                    النص مخفي للاستدعاء النشط
                  </p>
                  <p className="text-xs text-muted-foreground">
                    سمّع الآيات غيباً ثم اختر «كلمات البداية» أو «النص الكامل» للتحقق.
                  </p>
                </div>
              ) : loadingTexts && !ayahTextMap[activeTarget.key] ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  <span>جاري تحميل نص الآيات...</span>
                </div>
              ) : (
                <p className="quran-text leading-[2.35] text-foreground">
                  {activePlan.items.map((item, idx) => {
                    const prev = idx > 0 ? activePlan.items[idx - 1] : null;
                    const showSurahTag =
                      idx === 0 || (prev !== null && prev.surahId !== item.surahId);
                    const itemSurah = showSurahTag ? getSurahById(item.surahId) : null;
                    const isSelected = idx === activeAudioIdx;
                    const rawText = ayahTextMap[item.key] ?? '';
                    const displayedText =
                      recallMode === 'cue' && rawText ? formatCueText(rawText) : rawText;

                    return (
                      <span key={`${item.key}-${idx}`}>
                        {itemSurah && activePlan.id !== 'whole_surah' && (
                          <span className="mx-1.5 inline-block rounded-md bg-secondary px-2 py-0.5 font-sans text-xs font-semibold text-primary">
                            {itemSurah.nameAr}
                          </span>
                        )}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveAudioIdx(idx)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setActiveAudioIdx(idx);
                            }
                          }}
                          className={cn(
                            'cursor-pointer rounded-lg transition-colors',
                            isSelected
                              ? 'bg-primary/15 px-1.5 ring-1 ring-primary/30'
                              : 'hover:bg-secondary/80',
                          )}
                        >
                          {displayedText || 'تعذّر تحميل نص الآية'}{' '}
                          <span className="mx-1 font-quran text-primary">
                            ﴿{toArabicDigits(item.ayahNumber)}﴾
                          </span>
                        </span>{' '}
                      </span>
                    );
                  })}
                </p>
              )}
            </div>
          </section>

          {/* Reference Audio Player */}
          <AudioPlayerBar
            mode="reference"
            surahId={activeTarget.surahId}
            surahName={activeSurah.nameAr}
            ayahNumber={activeTarget.ayahNumber}
            onPrevAyah={
              activeAudioIdx > 0 ? () => setActiveAudioIdx((i) => i - 1) : undefined
            }
            onNextAyah={
              activeAudioIdx + 1 < activePlan.items.length
                ? () => setActiveAudioIdx((i) => i + 1)
                : undefined
            }
          />

          {/* Self Evaluation + Complete */}
          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-bold text-foreground">
              قيّم إتقانك لتحديث جدول التكرار المتباعد:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {evalOptions.map((opt) => {
                const selected = planRating === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPlanRating(opt.id)}
                    aria-pressed={selected}
                    className={cn(
                      'flex min-h-[60px] flex-col items-center justify-center rounded-xl border p-2 text-center transition-colors',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:bg-secondary',
                    )}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-[10px] opacity-85">{opt.hint}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleCompletePlan}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-base font-bold text-primary-foreground hover:opacity-95"
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span>أتممت المراجعة وتثبيت التقييم</span>
            </button>
          </section>
        </div>
      </AppShell>
    );
  }

  // PLANS DIRECTORY VIEW
  return (
    <AppShell title="المراجعة العلمية" subtitle="برامج التثبيت المبنية على الذاكرة المتباعدة">
      <div className="space-y-6">
        {/* Hero Summary Banner */}
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs opacity-90">لوحة المراجعة والتثبيت</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              ٦ خطط علمية
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">
                {queues.totalDueCount > 0
                  ? `مستحق للمراجعة اليوم: ${toArabicDigits(queues.totalDueCount)} آية`
                  : 'اختر خطة المراجعة المناسبة لك'}
              </h1>
              <p className="mt-1 text-xs leading-relaxed opacity-85">
                {queues.totalDueCount > 0
                  ? 'ابدأ بالمراجعة المستحقة الآن لحماية محفوظك من النسيان.'
                  : 'يمكنك مراجعة سورة كاملة أو استعراض خطط الأسبوع والشهر.'}
              </p>
            </div>

            {queues.totalDueCount > 0 && (
              <button
                type="button"
                onClick={() => startPlan('daily_srs')}
                className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-primary shadow-sm hover:opacity-95"
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                <span>ابدأ مراجعة اليوم</span>
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[11px] opacity-80">مراجعة الأمس</p>
              <p className="mt-0.5 text-lg font-bold">
                {toArabicDigits(queues.yesterdayItems.length)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[11px] opacity-80">إجمالي المحفوظ</p>
              <p className="mt-0.5 text-lg font-bold">{toArabicDigits(totalMemorizedCount)}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[11px] opacity-80">أيام التعهّد</p>
              <p className="mt-0.5 text-lg font-bold">{toArabicDigits(activityDates.length)}</p>
            </div>
          </div>
        </section>

        {/* Completion Banner */}
        {completedPlanTitle && (
          <section className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">
                  أتممت «{completedPlanTitle}» بنجاح
                </p>
                <p className="text-xs text-muted-foreground">
                  تم تحديث فواصل المراجعة القادمة لآياتك المحفوظة تلقائياً.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCompletedPlanTitle(null)}
              aria-label="إغلاق الإشعار"
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </section>
        )}

        {/* Weak Verses Alert Bar */}
        {queues.weakItems.length > 0 && (
          <section className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-xs font-medium text-foreground">
                لديك{' '}
                <span className="font-bold">{toArabicDigits(queues.weakItems.length)}</span>{' '}
                {queues.weakItems.length === 1 ? 'آية تحتاج' : 'آيات تحتاج'} لعناية إضافية.
              </p>
            </div>
            <button
              type="button"
              onClick={() => startPlan('weak_spots')}
              className="shrink-0 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-primary hover:opacity-90"
            >
              مراجعتها الآن
            </button>
          </section>
        )}

        {/* Filter Pills + Section Header */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground">برامج المراجعة المتاحة</h2>
            <div
              role="group"
              aria-label="تصنيف خطط المراجعة"
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1"
            >
              {(
                [
                  { id: 'all', label: 'الكل' },
                  { id: 'scheduled', label: 'خطط زمنية' },
                  { id: 'focused', label: 'سورة وتركيز' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  aria-pressed={categoryFilter === tab.id}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    categoryFilter === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visiblePlans.map((plan) => {
              const Icon = plan.icon;
              const isAvailable = plan.items.length > 0;
              const isRecommended = plan.id === recommendedPlanId;

              return (
                <article
                  key={plan.id}
                  className={cn(
                    'flex flex-col justify-between gap-3.5 rounded-2xl border bg-card p-4 transition-colors',
                    isRecommended
                      ? 'border-primary/45 ring-1 ring-primary/15'
                      : 'border-border',
                  )}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-base font-bold text-foreground">{plan.title}</h3>
                            {isRecommended && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                مقترح الآن
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-primary">
                            {plan.scienceTag}
                          </span>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                        {plan.badge}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {plan.shortDesc}
                    </p>

                    {plan.id === 'whole_surah' && (
                      <div className="pt-0.5">
                        <MillaPicker
                          value={String(selectedSurahId)}
                          options={surahOptions}
                          onChange={(val) => {
                            const nextId = Number(val);
                            if (Number.isFinite(nextId)) {
                              setSelectedSurahId(nextId);
                            }
                          }}
                          title="اختر السورة للمراجعة الكاملة"
                          ariaLabel="اختيار السورة للمراجعة الكاملة"
                          searchable
                          compact
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {plan.id === 'interleaved_mix' && isAvailable && (
                      <button
                        type="button"
                        onClick={() => setShuffleSeed((s) => s + 1)}
                        aria-label="تبديل الآيات العشوائية"
                        className="flex min-h-[46px] shrink-0 items-center justify-center gap-1 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-secondary"
                      >
                        <Shuffle className="h-4 w-4" aria-hidden="true" />
                        <span>تبديل</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => startPlan(plan.id)}
                      className={cn(
                        'flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-opacity',
                        isAvailable
                          ? 'bg-primary text-primary-foreground hover:opacity-95'
                          : 'cursor-not-allowed border border-border bg-muted text-muted-foreground',
                      )}
                    >
                      <PlayCircle className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {isAvailable
                          ? `بدء المراجعة (${toArabicDigits(plan.items.length)} ${plan.items.length === 1 ? 'آية' : 'آيات'})`
                          : 'لا توجد آيات محفوظة بعد'}
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Empty state CTA to Memorize */}
        {totalMemorizedCount === 0 && (
          <section className="rounded-2xl border border-border bg-card p-5 text-center">
            <BookOpen className="mx-auto h-7 w-7 text-primary" aria-hidden="true" />
            <h2 className="mt-2 text-base font-bold text-foreground">
              ابدأ وردك الأول لتفعيل الخطط الزمنية
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              يمكنك الآن تجربة «مراجعة سورة كاملة» لأي سورة، وعند حفظ آياتك الأولى ستتفعّل تلقائياً
              خطط الأمس والأسبوع والشهر والمراجعة المتداخلة.
            </p>
            <Link
              href="/memorize"
              className="mt-4 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground"
            >
              <span>الانتقال إلى الحفظ الجديد</span>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        )}
      </div>
    </AppShell>
  );
}
