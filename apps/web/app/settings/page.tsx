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
import { MillaPicker } from '@/components/milla/MillaPicker';
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
            <span className="text-xs font-semibold text-foreground">الشيخ القارئ المفضّل</span>
            <MillaPicker
              value={store.reciter}
              onChange={(val) => store.setReciter(val as ReciterId)}
              title="اختر الشيخ القارئ المفضّل"
              ariaLabel="الشيخ القارئ المفضّل"
              triggerClassName="w-full"
              options={RECITERS.map((r) => ({
                value: r.id,
                label: r.nameAr,
                description: r.styleAr,
                keywords: r.nameEn,
              }))}
            />
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

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">عرض ترجمة المعاني</p>
              <p className="text-xs text-muted-foreground">إظهار الترجمة مع الآيات عند الحاجة</p>
            </div>
            <button
              type="button"
              onClick={() => store.setShowTranslation(!store.showTranslation)}
              aria-pressed={store.showTranslation}
              className={cn(
                'min-h-[48px] rounded-xl border px-4 text-xs font-bold',
                store.showTranslation
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground',
              )}
            >
              {store.showTranslation ? 'مُفعّل' : 'متوقف'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">النطق بالحروف اللاتينية</p>
              <p className="text-xs text-muted-foreground">مفيد لغير الناطقين بالعربية</p>
            </div>
            <button
              type="button"
              onClick={() => store.setShowTransliteration(!store.showTransliteration)}
              aria-pressed={store.showTransliteration}
              className={cn(
                'min-h-[48px] rounded-xl border px-4 text-xs font-bold',
                store.showTransliteration
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground',
              )}
            >
              {store.showTransliteration ? 'مُفعّل' : 'متوقف'}
            </button>
          </div>

          <p className="rounded-xl bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
            تنبيه: يتم حفظ نصوص السور التي تفتحها محلياً للقراءة دون اتصال، بينما تتطلب التلاوة
            الصوتية اتصالاً بالإنترنت.
          </p>
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

        {/* Simple Device Backup & Optional Transfer */}
        <section className="space-y-3.5 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">حفظ تقدّمك واستعادته</h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            تُحفظ آياتك وتقدّمك على هذا المتصفح فقط. حتى لا يضيع حفظك عند تغيير الجهاز أو مسح
            بيانات المتصفح، يمكنك حفظ نسخة على جهازك.
          </p>

          {/* Primary: Simple File Backup on Device */}
          <div className="space-y-2 rounded-xl border border-border bg-background p-3.5">
            <p className="text-xs font-bold text-foreground">نسخة احتياطية على جهازك</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              احفظ ملفاً صغيراً في هاتفك أو حاسوبك، وأعد تحميله لاحقاً لاسترجاع حفظك بضغطة واحدة.
            </p>
            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleExportLocalBackup}
                className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground hover:opacity-95"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>حفظ نسخة على جهازي</span>
              </button>

              <label className="flex min-h-[48px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-secondary">
                <Upload className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>استرجاع نسخة من جهازي</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={(e) => void handleImportLocalFile(e)}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Optional: Transfer Between Devices */}
          <details className="rounded-xl border border-border bg-background p-3.5">
            <summary className="cursor-pointer text-xs font-bold text-foreground">
              نقل الحفظ إلى جهاز آخر بكلمة سر (اختياري)
            </summary>
            <div className="mt-3 space-y-2.5">
              <label htmlFor="sync-key-input" className="block text-[11px] text-muted-foreground">
                اكتب كلمة سر خاصة بك لحفظ تقدمك أو استرجاعه على هاتف آخر:
              </label>
              <input
                id="sync-key-input"
                type="text"
                placeholder="مثال: حفظ-أحمد-٢٠٢٦"
                value={store.syncKey === 'milla-local-portfolio-v1' ? '' : store.syncKey}
                onChange={(e) => store.setSyncKey(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-border bg-card px-3 text-xs text-foreground"
              />
              {store.lastSyncedAt && (
                <p className="text-[11px] text-muted-foreground">
                  آخر نقل: {new Date(store.lastSyncedAt).toLocaleString('ar-TN')}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={syncing}
                  onClick={() => void handleCloudPush()}
                  className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-50"
                >
                  <CloudUpload className="h-4 w-4" aria-hidden="true" />
                  <span>رفع الحفظ</span>
                </button>
                <button
                  type="button"
                  disabled={syncing}
                  onClick={() => void handleCloudRestore()}
                  className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-50"
                >
                  <CloudDownload className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>استرجاع الحفظ</span>
                </button>
              </div>
            </div>
          </details>

          <button
            type="button"
            onClick={() => {
              store.resetLocalProgress();
              setStatusMessage('تم مسح التقدّم والبدء من جديد.');
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-background px-4 text-xs font-bold text-destructive hover:bg-destructive/5"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>مسح الحفظ والبدء من جديد</span>
          </button>
        </section>
      </div>
    </AppShell>
  );
}
