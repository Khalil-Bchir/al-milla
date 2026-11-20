'use client';

import Link from 'next/link';
import { BookOpen, CheckCircle2, Settings } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { cn } from '@/lib/utils';
import { INITIAL_SURAH_MASTERY } from '@/lib/quran-data';
import { useMillaStore } from '@/store/milla-store';

export default function ProgressPage() {
  const memorizedAyahs = useMillaStore((s) => s.memorizedAyahs);
  const narration = useMillaStore((s) => s.narration);

  const localCompleted = Object.values(memorizedAyahs).filter((v) => v === 'memorized').length;
  const totalVerses = 139 + localCompleted;

  const weekDays = [
    { label: 'أحد', note: 'مراجعة' },
    { label: 'إثن', note: 'مراجعة' },
    { label: 'ثلا', note: 'متشابهات' },
    { label: 'أرب', note: 'مراجعة' },
    { label: 'خمي', note: 'مراجعة' },
    { label: 'جمع', note: 'مراجعة' },
    { label: 'سبت', note: 'تلاوة' },
  ];

  return (
    <AppShell title="محفظة الحافظ" subtitle="ثمرة التعهّد والرسوخ اليومي • بيانات محلية خاصة بك">
      <div className="space-y-5">
        {/* Top Retention Summary Card */}
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs opacity-90">مستوى الرسوخ التراكمي</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              {narration === 'qalun' ? 'رواية قالون' : narration === 'warsh' ? 'رواية ورش' : 'رواية حفص'}
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold">{totalVerses} آية</p>
              <p className="mt-1 text-xs opacity-85">من إجمالي الحزبين الأخيرين والمفصّل</p>
            </div>
            <div className="text-end">
              <p className="text-2xl font-bold text-accent">٩٤٪</p>
              <p className="text-xs opacity-85">نسبة الضبط</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[11px] opacity-80">السور التامة</p>
              <p className="mt-0.5 text-sm font-bold">٤ سُوَر</p>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[11px] opacity-80">أيام التعهّد</p>
              <p className="mt-0.5 text-sm font-bold">١٨ يوماً</p>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[11px] opacity-80">المتوسط اليومي</p>
              <p className="mt-0.5 text-sm font-bold">١٥ دقيقة</p>
            </div>
          </div>
        </section>

        {/* Weekly Calm Activity Log */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">سجل التعهّد والأثر</h2>
            <span className="text-xs text-muted-foreground">الأسبوع الحالي</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {weekDays.map((day, i) => (
              <div
                key={day.label}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary/45 py-2.5"
              >
                <span className="text-[11px] text-muted-foreground">{day.label}</span>
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                    i === 6
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary text-primary-foreground',
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-[10px] text-muted-foreground">{day.note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Surah Mastery Map */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">خريطة السور والتمكين</h2>
            <span className="text-xs text-muted-foreground">٤ مكتملة • ١ جارية</span>
          </div>

          {INITIAL_SURAH_MASTERY.map((item) => (
            <div key={item.surahId} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-primary">
                    {item.surahId}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{item.nameAr}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.totalAyahs} آية • الحزب {item.hizb}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                    item.needsCare
                      ? 'bg-accent/25 text-foreground'
                      : 'bg-secondary text-secondary-foreground',
                  )}
                >
                  {!item.needsCare && <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
                  <span>{item.statusLabelAr}</span>
                </span>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', item.needsCare ? 'bg-accent' : 'bg-primary')}
                  style={{ width: `${item.percent}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-muted-foreground">{item.lastActivityAr}</p>
            </div>
          ))}
        </section>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-2.5">
          <Link
            href="/settings"
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground hover:opacity-95"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
            <span>إعدادات المصحف والتفضيلات</span>
          </Link>
        </div>

        <Link
          href="/revision"
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/70 px-4 text-sm font-bold text-primary"
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span>بدء مراجعة المحفوظ الآن</span>
        </Link>
      </div>
    </AppShell>
  );
}
