'use client';

import { motion } from 'motion/react';

const SURAH_NAMES = [
  'سُورَةُ الفَاتِحَة',
  'سُورَةُ البَقَرَة',
  'سُورَةُ آلِ عِمْرَان',
  'سُورَةُ الكَهْف',
  'سُورَةُ يَس',
  'سُورَةُ الرَّحْمَٰن',
  'سُورَةُ المُـلْك',
  'سُورَةُ النَّبَأ',
] as const;

/**
 * Continuous serene Surah calligraphy ribbon in KFGQPC Nastaleeq.
 */
export function SurahRibbon() {
  const items = [...SURAH_NAMES, ...SURAH_NAMES];

  return (
    <div
      dir="ltr"
      className="relative overflow-hidden border-y border-border/80 bg-card/60 py-4 select-none"
      aria-hidden="true"
    >
      <motion.div
        className="flex w-max items-center gap-10 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 36, ease: 'linear', repeat: Infinity }}
      >
        {items.map((name, idx) => (
          <span key={`${name}-${idx}`} className="flex items-center gap-10">
            <span className="quran-script text-xl text-primary/75 sm:text-2xl" lang="ar" dir="rtl">
              {name}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
