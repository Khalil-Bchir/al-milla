'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Compass, PlayCircle, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { cn } from '@/lib/utils';
import { getSurahById } from '@/lib/quran-data';
import { useMillaStore } from '@/store/milla-store';

export default function HomePage() {
  const dailyTarget = useMillaStore((s) => s.dailyTarget);
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const memorizedAyahs = useMillaStore((s) => s.memorizedAyahs);
  const dailyStages = useMillaStore((s) => s.dailyStages);
  const toggleDailyStage = useMillaStore((s) => s.toggleDailyStage);
  const narration = useMillaStore((s) => s.narration);

  const surah = getSurahById(currentSurahId);
  const completedCount = Object.values(memorizedAyahs).filter((v) => v === 'memorized').length;
  const totalMemorizedSample = 139 + completedCount;
  const stagesCompleted = Object.values(dailyStages).filter(Boolean).length;

  const stageItems: {
    key: keyof typeof dailyStages;
    title: string;
    subtitle: string;
    href: string;
  }[] = [
      {
        key: 'yesterdayReview',
        title: '١. مراجعة الأمس',
        subtitle: 'الآيات السابقة من سورة الكهف',
        href: '/revision',
      },
      {
        key: 'olderReview',
        title: '٢. المراجعة السابقة',
        subtitle: 'سورة الملك وسورة الواقعة',
        href: '/revision',
      },
      {
        key: 'newMemorization',
        title: '٣. حفظ الآيات الجديدة',
        subtitle: `${surah.nameAr} • ${dailyTarget} آيات مقررة`,
        href: '/memorize',
      },
      {
        key: 'selfTest',
        title: '٤. التسميع الذاتي',
        subtitle: 'اختبار الاستحضار غيباً دون النظر للنص',
        href: '/self-test',
      },
      {
        key: 'verseConnection',
        title: '٥. ربط الآيات',
        subtitle: 'وصل المحفوظ الجديد بما قبله',
        href: '/memorize',
      },
    ];

  const narrationLabel =
    narration === 'qalun' ? 'رواية قالون عن نافع' : narration === 'warsh' ? 'رواية ورش عن نافع' : 'رواية حفص عن عاصم';

  return (
    <AppShell title="الرئيسية" subtitle={`منهج المِلّة اليومي • ${narrationLabel}`}>
      <div className="space-y-5">
        {/* Greeting */}
        <section className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">السلام عليكم ورحمة الله</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ثباتٌ واستمرار • خطوة صغيرة كل يوم تصنع أثراً راسخاً
            </p>
          </div>
          <Link
            href="/onboarding"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary"
          >
            <Compass className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>التهيئة</span>
          </Link>
        </section>

        {/* Primary Hero Card: Today's Wird */}
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="mb-4 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>ورد اليوم • منهجية المِلّة</span>
            </span>
            <span className="text-xs opacity-80">الربع الأول • الحزب {surah.hizb}</span>
          </div>

          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{surah.nameAr}</h2>
              <p className="mt-1 text-sm opacity-90">
                الآيات ١ - {dailyTarget} ({dailyTarget} آيات)
              </p>
            </div>

            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-4 border-accent bg-white/10 text-center">
              <span className="text-sm font-bold">
                {Math.min(completedCount, dailyTarget)}/{dailyTarget}
              </span>
              <span className="text-[10px] opacity-85">آيات</span>
            </div>
          </div>

          <Link
            href="/memorize"
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-base font-bold text-[#073D35] transition-colors hover:bg-secondary"
          >
            <span>متابعة الحفظ الآن</span>
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
        </section>

        {/* 5-Stage Milla Daily Loop */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">خطوات المِلّة لليوم</h2>
            <span className="text-xs font-medium text-muted-foreground">
              {stagesCompleted} من ٥ مراحل
            </span>
          </div>

          <div className="space-y-2.5">
            {stageItems.map((stage) => {
              const done = dailyStages[stage.key];
              return (
                <div
                  key={stage.key}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-colors',
                    done ? 'border-primary/25 bg-secondary/70' : 'border-border bg-card',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleDailyStage(stage.key)}
                    className="flex min-h-[44px] flex-1 items-center gap-3 text-start"
                    aria-pressed={done}
                  >
                    {done ? (
                      <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
                    ) : (
                      <Circle className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-foreground">{stage.title}</p>
                      <p className="text-xs text-muted-foreground">{stage.subtitle}</p>
                    </div>
                  </button>

                  <Link
                    href={stage.href}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-primary hover:bg-secondary"
                  >
                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    <span>{done ? 'مكتمل' : 'ابدأ'}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Shortcuts to Mushaf, Tafsir & Mutashabihat */}
        <section className="grid grid-cols-3 gap-2.5">
          <Link
            href="/mushaf"
            className="flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card p-3 text-center text-xs font-semibold text-foreground hover:bg-secondary"
          >
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>المصحف الشريف</span>
          </Link>
          <Link
            href="/tafsir"
            className="flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card p-3 text-center text-xs font-semibold text-foreground hover:bg-secondary"
          >
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>أصول قالون والتفسير</span>
          </Link>
          <Link
            href="/mutashabihat"
            className="flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card p-3 text-center text-xs font-semibold text-foreground hover:bg-secondary"
          >
            <Compass className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>ضبط المتشابهات</span>
          </Link>
        </section>

        {/* Harvest Summary */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">إجمالي الآيات المحفوظة</p>
            <p className="mt-2 text-2xl font-bold text-primary">{totalMemorizedSample} آية</p>
            <p className="mt-1 text-xs text-muted-foreground">تثبيت متقن بالرواية</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">السور المكتملة</p>
            <p className="mt-2 text-2xl font-bold text-primary">٤ سور</p>
            <p className="mt-1 text-xs text-muted-foreground">الملك، السجدة، الواقعة، يس</p>
          </div>
        </section>

        {/* Calm Hadith Quote */}
        <section className="rounded-2xl border border-border bg-secondary/50 p-4 text-center">
          <p className="font-quran text-lg font-bold text-foreground">
            «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            خطوات يسيرة كل يوم دون عجلة تثبّت الحفظ في الصدر.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
