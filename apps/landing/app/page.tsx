'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowUp, BookOpen, Download, Menu, X } from 'lucide-react';
import { AnimatedContent } from '@/components/reactbits/AnimatedContent';
import { BlurText } from '@/components/reactbits/BlurText';
import { CountUp } from '@/components/reactbits/CountUp';
import { LivingPaperBackground } from '@/components/reactbits/LivingPaperBackground';
import { Magnet } from '@/components/reactbits/Magnet';
import { SurahRibbon } from '@/components/reactbits/SurahRibbon';
import { TiltedCard } from '@/components/reactbits/TiltedCard';
import { LiveSessionPreview } from '@/components/LiveSessionPreview';
import { FeaturesSection } from '@/components/FeaturesSection';
import { FaqSection } from '@/components/FaqSection';
import { ArabesqueBackdrop } from '@/components/ArabesqueBackdrop';
import { LandingThemeSwitcher, type LandingTheme } from '@/components/LandingThemeSwitcher';
import { LANDING_COPY, formatLandingNum, type LandingLang } from '@/lib/landing-copy';

const LANDING_THEME_STORAGE_KEY = 'milla_landing_theme';

function isLandingTheme(value: string | null): value is LandingTheme {
  return value === 'light' || value === 'dark';
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001'
    : 'https://app.al-milla.khalilbchir.pro');

