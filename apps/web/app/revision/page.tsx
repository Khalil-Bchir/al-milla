'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, BookOpen, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { cn } from '@/lib/utils';
import { getSurahById } from '@/lib/quran-data';
import {
  computeRevisionQueues,
  useMillaStore,
  type MemorizedVerseRecord,
  type SelfEvalRating,
} from '@/store/milla-store';

export default function RevisionPage() {
  const router = useRouter();
  const verseRecords = useMillaStore((s) => s.verseRecords);
  const activityDates = useMillaStore((s) => s.activityDates);
  const evaluations = useMillaStore((s) => s.evaluations);
  const recordEvaluation = useMillaStore((s) => s.recordEvaluation);
  const setCurrentPosition = useMillaStore((s) => s.setCurrentPosition);
  const setDailyStage = useMillaStore((s) => s.setDailyStage);

  const queues = computeRevisionQueues(verseRecords);
  const primaryYesterday = queues.yesterdayItems[0];
  const primaryOlder = queues.olderDueItems[0];
  const primaryWeak = queues.weakItems[0];

  const activeTarget = primaryWeak ?? primaryYesterday ?? primaryOlder;
  const activeTargetKey = activeTarget?.key ?? null;
  const [selectedEval, setSelectedEval] = useState<SelfEvalRating>(
    (activeTargetKey ? evaluations[activeTargetKey] : undefined) ?? 'good',
  );

  const evalOptions: { id: SelfEvalRating; label: string; hint: string }[] = [
    { id: 'difficult', label: 'صعبة', hint: 'مراجعة بعد يوم' },
    { id: 'good', label: 'جيدة', hint: 'توسيع الفاصل' },
    { id: 'easy', label: 'متقنة وثابتة', hint: 'رسوخ طويل المدى' },
  ];

  const handleQuickEval = (rating: SelfEvalRating) => {
    if (!activeTargetKey) return;
    setSelectedEval(rating);
    recordEvaluation(activeTargetKey, rating);
  };

  const handleLaunchReview = (
    rec: MemorizedVerseRecord,
    stage: 'yesterdayReview' | 'olderReview',
  ) => {
    setCurrentPosition(rec.surahId, rec.ayahNumber);
    setDailyStage(stage, true);
    router.push('/self-test');
  };

  const yesterdaySurah = primaryYesterday ? getSurahById(primaryYesterday.surahId) : null;
  const olderSurah = primaryOlder ? getSurahById(primaryOlder.surahId) : null;
  const weakSurah = primaryWeak ? getSurahById(primaryWeak.surahId) : null;

  return (
    <AppShell title="المراجعة اليومية" subtitle="الأركان الثلاثة للمراجعة والتثبيت">
      <div className="space-y-5">
        {/* Intro & Summary Card */}
        <section>
          <h1 className="text-2xl font-bold text-foreground">ورد المراجعة والتثبيت</h1>
          <p className="mt-1 text-base leading-relaxed text-muted-foreground">
            السر في حفظ القرآن رسوخ المراجعة اليومية قبل كل جديد؛ فالمحفوظ كالغرس يُتعاهد بالريّ لئلا يجف.
          </p>
        </section>

        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs opacity-90">خطة التثبيت اليومية</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              ٣ أركان للمراجعة
            </span>
          </div>
          <p className="text-xl font-bold">
            {queues.totalDueCount > 0
              ? `مستحق للمراجعة اليوم: ${queues.totalDueCount} آية`
              : 'لا توجد مراجعات مستحقة بعد'}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">مراجعة الأمس</p>
              <p className="mt-1 text-lg font-bold">{queues.yesterdayItems.length}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">المراجعة السابقة</p>
              <p className="mt-1 text-lg font-bold">{queues.olderDueItems.length}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">أيام التعهّد</p>
              <p className="mt-1 text-lg font-bold">{activityDates.length} يوم</p>
            </div>
          </div>
        </section>

        {queues.totalDueCount === 0 ? (
          <section className="rounded-2xl border border-border bg-card p-6 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-foreground">ابدأ بحفظ وردك الأول اليوم</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              بمجرد حفظ آياتك الأولى أو تقييمها في التسميع الذاتي، ستظهر هنا تلقائياً ضمن مراجعة الأمس
              والمراجعة السابقة ومواضع العناية.
            </p>
            <Link
              href="/memorize"
              className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground"
            >
              <span>الانتقال إلى الحفظ الجديد</span>
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          </section>
        ) : (
          <>
            {/* Pillar 1: Yesterday's Review */}
            {primaryYesterday && yesterdaySurah && (
              <section className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-primary">١. مراجعة الأمس</span>
                    <h2 className="text-base font-bold text-foreground">الصلة المباشرة لتثبيت الجديد</h2>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{queues.yesterdayItems.length} آيات</span>
                  </span>
                </div>

                <div className="mb-3 rounded-xl bg-secondary/50 p-3.5">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{yesterdaySurah.nameAr}</span>
                    <span>
                      الآية {primaryYesterday.ayahNumber} • فاصل المراجعة:{' '}
                      {primaryYesterday.intervalDays} يوم
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleLaunchReview(primaryYesterday, 'yesterdayReview')}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-95"
                >
                  <PlayCircle className="h-5 w-5" aria-hidden="true" />
                  <span>بدء تثبيت مراجعة الأمس</span>
                </button>
              </section>
            )}

            {/* Pillar 2: Older Material */}
            {primaryOlder && olderSurah && (
              <section className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-primary">
                      ٢. المراجعة السابقة (المِلّة الكبرى)
                    </span>
                    <h2 className="text-base font-bold text-foreground">
                      تدوير المحفوظ القديم (١، ٣، ٧، ١٤، ٣٠ يوماً)
                    </h2>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {queues.olderDueItems.length} مستحقة
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-background p-3.5">
                  <div className="flex items-center justify-between text-sm font-bold text-foreground">
                    <span>{olderSurah.nameAr}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      الآية {primaryOlder.ayahNumber} • فاصل {primaryOlder.intervalDays} أيام
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>عدد المراجعات: {primaryOlder.reviewCount}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>جاهزة للتسميع</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLaunchReview(primaryOlder, 'olderReview')}
                    className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/70 px-4 text-xs font-bold text-primary hover:bg-secondary"
                  >
                    <span>تسميع المراجعة السابقة الآن</span>
                  </button>
                </div>
              </section>
            )}

            {/* Pillar 3: Weak Verses */}
            {primaryWeak && weakSurah && (
              <section className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-foreground">
                      ٣. مواضع العناية والآيات الضعيفة
                    </span>
                    <h2 className="text-base font-bold text-foreground">
                      الآيات التي تحتاج تكراراً إضافياً
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/25 px-2.5 py-1 text-xs font-semibold text-foreground">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{queues.weakItems.length} موضع</span>
                  </span>
                </div>

                <div className="rounded-xl bg-muted/60 p-3.5">
                  <div className="flex items-center justify-between text-sm font-bold text-foreground">
                    <span>{weakSurah.nameAr}</span>
                    <span className="text-xs text-muted-foreground">
                      الآية {primaryWeak.ayahNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLaunchReview(primaryWeak, 'olderReview')}
                    className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-1 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground"
                  >
                    <span>تسميع الموضع الآن</span>
                  </button>
                </div>
              </section>
            )}

            {/* Quick Self-Evaluation */}
            {activeTargetKey && (
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-1 text-sm font-bold text-foreground">
                  تقييم سريع للموضع الحالي ({activeTargetKey})
                </h2>
                <p className="mb-3 text-xs text-muted-foreground">
                  يحدّث موعد المراجعة القادمة تلقائياً وفق سلّم الفواصل (١ ← ٣ ← ٧ ← ١٤ ← ٣٠ يوماً)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {evalOptions.map((opt) => {
                    const active = selectedEval === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleQuickEval(opt.id)}
                        aria-pressed={active}
                        className={cn(
                          'flex min-h-[68px] flex-col items-center justify-center rounded-xl border p-2 text-center transition-colors',
                          active
                            ? 'border-primary bg-secondary text-primary'
                            : 'border-border bg-background text-foreground hover:bg-muted',
                        )}
                      >
                        <span className="text-xs font-bold">{opt.label}</span>
                        <span className="mt-0.5 text-[11px] text-muted-foreground">{opt.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
