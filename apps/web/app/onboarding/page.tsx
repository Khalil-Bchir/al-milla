'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle2, Lock, Sparkles, Type, Volume2 } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { MillaPicker } from '@/components/milla/MillaPicker';
import { cn } from '@/lib/utils';
import type { AppLanguage } from '@/lib/milla-i18n';
import { RECITERS, SURAHS } from '@/lib/quran-data';
import { useMillaStore } from '@/store/milla-store';

export default function OnboardingPage() {
  const router = useRouter();
  const language = useMillaStore((s) => s.language);
  const setLanguage = useMillaStore((s) => s.setLanguage);
  const reciter = useMillaStore((s) => s.reciter);
  const setReciter = useMillaStore((s) => s.setReciter);
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const setCurrentPosition = useMillaStore((s) => s.setCurrentPosition);
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

  const startingSurahPresets = [
    { id: 1, label: 'سورة الفاتحة', hint: '٧ آيات • بداية موصى بها' },
    { id: 78, label: 'سورة النبأ (جزء عمّ)', hint: '٤٠ آية • للسور القصيرة' },
    { id: 67, label: 'سورة الملك', hint: '٣٠ آية • المنجية' },
    { id: 18, label: 'سورة الكهف', hint: '١١٠ آيات • ورد الجمعة' },
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
              'inline-flex min-h-[48px] items-center gap-2 rounded-full border px-4 text-xs font-semibold transition-colors',
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
                  'min-h-[40px] rounded-full px-3 text-xs font-semibold transition-colors',
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
            تطبيق مجاني بالكامل مبني على المنهجية التونسية الأصيلة للحفظ المتقن والمستمر لكتاب الله
            برواية <strong>حفص عن عاصم (الرسم العثماني)</strong>، بدون حساب إلزامي أو إعلانات.
          </div>
        </section>

        {/* 1. Preferred Sheikh (Reciter) Selection */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Volume2 className="h-5 w-5 text-primary" aria-hidden="true" />
              <span>اختر الشيخ القارئ المفضّل</span>
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              حفص عن عاصم
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {RECITERS.map((item) => {
              const selected = reciter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReciter(item.id)}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-[68px] flex-col items-start justify-between rounded-xl border p-3 text-start transition-colors',
                    selected
                      ? 'border-primary bg-secondary/70 text-foreground'
                      : 'border-border bg-background text-foreground hover:bg-muted',
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-bold">{item.nameAr}</span>
                    {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{item.styleAr}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Starting Surah */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
              <span>سورة البداية</span>
            </h2>
            <MillaPicker
              compact
              searchable
              value={String(currentSurahId)}
              onChange={(val) => setCurrentPosition(Number(val), 1)}
              title="اختر سورة البداية من المصحف"
              ariaLabel="اختيار أي سورة من المصحف"
              options={SURAHS.map((s) => ({
                value: String(s.id),
                label: `${s.id}. ${s.nameAr}`,
                description: `${s.totalAyahs} آية • ${s.revelationTypeAr}`,
                keywords: `${s.nameEn} ${s.nameFr}`,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {startingSurahPresets.map((preset) => {
              const selected = currentSurahId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setCurrentPosition(preset.id, 1)}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-[68px] flex-col items-start justify-between rounded-xl border p-3 text-start transition-colors',
                    selected
                      ? 'border-primary bg-secondary/70'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  <span className="text-sm font-bold text-foreground">{preset.label}</span>
                  <span className="text-xs text-muted-foreground">{preset.hint}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Daily Goal Selection */}
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
