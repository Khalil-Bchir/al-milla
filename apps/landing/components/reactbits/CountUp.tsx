'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';

interface CountUpProps {
  to: number;
  from?: number;
  durationMs?: number;
  format?: (val: number) => string;
  className?: string;
}

/**
 * ReactBits-inspired CountUp: smoothly counts up to a target number when scrolled into view.
 */
export function CountUp({
  to,
  from = 0,
  durationMs = 1100,
  format = (v) => String(v),
  className = '',
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [value, setValue] = useState<number>(from);

  useEffect(() => {
    if (!isInView) return;
    let rafId = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [isInView, from, to, durationMs]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
