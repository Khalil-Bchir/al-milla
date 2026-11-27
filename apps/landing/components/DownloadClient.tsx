'use client';

import { CheckCircle2, Download, ExternalLink, ShieldCheck, Smartphone } from 'lucide-react';
import { AnimatedContent } from '@/components/reactbits/AnimatedContent';
import { BlurText } from '@/components/reactbits/BlurText';
import { Magnet } from '@/components/reactbits/Magnet';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';
import { ArabesqueBackdrop, type ArabesquePattern } from '@/components/ArabesqueBackdrop';
import { LandingSubpageShell } from '@/components/LandingSubpageShell';

const GITHUB_RELEASES_URL = 'https://github.com/Khalil-Bchir/al-milla/releases';
const DIRECT_APK_URL =
  'https://github.com/Khalil-Bchir/al-milla/releases/latest/download/al-milla-release.apk';

interface InstallStep {
  step: string;
  title: string;
  body: string;
  pattern: ArabesquePattern;
}

const INSTALL_STEPS: readonly InstallStep[] = [
  {
    step: '١',
    title: 'حمّل ملف التطبيق (APK)',
    body: 'اضغط على زر التحميل المباشر ليبدأ تنزيل ملف al-milla-release.apk على هاتفك من GitHub Releases.',
    pattern: 'rosette',
  },
  {
    step: '٢',
    title: 'اسمح بالتثبيت من المتصفح',
    body: 'عند فتح الملف قد يطلب منك أندرويد تفعيل «السماح بالتثبيت من هذا المصدر» (Install unknown apps). فعّله لمتابعة التثبيت.',
    pattern: 'lattice',
  },
  {
    step: '٣',
    title: 'تأكيد التثبيت بأمان',
    body: 'إذا ظهر تنبيه فحص Google Play Protect، فهذا طبيعي لأي تطبيق يُثبّت من خارج متجر Play؛ اختر «تثبيت على أي حال» ليبدأ التطبيق فوراً.',
    pattern: 'arch',
  },
];

export function DownloadClient() {
  return (
    <LandingSubpageShell>
      <div className="space-y-8">
        {/* Main Download Card */}
        <AnimatedContent>
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-10">
            <ArabesqueBackdrop variant="featured" pattern="rosette" />

            <div className="relative z-10 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                  <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Android APK • الإصدار 1.0.0</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold text-foreground">
                  <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                  <span>مجاني وبدون إعلانات</span>
                </span>
              </div>

              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                <BlurText text="تحميل تطبيق المِلّة للأندرويد" />
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                نسخة شاملة (Universal APK) تعمل على جميع هواتف أندرويد الحديثة، محفوظة محلياً
                على جهازك وتعمل بدون إنترنت بعد تحميل السور.
              </p>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <Magnet>
                  <a
                    href={DIRECT_APK_URL}
                    className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-xs transition-opacity hover:opacity-95"
                  >
                    <Download className="h-5 w-5" aria-hidden="true" />
                    <span>تحميل مباشر (APK)</span>
                  </a>
                </Magnet>

                <a
                  href={GITHUB_RELEASES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-border bg-background/80 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <ExternalLink className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>الإصدارات على GitHub</span>
                </a>
              </div>
            </div>
          </section>
        </AnimatedContent>

        {/* Step-by-Step Installation Guide */}
        <AnimatedContent delay={0.08}>
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xs sm:p-8">
            <ArabesqueBackdrop variant="subtle" pattern="medallion" />

            <div className="relative z-10 space-y-5">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="text-lg font-bold text-foreground">طريقة التثبيت في ٣ خطوات</h2>
              </div>

              <div className="space-y-3">
                {INSTALL_STEPS.map((item) => (
                  <SpotlightCard
                    key={item.step}
                    className="bg-background/80 p-4"
                    spotlightColor="rgba(255, 142, 121, 0.08)"
                  >
                    <ArabesqueBackdrop variant="corner" pattern={item.pattern} />
                    <div className="relative z-10 flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-primary">
                        {item.step}
                      </span>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  </SpotlightCard>
                ))}
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl border border-border/70 bg-secondary/70 p-4 text-xs leading-relaxed text-foreground sm:text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p>
                  يتحقق التطبيق تلقائياً من وجود نسخ جديدة عبر{' '}
                  <code className="rounded bg-card px-1.5 py-0.5 font-mono text-xs text-primary">
                    version.json
                  </code>{' '}
                  لتصلك التحديثات مباشرة دون فقدان تقدمك.
                </p>
              </div>
            </div>
          </section>
        </AnimatedContent>
      </div>
    </LandingSubpageShell>
  );
}
