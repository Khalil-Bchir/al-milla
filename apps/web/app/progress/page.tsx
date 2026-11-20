'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle2, Settings } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { cn } from '@/lib/utils';
import { computeProgressMetrics, useMillaStore } from '@/store/milla-store';
import { getSurahById, toArabicDigits } from '@/lib/quran-data';

export default function ProgressPage() {
  const router = useRouter();
  const verseRecords = useMillaStore((s) => s.verseRecords);
  const activityDates = useMillaStore((s) => s.activityDates);
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const currentAyah = useMillaStore((s) => s.currentAyah);
  const setCurrentPosition = useMillaStore((s) => s.setCurrentPosition);

  const metrics = computeProgressMetrics(verseRecords, activityDates, currentSurahId);
  const currentSurah = getSurahById(currentSurahId);

  return (
    <AppShell title="محفظة الحافظ" subtitle="ثمرة الحفظ الهادئ • بيانات محلية خاصة بك">
      <div className="space-y-5">
        {/* Top Retention Summary Card */}
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs opacity-90">سجل الحفظ المحلي</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              رواية حفص عن عاصم
            </span>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-bold">{toArabicDigits(metrics.totalMemorizedVerses)} آية</p>
              <p className="mt-1 text-xs opacity-85">إجمالي الآيات المسجلة في محفظتك المحلية</p>
            </div>
            <div className="text-end">
              <p className="text-sm font-bold">{currentSurah.nameAr}</p>
              <p className="text-xs opacity-85">الورد الحالي • الآية {toArabicDigits(currentAyah)}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[11px] opacity-80">السور المكتملة</p>
              <p className="mt-0.5 text-sm font-bold">{toArabicDigits(metrics.completedSurahsCount)} سُوَر</p>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[11px] opacity-80">السور الجارية</p>
              <p className="mt-0.5 text-sm font-bold">{toArabicDigits(metrics.surahMasteryList.length)}</p>
            </div>
          </div>
        </section>

        {/* Weekly Calm Activity Log */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">سجل التعهّد والأثر</h2>
            <span className="text-xs text-muted-foreground">آخر ٧ أيام</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {metrics.last7Days.map((day) => (
              <div
                key={day.date}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary/45 py-2.5"
              >
                <span className="text-[11px] text-muted-foreground">{day.dayLabelAr}</span>
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                    day.active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {day.date.slice(8, 10)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {day.active ? 'تعهّد' : 'راحة'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Surah Mastery Map */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">خريطة السور والتمكين</h2>
            <span className="text-xs text-muted-foreground">
              {metrics.completedSurahsCount} مكتملة •{' '}
              {Math.max(0, metrics.surahMasteryList.length - metrics.completedSurahsCount)} جارية
            </span>
          </div>

          {metrics.surahMasteryList.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
              لم تسجّل أي آيات محفوظة بعد. ابدأ جلستك الأولى من قسم «الحفظ» وستظهر خريطة السور هنا.
            </div>
          ) : (
            metrics.surahMasteryList.map((item) => (
            <button
              key={item.surahId}
              type="button"
              onClick={() => {
                setCurrentPosition(item.surahId, 1);
                router.push('/mushaf');
              }}
              className="w-full rounded-2xl border border-border bg-card p-4 text-start transition-colors hover:bg-secondary/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-primary">
                    {item.surahId}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{item.nameAr}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.memorizedCount} / {item.totalAyahs} آية • الحزب {item.hizb}
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
                  {!item.needsCare && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  )}
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
            </button>
          ))
          )}
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
