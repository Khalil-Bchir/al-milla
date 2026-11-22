'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  History,
  PlayCircle,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { AudioPlayerBar } from '@/components/milla/AudioPlayerBar';
import { cn } from '@/lib/utils';
import { MILLA_COPY, formatNum, getSurahDisplayName } from '@/lib/milla-i18n';
import { getSurahById, loadVerifiedSurahAyahs, toArabicDigits } from '@/lib/quran-data';
import { formatCueText } from '@/lib/verse-masking';
import {
  computeRevisionQueues,
  useMillaStore,
  type MemorizedVerseRecord,
  type SelfEvalRating,
} from '@/store/milla-store';

type RevisionGroupId = 'yesterday' | 'older' | 'weak';
type RecallViewMode = 'full' | 'cue' | 'hidden';

interface RevisionTargetItem {
  key: string;
  surahId: number;
  ayahNumber: number;
}

interface SurahRevisionBucket {
  surahId: number;
  items: RevisionTargetItem[];
}

interface RevisionGroupMeta {
  id: RevisionGroupId;
  title: string;
  subtitle: string;
  icon: typeof Clock;
  items: RevisionTargetItem[];
  surahBuckets: SurahRevisionBucket[];
}

function toTargetItems(records: MemorizedVerseRecord[]): RevisionTargetItem[] {
  return [...records]
    .sort((a, b) => a.surahId - b.surahId || a.ayahNumber - b.ayahNumber)
    .map((r) => ({
      key: r.key,
      surahId: r.surahId,
      ayahNumber: r.ayahNumber,
    }));
}

function groupItemsBySurah(items: RevisionTargetItem[]): SurahRevisionBucket[] {
  const bySurah = new Map<number, RevisionTargetItem[]>();
  for (const item of items) {
    const existing = bySurah.get(item.surahId);
    if (existing) {
      existing.push(item);
    } else {
      bySurah.set(item.surahId, [item]);
    }
  }
  return Array.from(bySurah.entries())
    .sort(([a], [b]) => a - b)
    .map(([surahId, surahItems]) => ({
      surahId,
      items: surahItems,
    }));
}

