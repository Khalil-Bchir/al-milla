'use client';

import {
  BookOpenCheck,
  HeartHandshake,
  Layers,
  MoonStar,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { ARABESQUE_PATTERNS, ArabesqueBackdrop } from '@/components/ArabesqueBackdrop';
import { AnimatedContent } from '@/components/reactbits/AnimatedContent';
import { TiltedCard } from '@/components/reactbits/TiltedCard';
import type { LandingCopy, LandingFeatureIcon, LandingLang } from '@/lib/landing-copy';

interface FeaturesSectionProps {
  lang: LandingLang;
  copy: LandingCopy;
}

function FeatureIcon({ kind }: { kind: LandingFeatureIcon }) {
  switch (kind) {
    case 'flow':
      return <Layers className="h-5 w-5 text-primary" aria-hidden="true" />;
    case 'revision':
      return <HeartHandshake className="h-5 w-5 text-primary" aria-hidden="true" />;
    case 'audio':
      return <Volume2 className="h-5 w-5 text-primary" aria-hidden="true" />;
    case 'pace':
      return <BookOpenCheck className="h-5 w-5 text-primary" aria-hidden="true" />;
    case 'dhikr':
      return <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />;
    case 'comfort':
    default:
      return <MoonStar className="h-5 w-5 text-primary" aria-hidden="true" />;
  }
}

export function FeaturesSection({ lang, copy }: FeaturesSectionProps) {
  const isRtl = lang === 'ar';

  return (
    <section
      id="features"
      dir={isRtl ? 'rtl' : 'ltr'}
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
    >
      <AnimatedContent>
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            {copy.featuresTitle}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            {copy.featuresSubtitle}
          </p>
        </div>
      </AnimatedContent>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Right/Start: 2x3 Feature Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
          {copy.features.map((feat, idx) => {
            const pattern = ARABESQUE_PATTERNS[idx % ARABESQUE_PATTERNS.length] ?? 'medallion';
            return (
              <AnimatedContent key={feat.title} delay={idx * 0.05} className="h-full">
                <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-card/85 p-5 transition-colors hover:border-primary/35">
                  <ArabesqueBackdrop variant="corner" pattern={pattern} />

                  <div className="relative z-10 flex flex-col gap-2.5">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                      <FeatureIcon kind={feat.icon} />
                    </div>
                    <h3 className="text-base font-bold text-foreground">{feat.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{feat.desc}</p>
                  </div>
                </div>
              </AnimatedContent>
            );
          })}
        </div>

        {/* Left/End: Equal-Height Theme-Adaptive Editorial Photo */}
        <div className="lg:col-span-5">
          <AnimatedContent delay={0.1} className="h-full">
            <TiltedCard className="h-full">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:aspect-auto lg:h-full">
                <img
                  src="/images/hero-memorize.jpg"
                  alt="حامل مصحف خشبي في إضاءة صباحية هادئة"
                  loading="lazy"
                  decoding="async"
                  className="block h-full w-full object-cover dark:hidden lg:absolute lg:inset-0"
                />
                <img
                  src="/images/hero-space.jpg"
                  alt="رواق أندلسي هادئ وقت الغسق مع إضاءة دافئة"
                  loading="lazy"
                  decoding="async"
                  className="hidden h-full w-full object-cover brightness-95 contrast-105 dark:block lg:dark:block lg:absolute lg:inset-0"
                />
              </div>
            </TiltedCard>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}
