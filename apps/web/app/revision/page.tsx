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
import { getSurahById, loadVerifiedSurahAyahs, toArabicDigits } from '@/lib/quran-data';
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

interface RevisionGroupMeta {
  id: RevisionGroupId;
  title: string;
  subtitle: string;
  badge: string;
  icon: typeof Clock;
  items: RevisionTargetItem[];
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

function formatCueText(textAr: string): string {
  const words = textAr.trim().split(/\s+/);
  if (words.length <= 2) return textAr;
  return `${words.slice(0, 2).join(' ')} ...`;
}

export default function RevisionPage() {
  const verseRecords = useMillaStore((s) => s.verseRecords);
  const recordEvaluation = useMillaStore((s) => s.recordEvaluation);
  const setDailyStage = useMillaStore((s) => s.setDailyStage);

  const queues = useMemo(() => computeRevisionQueues(verseRecords), [verseRecords]);
  const totalMemorizedCount = Object.keys(verseRecords).length;

  const [activeGroupId, setActiveGroupId] = useState<RevisionGroupId | null>(null);
  const [activeAudioIdx, setActiveAudioIdx] = useState<number>(0);
  const [recallMode, setRecallMode] = useState<RecallViewMode>('full');
  const [groupRating, setGroupRating] = useState<SelfEvalRating>('good');
  const [completedTitle, setCompletedTitle] = useState<string | null>(null);

  const [ayahTextMap, setAyahTextMap] = useState<Record<string, string>>({});
  const [loadingTexts, setLoadingTexts] = useState<boolean>(false);

  const groups = useMemo<RevisionGroupMeta[]>(
    () => [
      {
        id: 'yesterday',
        title: '١. مراجعة الأمس',
        subtitle: 'تثبيت ما حفظته مؤخراً قبل البدء بالآيات الجديدة.',
        badge: 'القريب',
        icon: Clock,
        items: toTargetItems(queues.yesterdayItems),
      },
      {
        id: 'older',
        title: '٢. المراجعة السابقة',
        subtitle: 'تعاهد المحفوظ القديم في مواعيده المتباعدة.',
        badge: 'المتباعد',
        icon: History,
        items: toTargetItems(queues.olderDueItems),
      },
      {
        id: 'weak',
        title: '٣. مواضع العناية',
        subtitle: 'الآيات التي احتاجت تكراراً إضافياً لتثبت بيسر.',
        badge: 'أولوية',
        icon: AlertCircle,
        items: toTargetItems(queues.weakItems),
      },
    ],
    [queues],
  );

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? null,
    [groups, activeGroupId],
  );

