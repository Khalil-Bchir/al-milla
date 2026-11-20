'use client';

import { useState } from 'react';
import { Bell, BookOpen, Download, Moon, RotateCcw, ShieldCheck, Sliders } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { cn } from '@/lib/utils';
import type { AppLanguage } from '@/lib/milla-i18n';
import type { NarrationId } from '@/lib/quran-data';
import { useMillaStore, type PlaybackSpeed, type ReciterId } from '@/store/milla-store';

export default function SettingsPage() {
  const store = useMillaStore();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const narrations: { id: NarrationId; label: string }[] = [
    { id: 'qalun', label: 'قالون عن نافع' },
    { id: 'warsh', label: 'ورش عن نافع' },
    { id: 'hafs', label: 'حفص عن عاصم' },
  ];

  const languages: { id: AppLanguage; label: string }[] = [
    { id: 'ar', label: 'العربية' },
    { id: 'en', label: 'English' },
    { id: 'fr', label: 'Français' },
  ];

  const speeds: PlaybackSpeed[] = [0.75, 1.0, 1.25];

  const handleExportLocalBackup = () => {
    try {
      const payload = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          narration: store.narration,
          dailyTarget: store.dailyTarget,
          memorizedAyahs: store.memorizedAyahs,
          evaluations: store.evaluations,
          bookmarks: store.bookmarks,
        },
        null,
        2,
      );
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'al-milla-local-backup.json';
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage('تم تصدير نسخة محلية من تقدّمك بنجاح.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'تعذر تصدير النسخة المحلية');
    }
  };

  return (
    <AppShell title="الإعدادات" subtitle="تفضيلات الحافظ • حفظ محلي بالكامل">
      <div className="space-y-5">
        {statusMessage && (
          <div
            role="status"
            className="rounded-xl border border-primary/30 bg-secondary px-4 py-3 text-xs font-semibold text-primary"
          >
            {statusMessage}
          </div>
        )}

        {/* Language */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold text-foreground">لغة الواجهة</h2>
          <div className="grid grid-cols-3 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => store.setLanguage(lang.id)}
                className={cn(
                  'min-h-[44px] rounded-xl border text-xs font-bold transition-colors',
                  store.language === lang.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-secondary',
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </section>

        {/* Narration & Audio */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">تفضيلات الرواية والقراءة</h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {narrations.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => store.setNarration(n.id)}
                className={cn(
                  'min-h-[46px] rounded-xl border px-2 text-xs font-bold transition-colors',
                  store.narration === n.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-secondary',
                )}
              >
                {n.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <label htmlFor="reciter-select" className="text-xs font-semibold text-foreground">
              القارئ المعتمد للتسميع
            </label>
            <select
              id="reciter-select"
              value={store.reciter}
              onChange={(e) => store.setReciter(e.target.value as ReciterId)}
              className="min-h-[44px] rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground"
            >
              <option value="hudhaify">الشيخ علي الحذيفي (قالون)</option>
              <option value="husary">الشيخ محمود خليل الحصري</option>
              <option value="minshawi">الشيخ محمد صديق المنشاوي</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground">سرعة التلاوة الافتراضية</span>
            <div className="flex gap-1.5">
              {speeds.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => store.setPlaybackSpeed(sp)}
                  className={cn(
                    'min-h-[40px] rounded-lg border px-3 text-xs font-bold',
                    store.playbackSpeed === sp
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground',
                  )}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Memorization Plan */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">خطة الحفظ والمراجعة</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">مقدار الورد اليومي</p>
              <p className="text-xs text-muted-foreground">{store.dailyTarget} آيات يومياً</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => store.setDailyTarget(store.dailyTarget - 1)}
                className="h-11 w-11 rounded-xl border border-border bg-background text-lg font-bold"
                aria-label="إنقاص الورد اليومي"
              >
                -
              </button>
              <span className="min-w-[28px] text-center text-sm font-bold">{store.dailyTarget}</span>
              <button
                type="button"
                onClick={() => store.setDailyTarget(store.dailyTarget + 1)}
                className="h-11 w-11 rounded-xl border border-border bg-background text-lg font-bold"
                aria-label="زيادة الورد اليومي"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">التكرار المقترح لكل آية</p>
              <p className="text-xs text-muted-foreground">{store.mandatoryRepeats} مرات</p>
            </div>
            <div className="flex gap-1.5">
              {[3, 5, 7, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => store.setMandatoryRepeats(num)}
                  className={cn(
                    'min-h-[40px] rounded-lg border px-2.5 text-xs font-bold',
                    store.mandatoryRepeats === num
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground',
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Display & Accessibility */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">مظهر المصحف وسهولة القراءة</h2>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <label htmlFor="font-slider" className="font-semibold text-foreground">
                حجم الخط القرآني
              </label>
              <span className="font-bold text-primary">{store.quranFontSize}px</span>
            </div>
            <input
              id="font-slider"
              type="range"
              min={18}
              max={36}
              value={store.quranFontSize}
              onChange={(e) => store.setQuranFontSize(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="mt-3 rounded-xl bg-secondary/50 p-3 text-center">
              <p className="quran-text text-foreground" dir="rtl" lang="ar">
                بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">الوضع الليلي الهادئ</p>
              <p className="text-xs text-muted-foreground">مريح للعين أثناء القراءة الليلية</p>
            </div>
            <button
              type="button"
              onClick={() => store.setNightMode(!store.nightMode)}
              aria-pressed={store.nightMode}
              className={cn(
                'min-h-[44px] rounded-xl border px-4 text-xs font-bold',
                store.nightMode
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground',
              )}
            >
              {store.nightMode ? 'مُفعّل' : 'متوقف'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">تكبير خط الواجهة (لكبار السن)</p>
              <p className="text-xs text-muted-foreground">عناصر وأزرار أكبر وضوحاً</p>
            </div>
            <button
              type="button"
              onClick={() => store.setLargeUiMode(!store.largeUiMode)}
              aria-pressed={store.largeUiMode}
              className={cn(
                'min-h-[44px] rounded-xl border px-4 text-xs font-bold',
                store.largeUiMode
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground',
              )}
            >
              {store.largeUiMode ? 'مُفعّل' : 'متوقف'}
            </button>
          </div>
        </section>

        {/* Reminders */}
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">مواقيت التذكير الهادئة</h2>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-background p-3">
            <div>
              <p className="text-sm font-bold text-foreground">ورد الفجر والتبكير</p>
              <p className="text-xs text-muted-foreground">{store.reminders.fajrTime}</p>
            </div>
            <button
              type="button"
              onClick={() => store.updateReminders({ fajrEnabled: !store.reminders.fajrEnabled })}
              aria-pressed={store.reminders.fajrEnabled}
              className={cn(
                'min-h-[40px] rounded-xl border px-3 text-xs font-bold',
                store.reminders.fajrEnabled
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground',
              )}
            >
              {store.reminders.fajrEnabled ? 'مُفعّل' : 'متوقف'}
            </button>
          </div>
        </section>

        {/* Local-First Privacy & Backup */}
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">البيانات والخصوصية المحلية</h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            جميع بيانات حفظك ومراجعاتك محفوظة محلياً على جهازك فقط، ولا تُرسل لأي خادم خارجي.
          </p>

          <button
            type="button"
            onClick={handleExportLocalBackup}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>تصدير نسخة احتياطية محلية (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              store.resetLocalProgress();
              setStatusMessage('تمت إعادة ضبط التقدّم المحلي.');
            }}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-background px-4 text-xs font-bold text-destructive"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>إعادة ضبط البيانات المحلية</span>
          </button>
        </section>
      </div>
    </AppShell>
  );
}
