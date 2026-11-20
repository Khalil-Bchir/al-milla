'use client';

import { useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
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
import { MILLA_COPY, formatNum, type AppLanguage } from '@/lib/milla-i18n';
import { RECITERS, type ReciterId } from '@/lib/quran-data';
import {
  useMillaStore,
  type BackupImportPayload,
  type PlaybackSpeed,
} from '@/store/milla-store';

export default function SettingsPage() {
  const store = useMillaStore();
  const copy = MILLA_COPY[store.language];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
          version: 1,
          exportedAt: new Date().toISOString(),
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
      setStatusMessage(copy.settingsExportDone);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Error');
    }
  };

  const handleImportLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupImportPayload;
      store.importBackupData(parsed);
      setStatusMessage(copy.settingsImportDone);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <AppShell title={copy.settingsTitle} subtitle={copy.settingsSubtitle}>
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
          <h2 className="mb-3 text-sm font-bold text-foreground">{copy.settingsLanguageTitle}</h2>
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
              <h2 className="text-base font-bold text-foreground">{copy.settingsWirdTitle}</h2>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {copy.hafsBadge}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-foreground">
              {copy.settingsReciterLabel}
            </span>
            <MillaPicker
              value={store.reciter}
              onChange={(val) => store.setReciter(val as ReciterId)}
              title={copy.settingsReciterLabel}
              ariaLabel={copy.settingsReciterLabel}
              triggerClassName="w-full"
              options={RECITERS.map((r) => ({
                value: r.id,
                label: store.language === 'ar' ? r.nameAr : r.nameEn,
                description: store.language === 'ar' ? r.styleAr : r.nameAr,
                keywords: `${r.nameAr} ${r.nameEn}`,
              }))}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground">{copy.settingsSpeedLabel}</span>
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
            <h2 className="text-base font-bold text-foreground">{copy.settingsWirdTitle}</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{copy.settingsDailyGoalLabel}</p>
              <p className="text-xs text-muted-foreground">
                {formatNum(store.dailyTarget, store.language)} {copy.versesUnit}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => store.setDailyTarget(store.dailyTarget - 1)}
                className="h-12 w-12 rounded-xl border border-border bg-background text-lg font-bold"
                aria-label="-"
              >
                -
              </button>
              <span className="min-w-[28px] text-center text-sm font-bold">
                {formatNum(store.dailyTarget, store.language)}
              </span>
              <button
                type="button"
                onClick={() => store.setDailyTarget(store.dailyTarget + 1)}
                className="h-12 w-12 rounded-xl border border-border bg-background text-lg font-bold"
                aria-label="+"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{copy.settingsRepeatsLabel}</p>
              <p className="text-xs text-muted-foreground">
                {formatNum(store.mandatoryRepeats, store.language)}
              </p>
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
                  {formatNum(num, store.language)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Display & Accessibility */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">{copy.settingsDisplayTitle}</h2>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <label htmlFor="font-slider" className="font-semibold text-foreground">
                {copy.settingsFontSizeLabel}
              </label>
              <span className="font-bold text-primary">
                {formatNum(store.quranFontSize, store.language)}
              </span>
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
              <p className="text-sm font-bold text-foreground">{copy.settingsMushafModeLabel}</p>
              <p className="text-xs text-muted-foreground">{copy.settingsMushafModeSub}</p>
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
                {copy.settingsModeVerses}
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
                {copy.settingsModePages}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{copy.settingsNightMode}</p>
              <p className="text-xs text-muted-foreground">{copy.settingsNightModeSub}</p>
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
              {store.nightMode ? copy.settingsEnabled : copy.settingsDisabled}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{copy.settingsLargeUi}</p>
              <p className="text-xs text-muted-foreground">{copy.settingsLargeUiSub}</p>
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
              {store.largeUiMode ? copy.settingsEnabled : copy.settingsDisabled}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{copy.settingsTranslation}</p>
              <p className="text-xs text-muted-foreground">{copy.settingsTranslationSub}</p>
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
              {store.showTranslation ? copy.settingsEnabled : copy.settingsDisabled}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{copy.settingsTranslit}</p>
              <p className="text-xs text-muted-foreground">{copy.settingsTranslitSub}</p>
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
              {store.showTransliteration ? copy.settingsEnabled : copy.settingsDisabled}
            </button>
          </div>

          <p className="rounded-xl bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">
            {copy.settingsOfflineNote}
          </p>
        </section>

        {/* Reminders */}
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">{copy.settingsRemindersTitle}</h2>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-background p-3">
            <div>
              <p className="text-sm font-bold text-foreground">{copy.settingsFajrReminder}</p>
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
              {store.reminders.fajrEnabled ? copy.settingsEnabled : copy.settingsDisabled}
            </button>
          </div>
        </section>

        {/* Fully Local Device Backup */}
        <section className="space-y-3.5 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">{copy.settingsBackupTitle}</h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{copy.settingsBackupDesc}</p>

          <div className="space-y-2 rounded-xl border border-border bg-background p-3.5">
            <p className="text-xs font-bold text-foreground">{copy.settingsBackupCardTitle}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {copy.settingsBackupCardSub}
            </p>
            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleExportLocalBackup}
                className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground hover:opacity-95"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>{copy.settingsExportBtn}</span>
              </button>

              <label className="flex min-h-[48px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-secondary">
                <Upload className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>{copy.settingsImportBtn}</span>
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

          <button
            type="button"
            onClick={() => {
              store.resetLocalProgress();
              setStatusMessage(copy.settingsResetDone);
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-background px-4 text-xs font-bold text-destructive hover:bg-destructive/5"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>{copy.settingsResetBtn}</span>
          </button>
        </section>
      </div>
    </AppShell>
  );
}
