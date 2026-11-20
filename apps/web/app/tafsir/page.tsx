'use client';

import Link from 'next/link';
import { BookOpen, Info, Lightbulb, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { KAHF_TAFSIR_WORDS, getSurahById } from '@/lib/quran-data';

export default function TafsirPage() {
  const kahf = getSurahById(18);

  return (
    <AppShell title="التفسير ومعاني الكلمات" subtitle="سورة الكهف • الآيات ١ - ٢ • حفص عن عاصم">
      <div className="space-y-5">
        {/* Verse Preview */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">نص التلاوة بالرسم العثماني</span>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
              حفص عن عاصم
            </span>
          </div>

          <div className="rounded-2xl bg-secondary/50 p-4 text-center">
            <p className="quran-text text-foreground" dir="rtl" lang="ar">
              {kahf.ayahs[0].textAr} ﴿١﴾ {kahf.ayahs[1].textAr} ﴿٢﴾
            </p>
          </div>
        </section>

        {/* Teacher Guidance Disclaimer */}
        <section className="flex items-start gap-2.5 rounded-2xl border border-border bg-secondary/40 p-4 text-xs leading-relaxed text-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p>
            هذا القسم مخصص لتيسير فهم معاني الكلمات أثناء الحفظ؛ أما أحكام الأداء والتجويد
            والوقف والابتداء فتُتلقّى بالمشافهة على يد معلم مجاز.
          </p>
        </section>

        {/* Word-by-word Tafsir */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-base font-bold text-foreground">معاني الكلمات</h1>
          </div>

          <div className="space-y-2.5">
            {KAHF_TAFSIR_WORDS.map((item) => (
              <div key={item.word} className="rounded-xl bg-secondary/45 p-3.5">
                <span className="inline-block rounded-lg bg-primary px-2.5 py-0.5 font-quran text-base font-bold text-primary-foreground">
                  {item.word}
                </span>
                <p className="mt-2 text-xs leading-relaxed text-foreground">{item.meaningAr}</p>
              </div>
            ))}

            <div className="rounded-xl border border-border bg-background p-3.5 text-xs leading-relaxed">
              <p className="font-bold text-primary">المعنى الإجمالي لاستحضاره أثناء التسميع:</p>
              <p className="mt-1 text-foreground">
                يفتتح المولى سورة الكهف بحمد ذاته العلية على نعمة تنزيل هذا القرآن على نبيه ﷺ؛ قرآن نُفي عنه
                أدنى عِوَج في بلاغته وأحكامه، وأُثبتت له الاستقامة الكاملة ليهدي للتي هي أقوم، وينذر
                المعاندين، ويبشر المؤمنين العاملين بالخلود في الجزاء الحسن.
              </p>
            </div>
          </div>
        </section>

        {/* Mental Anchor */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">الروابط الذهنية للتثبيت</h2>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl bg-secondary/50 p-3.5 text-xs leading-relaxed text-foreground">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>
              حين تقف على رأس الآية الأولى «عِوَجًا» تذكّر أن بداية الآية الثانية تعلّة لما بعدها:
              «قَيِّمًا لِّيُنذِرَ». فالاستقامة مقرونة مباشرة بالإنذار والتبشير.
            </p>
          </div>
        </section>

        <Link
          href="/self-test"
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-95"
        >
          الانتقال إلى التسميع الذاتي
        </Link>
      </div>
    </AppShell>
  );
}