  useEffect(() => {
    if (!activeGroup || activeGroup.items.length === 0) return;

    const uniqueSurahIds = Array.from(new Set(activeGroup.items.map((item) => item.surahId)));
    const missingSurahs = uniqueSurahIds.filter((sid) => {
      const firstOfSurah = activeGroup.items.find((i) => i.surahId === sid);
      return firstOfSurah ? !ayahTextMap[firstOfSurah.key] : false;
    });

    if (missingSurahs.length === 0) return;

    let cancelled = false;
    setLoadingTexts(true);

    void Promise.all(
      missingSurahs.map(async (sid) => {
        const res = await loadVerifiedSurahAyahs(sid);
        return { sid, ayahs: res.ayahs };
      }),
    ).then((results) => {
      if (cancelled) return;
      setAyahTextMap((prev) => {
        const next = { ...prev };
        for (const { sid, ayahs } of results) {
          for (const a of ayahs) {
            next[`${sid}:${a.number}`] = a.textAr;
          }
        }
        return next;
      });
      setLoadingTexts(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeGroup, ayahTextMap]);

  const startGroup = (groupId: RevisionGroupId) => {
    setActiveGroupId(groupId);
    setActiveAudioIdx(0);
    setRecallMode('full');
    setGroupRating('good');
    setCompletedTitle(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCompleteGroup = () => {
    if (!activeGroup) return;

    for (const item of activeGroup.items) {
      if (verseRecords[item.key]) {
        recordEvaluation(item.key, groupRating);
      }
    }

    if (activeGroup.id === 'yesterday') {
      setDailyStage('yesterdayReview', true);
    } else if (activeGroup.id === 'older' || activeGroup.id === 'weak') {
      setDailyStage('olderReview', true);
    }

    setCompletedTitle(activeGroup.title);
    setActiveGroupId(null);
  };

  const evalOptions: { id: SelfEvalRating; label: string; hint: string }[] = [
    { id: 'difficult', label: 'صعبة', hint: 'إعادة غداً' },
    { id: 'good', label: 'جيدة', hint: 'توسيع الفاصل' },
    { id: 'easy', label: 'سهلة', hint: 'ثابتة بيسر' },
  ];

  const activeTarget = activeGroup?.items[activeAudioIdx] ?? activeGroup?.items[0] ?? null;
  const activeSurah = activeTarget ? getSurahById(activeTarget.surahId) : null;

  // FOCUSED REVISION VIEW
  if (activeGroup && activeTarget && activeSurah) {
    return (
      <AppShell title={activeGroup.title} subtitle="تلاوة متصلة واسترجاع هادئ">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setActiveGroupId(null)}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-bold text-foreground hover:bg-secondary"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              <span>العودة إلى المراجعة</span>
            </button>

            <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-primary">
              الآية {toArabicDigits(activeAudioIdx + 1)} من{' '}
              {toArabicDigits(activeGroup.items.length)}
            </span>
          </div>

          {/* 3-State Active Recall Selector */}
          <div
            role="group"
            aria-label="وضع عرض النص"
            className="grid grid-cols-3 gap-1.5 rounded-2xl border border-border bg-card p-1.5"
          >
            {(
              [
                { id: 'full', label: 'النص الكامل', icon: Eye },
                { id: 'cue', label: 'كلمات البداية', icon: Sparkles },
                { id: 'hidden', label: 'إخفاء للتسميع', icon: EyeOff },
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

          {/* Connected Passage */}
          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-2.5 text-xs text-muted-foreground">
              <span className="font-bold text-foreground">
                {activeSurah.nameAr} • الآية {toArabicDigits(activeTarget.ayahNumber)}
              </span>
              <span>اضغط على أي آية للاستماع إليها</span>
            </div>

            <div
              className="max-h-[380px] overflow-y-auto rounded-xl bg-secondary/40 p-4 text-justify"
              dir="rtl"
              lang="ar"
            >
              {recallMode === 'hidden' ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <EyeOff className="h-7 w-7 text-primary/60" aria-hidden="true" />
                  <p className="text-sm font-semibold text-foreground">النص مخفي للتسميع</p>
                  <p className="text-xs text-muted-foreground">
                    سمّع الآيات غيباً ثم اختر «كلمات البداية» أو «النص الكامل» للتحقق.
                  </p>
                </div>
              ) : loadingTexts && !ayahTextMap[activeTarget.key] ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  <span>جاري تحميل نص الآيات...</span>
                </div>
              ) : (
                <p className="quran-text leading-[2.35] text-foreground">
                  {activeGroup.items.map((item, idx) => {
                    const prev = idx > 0 ? activeGroup.items[idx - 1] : null;
                    const showSurahTag =
                      idx === 0 || (prev !== null && prev.surahId !== item.surahId);
                    const itemSurah = showSurahTag ? getSurahById(item.surahId) : null;
                    const isSelected = idx === activeAudioIdx;
                    const rawText = ayahTextMap[item.key] ?? '';
                    const displayedText =
                      recallMode === 'cue' && rawText ? formatCueText(rawText) : rawText;

                    return (
                      <span key={item.key}>
                        {itemSurah && (
                          <span className="mx-1.5 inline-block rounded-md bg-secondary px-2 py-0.5 font-sans text-xs font-semibold text-primary">
                            {itemSurah.nameAr}
                          </span>
                        )}
                        <span
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
                          {displayedText || 'تعذّر تحميل نص الآية'}{' '}
                          <span className="mx-1 font-quran text-primary">
                            ﴿{toArabicDigits(item.ayahNumber)}﴾
                          </span>
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
            surahName={activeSurah.nameAr}
            ayahNumber={activeTarget.ayahNumber}
            onPrevAyah={
              activeAudioIdx > 0 ? () => setActiveAudioIdx((i) => i - 1) : undefined
            }
            onNextAyah={
              activeAudioIdx + 1 < activeGroup.items.length
                ? () => setActiveAudioIdx((i) => i + 1)
                : undefined
            }
          />

          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-bold text-foreground">تقييم التسميع:</p>
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
              onClick={handleCompleteGroup}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-base font-bold text-primary-foreground hover:opacity-95"
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span>أتممت المراجعة وحفظت التقييم</span>
            </button>
          </section>
        </div>
      </AppShell>
    );
  }

  // 3-SECTION REVISION OVERVIEW
  return (
    <AppShell title="المراجعة اليومية" subtitle="الأقسام الثلاثة لتثبيت المحفوظ">
      <div className="space-y-5">
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs opacity-90">ورد المراجعة والتثبيت</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              ٣ أقسام للمراجعة
            </span>
          </div>
          <h1 className="text-xl font-bold">
            {queues.totalDueCount > 0
              ? `مستحق للمراجعة اليوم: ${toArabicDigits(queues.totalDueCount)} آية`
              : 'لا توجد مراجعات مستحقة بعد'}
          </h1>
          <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">مراجعة الأمس</p>
              <p className="mt-1 text-lg font-bold">
                {toArabicDigits(queues.yesterdayItems.length)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">المراجعة السابقة</p>
              <p className="mt-1 text-lg font-bold">
                {toArabicDigits(queues.olderDueItems.length)}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">مواضع العناية</p>
              <p className="mt-1 text-lg font-bold">{toArabicDigits(queues.weakItems.length)}</p>
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
                <p className="text-sm font-bold text-foreground">أتممت «{completedTitle}»</p>
                <p className="text-xs text-muted-foreground">
                  تم تحديث موعد المراجعة القادمة لآياتك تلقائياً.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCompletedTitle(null)}
              aria-label="إغلاق الإشعار"
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </section>
        )}

        {totalMemorizedCount === 0 ? (
          <section className="rounded-2xl border border-border bg-card p-6 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-foreground">ابدأ بحفظ وردك الأول اليوم</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              بمجرد حفظ آياتك الأولى، ستظهر هنا تلقائياً ضمن مراجعة الأمس والمراجعة السابقة ومواضع
              العناية.
            </p>
            <Link
              href="/memorize"
              className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground"
            >
              <span>الانتقال إلى جلسة اليوم</span>
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          </section>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const Icon = group.icon;
              const isAvailable = group.items.length > 0;
              return (
                <section
                  key={group.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
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
                      {toArabicDigits(group.items.length)}{' '}
                      {group.items.length === 1 ? 'آية' : 'آيات'}
                    </span>
                  </div>

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
                    <span>
                      {isAvailable ? 'بدء المراجعة' : 'لا توجد آيات مستحقة في هذا القسم'}
                    </span>
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