export default function RevisionPage() {
  const language = useMillaStore((s) => s.language);
  const verseRecords = useMillaStore((s) => s.verseRecords);
  const lastSessionKeys = useMillaStore((s) => s.lastSessionKeys);
  const lastSessionCompletedAt = useMillaStore((s) => s.lastSessionCompletedAt);
  const recordEvaluation = useMillaStore((s) => s.recordEvaluation);
  const setDailyStage = useMillaStore((s) => s.setDailyStage);

  const copy = MILLA_COPY[language];
  const BackArrow = language === 'ar' ? ArrowRight : ArrowLeft;
  const ForwardArrow = language === 'ar' ? ArrowLeft : ArrowRight;

  const queues = useMemo(
    () =>
      computeRevisionQueues(verseRecords, {
        lastSessionKeys,
        lastSessionCompletedAt,
      }),
    [verseRecords, lastSessionKeys, lastSessionCompletedAt],
  );
  const totalMemorizedCount = Object.keys(verseRecords).length;

  const [activeGroupId, setActiveGroupId] = useState<RevisionGroupId | null>(null);
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
  const [activeAudioIdx, setActiveAudioIdx] = useState<number>(0);
  const [recallMode, setRecallMode] = useState<RecallViewMode>('full');
  const [groupRating, setGroupRating] = useState<SelfEvalRating>('good');
  const [completedTitle, setCompletedTitle] = useState<string | null>(null);
  const [completedSurahNotice, setCompletedSurahNotice] = useState<string | null>(null);

  const [ayahTextMap, setAyahTextMap] = useState<Record<string, string>>({});
  const [loadingTexts, setLoadingTexts] = useState<boolean>(false);

  const groups = useMemo<RevisionGroupMeta[]>(() => {
    const yesterdayItems = toTargetItems(queues.yesterdayItems);
    const olderItems = toTargetItems(queues.olderDueItems);
    const weakItems = toTargetItems(queues.weakItems);

    return [
      {
        id: 'yesterday',
        title: copy.revisionPillar1Title,
        subtitle: copy.revisionPillar1Sub,
        icon: Clock,
        items: yesterdayItems,
        surahBuckets: groupItemsBySurah(yesterdayItems),
      },
      {
        id: 'older',
        title: copy.revisionPillar2Title,
        subtitle: copy.revisionPillar2Sub,
        icon: History,
        items: olderItems,
        surahBuckets: groupItemsBySurah(olderItems),
      },
      {
        id: 'weak',
        title: copy.revisionPillar3Title,
        subtitle: copy.revisionPillar3Sub,
        icon: AlertCircle,
        items: weakItems,
        surahBuckets: groupItemsBySurah(weakItems),
      },
    ];
  }, [queues, copy]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? null,
    [groups, activeGroupId],
  );

  // Always resolve to a single Surah bucket so verses from different Surahs never mix
  const activeBucket = useMemo(() => {
    if (!activeGroup || activeGroup.surahBuckets.length === 0) return null;
    return (
      activeGroup.surahBuckets.find((b) => b.surahId === selectedSurahId) ??
      activeGroup.surahBuckets[0]
    );
  }, [activeGroup, selectedSurahId]);

  // Load verified Arabic text for the currently selected Surah only
  useEffect(() => {
    if (!activeBucket || activeBucket.items.length === 0) return;

    const firstKey = activeBucket.items[0].key;
    if (ayahTextMap[firstKey]) return;

    let cancelled = false;
    setLoadingTexts(true);

    void loadVerifiedSurahAyahs(activeBucket.surahId).then((res) => {
      if (cancelled) return;
      if (res.ayahs.length > 0) {
        setAyahTextMap((prev) => {
          const next = { ...prev };
          for (const a of res.ayahs) {
            next[`${activeBucket.surahId}:${a.number}`] = a.textAr;
          }
          return next;
        });
      }
      setLoadingTexts(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeBucket, ayahTextMap]);

  const startGroup = (groupId: RevisionGroupId, initialSurahId?: number) => {
    const group = groups.find((g) => g.id === groupId);
    const firstSurahId = initialSurahId ?? group?.surahBuckets[0]?.surahId ?? null;
    setActiveGroupId(groupId);
    setSelectedSurahId(firstSurahId);
    setActiveAudioIdx(0);
    setRecallMode('full');
    setGroupRating('good');
    setCompletedTitle(null);
    setCompletedSurahNotice(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectSurah = (surahId: number) => {
    setSelectedSurahId(surahId);
    setActiveAudioIdx(0);
    setCompletedSurahNotice(null);
  };

  const handleCompleteSurah = () => {
    if (!activeGroup || !activeBucket) return;

    const completedSurah = getSurahById(activeBucket.surahId);
    const remainingBuckets = activeGroup.surahBuckets.filter(
      (b) => b.surahId !== activeBucket.surahId,
    );

    for (const item of activeBucket.items) {
      if (verseRecords[item.key]) {
        recordEvaluation(item.key, groupRating);
      }
    }

    if (remainingBuckets.length > 0) {
      setSelectedSurahId(remainingBuckets[0].surahId);
      setActiveAudioIdx(0);
      setGroupRating('good');
      setCompletedSurahNotice(getSurahDisplayName(completedSurah, language));
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (activeGroup.id === 'yesterday') {
      setDailyStage('yesterdayReview', true);
    } else if (activeGroup.id === 'older' || activeGroup.id === 'weak') {
      setDailyStage('olderReview', true);
    }

    setCompletedTitle(activeGroup.title);
    setActiveGroupId(null);
    setSelectedSurahId(null);
  };

  const evalOptions: { id: SelfEvalRating; label: string; hint: string }[] = [
    { id: 'difficult', label: copy.evalDifficult, hint: copy.evalDifficultHint },
    { id: 'good', label: copy.evalGood, hint: copy.evalGoodHint },
    { id: 'easy', label: copy.evalEasy, hint: copy.evalEasyHint },
  ];

  const safeAudioIdx =
    activeBucket && activeAudioIdx < activeBucket.items.length ? activeAudioIdx : 0;
  const activeTarget = activeBucket?.items[safeAudioIdx] ?? activeBucket?.items[0] ?? null;
  const activeSurah = activeBucket ? getSurahById(activeBucket.surahId) : null;

  if (activeGroup && activeBucket && activeTarget && activeSurah) {
    const surahDisplayName = getSurahDisplayName(activeSurah, language);
    const chooseSurahHeading =
      language === 'en'
        ? 'Choose Surah to revise'
        : language === 'fr'
          ? 'Choisir la sourate à réviser'
          : 'اختر السورة للمراجعة';

    return (
      <AppShell title={activeGroup.title} subtitle={surahDisplayName}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveGroupId(null);
                setSelectedSurahId(null);
              }}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-bold text-foreground hover:bg-secondary"
            >
              <BackArrow className="h-4 w-4" aria-hidden="true" />
              <span>{copy.revisionBackBtn}</span>
            </button>

            <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-primary">
              {copy.ayahLabel} {formatNum(safeAudioIdx + 1, language)} /{' '}
              {formatNum(activeBucket.items.length, language)}
            </span>
          </div>

          {/* Dedicated Surah Selector when multiple Surahs are due */}
          {activeGroup.surahBuckets.length > 1 && (
            <section className="rounded-2xl border border-border bg-card p-3">
              <p className="mb-2 text-[11px] font-bold text-muted-foreground">
                {chooseSurahHeading}
              </p>
              <div className="flex flex-wrap gap-2">
                {activeGroup.surahBuckets.map((bucket) => {
                  const bucketSurah = getSurahById(bucket.surahId);
                  const selected = bucket.surahId === activeBucket.surahId;
                  return (
                    <button
                      key={bucket.surahId}
                      type="button"
                      onClick={() => handleSelectSurah(bucket.surahId)}
                      aria-pressed={selected}
                      className={cn(
                        'inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-secondary',
                      )}
                    >
                      <span>{getSurahDisplayName(bucketSurah, language)}</span>
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px]',
                          selected
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-secondary text-primary',
                        )}
                      >
                        {formatNum(bucket.items.length, language)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {completedSurahNotice && (
            <div
              role="status"
              className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-secondary/70 px-3.5 py-2.5 text-xs font-semibold text-primary"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {copy.revisionCompletedBanner}: {completedSurahNotice}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setCompletedSurahNotice(null)}
                aria-label={copy.mushafClose}
                className="rounded p-1 hover:bg-secondary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div
            role="group"
            aria-label={copy.revisionModeFull}
            className="grid grid-cols-3 gap-1.5 rounded-2xl border border-border bg-card p-1.5"
          >
            {(
              [
                { id: 'full', label: copy.revisionModeFull, icon: Eye },
                { id: 'cue', label: copy.revisionModeCue, icon: Sparkles },
                { id: 'hidden', label: copy.revisionModeHidden, icon: EyeOff },
              ] as const
            ).map((mode) => {
              const Icon = mode.icon;
              const selected = recallMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setRecallMode(mode.id)}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition-colors',
                    selected
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Single-Surah Dedicated Reading Surface */}
          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2.5 text-xs text-muted-foreground">
              <span className="font-bold text-foreground">
                {surahDisplayName} • {copy.ayahLabel} {formatNum(activeTarget.ayahNumber, language)}
              </span>
              <span>{copy.revisionTapAyahHint}</span>
            </div>

            <div
              className="max-h-[380px] overflow-y-auto rounded-xl bg-secondary/40 p-4 text-justify"
              dir="rtl"
              lang="ar"
            >
              {recallMode === 'hidden' ? (
                <div
                  className="flex flex-col items-center justify-center gap-2 py-10 text-center"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  <EyeOff className="h-7 w-7 text-primary/60" aria-hidden="true" />
                  <p className="text-sm font-semibold text-foreground">{copy.revisionHiddenTitle}</p>
                  <p className="text-xs text-muted-foreground">{copy.revisionHiddenBody}</p>
                </div>
              ) : loadingTexts && !ayahTextMap[activeTarget.key] ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  <span>{copy.loadingLabel}</span>
                </div>
              ) : (
                <p className="quran-text leading-[2.35] text-foreground">
                  {activeBucket.items.map((item, idx) => {
                    const isSelected = idx === safeAudioIdx;
                    const rawText = ayahTextMap[item.key] ?? '';
                    const displayedText =
                      recallMode === 'cue' && rawText ? formatCueText(rawText) : rawText;

                    return (
                      <span
                        key={item.key}
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveAudioIdx(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveAudioIdx(idx);
                          }
                        }}
                        className={cn(
                          'cursor-pointer rounded-lg transition-colors',
                          isSelected
                            ? 'bg-primary/15 px-1.5 ring-1 ring-primary/30'
                            : 'hover:bg-secondary/80',
                        )}
                      >
                        {displayedText || copy.loadingLabel}{' '}
                        <span className="mx-1 font-quran text-primary">
                          ﴿{toArabicDigits(item.ayahNumber)}﴾
                        </span>{' '}
                      </span>
                    );
                  })}
                </p>
              )}
            </div>
          </section>

          <AudioPlayerBar
            mode="reference"
            surahId={activeTarget.surahId}
            surahName={surahDisplayName}
            ayahNumber={activeTarget.ayahNumber}
            onPrevAyah={
              safeAudioIdx > 0 ? () => setActiveAudioIdx((i) => Math.max(0, i - 1)) : undefined
            }
            onNextAyah={
              safeAudioIdx + 1 < activeBucket.items.length
                ? () => setActiveAudioIdx((i) => i + 1)
                : undefined
            }
          />

          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-bold text-foreground">
              {copy.revisionEvalPrompt} ({surahDisplayName})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {evalOptions.map((opt) => {
                const selected = groupRating === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGroupRating(opt.id)}
                    aria-pressed={selected}
                    className={cn(
                      'flex min-h-[60px] flex-col items-center justify-center rounded-xl border p-2 text-center transition-colors',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:bg-secondary',
                    )}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-[10px] opacity-85">{opt.hint}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleCompleteSurah}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-base font-bold text-primary-foreground hover:opacity-95"
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span>
                {activeGroup.surahBuckets.length > 1
                  ? `${copy.revisionCompleteBtn} (${surahDisplayName})`
                  : copy.revisionCompleteBtn}
              </span>
            </button>
          </section>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={copy.revisionTitle} subtitle={copy.revisionSubtitle}>
      <div className="space-y-5">
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs opacity-90">{copy.revisionHeaderLabel}</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              {copy.revisionThreePillars}
            </span>
          </div>
          <h1 className="text-xl font-bold">
            {queues.totalDueCount > 0
              ? `${copy.revisionDueToday} ${formatNum(queues.totalDueCount, language)} ${copy.versesUnit}`
              : copy.revisionNoneDue}
          </h1>
          <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">{copy.homeYesterdayShort}</p>
              <p className="mt-1 text-lg font-bold">
                {formatNum(queues.yesterdayItems.length, language)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">{copy.homeOlderShort}</p>
              <p className="mt-1 text-lg font-bold">
                {formatNum(queues.olderDueItems.length, language)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">{copy.homeWeakShort}</p>
              <p className="mt-1 text-lg font-bold">
                {formatNum(queues.weakItems.length, language)}
              </p>
            </div>
          </div>
        </section>

        {completedTitle && (
          <section className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {copy.revisionCompletedBanner}: {completedTitle}
                </p>
                <p className="text-xs text-muted-foreground">{copy.revisionCompletedSub}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCompletedTitle(null)}
              aria-label={copy.mushafClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </section>
        )}

        {totalMemorizedCount === 0 ? (
          <section className="rounded-2xl border border-border bg-card p-6 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-foreground">{copy.revisionEmptyTitle}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {copy.revisionEmptyBody}
            </p>
            <Link
              href="/memorize"
              className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground"
            >
              <span>{copy.revisionGoToSession}</span>
              <ForwardArrow className="h-5 w-5" aria-hidden="true" />
            </Link>
          </section>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const Icon = group.icon;
              const isAvailable = group.items.length > 0;
              return (
                <section key={group.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="text-base font-bold text-foreground">{group.title}</h2>
                        <p className="text-xs text-muted-foreground">{group.subtitle}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                      {formatNum(group.items.length, language)}{' '}
                      {group.items.length === 1 ? copy.verseSingular : copy.versesUnit}
                    </span>
                  </div>

                  {/* Direct Surah Picker Pills inside each Revision Card */}
                  {group.surahBuckets.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {group.surahBuckets.map((bucket) => {
                        const bucketSurah = getSurahById(bucket.surahId);
                        return (
                          <button
                            key={bucket.surahId}
                            type="button"
                            onClick={() => startGroup(group.id, bucket.surahId)}
                            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
                          >
                            <span>{getSurahDisplayName(bucketSurah, language)}</span>
                            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-primary">
                              {formatNum(bucket.items.length, language)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => startGroup(group.id)}
                    className={cn(
                      'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-opacity',
                      isAvailable
                        ? 'bg-primary text-primary-foreground hover:opacity-95'
                        : 'cursor-not-allowed border border-border bg-muted text-muted-foreground',
                    )}
                  >
                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    <span>{isAvailable ? copy.revisionStartBtn : copy.revisionEmptyBtn}</span>
                  </button>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
