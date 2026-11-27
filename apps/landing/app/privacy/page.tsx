import type { Metadata } from 'next';
import { Shield } from 'lucide-react';
import { LandingSubpageShell } from '@/components/LandingSubpageShell';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description: 'سياسة الخصوصية لتطبيق المِلّة — تطبيق مجاني فردي يحفظ بياناتك محلياً على جهازك.',
  alternates: {
    canonical: '/privacy',
  },
};

const PRIVACY_SECTIONS = [
  {
    title: '١. حفظ محلي على جهازك أولاً',
    body: 'يُحفظ تقدمك في الحفظ والمراجعة وإعداداتك محلياً على هاتفك (عبر SQLite) دون إجبارك على إنشاء حساب أو تسجيل دخول.',
  },
  {
    title: '٢. لا إعلانات ولا تتبع سلوكي',
    body: 'تطبيق المِلّة مجاني بالكامل وخالٍ تماماً من الإعلانات أو أدوات التتبع الإعلانية أو بيع البيانات.',
  },
  {
    title: '٣. النسخ الاحتياطي السحابي الاختياري',
    body: 'إذا اخترت استخدام ميزة النسخ الاحتياطي السحابي طواعيةً، يتم حفظ تقدمك مرتبطاً بمفتاح المزامنة الخاص بك فقط لتتمكن من استرجاعه على جهاز آخر.',
  },
  {
    title: '٤. الملاحظات والتواصل',
    body: 'عند إرسال رسالة ملاحظات أو اقتراح من داخل التطبيق، نستخدم البيانات التي تكتبها فقط لتحسين التطبيق والرد عليك إذا أضفت وسيلة تواصل اختيارية.',
  },
  {
    title: '٥. الصوت والتلاوة دون اتصال',
    body: 'يتم جلب نصوص القرآن والتفسير الميسّر وتلاوات المشايخ من مصادر موثوقة وتخزينها محلياً للقراءة لاحقاً دون اتصال.',
  },
] as const;

export default function PrivacyPage() {
  return (
    <LandingSubpageShell>
      <div className="space-y-6 rounded-3xl border border-border/80 bg-card/90 p-6 shadow-2xs sm:p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">سياسة الخصوصية</h1>
            <p className="text-xs text-muted-foreground">آخر تحديث: نوفمبر ٢٠٢٦</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          نحترم خصوصيتك ونسعى لتقديم رفيق هادئ لحفظ القرآن الكريم بأقل قدر ممكن من البيانات.
        </p>

        <div className="space-y-4">
          {PRIVACY_SECTIONS.map((sec) => (
            <section
              key={sec.title}
              className="space-y-1.5 rounded-2xl border border-border bg-background/80 p-4"
            >
              <h2 className="text-sm font-bold text-foreground sm:text-base">{sec.title}</h2>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {sec.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </LandingSubpageShell>
  );
}
