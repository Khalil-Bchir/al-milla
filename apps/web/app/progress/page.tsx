'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle2, Settings } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { cn } from '@/lib/utils';
import { MILLA_COPY, formatNum, getSurahDisplayName } from '@/lib/milla-i18n';
import { getSurahById } from '@/lib/quran-data';
import { computeProgressMetrics, useMillaStore } from '@/store/milla-store';

export default function ProgressPage() {
  const router = useRouter();
  const language = useMillaStore((s) => s.language);
  const verseRecords = useMillaStore((s) => s.verseRecords);
  const activityDates = useMillaStore((s) => s.activityDates);
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const currentAyah = useMillaStore((s) => s.currentAyah);
  const setCurrentPosition = useMillaStore((s) => s.setCurrentPosition);

  const copy = MILLA_COPY[language];
  const metrics = computeProgressMetrics(verseRecords, activityDates, currentSurahId);
  const currentSurah = getSurahById(currentSurahId);

  return (
    <AppShell title={copy.progressTitle} subtitle={copy.progressSubtitle}>
      <div className="space-y-5">
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs opacity-90">{copy.progressBannerLabel}</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              {copy.hafsBadge}
            </span>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-bold">
                {formatNum(metrics.totalMemorizedVerses, language)} {copy.versesUnit}
              </p>
              <p className="mt-1 text-xs opacity-85">{copy.progressTotalLabel}</p>
            </div>
            <div className="text-end">
              <p className="text-sm font-bold">{getSurahDisplayName(currentSurah, language)}</p>
              <p className="text-xs opacity-85">
                {copy.progressCurrentWird} • {copy.ayahLabel} {formatNum(currentAyah, language)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[11px] opacity-80">{copy.progressCompletedSurahs}</p>
              <p className="mt-0.5 text-sm font-bold">
                {formatNum(metrics.completedSurahsCount, language)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[11px] opacity-80">{copy.progressActiveSurahs}</p>
              <p className="mt-0.5 text-sm font-bold">
                {formatNum(metrics.surahMasteryList.length, language)}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">{copy.progressMapTitle}</h2>
            <span className="text-xs text-muted-foreground">
              {formatNum(metrics.completedSurahsCount, language)} {copy.progressCompletedCount} •{' '}
              {formatNum(
                Math.max(0, metrics.surahMasteryList.length - metrics.completedSurahsCount),
                language,
              )}{' '}
              {copy.progressInProgressCount}
            </span>
          </div>

          {metrics.surahMasteryList.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
              {copy.progressEmpty}
            </div>
          ) : (
            metrics.surahMasteryList.map((item) => {
              const surah = getSurahById(item.surahId);
              return (
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
                        {formatNum(item.surahId, language)}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {getSurahDisplayName(surah, language)}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {formatNum(item.memorizedCount, language)} /{' '}
                          {formatNum(item.totalAyahs, language)} {copy.versesUnit} • {copy.hizbLabel}{' '}
                          {formatNum(item.hizb, language)}
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
                      <span>{formatNum(item.percent, language)}%</span>
                    </span>
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        item.needsCare ? 'bg-accent' : 'bg-primary',
                      )}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </button>
              );
            })
          )}
        </section>

        <div className="grid grid-cols-1 gap-2.5">
          <Link
            href="/settings"
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground hover:opacity-95"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
            <span>{copy.settingsLink}</span>
          </Link>
        </div>

        <Link
          href="/revision"
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/70 px-4 text-sm font-bold text-primary"
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span>{copy.revisionStartBtn}</span>
        </Link>
      </div>
    </AppShell>
  );
}
