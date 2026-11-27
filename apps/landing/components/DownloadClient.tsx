'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  HardDrive,
  Lock,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { AnimatedContent } from '@/components/reactbits/AnimatedContent';
import { BlurText } from '@/components/reactbits/BlurText';
import { CountUp } from '@/components/reactbits/CountUp';
import { Magnet } from '@/components/reactbits/Magnet';
import { SpotlightCard } from '@/components/reactbits/SpotlightCard';
import { SurahRibbon } from '@/components/reactbits/SurahRibbon';
import { TiltedCard } from '@/components/reactbits/TiltedCard';
import { ArabesqueBackdrop, type ArabesquePattern } from '@/components/ArabesqueBackdrop';
import { LandingSubpageShell } from '@/components/LandingSubpageShell';

const GITHUB_RELEASES_URL = 'https://github.com/Khalil-Bchir/al-milla/releases';
const GITHUB_REPO_URL = 'https://github.com/Khalil-Bchir/al-milla';
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
    body: 'اضغط على زر التحميل المباشر ليبدأ تنزيل ملف al-milla-release.apk الموقع رسمياً من مستودع GitHub Releases.',
    pattern: 'rosette',
  },
  {
    step: '٢',
    title: 'اسمح بالتثبيت من المتصفح',
    body: 'عند فتح الملف، سيطلب أندرويد تفعيل «السماح بالتثبيت من هذا المصدر» (Install unknown apps). فعّله لمتابعة التثبيت.',
    pattern: 'lattice',
  },
  {
    step: '٣',
    title: 'تأكيد التثبيت بأمان',
    body: 'إذا ظهر تنبيه فحص Google Play Protect، فهذا أمر طبيعي للتطبيقات المثبتة خارج المتجر؛ اختر «تثبيت على أي حال» ليبدأ التطبيق.',
    pattern: 'arch',
  },
];

interface TrustHighlight {
  icon: typeof Lock;
  title: string;
  body: string;
  pattern: ArabesquePattern;
}

const TRUST_HIGHLIGHTS: readonly TrustHighlight[] = [
  {
    icon: Lock,
    title: 'حفظ محلي بالكامل',
    body: 'تُحفظ تلاوتك وتقدّمك داخل قاعدة بيانات SQLite على هاتفك دون إعلانات أو تتبّع أو حساب إلزامي.',
    pattern: 'medallion',
  },
  {
    icon: RefreshCw,
    title: 'تحديثات تلقائية داخل التطبيق',
    body: 'يتحقق التطبيق عند الفتح من ملف version.json الرسمي وينبّهك فور صدور نسخة أحدث لتثبيتها بسهولة.',
    pattern: 'crescent',
  },
  {
    icon: ShieldCheck,
    title: 'مفتوح المصدر ومُوقّع',
    body: 'الشيفرة المصدرية متاحة للعموم على GitHub، وملف APK مُوقّع بمفتاح إصدار رسمي للحفاظ على بياناتك عند كل تحديث.',
    pattern: 'rosette',
  },
];

