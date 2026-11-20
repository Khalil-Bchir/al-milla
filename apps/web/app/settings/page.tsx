'use client';

import { useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  CloudDownload,
  CloudUpload,
  Download,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Upload,
} from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { cn } from '@/lib/utils';
import type { AppLanguage } from '@/lib/milla-i18n';
import { RECITERS, type ReciterId } from '@/lib/quran-data';
import {
  useMillaStore,
  type BackupImportPayload,
  type PlaybackSpeed,
} from '@/store/milla-store';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api-al-milla.khalilbchir.pro'
).replace(/\/$/, '');

export default function SettingsPage() {
  const store = useMillaStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

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
          language: store.language,
          narration: store.narration,
          dailyTarget: store.dailyTarget,
          quranFontSize: store.quranFontSize,
          currentSurahId: store.currentSurahId,
          currentAyah: store.currentAyah,
          verseRecords: store.verseRecords,
          activityDates: store.activityDates,
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

  const handleImportLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupImportPayload;
      store.importBackupData(parsed);
      setStatusMessage('تم استيراد النسخة الاحتياطية المحلية بنجاح.');
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? `ملف غير صالح: ${error.message}` : 'تعذر استيراد الملف المحلي',
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCloudPush = async () => {
    setSyncing(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncKey: store.syncKey,
          narration: store.narration,
          dailyTarget: store.dailyTarget,
          currentSurahId: store.currentSurahId,
          currentAyah: store.currentAyah,
          bookmarks: store.bookmarks,
          activityDates: store.activityDates.slice(-90),
          verses: Object.values(store.verseRecords),
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const nowIso = new Date().toISOString();
      store.setLastSyncedAt(nowIso);
      setStatusMessage('تم حفظ النسخة الاحتياطية السحابية بنجاح.');
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'خطأ في الاتصال';
      setStatusMessage(
        `خادم المزامنة الاختياري غير متصل حالياً (${reason}). بياناتك محفوظة محلياً بأمان.`,
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleCloudRestore = async () => {
    setSyncing(true);
    setStatusMessage(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/sync?syncKey=${encodeURIComponent(store.syncKey)}`,
      );
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'لم يتم العثور على نسخة لهذا المفتاح' : `HTTP ${response.status}`);
      }
      const json = (await response.json()) as { data: BackupImportPayload & { updatedAt?: string } };
      store.importBackupData(json.data);
      store.setLastSyncedAt(json.data.updatedAt ?? new Date().toISOString());
      setStatusMessage('تمت استعادة المحفظة من السحابة بنجاح.');
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'خطأ في الاتصال';
      setStatusMessage(`تعذّر الاسترجاع السحابي (${reason}). يمكنك استخدام ملف JSON المحلي.`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AppShell title="الإعدادات" subtitle="تفضيلات الحافظ • حفظ محلي ومزامنة اختيارية">
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
                  'min-h-[48px] rounded-xl border text-xs font-bold transition-colors',
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-bold text-foreground">القارئ وتفضيلات التلاوة</h2>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              حفص عن عاصم
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reciter-select" className="text-xs font-semibold text-foreground">
              الشيخ القارئ المفضّل
            </label>
            <select
              id="reciter-select"
              value={store.reciter}
              onChange={(e) => store.setReciter(e.target.value as ReciterId)}
              className="min-h-[48px] w-full rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameAr} — {r.styleAr}
                </option>
              ))}
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
                    'min-h-[44px] rounded-lg border px-3 text-xs font-bold',
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
                className="h-12 w-12 rounded-xl border border-border bg-background text-lg font-bold"
                aria-label="إنقاص الورد اليومي"
              >
                -
              </button>
              <span className="min-w-[28px] text-center text-sm font-bold">{store.dailyTarget}</span>
              <button
                type="button"
                onClick={() => store.setDailyTarget(store.dailyTarget + 1)}
                className="h-12 w-12 rounded-xl border border-border bg-background text-lg font-bold"
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
                    'min-h-[44px] rounded-lg border px-3 text-xs font-bold',
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
              <p className="text-sm font-bold text-foreground">طريقة عرض المصحف</p>
              <p className="text-xs text-muted-foreground">بطاقات آيات أو صفحات المصحف (١-٦٠٤)</p>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => store.setMushafViewMode('verses')}
                className={cn(
                  'min-h-[44px] rounded-xl border px-3 text-xs font-bold',
                  store.mushafViewMode === 'verses'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground',
                )}
              >
                آيات
              </button>
              <button
                type="button"
                onClick={() => store.setMushafViewMode('page')}
                className={cn(
                  'min-h-[44px] rounded-xl border px-3 text-xs font-bold',
                  store.mushafViewMode === 'page'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground',
                )}
              >
                صفحات المصحف
              </button>
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
                'min-h-[48px] rounded-xl border px-4 text-xs font-bold',
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
                'min-h-[48px] rounded-xl border px-4 text-xs font-bold',
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
                'min-h-[44px] rounded-xl border px-3 text-xs font-bold',
                store.reminders.fajrEnabled
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground',
              )}
            >
              {store.reminders.fajrEnabled ? 'مُفعّل' : 'متوقف'}
            </button>
          </div>
        </section>

        {/* Local-First Privacy, JSON Backup & Optional Cloud Sync */}
        <section className="space-y-3.5 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">البيانات والنسخ الاحتياطي</h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            الأصل في المِلّة الحفظ المحلي الكامل على جهازك دون حساب. يمكنك تصدير أو استيراد ملف JSON محلي، أو
            استخدام مفتاح الاستعادة للمزامنة السحابية الاختيارية عبر خادم المِلّة (`/api/v1/sync`).
          </p>

          {/* Optional Cloud Sync Key */}
          <div className="rounded-xl border border-border bg-background p-3">
            <label htmlFor="sync-key-input" className="block text-xs font-bold text-foreground">
              مفتاح الاستعادة السحابي الاختياري (Sync Key)
            </label>
            <input
              id="sync-key-input"
              type="text"
              value={store.syncKey}
              onChange={(e) => store.setSyncKey(e.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded-lg border border-border bg-card px-3 font-latin text-xs text-foreground"
              dir="ltr"
            />
            {store.lastSyncedAt && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                آخر مزامنة: {new Date(store.lastSyncedAt).toLocaleString('ar-TN')}
              </p>
            )}
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={syncing}
                onClick={() => void handleCloudPush()}
                className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-50"
              >
                <CloudUpload className="h-4 w-4" aria-hidden="true" />
                <span>حفظ سحابي</span>
              </button>
              <button
                type="button"
                disabled={syncing}
                onClick={() => void handleCloudRestore()}
                className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-50"
              >
                <CloudDownload className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>استعادة سحابية</span>
              </button>
            </div>
          </div>

          {/* Local JSON Export & Import */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportLocalBackup}
              className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground hover:bg-secondary"
            >
              <Download className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>تصدير JSON محلي</span>
            </button>

            <label className="flex min-h-[48px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground hover:bg-secondary">
              <Upload className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>استيراد JSON محلي</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={(e) => void handleImportLocalFile(e)}
                className="sr-only"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              store.resetLocalProgress();
              setStatusMessage('تمت إعادة ضبط التقدّم المحلي.');
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-background px-4 text-xs font-bold text-destructive"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>إعادة ضبط البيانات المحلية</span>
          </button>
        </section>
      </div>
    </AppShell>
  );
}
