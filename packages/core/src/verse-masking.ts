export type ProgressiveHideLevel = 0 | 1 | 2 | 3;
export type StrengtheningHideLevel = 1 | 2 | 3;

const MASK_TOKEN = '•••••';

/**
 * Masks a verse for Strengthening reviews:
 * - Level 1: hide the last words of the verse (~last third, at least 1 word)
 * - Level 2: hide the second half of the verse
 * - Level 3: hide everything
 */
export function maskVerseForStrengthening(
  textAr: string,
  level: StrengtheningHideLevel,
): string {
  const words = textAr.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (level === 3 || words.length === 1) {
    return words.map(() => MASK_TOKEN).join(' ');
  }

  const visibleCount =
    level === 2
      ? Math.max(1, Math.floor(words.length / 2))
      : Math.max(1, words.length - Math.max(1, Math.ceil(words.length / 3)));

  return words
    .map((w, idx) => (idx < visibleCount ? w : MASK_TOKEN))
    .join(' ');
}

function nextSeededInt(seed: number): number {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return next;
}

/**
 * Dynamically and randomly hides words in a verse based on the current
 * repetition number, target repetitions, and the verse's word length.
 * Deterministic for a given `(repeatCount, ayahNumber, words.length)` so
 * UI re-renders do not flicker while the same repetition is active.
 */
export function maskVerseDynamic(
  textAr: string,
  params: {
    repeatCount: number;
    targetRepeats: number;
    ayahNumber?: number;
  },
): string {
  const { repeatCount, targetRepeats, ayahNumber = 1 } = params;
  if (repeatCount <= 1) return textAr;

  const words = textAr.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  const effectiveTarget = Math.max(2, targetRepeats);
  if (repeatCount >= effectiveTarget) {
    return words.map(() => MASK_TOKEN).join(' ');
  }

  const progress = (repeatCount - 1) / (effectiveTarget - 1);
  const hideCount = Math.min(
    words.length,
    Math.max(1, Math.round(progress * words.length)),
  );

  const indices = Array.from({ length: words.length }, (_, i) => i);
  let seed = (repeatCount * 2654435761 + ayahNumber * 40503 + words.length * 101) >>> 0;
  for (let i = indices.length - 1; i > 0; i -= 1) {
    seed = nextSeededInt(seed);
    const j = seed % (i + 1);
    const tmp = indices[i];
    indices[i] = indices[j] ?? i;
    indices[j] = tmp ?? j;
  }

  const hiddenSet = new Set<number>(indices.slice(0, hideCount));
  return words
    .map((w, idx) => (hiddenSet.has(idx) ? MASK_TOKEN : w))
    .join(' ');
}

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
