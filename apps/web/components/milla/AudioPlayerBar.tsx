'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Repeat, RotateCcw, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { MillaPicker } from '@/components/milla/MillaPicker';
import { cn } from '@/lib/utils';
import { MILLA_COPY, formatNum } from '@/lib/milla-i18n';
import { RECITERS, getEveryAyahAudioUrl, type ReciterId } from '@/lib/quran-data';
import { useMillaStore, type PlaybackSpeed } from '@/store/milla-store';

interface AudioPlayerBarProps {
  surahId?: number;
  surahName: string;
  ayahNumber: number;
  mode?: 'memorize' | 'reference';
  onPrevAyah?: () => void;
  onNextAyah?: () => void;
  onRepeatCycleComplete?: () => void;
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.75, 1.0, 1.25];

export function AudioPlayerBar({
  surahId = 18,
  surahName,
  ayahNumber,
  mode = 'memorize',
  onPrevAyah,
  onNextAyah,
  onRepeatCycleComplete,
}: AudioPlayerBarProps) {
  const language = useMillaStore((s) => s.language);
  const copy = MILLA_COPY[language];
  const reciter = useMillaStore((s) => s.reciter);
  const setReciter = useMillaStore((s) => s.setReciter);
  const playbackSpeed = useMillaStore((s) => s.playbackSpeed);
  const setPlaybackSpeed = useMillaStore((s) => s.setPlaybackSpeed);
  const mandatoryRepeats = useMillaStore((s) => s.mandatoryRepeats);

  const isReferenceMode = mode === 'reference';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatLoopActive, setRepeatLoopActive] = useState(!isReferenceMode);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [progress, setProgress] = useState(0);
  const [useFallbackTimer, setUseFallbackTimer] = useState(false);
  const [audioStatusNote, setAudioStatusNote] = useState<string>('تلاوة صوتية مباشرة');

  const audioUrl = getEveryAyahAudioUrl(reciter, surahId, ayahNumber);

  // Reset playback state when surah/ayah/reciter/mode changes
  useEffect(() => {
    setIsPlaying(false);
    setRepeatLoopActive(!isReferenceMode);
    setCurrentRepeat(1);
    setProgress(0);
    setUseFallbackTimer(false);
    setAudioStatusNote('تلاوة صوتية مباشرة');
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // Ignore reset errors
      }
    }
  }, [surahId, ayahNumber, reciter, isReferenceMode]);

  // Sync playbackRate on HTML5 audio element
  useEffect(() => {
    if (audioRef.current) {
      try {
        audioRef.current.playbackRate = playbackSpeed;
      } catch {
        // Ignore unsupported playbackRate errors
      }
    }
  }, [playbackSpeed]);

  // Fallback cadence timer when offline or external MP3 fails to load
  useEffect(() => {
    if (!isPlaying || !useFallbackTimer) return;
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
  }, [
    isPlaying,
    useFallbackTimer,
    playbackSpeed,
    repeatLoopActive,
    currentRepeat,
    mandatoryRepeats,
    onRepeatCycleComplete,
  ]);

  const togglePlayPause = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // Ignore pause error
        }
      }
      return;
    }

    if (progress >= 100) {
      setProgress(0);
      setCurrentRepeat(1);
    }

    if (useFallbackTimer || !audioRef.current) {
      setIsPlaying(true);
      return;
    }

    try {
      audioRef.current.playbackRate = playbackSpeed;
      await audioRef.current.play();
      setIsPlaying(true);
      setAudioStatusNote('تلاوة صوتية مباشرة');
    } catch {
      // Fallback gracefully when offline or stream blocked
      setUseFallbackTimer(true);
      setAudioStatusNote('وضع المؤقّت المحلي (دون اتصال)');
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    if (repeatLoopActive && currentRepeat < mandatoryRepeats) {
      const nextCount = currentRepeat + 1;
      setCurrentRepeat(nextCount);
      setProgress(0);
      if (audioRef.current) {
        try {
          audioRef.current.currentTime = 0;
          void audioRef.current.play();
          return;
        } catch {
          // Fall through to stop
        }
      }
    }
    setProgress(100);
    setIsPlaying(false);
    if (onRepeatCycleComplete) onRepeatCycleComplete();
  };

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
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (!el || !el.duration || Number.isNaN(el.duration)) return;
          setProgress(Math.min(100, Math.round((el.currentTime / el.duration) * 100)));
        }}
        onEnded={handleAudioEnded}
        onError={() => {
          setUseFallbackTimer(true);
          setAudioStatusNote('وضع المؤقّت المحلي (دون اتصال)');
        }}
      />

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/25 text-foreground">
            <RotateCcw className="h-5 w-5 text-primary" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground">
              {surahName} • {copy.ayahLabel} {formatNum(ayahNumber, language)}
            </p>
            <p className="text-sm font-bold text-foreground">
              {isReferenceMode
                ? copy.audioReferenceLabel
                : `${copy.audioRepeatLabel} ${formatNum(currentRepeat, language)} / ${formatNum(mandatoryRepeats, language)}`}
            </p>
          </div>
        </div>

        {!isReferenceMode && (
          <div className="flex items-center gap-1" aria-label={copy.audioRepeatLabel}>
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
        )}
      </div>

      {/* Progress Bar & Reciter Switcher */}
      <div className="mb-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <MillaPicker
            compact
            value={reciter}
            onChange={(val) => setReciter(val as ReciterId)}
            title={copy.onboardingReciterPickerTitle}
            ariaLabel={copy.onboardingReciterPickerTitle}
            icon={<Volume2 className="h-4 w-4" aria-hidden="true" />}
            options={RECITERS.map((r) => ({
              value: r.id,
              label: language === 'ar' ? r.nameAr : r.nameEn,
              description: language === 'ar' ? r.styleAr : r.nameAr,
              keywords: `${r.nameAr} ${r.nameEn}`,
            }))}
          />
          <span>{useFallbackTimer ? copy.audioOfflineStatus : copy.audioLiveStatus}</span>
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
            'inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors',
            repeatLoopActive
              ? 'border-accent bg-accent/20 text-foreground'
              : 'border-border bg-background text-muted-foreground',
          )}
          aria-pressed={repeatLoopActive}
        >
          <Repeat className="h-4 w-4" aria-hidden="true" />
          <span>{repeatLoopActive ? copy.audioRepeatOn : copy.audioRepeatOff}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevAyah}
            disabled={!onPrevAyah}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
            aria-label="الآية السابقة"
          >
            <SkipForward className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => void togglePlayPause()}
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
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
            aria-label="الآية التالية"
          >
            <SkipBack className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={cycleSpeed}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-border bg-background px-3.5 text-xs font-bold text-foreground transition-colors hover:bg-secondary"
          aria-label="تغيير سرعة التلاوة"
        >
          {playbackSpeed}x
        </button>
      </div>
    </section>
  );
}
