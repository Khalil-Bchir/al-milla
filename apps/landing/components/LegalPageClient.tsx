'use client';

import { FileText, Shield } from 'lucide-react';
import { AnimatedContent } from '@/components/reactbits/AnimatedContent';
import { BlurText } from '@/components/reactbits/BlurText';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';
import { ArabesqueBackdrop, type ArabesquePattern } from '@/components/ArabesqueBackdrop';
import { LandingSubpageShell } from '@/components/LandingSubpageShell';

export interface LegalSection {
  readonly title: string;
  readonly body: string;
}

interface LegalPageClientProps {
  title: string;
  updatedAt: string;
  intro?: string;
  icon: 'shield' | 'file';
  pattern?: ArabesquePattern;
  sections: readonly LegalSection[];
}

export function LegalPageClient({
  title,
  updatedAt,
  intro,
  icon,
  pattern = 'medallion',
  sections,
}: LegalPageClientProps) {
  const Icon = icon === 'shield' ? Shield : FileText;

  return (
    <LandingSubpageShell>
      <AnimatedContent>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <ArabesqueBackdrop variant="corner" pattern={pattern} />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  <BlurText text={title} />
                </h1>
                <p className="text-xs text-muted-foreground">{updatedAt}</p>
              </div>
            </div>

            {intro && (
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {intro}
              </p>
            )}

            <div className="space-y-3">
              {sections.map((sec) => (
                <SpotlightCard
                  key={sec.title}
                  className="bg-background/80 p-4 sm:p-5"
                  spotlightColor="rgba(255, 142, 121, 0.08)"
                >
                  <section className="space-y-1.5">
                    <h2 className="text-sm font-bold text-foreground sm:text-base">
                      {sec.title}
                    </h2>
                    <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {sec.body}
                    </p>
                  </section>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </div>
      </AnimatedContent>
    </LandingSubpageShell>
  );
}
