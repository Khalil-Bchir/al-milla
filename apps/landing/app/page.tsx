'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { AnimatedContent } from '@/components/reactbits/AnimatedContent';
import { BlurText } from '@/components/reactbits/BlurText';
import { CountUp } from '@/components/reactbits/CountUp';
import { LivingPaperBackground } from '@/components/reactbits/LivingPaperBackground';
import { Magnet } from '@/components/reactbits/Magnet';
import { SurahRibbon } from '@/components/reactbits/SurahRibbon';
import { TiltedCard } from '@/components/reactbits/TiltedCard';
import { LiveSessionPreview } from '@/components/LiveSessionPreview';
import { InstallGuide } from '@/components/InstallGuide';
import { LANDING_COPY, formatLandingNum, type LandingLang } from '@/lib/landing-copy';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001'
    : 'https://app.al-milla.khalilbchir.pro');

export default function LandingPage() {
  const [lang, setLang] = useState<LandingLang>('ar');
  const [activeMethodStep, setActiveMethodStep] = useState<number>(0);
  const copy = LANDING_COPY[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <LivingPaperBackground />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="#" className="flex items-center gap-2.5">
            <img
              src="/images/al-milla-logo.png"
              alt={copy.brand}
              className="h-9 w-9 rounded-xl border border-border object-cover"
            />
            <span className="text-lg font-bold text-primary">{copy.brand}</span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#method" className="transition-colors hover:text-foreground">
              {copy.navMethod}
            </a>
            <a href="#principles" className="transition-colors hover:text-foreground">
              {copy.navPrinciples}
            </a>
            <a href="#install" className="transition-colors hover:text-foreground">
              {lang === 'ar' ? 'التثبيت' : lang === 'fr' ? 'Installer' : 'Install'}
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

      <main className="relative z-10">
        {/* Editorial Hero with Mushaf Photography & Floating Calligraphy */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-6">
              <p className="text-xs font-bold tracking-wide text-primary">{copy.heroBadge}</p>

              <h1 className="text-3xl font-bold leading-[1.28] text-foreground sm:text-4xl lg:text-[44px]">
                <BlurText text={copy.heroTitle} />
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {copy.heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Magnet>
                  <a
                    href={APP_URL}
                    className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-base font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
                  >
                    <span>{copy.heroPrimaryCta}</span>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Magnet>

                <a
                  href="#method"
                  className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-border bg-card/80 px-5 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                >
                  <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>{copy.heroSecondaryCta}</span>
                </a>
              </div>

              <p className="text-xs text-muted-foreground">{copy.heroNoAccount}</p>
            </div>

            {/* Right: Tilted Editorial Mushaf Photo + Floating Verse */}
            <div className="lg:col-span-6">
              <AnimatedContent delay={0.1}>
                <TiltedCard className="relative">
                  <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-md">
                    <img
                      src="/images/mushaf-morning.jpg"
                      alt="Mushaf resting on a wooden rehal in morning light"
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <div
                      className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/40 bg-[#f7f5ed]/92 px-5 py-3.5 text-center shadow-sm backdrop-blur-md"
                      dir="rtl"
                      lang="ar"
                    >
                      <p className="quran-script text-xl text-primary sm:text-2xl">
                        بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ ﴿١﴾
                      </p>
                    </div>
                  </div>
                </TiltedCard>
              </AnimatedContent>
            </div>
          </div>
        </section>

        {/* Living Calligraphy Ribbon */}
        <SurahRibbon />

        {/* Interactive 5-Stage Daily Session Showcase */}
        <section id="method" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-6">
              <AnimatedContent>
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                  {copy.methodTitle}
                </h2>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {copy.methodSubtitle}
                </p>
              </AnimatedContent>

              <div className="space-y-2">
                {copy.stages.map((stage, idx) => {
                  const selected = idx === activeMethodStep;
                  return (
                    <button
                      key={stage.step}
                      type="button"
                      onClick={() => setActiveMethodStep(idx)}
                      className={`relative flex w-full items-start gap-4 rounded-2xl border p-4 text-start transition-colors ${
                        selected
                          ? 'border-primary/40 bg-card shadow-xs'
                          : 'border-transparent hover:bg-card/60'
                      }`}
                    >
                      {selected && (
                        <motion.span
                          layoutId="activeMethodBar"
                          className="absolute inset-y-3 start-0 w-1 rounded-full bg-primary"
                          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        />
                      )}
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-primary'
                        }`}
                      >
                        {formatLandingNum(stage.step, lang)}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-foreground">{stage.title}</h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {stage.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-6 lg:sticky lg:top-24">
              <AnimatedContent delay={0.12}>
                <LiveSessionPreview
                  lang={lang}
                  copy={copy}
                  activeStage={activeMethodStep}
                  onStageChange={setActiveMethodStep}
                />
              </AnimatedContent>
            </div>
          </div>
        </section>

        {/* Editorial Principles & Still-Life Photography */}
        <section id="principles" className="border-t border-border/80 bg-card/45 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <AnimatedContent>
                  <TiltedCard>
                    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                      <img
                        src="/images/quiet-study.jpg"
                        alt="Calm sunlit study space with olive branch shadows"
                        className="aspect-[4/5] w-full object-cover"
                      />
                    </div>
                  </TiltedCard>
                </AnimatedContent>
              </div>

              <div className="space-y-8 lg:col-span-7">
                <AnimatedContent>
                  <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                    {copy.principlesTitle}
                  </h2>
                  <p className="mt-2 text-base text-muted-foreground">{copy.principlesSubtitle}</p>
                </AnimatedContent>

                <div className="divide-y divide-border border-y border-border">
                  {copy.principles.map((item, idx) => (
                    <AnimatedContent key={item.title} delay={idx * 0.06}>
                      <div className="py-5">
                        <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    </AnimatedContent>
                  ))}
                </div>

                {/* Quiet Numbers Strip */}
                <div className="grid grid-cols-2 gap-6 pt-2 sm:grid-cols-4">
                  {[
                    { value: 114, label: copy.statsSurahs },
                    { value: 6236, label: copy.statsVerses },
                    { value: 604, label: copy.statsPages },
                    { value: 8, label: copy.statsReciters },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-2xl font-bold text-primary">
                        <CountUp to={stat.value} format={(v) => formatLandingNum(v, lang)} />
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Install on Home Screen Guide */}
        <AnimatedContent>
          <InstallGuide lang={lang} appUrl={APP_URL} />
        </AnimatedContent>

        {/* Closing Invitation */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <AnimatedContent>
            <div className="rounded-3xl bg-primary p-8 text-center text-primary-foreground sm:p-14">
              <h2 className="text-2xl font-bold sm:text-3xl">{copy.finalTitle}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed opacity-90 sm:text-base">
                {copy.finalSubtitle}
              </p>
              <div className="mt-8">
                <Magnet>
                  <a
                    href={APP_URL}
                    className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-bold text-[#073d35] transition-colors hover:bg-secondary"
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

      <footer className="relative z-10 border-t border-border bg-card/50 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-start">
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
