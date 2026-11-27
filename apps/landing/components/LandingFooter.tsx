'use client';

import Link from 'next/link';
import { ArrowUp, Download } from 'lucide-react';
import { LandingThemeSwitcher, type LandingTheme } from '@/components/LandingThemeSwitcher';
import { LANDING_COPY, formatLandingNum, type LandingLang } from '@/lib/landing-copy';

interface LandingFooterProps {
  theme: LandingTheme;
  lang: LandingLang;
  onToggleTheme: () => void;
  isSubpage?: boolean;
}

export function LandingFooter({
  theme,
  lang,
  onToggleTheme,
  isSubpage = false,
}: LandingFooterProps) {
  const copy = LANDING_COPY[lang];
  const prefix = isSubpage ? '/' : '';

  return (
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
                <Link
                  href={`${prefix}#method`}
                  className="text-foreground/85 transition-colors hover:text-primary"
                >
                  {copy.navMethod}
                </Link>
              </li>
              <li>
                <Link
                  href={`${prefix}#features`}
                  className="text-foreground/85 transition-colors hover:text-primary"
                >
                  {copy.navFeatures}
                </Link>
              </li>
              <li>
                <Link
                  href={`${prefix}#principles`}
                  className="text-foreground/85 transition-colors hover:text-primary"
                >
                  {copy.navPrinciples}
                </Link>
              </li>
              <li>
                <Link
                  href={`${prefix}#faq`}
                  className="text-foreground/85 transition-colors hover:text-primary"
                >
                  {copy.navFaq}
                </Link>
              </li>
              <li>
                <Link
                  href="/download"
                  className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{copy.footerOpenApp}</span>
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
              {copy.footerLanguageTitle}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <LandingThemeSwitcher
                theme={theme}
                lang={lang}
                onToggle={onToggleTheme}
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
  );
}
