export type ProgressiveHideLevel = 0 | 1 | 2 | 3;

const MASK_TOKEN = '•••••';

/**
 * Formats a verse for Cue ("opening words") mode, adapting to short 1–3 word verses
 * so that short verses still hide part of their text.
 */
export function formatCueText(textAr: string): string {
  const words = textAr.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return MASK_TOKEN;
  if (words.length <= 3) return `${words[0] ?? ''} ${MASK_TOKEN}`;
  return `${words.slice(0, 2).join(' ')} ...`;
}

/**
 * Masks words progressively (level 0..3) while adapting to short 1–3 word verses
 * so every level visibly increases recall difficulty.
 */
export function maskVerseByLevel(textAr: string, hideLevel: ProgressiveHideLevel): string {
  if (hideLevel === 0) return textAr;

  const words = textAr.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  if (words.length === 1) {
    return MASK_TOKEN;
  }

  if (words.length === 2) {
    return hideLevel === 1 ? `${words[0] ?? ''} ${MASK_TOKEN}` : `${MASK_TOKEN} ${MASK_TOKEN}`;
  }

  if (words.length === 3) {
    if (hideLevel === 1) return `${words[0] ?? ''} ${words[1] ?? ''} ${MASK_TOKEN}`;
    if (hideLevel === 2) return `${words[0] ?? ''} ${MASK_TOKEN} ${MASK_TOKEN}`;
    return `${MASK_TOKEN} ${MASK_TOKEN} ${MASK_TOKEN}`;
  }

  return words
    .map((w, idx) => {
      if (hideLevel === 1 && idx > 0 && idx % 3 === 1) return MASK_TOKEN;
      if (hideLevel === 2 && idx > 0 && idx % 3 !== 0) return MASK_TOKEN;
      if (hideLevel === 3 && idx > 0) return MASK_TOKEN;
      return w;
    })
    .join(' ');
}
