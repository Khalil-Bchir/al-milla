import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { LandingSubpageShell } from '@/components/LandingSubpageShell';

export const metadata: Metadata = {
  title: 'شروط الاستخدام',
  description: 'شروط استخدام تطبيق المِلّة لحفظ القرآن الكريم ومراجعته.',
  alternates: {
    canonical: '/terms',
  },
};

const TERMS_SECTIONS = [
  {
    title: '١. طبيعة التطبيق والهدف منه',
    body: 'المِلّة تطبيق مجاني فردي مخصص لمساعدة المسلم على حفظ القرآن الكريم ومراجعته يومياً بهدوء، بدون إعلانات أو اشتراكات مدفوعة.',
  },
  {
    title: '٢. نص القرآن الكريم والتسميع الذاتي',
    body: 'يعتمد التطبيق على النص القرآني الموثق برواية حفص عن عاصم بالرسم العثماني. التسميع الذاتي والتقييم داخل التطبيق معينان على التثبيت، ولا يغنيان عن التلقّي والمشافهة لدى معلم مجاز في التجويد.',
  },
  {
    title: '٣. النسخ الاحتياطي ومسؤولية المفتاح',
    body: 'تُحفظ بياناتك محلياً على جهازك. في حال استخدام النسخ الاحتياطي السحابي، أنت مسؤول عن حفظ مفتاح الاسترجاع الخاص بك في مكان آمن.',
  },
  {
    title: '٤. التحديثات والاستمرارية',
    body: 'نعمل على تحسين التطبيق وإصدار تحديثات دورية مجانية لإصلاح الأعطال وتحسين تجربة القراءة والحفظ دون التزام بجدول زمني محدد.',
  },
] as const;

export default function TermsPage() {
  return (
    <LandingSubpageShell>
      <div className="space-y-6 rounded-3xl border border-border/80 bg-card/90 p-6 shadow-2xs sm:p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-primary">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">شروط الاستخدام</h1>
            <p className="text-xs text-muted-foreground">آخر تحديث: نوفمبر ٢٠٢٦</p>
          </div>
        </div>

        <div className="space-y-4">
          {TERMS_SECTIONS.map((sec) => (
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
