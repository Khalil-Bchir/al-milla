import Link from 'next/link';
import { BookOpen, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xs">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
          <BookOpen className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-bold text-foreground">الصفحة غير موجودة</h1>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          الصفحة التي تبحث عنها غير متوفرة. يمكنك العودة إلى الصفحة الرئيسية لمتابعة وردك اليومي.
        </p>
        <Link
          href="/"
          className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground"
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          <span>العودة إلى الرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
