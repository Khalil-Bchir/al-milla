import type { Metadata } from 'next';
import { LegalPageClient, type LegalSection } from '@/components/LegalPageClient';

export const metadata: Metadata = {
  title: 'شروط الاستخدام',
  description: 'شروط استخدام تطبيق المِلّة لحفظ القرآن الكريم ومراجعته.',
  alternates: {
    canonical: '/terms',
  },
};

const TERMS_SECTIONS: readonly LegalSection[] = [
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
];

export default function TermsPage() {
  return (
    <LegalPageClient
      title="شروط الاستخدام"
      updatedAt="آخر تحديث: نوفمبر ٢٠٢٦"
      icon="file"
      pattern="arch"
      sections={TERMS_SECTIONS}
    />
  );
}