export default function LandingPage() {
  const lang: LandingLang = 'ar';
  const [theme, setTheme] = useState<LandingTheme>('light');
  const [activeMethodStep, setActiveMethodStep] = useState<number>(0);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const copy = LANDING_COPY[lang];
  const DirArrow = ArrowLeft;
  const appHref = APP_URL;

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(LANDING_THEME_STORAGE_KEY);
      if (isLandingTheme(savedTheme)) {
        setTheme(savedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next: LandingTheme = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(LANDING_THEME_STORAGE_KEY, next);
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <LivingPaperBackground />

      {/* Floating Pill Navigation */}
      <header className="sticky top-3 z-40 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl border border-border/85 bg-card/85 px-4 py-2.5 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <a href="#" className="flex items-center gap-2.5">
              <img
                src={theme === 'dark' ? '/images/al-milla-logo-dark.jpg' : '/images/al-milla-logo.png'}
                alt={copy.brand}
                className="h-9 w-9 rounded-xl border border-border/80 object-cover shadow-2xs"
              />
              <span className="text-lg font-bold tracking-tight text-primary">{copy.brand}</span>
            </a>

            <nav className="hidden items-center gap-1 md:flex">
              <a
                href="#method"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
              >
                {copy.navMethod}
              </a>
              <a
                href="#features"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
              >
                {copy.navFeatures}
              </a>
              <a
                href="#principles"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
              >
                {copy.navPrinciples}
              </a>
              <a
                href="#faq"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
              >
                {copy.navFaq}
              </a>
              <Link
                href="/download"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-secondary/70"
              >
                تحميل للأندرويد
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <LandingThemeSwitcher theme={theme} lang={lang} onToggle={handleToggleTheme} />

              <a
                href={appHref}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-2xs transition-opacity hover:opacity-95"
              >
                <span>{copy.navStart}</span>
                <DirArrow className="h-3.5 w-3.5" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                aria-label="Menu"
                aria-expanded={mobileNavOpen}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/80 text-foreground md:hidden"
              >
                {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mobileNavOpen && (
            <nav className="mt-2.5 flex flex-col gap-1 border-t border-border/70 pt-2.5 md:hidden">
              <a
                href="#method"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary/60"
              >
                {copy.navMethod}
              </a>
              <a
                href="#features"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary/60"
              >
                {copy.navFeatures}
              </a>
              <a
                href="#principles"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary/60"
              >
                {copy.navPrinciples}
              </a>
              <a
                href="#faq"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary/60"
              >
                {copy.navFaq}
              </a>
              <Link
                href="/download"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-primary hover:bg-secondary/60"
              >
                تحميل للأندرويد (APK)
              </Link>
            </nav>
          )}
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
                    href={appHref}
                    className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-base font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
                  >
                    <span>{copy.heroPrimaryCta}</span>
                    <DirArrow className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Magnet>

                <Link
                  href="/download"
                  className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-border bg-card/80 px-5 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                >
                  <Download className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>تحميل للأندرويد (APK)</span>
                </Link>

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
                      alt="مصحف مفتوح على حامل خشبي في ضوء الصباح"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      className="block aspect-[4/3] w-full object-cover dark:hidden"
                    />
                    <img
                      src="/images/hero-revision.jpg"
                      alt="أشعة دافئة عبر مشربية خشبية هندسية"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      className="hidden aspect-[4/3] w-full object-cover brightness-90 contrast-105 dark:block"
                    />
                    <div
                      className="absolute inset-x-4 bottom-4 rounded-2xl border border-border/80 bg-background/92 px-5 py-3.5 text-center shadow-sm backdrop-blur-md"
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
                        alt="خلوة هادئة مع ظلال أغصان الزيتون"
                        loading="lazy"
                        decoding="async"
                        className="block aspect-[4/5] w-full object-cover dark:hidden"
                      />
                      <img
                        src="/images/hero-memorize.jpg"
                        alt="حامل مصحف خشبي في إضاءة هادئة"
                        loading="lazy"
                        decoding="async"
                        className="hidden aspect-[4/5] w-full object-cover brightness-75 contrast-110 dark:block"
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

        {/* App Features Grid */}
        <FeaturesSection lang={lang} copy={copy} />

        {/* Frequently Asked Questions */}
        <AnimatedContent>
          <FaqSection lang={lang} copy={copy} />
        </AnimatedContent>

        {/* Closing Invitation */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <AnimatedContent>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-[#073d35] p-8 text-center text-white dark:bg-card sm:p-14">
              <ArabesqueBackdrop
                variant="featured"
                pattern="medallion"
                className="!text-white/75 dark:!text-primary/80"
              />
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white dark:text-foreground sm:text-3xl">
                  {copy.finalTitle}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/88 dark:text-muted-foreground sm:text-base">
                  {copy.finalSubtitle}
                </p>
                <div className="mt-8">
                  <Magnet>
                    <a
                      href={appHref}
                      className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#f7f5ed] px-8 text-base font-bold text-[#073d35] transition-colors hover:bg-[#e7ede5] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                    >
                      <span>{copy.finalCta}</span>
                      <DirArrow className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </Magnet>
                </div>
              </div>
            </div>
          </AnimatedContent>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/80 bg-card/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6 sm:pt-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Brand & Promise */}
            <div className="space-y-4 lg:col-span-5">
              <div className="flex items-center gap-3">
                <img
                  src={
                    theme === 'dark'
                      ? '/images/al-milla-logo-dark.jpg'
                      : '/images/al-milla-logo.png'
                  }
                  alt={copy.brand}
                  className="h-10 w-10 rounded-xl border border-border object-cover shadow-2xs"
                />
                <div>
                  <span className="block text-lg font-bold text-primary">{copy.brand}</span>
                  <span className="block text-[11px] font-medium text-muted-foreground">
                    {copy.heroBadge}
                  </span>
                </div>
              </div>

              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {copy.footerTagline}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {[copy.footerPillFree, copy.footerPillNoAccount, copy.footerPillLocal].map(
                  (pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-border bg-background/80 px-3 py-1 text-[11px] font-semibold text-foreground"
                    >
                      {pill}
                    </span>
                  ),
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-3 lg:col-span-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {copy.footerExploreTitle}
              </h3>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <a
                    href="#method"
                    className="text-foreground/85 transition-colors hover:text-primary"
                  >
                    {copy.navMethod}
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="text-foreground/85 transition-colors hover:text-primary"
                  >
                    {copy.navFeatures}
                  </a>
                </li>
                <li>
                  <a
                    href="#principles"
                    className="text-foreground/85 transition-colors hover:text-primary"
                  >
                    {copy.navPrinciples}
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="text-foreground/85 transition-colors hover:text-primary"
                  >
                    {copy.navFaq}
                  </a>
                </li>
                <li>
                  <a
                    href={appHref}
                    className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
                  >
                    <span>{copy.footerOpenApp}</span>
                    <DirArrow className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <Link
                    href="/download"
                    className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>تحميل للأندرويد (APK)</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-foreground/85 transition-colors hover:text-primary"
                  >
                    سياسة الخصوصية
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-foreground/85 transition-colors hover:text-primary"
                  >
                    شروط الاستخدام
                  </Link>
                </li>
              </ul>
            </div>

            {/* Theme & Quranic Verse */}
            <div className="space-y-4 lg:col-span-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                المظهر والتفضيل
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <LandingThemeSwitcher
                  theme={theme}
                  lang={lang}
                  onToggle={handleToggleTheme}
                  variant="pill"
                />
              </div>

              <div className="rounded-2xl border border-border/80 bg-background/70 px-4 py-3">
                <p
                  className="quran-script text-center text-lg leading-relaxed text-primary"
                  dir="rtl"
                  lang="ar"
                >
                  ﴿وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ﴾
                </p>
                <p className="mt-1 text-center text-[11px] text-muted-foreground">
                  {copy.footerVerseRef}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>
              © {formatLandingNum(2026, lang)} {copy.brand} • {copy.footerPrivacyNote}
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background/80 px-3 py-1.5 font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <span>{copy.footerBackToTop}</span>
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
