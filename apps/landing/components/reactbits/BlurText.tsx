'use client';

import { motion } from 'motion/react';

interface BlurTextProps {
  text: string;
  className?: string;
  delayStepMs?: number;
}

/**
 * ReactBits-inspired BlurText: gently reveals each word from soft blur into crisp focus.
 */
export function BlurText({ text, className = '', delayStepMs = 55 }: BlurTextProps) {
  const words = text.split(' ');

  return (
    <span className={className}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{
            duration: 0.55,
            delay: (index * delayStepMs) / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
        >
          {word}
          {index < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  );
}
