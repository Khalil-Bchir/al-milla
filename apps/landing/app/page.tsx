'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Eye, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { AnimatedContent } from '@/components/reactbits/AnimatedContent';
import { BlurText } from '@/components/reactbits/BlurText';
import { CountUp } from '@/components/reactbits/CountUp';
import { Magnet } from '@/components/reactbits/Magnet';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';
import { LiveSessionPreview } from '@/components/LiveSessionPreview';
import { LANDING_COPY, formatLandingNum, type LandingLang } from '@/lib/landing-copy';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://al-milla.khalilbchir.pro';

export default function LandingPage() {
  const [lang, setLang] = useState<LandingLang>('ar');
  const copy = LANDING_COPY[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const principleIcons = [ShieldCheck, HeartHandshake, Eye] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="#" className="flex items-center gap-2.5">
            <img
              src="/images/al-milla-logo.png"
              alt={copy.brand}
              className="h-9 w-9 rounded-xl border border-border object-cover"
            />
            <span className="text-lg font-bold text-primary">{copy.brand}</span>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#method" className="transition-colors hover:text-foreground">
              {copy.navMethod}
            </a>
            <a href="#principles" className="transition-colors hover:text-foreground">
              {copy.navPrinciples}
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-border bg-card p-0.5 text-xs font-semibold">
              {(
                [
                  { id: 'ar', label: 'ع' },
                  { id: 'en', label: 'EN' },
                  { id: 'fr', label: 'FR' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLang(item.id)}
                  className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                    lang === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <a
              href={APP_URL}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-95"
            >
              <span>{copy.navStart}</span>
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3.5 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{copy.heroBadge}</span>
              </span>

              <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-[42px]">
                <BlurText text={copy.heroTitle} />
              </h1>

              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                {copy.heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Magnet>
                  <a
                    href={APP_URL}
                    className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
                  >
                    <span>{copy.heroPrimaryCta}</span>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Magnet>

                <a
                  href="#method"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                >
                  <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>{copy.heroSecondaryCta}</span>
                </a>
              </div>

              <p className="text-xs text-muted-foreground">{copy.heroNoAccount}</p>
            </div>

            <div className="lg:col-span-6">
              <AnimatedContent delay={0.15}>
                <LiveSessionPreview lang={lang} copy={copy} />
              </AnimatedContent>
            </div>
          </div>
        </section>

        {/* Calm Numbers Strip */}
        <section className="border-y border-border bg-card/60 py-10">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 text-center sm:grid-cols-4 sm:px-6">
            {[
              { value: 114, label: copy.statsSurahs },
              { value: 6236, label: copy.statsVerses },
              { value: 604, label: copy.statsPages },
              { value: 8, label: copy.statsReciters },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-primary">
                  <CountUp to={stat.value} format={(v) => formatLandingNum(v, lang)} />
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5-Stage Method Section */}
        <section id="method" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <AnimatedContent>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{copy.methodTitle}</h2>
              <p className="mt-2 text-base text-muted-foreground">{copy.methodSubtitle}</p>
            </div>
          </AnimatedContent>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {copy.stages.map((stage, idx) => (
              <AnimatedContent key={stage.step} delay={idx * 0.06}>
                <SpotlightCard className="h-full p-5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-primary">
                    {formatLandingNum(stage.step, lang)}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-foreground">{stage.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {stage.desc}
                  </p>
                </SpotlightCard>
              </AnimatedContent>
            ))}
          </div>
        </section>

        {/* Principles Section */}
        <section id="principles" className="border-t border-border bg-secondary/35 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <AnimatedContent>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                  {copy.principlesTitle}
                </h2>
                <p className="mt-2 text-base text-muted-foreground">{copy.principlesSubtitle}</p>
              </div>
            </AnimatedContent>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {copy.principles.map((item, idx) => {
                const Icon = principleIcons[idx] ?? ShieldCheck;
                return (
                  <AnimatedContent key={item.title} delay={idx * 0.08}>
                    <SpotlightCard
                      className="h-full p-6"
                      spotlightColor="rgba(255, 142, 121, 0.10)"
                    >
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {item.desc}
                      </p>
                    </SpotlightCard>
                  </AnimatedContent>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final Calm Invitation */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <AnimatedContent>
            <div className="rounded-3xl bg-primary p-8 text-center text-primary-foreground sm:p-12">
              <h2 className="text-2xl font-bold sm:text-3xl">{copy.finalTitle}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed opacity-90 sm:text-base">
                {copy.finalSubtitle}
              </p>
              <div className="mt-7">
                <Magnet>
                  <a
                    href={APP_URL}
                    className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white px-7 text-base font-bold text-[#073d35] transition-colors hover:bg-secondary"
                  >
                    <span>{copy.finalCta}</span>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Magnet>
              </div>
            </div>
          </AnimatedContent>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-start">
          <div className="flex items-center gap-2.5">
            <img
              src="/images/al-milla-logo.png"
              alt={copy.brand}
              className="h-7 w-7 rounded-lg border border-border object-cover"
            />
            <span className="text-xs text-muted-foreground">{copy.footerTagline}</span>
          </div>
          <a href={APP_URL} className="text-xs font-bold text-primary hover:underline">
            {copy.footerOpenApp}
          </a>
        </div>
      </footer>
    </div>
  );
}
