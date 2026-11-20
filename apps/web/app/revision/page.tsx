'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
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

interface RevisionTargetItem {
  key: string;
  surahId: number;
  ayahNumber: number;
}

interface RevisionPlanMeta {
  id: RevisionPlanId;
  title: string;
  badge: string;
  scienceTag: string;
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

export default function RevisionPage() {
  const verseRecords = useMillaStore((s) => s.verseRecords);
  const activityDates = useMillaStore((s) => s.activityDates);
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const recordEvaluation = useMillaStore((s) => s.recordEvaluation);
  const setDailyStage = useMillaStore((s) => s.setDailyStage);

  const queues = useMemo(() => computeRevisionQueues(verseRecords), [verseRecords]);

  // Surah picker state for "Whole Surah" revision plan
  const [selectedSurahId, setSelectedSurahId] = useState<number>(currentSurahId);
  const [shuffleSeed, setShuffleSeed] = useState<number>(1);

  // Active interactive revision session state
  const [activePlanId, setActivePlanId] = useState<RevisionPlanId | null>(null);
  const [activeAudioIdx, setActiveAudioIdx] = useState<number>(0);
  const [passageHidden, setPassageHidden] = useState<boolean>(false);
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

    // 1. Daily SRS (Yesterday + Older Due + Weak, deduplicated)
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

    // 5. Interleaved Mixed Recall (up to 10 shuffled verses across memorized material)
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
        title: 'خطة التكرار المتباعد اليومية',
        badge: '١ – ٣ – ٧ – ١٤ – ٣٠ يوماً',
        scienceTag: 'منحنى النسيان (Ebbinghaus)',
        scienceNote:
          'تستهدف الآيات المستحقة اليوم قبل تلاشيها من الذاكرة، وهو التوقيت المثالي لرفع قوة الاسترجاع بأقل جهد.',
        icon: Clock,
        items: dailySrsItems,
      },
      {
        id: 'weekly_harvest',
        title: 'مراجعة حصاد الأسبوع',
        badge: 'آخر ٧ أيام',
        scienceTag: 'التثبيت التراكمي الأسبوعي',
        scienceNote:
          'دمج ما حُفظ خلال الأسبوع في جلسة متصلة واحدة ينقله من الذاكرة قصيرة المدى إلى التثبيت طويل المدى.',
        icon: CalendarDays,
        items: weeklyItems,
      },
      {
        id: 'whole_surah',
        title: `مراجعة سورة كاملة (${chosenSurah.nameAr})`,
        badge: `${toArabicDigits(chosenSurah.totalAyahs)} آية`,
        scienceTag: 'التجميع السياقي (Chunking)',
        scienceNote:
          'سرد السورة كاملةً يبني روابط تسلسلية متينة بين نهايات الآيات وبداياتها ويمنع الانقطاع أثناء التلاوة.',
        icon: Layers,
        items: wholeSurahItems,
      },
      {
        id: 'weak_spots',
        title: 'استهداف مواضع العناية',
        badge: 'أولوية قصوى',
        scienceTag: 'الصعوبة المرغوبة (Leitner)',
        scienceNote:
          'تخصيص وقت مركّز للآيات الصعبة أو المتعثرة يعالج نقاط الضعف مباشرة بدل إضاعة الوقت في المتقن.',
        icon: Target,
        items: weakItems,
      },
      {
        id: 'interleaved_mix',
        title: 'المراجعة المتداخلة العشوائية',
        badge: 'حتى ١٠ آيات متنوعة',
        scienceTag: 'التداخل المعرفي (Interleaving)',
        scienceNote:
          'الانتقال غير المتوقع بين سور ومواضع مختلفة يقوّي الاسترجاع المستقل للآية دون الاعتماد على سياق الحفظ.',
        icon: Shuffle,
        items: interleavedItems,
      },
      {
        id: 'monthly_deep',
        title: 'خطة التثبيت الشهري',
        badge: 'آخر ٣٠ يوماً',
        scienceTag: 'ترسيخ الذاكرة بعيدة المدى',
        scienceNote:
          'مراجعة شاملة لمحفوظ الشهر تحفظ القاعدة القرآنية راسخة وتكشف الآيات التي بدأت تضعف مع الوقت.',
        icon: Brain,
        items: monthlyItems,
      },
    ];
  }, [verseRecords, queues, selectedSurahId, shuffleSeed]);

  const activePlan = useMemo(
    () => plans.find((p) => p.id === activePlanId) ?? null,
    [plans, activePlanId],
  );

  // Load Arabic texts for the active plan's surahs
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
    setPassageHidden(false);
    setPlanRating('good');
    setCompletedPlanTitle(null);
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

  return (
    <AppShell title="المراجعة العلمية" subtitle="برامج وخطط التثبيت المبنية على الذاكرة المتباعدة">
      <div className="space-y-6">
        {/* Intro */}
        <section>
          <h1 className="text-2xl font-bold text-foreground">برامج وخطط المراجعة</h1>
          <p className="mt-1 text-base leading-relaxed text-muted-foreground">
            اختر برنامج المراجعة المناسب لوقتك وهدفك؛ جميع الخطط مصممة وفق أبحاث الذاكرة والتكرار
            المتباعد والاسترجاع النشط.
          </p>
        </section>

        {/* Daily Summary Banner */}
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs opacity-90">مؤشر التثبيت اليومي</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              ٦ خطط مراجعة علمية
            </span>
          </div>
          <p className="text-xl font-bold">
            {queues.totalDueCount > 0
              ? `مستحق للمراجعة اليوم: ${toArabicDigits(queues.totalDueCount)} آية`
              : 'سجّل حفظك أو اختر سورة كاملة للمراجعة'}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">مراجعة الأمس</p>
              <p className="mt-1 text-lg font-bold">
                {toArabicDigits(queues.yesterdayItems.length)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">المراجعة السابقة</p>
              <p className="mt-1 text-lg font-bold">
                {toArabicDigits(queues.olderDueItems.length)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">أيام التعهّد</p>
              <p className="mt-1 text-lg font-bold">{toArabicDigits(activityDates.length)} يوم</p>
            </div>
          </div>
        </section>

        {/* Completion Banner */}
        {completedPlanTitle && !activePlan && (
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

        {/* Active Interactive Revision Session */}
        {activePlan && activeTarget && activeSurah && (
          <section
            aria-label="جلسة المراجعة التفاعلية"
            className="space-y-4 rounded-2xl border-2 border-primary/40 bg-card p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{activePlan.scienceTag}</span>
                </span>
                <h2 className="mt-1.5 text-lg font-bold text-foreground">{activePlan.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {toArabicDigits(activePlan.items.length)}{' '}
                  {activePlan.items.length === 1 ? 'آية' : 'آيات'} في هذه الخطة • اضغط على أي آية
                  للاستماع إليها
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePlanId(null)}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span>إنهاء العرض</span>
              </button>
            </div>

            <p className="rounded-xl bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
              {activePlan.scienceNote}
            </p>

            {/* Connected Passage Card */}
            <div className="rounded-2xl bg-secondary/50 p-4 text-justify" dir="rtl" lang="ar">
              {passageHidden ? (
                <p className="py-6 text-center text-sm font-medium text-muted-foreground">
                  [ النص مخفي للاستدعاء النشط — سمّع الآيات غيباً ثم أظهرها للتحقق ]
                </p>
              ) : loadingTexts && !ayahTextMap[activeTarget.key] ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  <span>جاري تحميل نص الآيات...</span>
                </div>
              ) : (
                <p className="quran-text leading-[2.3] text-foreground">
                  {activePlan.items.map((item, idx) => {
                    const prev = idx > 0 ? activePlan.items[idx - 1] : null;
                    const showSurahTag =
                      idx === 0 || (prev !== null && prev.surahId !== item.surahId);
                    const itemSurah = showSurahTag ? getSurahById(item.surahId) : null;
                    const isSelected = idx === activeAudioIdx;

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
                            isSelected ? 'bg-primary/10 px-1' : 'hover:bg-secondary/80',
                          )}
                        >
                          {ayahTextMap[item.key] ?? 'تعذّر تحميل نص الآية'}{' '}
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

            {/* Active Recall Toggle */}
            <button
              type="button"
              onClick={() => setPassageHidden((v) => !v)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-secondary"
            >
              {passageHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span>{passageHidden ? 'إظهار النص للتحقق' : 'إخفاء النص للتسميع غيباً'}</span>
            </button>

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

            {/* Self Evaluation for Plan */}
            <div className="space-y-2 rounded-xl border border-border bg-background p-3.5">
              <p className="text-xs font-bold text-foreground">
                كيف كان أداؤك في هذه الخطة؟ (يحدّث جدول التكرار المتباعد)
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
                        'flex min-h-[56px] flex-col items-center justify-center rounded-xl border p-2 text-center transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground hover:bg-secondary',
                      )}
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className="text-[10px] opacity-85">{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
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
        )}

        {/* Scientific Revision Plans Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">اختر برنامج المراجعة</h2>
            <span className="text-xs text-muted-foreground">مبني على أبحاث الذاكرة</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isAvailable = plan.items.length > 0;
              const isActive = activePlanId === plan.id;

              return (
                <article
                  key={plan.id}
                  className={cn(
                    'flex flex-col justify-between gap-3 rounded-2xl border bg-card p-4 transition-colors',
                    isActive ? 'border-primary ring-1 ring-primary/30' : 'border-border',
                  )}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-foreground">{plan.title}</h3>
                          <span className="text-xs font-semibold text-primary">
                            {plan.scienceTag}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                        {plan.badge}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {plan.scienceNote}
                    </p>

                    {/* Surah Selector for Whole Surah plan */}
                    {plan.id === 'whole_surah' && (
                      <div className="pt-1">
                        <MillaPicker
                          value={String(selectedSurahId)}
                          options={surahOptions}
                          onChange={(val) => {
                            const nextId = Number(val);
                            if (Number.isFinite(nextId)) {
                              setSelectedSurahId(nextId);
                              if (activePlanId === 'whole_surah') {
                                setActiveAudioIdx(0);
                              }
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
                          ? `بدء الخطة (${toArabicDigits(plan.items.length)} ${plan.items.length === 1 ? 'آية' : 'آيات'})`
                          : 'لا توجد آيات محفوظة في هذا النطاق بعد'}
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Empty state CTA to Memorize */}
        {Object.keys(verseRecords).length === 0 && (
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

        {/* Quick Reference to Weak Verses count if any */}
        {queues.weakItems.length > 0 && !activePlan && (
          <section className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
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
      </div>
    </AppShell>
  );
}
