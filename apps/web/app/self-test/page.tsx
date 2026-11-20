'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Info, RotateCcw, Volume2 } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { cn } from '@/lib/utils';
import { MILLA_COPY } from '@/lib/milla-i18n';
import {
  getEveryAyahAudioUrl,
  getSurahById,
  loadVerifiedSurahAyahs,
  type AyahEntry,
} from '@/lib/quran-data';
import { useMillaStore, type SelfEvalRating } from '@/store/milla-store';

export default function SelfTestPage() {
  const language = useMillaStore((s) => s.language);
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const currentAyah = useMillaStore((s) => s.currentAyah);
  const setCurrentPosition = useMillaStore((s) => s.setCurrentPosition);
  const reciter = useMillaStore((s) => s.reciter);
  const recordEvaluation = useMillaStore((s) => s.recordEvaluation);

  const surah = getSurahById(currentSurahId);
  const [ayahs, setAyahs] = useState<AyahEntry[]>(surah.ayahs);
  const [revealed, setRevealed] = useState(false);
  const [rating, setRating] = useState<SelfEvalRating | null>(null);
  const [audioHintPlaying, setAudioHintPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadVerifiedSurahAyahs(currentSurahId).then((res) => {
      if (!cancelled && res.ayahs.length > 0) {
        setAyahs(res.ayahs);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentSurahId]);

  const ayahIdx = Math.max(
    0,
    ayahs.findIndex((a) => a.number === currentAyah),
  );
  const ayah = ayahs[ayahIdx] ?? ayahs[0];
  const copy = MILLA_COPY[language];

  const handleToggleAudioReference = async () => {
    if (!audioRef.current) return;
    if (audioHintPlaying) {
      try {
        audioRef.current.pause();
      } catch {
        // Ignore pause error
      }
      setAudioHintPlaying(false);
      return;
    }
    try {
      await audioRef.current.play();
      setAudioHintPlaying(true);
    } catch {
      setAudioHintPlaying(false);
    }
  };

  const handleSubmitAndNext = () => {
    if (rating && ayah) {
      recordEvaluation(`${surah.id}:${ayah.number}`, rating);
    }
    setRevealed(false);
    setRating(null);
    setAudioHintPlaying(false);
    const nextIdx = (ayahIdx + 1) % Math.max(1, ayahs.length);
    const nextAyahObj = ayahs[nextIdx];
    if (nextAyahObj) {
      setCurrentPosition(surah.id, nextAyahObj.number);
    }
  };

  const ratings: { id: SelfEvalRating; title: string; subtitle: string }[] = [
    { id: 'difficult', title: 'صعبة', subtitle: 'تعثّرت / مراجعة غداً' },
    { id: 'good', title: 'جيدة', subtitle: 'بتردّد يسير' },
    { id: 'easy', title: 'متقنة', subtitle: 'رسوخ كالماء' },
  ];

  return (
    <AppShell
      title="التسميع الذاتي"
      subtitle={`${surah.nameAr} • الآية ${ayah?.number ?? 1} من ${surah.totalAyahs}`}
    >
      <div className="space-y-5">
        {ayah && (
          <audio
            ref={audioRef}
            src={getEveryAyahAudioUrl(reciter, surah.id, ayah.number)}
            preload="none"
            onEnded={() => setAudioHintPlaying(false)}
            onError={() => setAudioHintPlaying(false)}
          />
        )}

        {/* Progress Header */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-primary">التسميع الغيبي الذاتي</span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
              الآية {ayah?.number ?? 1} من {surah.totalAyahs}
            </span>
          </div>
          <h1 className="text-lg font-bold text-foreground">{surah.nameAr}</h1>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {ayahs.slice(0, 5).map((item, idx) => (
              <span
                key={item.number}
                className={cn(
                  'h-2 rounded-full transition-colors',
                  idx <= ayahIdx % 5 ? 'bg-primary' : 'bg-muted',
                )}
              />
            ))}
          </div>
        </section>

        {/* Hidden / Revealed Verse Card */}
        <section className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            اقرأ بصوتك غيباً بتؤدة ورتّل، ثم اكشف النص للمطابقة...
          </p>

          <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/40 p-5">
            {revealed && ayah ? (
              <p className="quran-text text-foreground" dir="rtl" lang="ar">
                {ayah.textAr} ({ayah.number})
              </p>
            ) : (
              <div className="space-y-2 py-4">
                <EyeOff className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium text-muted-foreground">
                  [ نص الآية محجوب لتنشيط الحفظ الغيبي ]
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-4 text-sm font-bold text-secondary-foreground hover:opacity-90"
          >
            {revealed ? (
              <>
                <EyeOff className="h-4 w-4" aria-hidden="true" />
                <span>إخفاء النص مجدداً</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" aria-hidden="true" />
                <span>كشف النص للتحقق والمطابقة</span>
              </>
            )}
          </button>
        </section>

        {/* Audio Reference */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">التدقيق الصوتي المرجعي</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {ayah?.qalunNote ?? 'استمع للتحقق من مخارج الحروف والضبط'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleToggleAudioReference()}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              <span>{audioHintPlaying ? 'إيقاف' : 'استماع'}</span>
            </button>
          </div>
        </section>

        {/* Honest Tajweed Disclaimer */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-secondary/40 p-3.5 text-xs leading-relaxed text-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p>{copy.selfEvalDisclaimer}</p>
        </div>

        {/* Self-Evaluation Selector */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-1 text-base font-bold text-foreground">كيف وجدت استحضارك لهذه الآية؟</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            صدق التقييم يحدّث موعد المراجعة القادمة تلقائياً في محفظتك
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {ratings.map((item) => {
              const selected = rating === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRating(item.id)}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-[82px] flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-colors',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-secondary',
                  )}
                >
                  <CheckCircle2
                    className={cn('mb-1 h-4 w-4', selected ? 'opacity-100' : 'opacity-40')}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-bold">{item.title}</span>
                  <span
                    className={cn(
                      'mt-0.5 text-[11px]',
                      selected ? 'opacity-90' : 'text-muted-foreground',
                    )}
                  >
                    {item.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleSubmitAndNext}
            disabled={!rating}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-45"
          >
            <span>تثبيت التقييم والانتقال للآية التالية</span>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              setRevealed(false);
              setRating(null);
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>إعادة التسميع لهذه الآية مرة أخرى</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
