'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error details safely without exposing raw stacks in UI
    console.error('Al-Millah UI boundary error:', error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xs">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/25 text-primary">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-bold text-foreground">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          لا تقلق، بيانات حفظك ومراجعتك محفوظة محلياً على جهازك. يمكنك إعادة المحاولة أو العودة للرئيسية.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>إعادة المحاولة</span>
          </button>
          <Link
            href="/"
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground hover:bg-secondary"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>الرئيسية</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
