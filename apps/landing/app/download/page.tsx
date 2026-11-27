import type { Metadata } from 'next';
import { CheckCircle2, Download, ShieldCheck, Smartphone } from 'lucide-react';
import { ArabesqueBackdrop } from '@/components/ArabesqueBackdrop';
import { LandingSubpageShell } from '@/components/LandingSubpageShell';

const GITHUB_RELEASES_URL = 'https://github.com/Khalil-Bchir/al-milla/releases';
const DIRECT_APK_URL =
  'https://github.com/Khalil-Bchir/al-milla/releases/latest/download/al-milla-release.apk';

export const metadata: Metadata = {
  title: 'تحميل تطبيق الأندرويد (APK)',
  description:
    'حمّل تطبيق المِلّة للأندرويد مباشرة بصيغة APK مجاناً بدون إعلانات أو حساب إلزامي، مع خطوات التثبيت الآمن.',
  alternates: {
    canonical: '/download',
  },
};

const INSTALL_STEPS = [
  {
    step: '١',
    title: 'حمّل ملف التطبيق (APK)',
    body: 'اضغط على زر التحميل المباشر ليبدأ تنزيل ملف al-milla-release.apk على هاتفك من GitHub Releases.',
  },
  {
    step: '٢',
    title: 'اسمح بالتثبيت من المتصفح',
    body: 'عند فتح الملف قد يطلب منك أندرويد تفعيل «السماح بالتثبيت من هذا المصدر» (Install unknown apps). فعّله لمتابعة التثبيت.',
  },
  {
    step: '٣',
    title: 'تأكيد التثبيت بأمان',
    body: 'إذا ظهر تنبيه فحص Google Play Protect، فهذا طبيعي لأي تطبيق يُثبّت من خارج متجر Play؛ اختر «تثبيت على أي حال» ليبدأ التطبيق فوراً.',
  },
] as const;

export default function DownloadPage() {
  return (
    <LandingSubpageShell>
      <div className="space-y-8">
        {/* Main Hero Card matching Landing Theme */}
        <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-primary p-6 text-primary-foreground shadow-sm sm:p-10">
          <ArabesqueBackdrop />
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Android APK • الإصدار 1.0.0</span>
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                مجاني وبدون إعلانات
              </span>
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              تحميل تطبيق المِلّة للأندرويد
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
              نسخة شاملة (Universal APK) تعمل على جميع هواتف أندرويد الحديثة، محفوظة محلياً
              على جهازك وتعمل بدون إنترنت بعد تحميل السور.
            </p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <a
                href={DIRECT_APK_URL}
                className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#f7f5ed] px-6 py-3 text-base font-bold text-[#073d35] transition-colors hover:bg-[#e7ede5]"
              >
                <Download className="h-5 w-5" aria-hidden="true" />
                <span>تحميل مباشر (APK)</span>
              </a>
              <a
                href={GITHUB_RELEASES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                <span>الإصدارات على GitHub</span>
              </a>
            </div>
          </div>
        </section>

        {/* Step-by-Step Installation Guide */}
        <section className="space-y-5 rounded-3xl border border-border/80 bg-card/90 p-6 shadow-2xs sm:p-8">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-bold text-foreground">طريقة التثبيت في ٣ خطوات</h2>
          </div>

          <div className="space-y-3">
            {INSTALL_STEPS.map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-3 rounded-2xl border border-border bg-background/80 p-4"
              >
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
            ))}
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/80 p-4 text-xs leading-relaxed text-foreground sm:text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>
              يتحقق التطبيق تلقائياً من وجود نسخ جديدة عبر{' '}
              <code className="rounded bg-card px-1.5 py-0.5 font-mono text-xs">
                version.json
              </code>{' '}
              لتصلك التحديثات مباشرة دون فقدان تقدمك.
            </p>
          </div>
        </section>
      </div>
    </LandingSubpageShell>
  );
}
