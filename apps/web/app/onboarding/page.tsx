'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Lock,
  Sparkles,
  Type,
} from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { MillaPicker } from '@/components/milla/MillaPicker';
import { cn } from '@/lib/utils';
import type { AppLanguage } from '@/lib/milla-i18n';
import { SURAHS, toArabicDigits } from '@/lib/quran-data';
import { useMillaStore } from '@/store/milla-store';

export default function OnboardingPage() {
  const router = useRouter();
  const language = useMillaStore((s) => s.language);
  const setLanguage = useMillaStore((s) => s.setLanguage);
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const setCurrentPosition = useMillaStore((s) => s.setCurrentPosition);
  const dailyTarget = useMillaStore((s) => s.dailyTarget);
  const setDailyTarget = useMillaStore((s) => s.setDailyTarget);
  const largeUiMode = useMillaStore((s) => s.largeUiMode);
  const setLargeUiMode = useMillaStore((s) => s.setLargeUiMode);
  const completeOnboarding = useMillaStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<1 | 2>(1);
  const [customGoalInput, setCustomGoalInput] = useState<string>(String(dailyTarget));

  const languages: { id: AppLanguage; label: string }[] = [
    { id: 'ar', label: 'العربية' },
    { id: 'en', label: 'English' },
    { id: 'fr', label: 'Français' },
  ];

  const startingSurahPresets = [
    { id: 1, label: 'سورة الفاتحة', hint: '٧ آيات • بداية ميسّرة' },
    { id: 78, label: 'سورة النبأ', hint: '٤٠ آية • جزء عمّ' },
    { id: 67, label: 'سورة الملك', hint: '٣٠ آية • المنجية' },
    { id: 18, label: 'سورة الكهف', hint: '١١٠ آية • ورد الجمعة' },
  ];

  const dailyGoals: { value: number; title: string; subtitle: string; recommended?: boolean }[] = [
    { value: 1, title: 'آية واحدة يومياً', subtitle: 'للمبتدئين أو مع ضيق الوقت' },
    { value: 2, title: 'آيتان يومياً', subtitle: 'خطوة هادئة ومستقرة' },
    {
      value: 3,
      title: '٣ آيات يومياً',
      subtitle: 'توازن مناسب بين الحفظ والمراجعة',
      recommended: true,
    },
    { value: 5, title: '٥ آيات يومياً', subtitle: 'للمعتادين على الحفظ اليومي' },
  ];

  const handleStart = () => {
    completeOnboarding();
    router.push('/');
  };

  return (
    <AppShell title="البداية والتهيئة" hideBottomNav hideTopActions>
      <div className="space-y-6 py-2">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>الخطوة {toArabicDigits(step)} من ٢</span>
          <button
            type="button"
            onClick={handleStart}
            className="font-semibold text-primary hover:underline"
          >
            تخطي والبدء مباشرة
          </button>
        </div>

        {step === 1 ? (
          <>
            {/* Brand Identity */}
            <section className="text-center">
              <img
                src="/images/al-milla-logo.png"
                alt="شعار تطبيق المِلّة"
                className="mx-auto h-20 w-20 rounded-2xl border border-border object-cover shadow-xs"
              />
              <h1 className="mt-4 text-3xl font-bold text-primary">المِلّة</h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                رفيقك المجاني الهادئ لحفظ القرآن الكريم برواية <strong>حفص عن عاصم</strong>، بدون
                حساب أو إعلانات.
              </p>
            </section>

            {/* Language & Readability */}
            <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="mb-2 text-sm font-bold text-foreground">لغة الواجهة</p>
                <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-background p-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setLanguage(lang.id)}
                      className={cn(
                        'min-h-[44px] rounded-lg px-3 text-xs font-semibold transition-colors',
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

              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5">
                <div className="flex items-center gap-2.5">
                  <Type className="h-5 w-5 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-foreground">الخط الواضح (لكبار السن)</p>
                    <p className="text-xs text-muted-foreground">تكبير الأزرار والنصوص لراحة العين</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLargeUiMode(!largeUiMode)}
                  aria-pressed={largeUiMode}
                  className={cn(
                    'min-h-[44px] shrink-0 rounded-xl border px-4 text-xs font-bold transition-colors',
                    largeUiMode
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:bg-secondary',
                  )}
                >
                  {largeUiMode ? 'مُفعّل' : 'متوقف'}
                </button>
              </div>
            </section>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-base font-bold text-primary-foreground hover:opacity-95"
            >
              <span>التالي: اختيار السورة والورد</span>
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-secondary"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              <span>السابق</span>
            </button>

            {/* Starting Surah */}
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
                  title="اختر أي سورة أخرى"
                  ariaLabel="اختيار أي سورة من المصحف"
                  options={SURAHS.map((s) => ({
                    value: String(s.id),
                    label: `${toArabicDigits(s.id)}. ${s.nameAr}`,
                    description: `${toArabicDigits(s.totalAyahs)} آية • ${s.revelationTypeAr}`,
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
                        'flex min-h-[66px] flex-col items-start justify-between rounded-xl border p-3 text-start transition-colors',
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

            {/* Daily Goal Selection */}
            <section className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                  <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span>الورد اليومي للجديد</span>
                </h2>
                <span className="text-xs text-muted-foreground">يمكن تغييره لاحقاً</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {dailyGoals.map((goal) => {
                  const selected = dailyTarget === goal.value;
                  return (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => {
                        setDailyTarget(goal.value);
                        setCustomGoalInput(String(goal.value));
                      }}
                      aria-pressed={selected}
                      className={cn(
                        'flex min-h-[72px] flex-col items-start justify-between rounded-xl border p-3 text-start transition-colors',
                        selected
                          ? 'border-primary bg-secondary/70'
                          : 'border-border bg-background hover:bg-muted',
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground">{goal.title}</span>
                        {goal.recommended && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            مستحسن
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{goal.subtitle}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Goal Input */}
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
                <label htmlFor="custom-daily-goal" className="text-xs font-bold text-foreground">
                  عدد مخصص للآيات يومياً:
                </label>
                <input
                  id="custom-daily-goal"
                  type="number"
                  min={1}
                  max={20}
                  value={customGoalInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomGoalInput(val);
                    const num = Number(val);
                    if (Number.isInteger(num) && num >= 1 && num <= 20) {
                      setDailyTarget(num);
                    }
                  }}
                  className="h-10 w-20 rounded-lg border border-border bg-card px-2 text-center text-sm font-bold text-foreground"
                />
              </div>
            </section>

            {/* Privacy & Start CTA */}
            <div className="space-y-3 text-center">
              <p className="flex items-start justify-center gap-1.5 rounded-xl bg-secondary/50 p-3 text-start text-xs leading-relaxed text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  يُحفظ تقدّمك محلياً في هذا المتصفح على جهازك (مسح بيانات المتصفح يحذفه، ويمكنك
                  تصدير نسخة احتياطية من الإعدادات في أي وقت، كما يمكنك تغيير الشيخ القارئ من
                  الإعدادات).
                </span>
              </p>

              <button
                type="button"
                onClick={handleStart}
                className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
              >
                <span>ابدأ بدون تسجيل</span>
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
