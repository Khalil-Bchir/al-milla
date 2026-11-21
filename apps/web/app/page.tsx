'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, RotateCcw } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { HomeInstallButton } from '@/components/milla/InstallPwaBanner';
import { MushafIcon } from '@/components/milla/MushafIcon';
import { MILLA_COPY, formatNum, getSurahDisplayName } from '@/lib/milla-i18n';
import { getSurahById } from '@/lib/quran-data';
import { computeRevisionQueues, useMillaStore } from '@/store/milla-store';

export default function HomePage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  const onboardingCompleted = useMillaStore((s) => s.onboardingCompleted);
  const language = useMillaStore((s) => s.language);
  const dailyTarget = useMillaStore((s) => s.dailyTarget);
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const currentAyah = useMillaStore((s) => s.currentAyah);
  const verseRecords = useMillaStore((s) => s.verseRecords);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [hydrated, onboardingCompleted, router]);

  const copy = MILLA_COPY[language];
  const surah = getSurahById(currentSurahId);
  const rangeEnd = Math.min(surah.totalAyahs, currentAyah + dailyTarget - 1);

  const memorizedInCurrentSurah = Object.values(verseRecords).filter(
    (r) => r.surahId === surah.id && r.status === 'memorized',
  ).length;

  const queues = computeRevisionQueues(verseRecords);

  if (hydrated && !onboardingCompleted) {
    return null;
  }

  return (
    <AppShell title={copy.navHome} subtitle={copy.homeSubtitle}>
      <div className="space-y-5">
        <section>
          <h1 className="text-2xl font-bold text-foreground">{copy.homeGreeting}</h1>
          <p className="mt-1 text-lg text-muted-foreground">{copy.homeSubgreeting}</p>
        </section>

        {/* 1. Prominent Continue Learning Action */}
        <section className="rounded-2xl bg-primary p-6 text-primary-foreground">
          <div className="mb-3 flex items-center justify-between gap-2 text-sm opacity-90">
            <span>{copy.homeTodayWird}</span>
            <span>
              {formatNum(Math.min(memorizedInCurrentSurah, dailyTarget), language)} /{' '}
              {formatNum(dailyTarget, language)} {copy.versesUnit}
            </span>
          </div>

          <h2 className="text-2xl font-bold">{getSurahDisplayName(surah, language)}</h2>
          <p className="mt-1 text-lg opacity-90">
            {copy.ayahLabel} {formatNum(currentAyah, language)} - {formatNum(rangeEnd, language)} •{' '}
            {copy.hizbLabel} {formatNum(surah.hizb, language)}
          </p>

          <Link
            href="/memorize"
            className="mt-5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-lg font-bold text-[#073D35] transition-colors hover:bg-secondary"
          >
            <span>
              {queues.totalDueCount > 0 ? copy.homeContinueSessionCta : copy.homeContinueCta}
            </span>
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
        </section>

        {/* 2. Today's Revision */}
        <Link
          href="/revision"
          className="flex min-h-[84px] items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-secondary/50"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <RotateCcw className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">{copy.homeRevisionTitle}</h2>
              <p className="text-base text-muted-foreground">
                {queues.totalDueCount > 0
                  ? `${formatNum(queues.totalDueCount, language)} ${copy.homeDueSummary} (${formatNum(queues.yesterdayItems.length, language)} ${copy.homeYesterdayShort} • ${formatNum(queues.olderDueItems.length, language)} ${copy.homeOlderShort} • ${formatNum(queues.weakItems.length, language)} ${copy.homeWeakShort})`
                  : copy.homeRevisionEmpty}
              </p>
            </div>
          </div>
          <ArrowLeft className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        </Link>

        {/* 3. Today's New Memorization */}
        <Link
          href="/memorize"
          className="flex min-h-[84px] items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-secondary/50"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">{copy.homeNewMemTitle}</h2>
              <p className="text-base text-muted-foreground">
                {getSurahDisplayName(surah, language)} • {copy.ayahLabel}{' '}
                {formatNum(currentAyah, language)} - {formatNum(rangeEnd, language)}
              </p>
            </div>
          </div>
          <ArrowLeft className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        </Link>

        {/* Direct Entry to Quran Reader */}
        <Link
          href="/mushaf"
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/70 px-4 text-base font-bold text-primary transition-colors hover:bg-secondary"
        >
          <MushafIcon className="h-5 w-5" />
          <span>{copy.homeOpenMushaf}</span>
        </Link>

        {/* Automated / Manual Home-Screen Install Guide Button */}
        <HomeInstallButton />
      </div>
    </AppShell>
  );
}