export function DownloadClient() {
  return (
    <LandingSubpageShell containerClassName="max-w-6xl">
      <div className="space-y-12">
        {/* Editorial Hero Section matching Landing Page */}
        <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-6 lg:col-span-7">
            <AnimatedContent>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-bold text-primary">
                  <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Android Universal APK</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground">
                  <span
                    className="h-2 w-2 rounded-full bg-accent"
                    aria-hidden="true"
                  />
                  <span>الإصدار 1.0.0 • مجاني بدون إعلانات</span>
                </span>
              </div>
            </AnimatedContent>

            <h1 className="text-3xl font-bold leading-[1.3] text-foreground sm:text-4xl lg:text-[42px]">
              <BlurText text="حمّل تطبيق المِلّة للأندرويد" />
            </h1>

            <AnimatedContent delay={0.08}>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                تطبيق هادئ لحفظ القرآن الكريم ومراجعته بأربع خطوات يومية، يعمل محلياً على
                جهازك دون الحاجة لإنترنت بعد تحميل السور، وبلا إعلانات أو تشتيت.
              </p>
            </AnimatedContent>

            <AnimatedContent delay={0.14}>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Magnet>
                  <a
                    href={DIRECT_APK_URL}
                    className="inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-2xl bg-primary px-7 text-base font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
                  >
                    <Download className="h-5 w-5" aria-hidden="true" />
                    <span>تحميل مباشر (APK)</span>
                  </a>
                </Magnet>

                <a
                  href={GITHUB_RELEASES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-border bg-card/85 px-5 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                >
                  <ExternalLink className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>صفحة الإصدارات (GitHub)</span>
                </a>
              </div>
            </AnimatedContent>

            <AnimatedContent delay={0.2}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>متوافق مع أندرويد ٨.٠ فأحدث</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>يدعم arm64-v8a وجميع الأجهزة</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>لا يتطلب حساباً</span>
                </span>
              </div>
            </AnimatedContent>
          </div>

          {/* Right: Tilted Arabesque App Card */}
          <div className="lg:col-span-5">
            <AnimatedContent delay={0.12}>
              <TiltedCard className="relative">
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-md sm:p-7">
                  <ArabesqueBackdrop
                    variant="featured"
                    pattern="rosette"
                    className="opacity-100"
                  />

                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src="/images/al-milla-logo.png"
                          alt="شعار المِلّة"
                          className="h-12 w-12 rounded-2xl border border-border/80 object-cover shadow-xs dark:hidden"
                        />
                        <img
                          src="/images/al-milla-logo-dark.jpg"
                          alt="شعار المِلّة"
                          className="hidden h-12 w-12 rounded-2xl border border-border/80 object-cover shadow-xs dark:block"
                        />
                        <div>
                          <p className="text-base font-bold text-foreground">تطبيق المِلّة</p>
                          <p className="text-xs text-muted-foreground">
                            al-milla-release.apk
                          </p>
                        </div>
                      </div>
                      <span className="rounded-xl bg-secondary px-3 py-1 text-xs font-bold text-primary">
                        v1.0.0
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="rounded-2xl border border-border/80 bg-background/85 p-3 text-center">
                        <p className="text-lg font-bold text-primary">
                          <CountUp to={114} />
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">سورة كاملة</p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/85 p-3 text-center">
                        <p className="text-lg font-bold text-primary">
                          <CountUp to={4} />
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">خطوات يومية</p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/85 p-3 text-center">
                        <p className="text-lg font-bold text-primary">
                          <CountUp to={0} />
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">إعلانات</p>
                      </div>
                    </div>

                    <div
                      className="rounded-2xl border border-border/80 bg-background/90 px-4 py-3.5 text-center"
                      dir="rtl"
                      lang="ar"
                    >
                      <p className="quran-script text-lg text-primary sm:text-xl">
                        ﴿وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ﴾
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        <span>ملف تثبيت شامل (Universal)</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                        <span>موقّع رسمياً</span>
                      </span>
                    </div>
                  </div>
                </div>
              </TiltedCard>
            </AnimatedContent>
          </div>
        </section>

        {/* Living Calligraphy Ribbon */}
        <div className="-mx-4 sm:-mx-6">
          <SurahRibbon />
        </div>

        {/* Step-by-Step Installation Guide with Arabesque & SpotlightCard */}
        <section className="space-y-6">
          <AnimatedContent>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold tracking-wide text-primary">
                  دليل التثبيت المباشر
                </p>
                <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                  ثلاث خطوات بسيطة للتثبيت على أندرويد
                </h2>
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm">
                يستغرق التثبيت أقل من دقيقة واحدة
              </p>
            </div>
          </AnimatedContent>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {INSTALL_STEPS.map((item, idx) => (
              <AnimatedContent key={item.step} delay={idx * 0.08}>
                <SpotlightCard
                  className="h-full p-6"
                  spotlightColor="rgba(255, 142, 121, 0.10)"
                >
                  <ArabesqueBackdrop variant="corner" pattern={item.pattern} />
                  <div className="relative z-10 flex h-full flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-base font-bold text-primary">
                        {item.step}
                      </span>
                      <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </SpotlightCard>
              </AnimatedContent>
            ))}
          </div>
        </section>

        {/* Trust, Auto-Update & Open Source Section */}
        <section className="space-y-6">
          <AnimatedContent>
            <div>
              <p className="text-xs font-bold tracking-wide text-primary">
                الشفافية والأمان
              </p>
              <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                مصمم ليكون آمناً وموثوقاً على جهازك
              </h2>
            </div>
          </AnimatedContent>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {TRUST_HIGHLIGHTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <AnimatedContent key={item.title} delay={idx * 0.08}>
                  <SpotlightCard className="h-full p-6">
                    <ArabesqueBackdrop variant="subtle" pattern={item.pattern} />
                    <div className="relative z-10 space-y-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </SpotlightCard>
                </AnimatedContent>
              );
            })}
          </div>
        </section>

        {/* Bottom Arabesque Banner */}
        <AnimatedContent>
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
            <ArabesqueBackdrop variant="featured" pattern="medallion" />
            <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                  جاهز للبدء بوردك اليومي؟
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                  حمّل التطبيق الآن أو اطّلع على الشيفرة المصدرية وسياسة الخصوصية قبل
                  التثبيت.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Magnet>
                  <a
                    href={DIRECT_APK_URL}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    <span>تحميل APK الآن</span>
                  </a>
                </Magnet>
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-border bg-background/85 px-5 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                >
                  <span>الكود المصدري</span>
                  <ArrowLeft className="h-4 w-4 text-primary" aria-hidden="true" />
                </a>
                <Link
                  href="/privacy"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
                >
                  سياسة الخصوصية
                </Link>
              </div>
            </div>
          </section>
        </AnimatedContent>
      </div>
    </LandingSubpageShell>
  );
}
