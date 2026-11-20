'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { cn } from '@/lib/utils';
import { getSurahById } from '@/lib/quran-data';
import { useMillaStore, type SelfEvalRating } from '@/store/milla-store';

export default function RevisionPage() {
  const evaluations = useMillaStore((s) => s.evaluations);
  const recordEvaluation = useMillaStore((s) => s.recordEvaluation);

  const kahf = getSurahById(18);
  const waqiah = getSurahById(56);
  const [selectedEval, setSelectedEval] = useState<SelfEvalRating>(evaluations['18:1'] ?? 'easy');

  const evalOptions: { id: SelfEvalRating; label: string; hint: string }[] = [
    { id: 'difficult', label: 'صعبة', hint: 'يحتاج إعادة' },
    { id: 'good', label: 'جيدة', hint: 'استحضار بتأنٍّ' },
    { id: 'easy', label: 'متقنة وثابتة', hint: 'حفظ كالفاتحة' },
  ];

  const handleQuickEval = (rating: SelfEvalRating) => {
    setSelectedEval(rating);
    recordEvaluation('18:1', rating);
  };

  return (
    <AppShell title="المراجعة اليومية" subtitle="الأركان الثلاثة للمراجعة والتثبيت">
      <div className="space-y-5">
        {/* Intro & Summary Card */}
        <section>
          <h1 className="text-2xl font-bold text-foreground">ورد المراجعة والتثبيت</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            السر في حفظ القرآن رسوخ المراجعة اليومية قبل كل جديد؛ فالمحفوظ كالغرس يُتعاهد بالريّ لئلا يجف.
          </p>
        </section>

        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs opacity-90">خطة التثبيت اليومية</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              ٣ جلسات مجدولة
            </span>
          </div>
          <p className="text-xl font-bold">متبقي مراجعة ١٢ آية اليوم</p>
          <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">تم إنجازه</p>
              <p className="mt-1 text-lg font-bold">٤٥٪</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">الوقت المتوقع</p>
              <p className="mt-1 text-lg font-bold">١٥ د</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">أيام التعهّد</p>
              <p className="mt-1 text-lg font-bold">١٨ يوماً</p>
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
              <span>جاهزة للمراجعة</span>
            </span>
          </div>

          <div className="mb-3 rounded-xl bg-secondary/50 p-3.5">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{kahf.nameAr}</span>
              <span>الآيات ١ - ٤ • الحزب {kahf.hizb}</span>
            </div>
            <p className="quran-text text-center text-foreground" dir="rtl" lang="ar">
              {kahf.ayahs[0].textAr}
            </p>
          </div>

          <Link
            href="/self-test"
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-95"
          >
            <PlayCircle className="h-5 w-5" aria-hidden="true" />
            <span>بدء التثبيت الآن (٤ دقائق)</span>
          </Link>
        </section>

        {/* Pillar 2: Older Material */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-primary">٢. المراجعة السابقة (المِلّة الكبرى)</span>
              <h2 className="text-base font-bold text-foreground">تدوير المحفوظ القديم لدوام الحضور</h2>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              الدورة السريعة
            </span>
          </div>

          <div className="rounded-xl border border-border bg-background p-3.5">
            <div className="flex items-center justify-between text-sm font-bold text-foreground">
              <span>سورة الملك</span>
              <span className="text-xs font-normal text-muted-foreground">الآيات ١ - ١٥</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>آخر مراجعة: منذ ٣ أيام</span>
              <span className="inline-flex items-center gap-1 font-semibold text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>٩٥٪ تثبيت</span>
              </span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[95%] rounded-full bg-primary" />
            </div>
          </div>
        </section>

        {/* Pillar 3: Weak Verses & Mutashabihat */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground">٣. مواضع العناية والتكرار</span>
              <h2 className="text-base font-bold text-foreground">المتشابهات ومزالق النسيان</h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/25 px-2.5 py-1 text-xs font-semibold text-foreground">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>تحتاج تركيزاً</span>
            </span>
          </div>

          <div className="rounded-xl bg-muted/60 p-3.5">
            <div className="flex items-center justify-between text-sm font-bold text-foreground">
              <span>{waqiah.nameAr}</span>
              <span className="text-xs text-muted-foreground">الآيات ٧٥ - ٨٢</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground">
              موضع تشابه: ({waqiah.ayahs[0].textAr}) مع خواتيم سورة الحاقة.
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-destructive">تحتاج إلى تكرار ٣ مرات</span>
              <Link
                href="/mutashabihat"
                className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-card px-3 text-xs font-bold text-primary hover:bg-secondary"
              >
                <span>عرض الملاحظة</span>
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Self-Evaluation */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold text-foreground">مقياس استحضار الورد (التقييم الذاتي)</h2>
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
