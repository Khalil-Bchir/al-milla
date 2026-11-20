'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
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

  const queues = computeRevisionQueues(verseRecords);
  const primaryYesterday = queues.yesterdayItems[0];
  const primaryOlder = queues.olderDueItems[0];
  const primaryWeak = queues.weakItems[0];

  const activeTargetKey =
    primaryWeak?.key ?? primaryYesterday?.key ?? primaryOlder?.key ?? '18:1';
  const [selectedEval, setSelectedEval] = useState<SelfEvalRating>(
    evaluations[activeTargetKey] ?? 'good',
  );

  const evalOptions: { id: SelfEvalRating; label: string; hint: string }[] = [
    { id: 'difficult', label: 'صعبة', hint: 'مراجعة بعد يوم' },
    { id: 'good', label: 'جيدة', hint: 'توسيع الفاصل' },
    { id: 'easy', label: 'متقنة وثابتة', hint: 'رسوخ طويل المدى' },
  ];

  const handleQuickEval = (rating: SelfEvalRating) => {
    setSelectedEval(rating);
    recordEvaluation(activeTargetKey, rating);
  };

  const handleLaunchReview = (rec?: MemorizedVerseRecord) => {
    if (rec) {
      setCurrentPosition(rec.surahId, rec.ayahNumber);
    }
    router.push('/self-test');
  };

  const yesterdaySurah = getSurahById(primaryYesterday?.surahId ?? 18);
  const olderSurah = getSurahById(primaryOlder?.surahId ?? 1);
  const weakSurah = getSurahById(primaryWeak?.surahId ?? 56);

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
              : 'أتممت مراجعاتك المستحقة لهذا اليوم'}
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

        {/* Pillar 1: Yesterday's Review */}
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
                الآية {primaryYesterday?.ayahNumber ?? 1} • فاصل المراجعة:{' '}
                {primaryYesterday?.intervalDays ?? 1} يوم
              </span>
            </div>
            {yesterdaySurah.ayahs[0] && (
              <p className="quran-text text-center text-foreground" dir="rtl" lang="ar">
                {yesterdaySurah.ayahs[0].textAr}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleLaunchReview(primaryYesterday)}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-95"
          >
            <PlayCircle className="h-5 w-5" aria-hidden="true" />
            <span>بدء تثبيت مراجعة الأمس</span>
          </button>
        </section>

        {/* Pillar 2: Older Material */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-primary">٢. المراجعة السابقة (المِلّة الكبرى)</span>
              <h2 className="text-base font-bold text-foreground">تدوير المحفوظ القديم (١، ٣، ٧، ١٤، ٣٠ يوماً)</h2>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {queues.olderDueItems.length} مستحقة
            </span>
          </div>

          <div className="rounded-xl border border-border bg-background p-3.5">
            <div className="flex items-center justify-between text-sm font-bold text-foreground">
              <span>{olderSurah.nameAr}</span>
              <span className="text-xs font-normal text-muted-foreground">
                الآية {primaryOlder?.ayahNumber ?? 1} • فاصل {primaryOlder?.intervalDays ?? 7} أيام
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>عدد المراجعات: {primaryOlder?.reviewCount ?? 3}</span>
              <span className="inline-flex items-center gap-1 font-semibold text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>جاهزة للتسميع</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleLaunchReview(primaryOlder)}
              className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/70 px-4 text-xs font-bold text-primary hover:bg-secondary"
            >
              <span>تسميع المراجعة السابقة الآن</span>
            </button>
          </div>
        </section>

        {/* Pillar 3: Weak Verses & Mutashabihat */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground">٣. مواضع العناية والآيات الضعيفة</span>
              <h2 className="text-base font-bold text-foreground">المتشابهات والآيات التي تحتاج تكراراً</h2>
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
                الآية {primaryWeak?.ayahNumber ?? 75}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground">
              موضع تشابه وعناية: (فَلَا أُقْسِمُ بِمَوَاقِعِ النُّجُومِ) مع خواتيم سورة الحاقة.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleLaunchReview(primaryWeak)}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground"
              >
                <span>تسميع الموضع</span>
              </button>
              <Link
                href="/mutashabihat"
                className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-card px-3 text-xs font-bold text-primary hover:bg-secondary"
              >
                <span>مقارنة المتشابهات</span>
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Self-Evaluation */}
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
      </div>
    </AppShell>
  );
}
