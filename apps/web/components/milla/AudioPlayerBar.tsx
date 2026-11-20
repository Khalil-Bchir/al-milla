'use client';

import { useEffect, useState } from 'react';
import { Pause, Play, Repeat, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMillaStore, type PlaybackSpeed } from '@/store/milla-store';

interface AudioPlayerBarProps {
  surahName: string;
  ayahNumber: number;
  onPrevAyah?: () => void;
  onNextAyah?: () => void;
  onRepeatCycleComplete?: () => void;
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.75, 1.0, 1.25];

export function AudioPlayerBar({
  surahName,
  ayahNumber,
  onPrevAyah,
  onNextAyah,
  onRepeatCycleComplete,
}: AudioPlayerBarProps) {
  const reciter = useMillaStore((s) => s.reciter);
  const playbackSpeed = useMillaStore((s) => s.playbackSpeed);
  const setPlaybackSpeed = useMillaStore((s) => s.setPlaybackSpeed);
  const mandatoryRepeats = useMillaStore((s) => s.mandatoryRepeats);

  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatLoopActive, setRepeatLoopActive] = useState(true);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [progress, setProgress] = useState(0);

  const reciterLabel =
    reciter === 'hudhaify'
      ? 'الشيخ علي الحذيفي (معاينة محلية)'
      : reciter === 'husary'
        ? 'الشيخ محمود خليل الحصري (معاينة محلية)'
        : 'الشيخ محمد صديق المنشاوي (معاينة محلية)';

  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.round(120 / playbackSpeed);
    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (repeatLoopActive && currentRepeat < mandatoryRepeats) {
            setCurrentRepeat((r) => r + 1);
            return 0;
          }
          setIsPlaying(false);
          if (onRepeatCycleComplete) onRepeatCycleComplete();
          return 100;
        }
        return prev + 4;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, playbackSpeed, repeatLoopActive, currentRepeat, mandatoryRepeats, onRepeatCycleComplete]);

  const cycleSpeed = () => {
    const idx = SPEED_OPTIONS.indexOf(playbackSpeed);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setPlaybackSpeed(next);
  };

  return (
    <section
      aria-label="مشغل التلاوة والتكرار"
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent/25 text-foreground">
            <RotateCcw className="h-4 w-4 text-primary" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">
              {surahName} • الآية {ayahNumber}
            </p>
            <p className="text-sm font-bold text-foreground">
              التكرار: {currentRepeat} / {mandatoryRepeats} مرات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1" aria-label="مؤشر التكرار">
          {Array.from({ length: mandatoryRepeats }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-colors',
                i < currentRepeat ? 'bg-accent' : 'bg-muted',
              )}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{reciterLabel}</span>
          <span>وضع المعاينة المحلي (أوفلاين)</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setRepeatLoopActive((v) => !v)}
          className={cn(
            'inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors',
            repeatLoopActive
              ? 'border-accent bg-accent/20 text-foreground'
              : 'border-border bg-background text-muted-foreground',
          )}
          aria-pressed={repeatLoopActive}
        >
          <Repeat className="h-4 w-4" aria-hidden="true" />
          <span>{repeatLoopActive ? 'تكرار مُفعّل' : 'تكرار متوقف'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevAyah}
            disabled={!onPrevAyah}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
            aria-label="الآية السابقة"
          >
            <SkipForward className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (progress >= 100) setProgress(0);
              setIsPlaying((p) => !p);
            }}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95"
            aria-label={isPlaying ? 'إيقاف التلاوة مؤقتاً' : 'تشغيل التلاوة'}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Play className="h-6 w-6" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onNextAyah}
            disabled={!onNextAyah}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
            aria-label="الآية التالية"
          >
            <SkipBack className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={cycleSpeed}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground transition-colors hover:bg-secondary"
          aria-label="تغيير سرعة التلاوة"
        >
          {playbackSpeed}x
        </button>
      </div>
    </section>
  );
}
