'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle2, Lock, Sparkles, Type } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { cn } from '@/lib/utils';
import type { AppLanguage } from '@/lib/milla-i18n';
import type { NarrationId } from '@/lib/quran-data';
import { useMillaStore } from '@/store/milla-store';

export default function OnboardingPage() {
  const router = useRouter();
  const language = useMillaStore((s) => s.language);
  const setLanguage = useMillaStore((s) => s.setLanguage);
  const narration = useMillaStore((s) => s.narration);
  const setNarration = useMillaStore((s) => s.setNarration);
  const dailyTarget = useMillaStore((s) => s.dailyTarget);
  const setDailyTarget = useMillaStore((s) => s.setDailyTarget);
  const largeUiMode = useMillaStore((s) => s.largeUiMode);
  const setLargeUiMode = useMillaStore((s) => s.setLargeUiMode);
  const completeOnboarding = useMillaStore((s) => s.completeOnboarding);

  const languages: { id: AppLanguage; label: string }[] = [
    { id: 'ar', label: 'العربية' },
    { id: 'en', label: 'English' },
    { id: 'fr', label: 'Français' },
  ];

  const narrations: { id: NarrationId; title: string; subtitle: string }[] = [
    { id: 'qalun', title: 'قالون عن نافع', subtitle: 'رسم تونسي معتمد' },
    { id: 'hafs', title: 'حفص عن عاصم', subtitle: 'المصحف القياسي' },
  ];

  const dailyGoals: { value: number; title: string; subtitle: string; recommended?: boolean }[] = [
    {
      value: 3,
      title: '٣ آيات يومياً',
      subtitle: 'تثبيت محكم بلا انقطاع، مناسب للبدء',
      recommended: true,
    },
    { value: 4, title: '٤ آيات يومياً', subtitle: 'الورد اليومي المعتاد في المِلّة' },
    { value: 5, title: '٥ آيات يومياً', subtitle: 'للمتمرسين في الحفظ والمراجعة' },
  ];

  const handleStart = () => {
    completeOnboarding();
    router.push('/');
  };

  return (
    <AppShell title="البداية والتهيئة" hideBottomNav>
      <div className="space-y-6 py-2">
        {/* Top Controls: Large Text & Language */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setLargeUiMode(!largeUiMode)}
            aria-pressed={largeUiMode}
            className={cn(
              'inline-flex min-h-[44px] items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-colors',
              largeUiMode
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:bg-secondary',
            )}
          >
            <Type className="h-4 w-4" aria-hidden="true" />
            <span>الخط الواضح</span>
          </button>

          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
            {languages.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id)}
                className={cn(
                  'min-h-[38px] rounded-full px-3 text-xs font-semibold transition-colors',
                  language === lang.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Identity */}
        <section className="text-center">
          <img
            src="/images/al-milla-logo.png"
            alt="شعار تطبيق المِلّة"
            className="mx-auto h-24 w-24 rounded-2xl border border-border object-cover shadow-xs"
          />
          <h1 className="mt-4 text-3xl font-bold text-primary">المِلّة</h1>
          <p className="mt-1 text-base text-muted-foreground">رحلتك مع حفظ القرآن الكريم</p>
          <div className="mt-4 rounded-2xl border border-border bg-secondary/60 p-4 text-sm leading-relaxed text-foreground">
            تطبيق مجاني بالكامل مبني على المنهجية التونسية الأصيلة للحفظ المتقن والمستمر لكتاب الله،
            بدون حساب إلزامي أو إعلانات.
          </div>
        </section>

        {/* Narration Selection */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
              <span>الرواية القرآنية</span>
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              المقرأة التونسية
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {narrations.map((item) => {
              const selected = narration === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setNarration(item.id)}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-[76px] flex-col items-start justify-between rounded-xl border p-3.5 text-start transition-colors',
                    selected
                      ? 'border-primary bg-secondary/70 text-foreground'
                      : 'border-border bg-background text-foreground hover:bg-muted',
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-bold">{item.title}</span>
                    {selected && <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Daily Goal Selection */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              <span>الورد اليومي للجديد</span>
            </h2>
            <span className="rounded-full bg-accent/25 px-2.5 py-1 text-xs font-medium text-foreground">
              خطوة بخطوة
            </span>
          </div>

          <div className="space-y-2.5">
            {dailyGoals.map((goal) => {
              const selected = dailyTarget === goal.value;
              return (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => setDailyTarget(goal.value)}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-[68px] w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-start transition-colors',
                    selected
                      ? 'border-primary bg-secondary/70'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{goal.title}</span>
                      {goal.recommended && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          مستحسن للبدء
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{goal.subtitle}</p>
                  </div>
                  <span
                    className={cn(
                      'h-5 w-5 shrink-0 rounded-full border-2',
                      selected ? 'border-primary bg-primary' : 'border-muted-foreground',
                    )}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* Privacy & Start CTA */}
        <div className="space-y-3 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>يُحفظ تقدّمك محلياً على هاتفك تماماً بكل خصوصية، ويمكنك تعديل الإعدادات لاحقاً.</span>
          </p>

          <button
            type="button"
            onClick={handleStart}
            className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-base font-bold text-primary-foreground transition-colors hover:opacity-95"
          >
            <span>ابدأ رحلتك الآن (دون تسجيل)</span>
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
