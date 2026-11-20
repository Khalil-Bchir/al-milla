'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Lightbulb, Sparkles, Volume2 } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { KAHF_TAFSIR_WORDS, getSurahById } from '@/lib/quran-data';

export default function TafsirPage() {
  const kahf = getSurahById(18);
  const [playingSample, setPlayingSample] = useState(false);

  return (
    <AppShell title="التفسير وأصول قالون" subtitle="سورة الكهف • الآيات ١ - ٢ • طريق الشاطبية">
      <div className="space-y-5">
        {/* Verse Preview */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">نص التلاوة بالرسم العثماني</span>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
              رواية قالون عن نافع
            </span>
          </div>

          <div className="rounded-2xl bg-secondary/50 p-4 text-center">
            <p className="quran-text text-foreground" dir="rtl" lang="ar">
              {kahf.ayahs[0].textAr} (١) {kahf.ayahs[1].textAr} (٢)
            </p>
          </div>
        </section>

        {/* Usul Qalun Card */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h1 className="text-base font-bold text-foreground">فرائد وأصول قالون</h1>
              <p className="text-xs text-muted-foreground">حكم السكت والوقف عند رأس الآية الأولى</p>
            </div>
            <button
              type="button"
              onClick={() => setPlayingSample((v) => !v)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-bold text-primary-foreground"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              <span>{playingSample ? 'إيقاف' : 'استماع للوصل'}</span>
            </button>
          </div>

          <div className="space-y-3 text-sm leading-relaxed text-foreground">
            <div className="rounded-xl bg-secondary/60 p-3.5">
              <p className="font-bold text-primary">مذهب قالون (الوجه المختار والمعمول به):</p>
              <p className="mt-1 text-xs leading-relaxed">
                يقف على قوله تعالى «عِوَجًا» بالألف مبدلة من التنوين كأي رأس آية، ثم يبتدئ بقوله «قَيِّمًا».
                وإذا وصل الآيتين فالأصل عنده الإدراج وترك السكت مع إخفاء التنوين عند القاف بغنّة كاملة، بخلاف
                رواية حفص التي تسكت وجوباً بدون تنفس.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background p-3.5 text-xs leading-relaxed">
              <p className="font-bold text-foreground">الفارق بين الروايتين للضبط السريع:</p>
              <p className="mt-1 text-muted-foreground">
                • حفص عن عاصم: سكتة لطيفة ملزمة بلا تنفس على «عِوَجًا» حال الوصل.
                <br />• قالون عن نافع: لا سكت؛ إما قطع على رأس الآية بسكون تام، أو إدراج مع الإخفاء.
              </p>
            </div>
          </div>
        </section>

        {/* Word-by-word Tafsir */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">التفسير والبيان الإيماني</h2>
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
            <h2 className="text-base font-bold text-foreground">اللطائف والروابط الذهنية للتثبيت</h2>
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
          بدء التسميع برواية قالون
        </Link>
      </div>
    </AppShell>
  );
}
