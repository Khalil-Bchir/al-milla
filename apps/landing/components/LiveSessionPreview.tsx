'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Pause,
  Play,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { ArabesqueBackdrop } from '@/components/ArabesqueBackdrop';
import { formatLandingNum, type LandingCopy, type LandingLang } from '@/lib/landing-copy';

interface LiveSessionPreviewProps {
  lang: LandingLang;
  copy: LandingCopy;
  activeStage?: number;
  onStageChange?: (idx: number) => void;
}

type PreviewViewMode = 'revealed' | 'partial' | 'hidden';
type PreviewSpeed = 0.75 | 1 | 1.25;

interface PreviewReciter {
  id: string;
  label: string;
  folder: string;
}

const PREVIEW_RECITERS: readonly PreviewReciter[] = [
  { id: 'hudhaify', label: 'الحذيفي', folder: 'Hudhaify_128kbps' },
  { id: 'husary', label: 'الحصري', folder: 'Husary_128kbps' },
  { id: 'minshawi', label: 'المنشاوي', folder: 'Minshawy_Murattal_128kbps' },
  { id: 'afasy', label: 'العفاسي', folder: 'Alafasy_128kbps' },
];

const SAMPLE_VERSES = [
  { number: 1, ar: 'بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ' },
  { number: 2, ar: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
  { number: 3, ar: 'الرَّحْمَـٰنِ الرَّحِيمِ' },
] as const;

const ARABIC_VERSE_DIGITS = ['١', '٢', '٣'] as const;
const SPEEDS: readonly PreviewSpeed[] = [0.75, 1, 1.25];

function maskPartialArabicVerse(text: string): string {
  const words = text.trim().split(/\s+/);
  return words
    .map((word, idx) => (idx === 0 || idx % 2 === 0 ? word : '••••'))
    .join(' ');
}

/**
 * Interactive preview of Al-Millah's 4-stage session: partial/full hiding, live audio, and final rating.
 */
export function LiveSessionPreview({
  lang,
  copy,
  activeStage: controlledStage,
  onStageChange,
}: LiveSessionPreviewProps) {
  const [internalStage, setInternalStage] = useState<number>(1);
  const activeStage = controlledStage ?? internalStage;
  const setActiveStage = (idx: number) => {
    setInternalStage(idx);
    if (onStageChange) onStageChange(idx);
  };

  const [viewMode, setViewMode] = useState<PreviewViewMode>('partial');
  const [reciterIdx, setReciterIdx] = useState<number>(0);
  const [speed, setSpeed] = useState<PreviewSpeed>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeAyahIdx, setActiveAyahIdx] = useState<number>(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [rating, setRating] = useState<'difficult' | 'good' | 'easy' | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const playAyahAudio = (targetReciterIdx: number, ayahOffset: number) => {
    setAudioError(null);
    const reciter = PREVIEW_RECITERS[targetReciterIdx] ?? PREVIEW_RECITERS[0]!;
    const ayahNum = SAMPLE_VERSES[ayahOffset]?.number ?? 1;
    const url = `https://everyayah.com/data/${reciter.folder}/00100${ayahNum}.mp3`;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audio.playbackRate = speed;
    audioRef.current = audio;

    audio.onended = () => {
      if (ayahOffset + 1 < SAMPLE_VERSES.length) {
        const nextOffset = ayahOffset + 1;
        setActiveAyahIdx(nextOffset);
        playAyahAudio(targetReciterIdx, nextOffset);
      } else {
        setIsPlaying(false);
        setActiveAyahIdx(0);
      }
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setAudioError('تعذّر تشغيل الصوت حالياً');
    };

    setIsPlaying(true);
    void audio.play().catch(() => {
      setIsPlaying(false);
      setAudioError('تعذّر تشغيل الصوت حالياً');
    });
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudio();
      return;
    }
    playAyahAudio(reciterIdx, activeAyahIdx);
  };

  const handleSelectReciter = (nextIdx: number) => {
    setReciterIdx(nextIdx);
    if (isPlaying) {
      playAyahAudio(nextIdx, activeAyahIdx);
    }
  };

  const stage = copy.stages[activeStage] ?? copy.stages[0];
  const totalStages = copy.stages.length;
  const activeReciter = PREVIEW_RECITERS[reciterIdx] ?? PREVIEW_RECITERS[0]!;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm">
      <ArabesqueBackdrop variant="corner" pattern="rosette" />

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/70 pb-3">
          <span className="text-xs font-bold text-primary">{copy.previewHeader}</span>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {formatLandingNum(activeStage + 1, lang)} / {formatLandingNum(totalStages, lang)}
          </span>
        </div>

        {/* Interactive 4-Stage Stepper */}
        <div className="mb-4 grid grid-cols-4 gap-1.5">
          {copy.stages.map((item, idx) => {
            const isCurrent = idx === activeStage;
            const isDone = idx < activeStage;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  setActiveStage(idx);
                  setRating(null);
                  if (idx === 0 || idx === 1) setViewMode('partial');
                  if (idx === 2) setViewMode('hidden');
                  if (idx === 3) setViewMode('revealed');
                }}
                className="flex flex-col items-center gap-1 text-center"
              >
                <span
                  className={`h-2 w-full rounded-full transition-colors ${
                    isCurrent ? 'bg-accent' : isDone ? 'bg-primary' : 'bg-muted'
                  }`}
                />
                <span
                  className={`line-clamp-1 text-[10px] ${
                    isCurrent ? 'font-bold text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Stage Description */}
        <div className="mb-3">
          <p className="text-sm font-bold text-foreground">{stage.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{stage.desc}</p>
        </div>

        {/* Authentic Quranic Text Box with Partial / Full / Revealed Hiding */}
        <div
          className="rounded-2xl border border-border/80 bg-background/90 p-4 text-center"
          dir="rtl"
          lang="ar"
        >
          {viewMode === 'hidden' ? (
            <p className="py-5 text-xs font-medium text-muted-foreground">
              {copy.previewHiddenHint}
            </p>
          ) : (
            <p className="quran-script text-xl text-foreground sm:text-2xl">
              {SAMPLE_VERSES.map((v, i) => {
                const displayVerse =
                  viewMode === 'partial' ? maskPartialArabicVerse(v.ar) : v.ar;
                const isSpeaking = isPlaying && i === activeAyahIdx;
                return (
                  <span
                    key={v.number}
                    className={isSpeaking ? 'rounded-lg bg-secondary/80 px-1' : undefined}
                  >
                    {displayVerse}{' '}
                    <span className="mx-1 text-primary">﴿{ARABIC_VERSE_DIGITS[i]}﴾</span>{' '}
                  </span>
                );
              })}
            </p>
          )}
        </div>

        {/* 3-Mode Partial / Full / Reveal Control */}
        <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-background/85 p-1">
          {(
            [
              { id: 'partial', label: 'إخفاء جزئي', icon: Sparkles },
              { id: 'hidden', label: 'إخفاء كامل', icon: EyeOff },
              { id: 'revealed', label: 'إظهار', icon: Eye },
            ] as const
          ).map((mode) => {
            const active = viewMode === mode.id;
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Audio & Reciter Preview Bar */}
        <div className="mt-3 rounded-2xl border border-border/80 bg-background/80 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-xl bg-primary px-3.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-95"
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {isPlaying ? 'إيقاف التلاوة' : `استمع (${activeReciter.label})`}
              </span>
            </button>

            <div className="flex items-center gap-1">
              {SPEEDS.map((sp) => {
                const active = speed === sp;
                return (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSpeed(sp)}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors ${
                      active
                        ? 'border-primary bg-secondary text-primary'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {formatLandingNum(sp, lang)}×
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {PREVIEW_RECITERS.map((r, idx) => {
              const selected = idx === reciterIdx;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectReciter(idx)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                    selected
                      ? 'border-primary/40 bg-secondary text-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {audioError ? (
            <p className="mt-2 text-[11px] font-medium text-muted-foreground">{audioError}</p>
          ) : null}
        </div>

        {/* Calm Final Rating */}
        <div className="mt-3 border-t border-border/70 pt-3">
          <p className="mb-2 text-[11px] font-semibold text-muted-foreground">
            {copy.previewEvalLabel}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {copy.previewRatings.map((item) => {
              const selected = rating === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRating(item.id)}
                  className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-secondary'
                  }`}
                >
                  <span className="block text-xs font-bold">{item.label}</span>
                  <span className="block text-[10px] opacity-80">{item.hint}</span>
                </button>
              );
            })}
          </div>
          {rating && (
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-primary">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{copy.previewEvalThanks}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
