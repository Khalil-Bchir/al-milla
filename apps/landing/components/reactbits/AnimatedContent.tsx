'use client';

import { motion } from 'motion/react';

interface AnimatedContentProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * ReactBits-inspired AnimatedContent: calm scroll-triggered entrance with subtle lift.
 */
export function AnimatedContent({ children, delay = 0, className = '' }: AnimatedContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
