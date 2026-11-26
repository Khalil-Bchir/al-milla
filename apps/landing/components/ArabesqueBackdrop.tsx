'use client';

export type ArabesqueVariant = 'featured' | 'subtle' | 'corner';
export type ArabesquePattern = 'medallion' | 'rosette' | 'lattice' | 'arch' | 'crescent';

export const ARABESQUE_PATTERNS: readonly ArabesquePattern[] = [
  'medallion',
  'rosette',
  'lattice',
  'arch',
  'crescent',
];

interface MotifSvgProps {
  pattern: ArabesquePattern;
  className?: string;
}

function MotifSvg({ pattern, className }: MotifSvgProps) {
  switch (pattern) {
    case 'rosette':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
          <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="1.2" />
          <rect x="24" y="24" width="72" height="72" rx="4" stroke="currentColor" strokeWidth="1.1" />
          <rect
            x="24"
            y="24"
            width="72"
            height="72"
            rx="4"
            stroke="currentColor"
            strokeWidth="1.1"
            transform="rotate(30 60 60)"
          />
          <rect
            x="24"
            y="24"
            width="72"
            height="72"
            rx="4"
            stroke="currentColor"
            strokeWidth="1.1"
            transform="rotate(60 60 60)"
          />
          <circle cx="60" cy="60" r="24" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="60" cy="60" r="4" fill="currentColor" />
        </svg>
      );
    case 'lattice':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
          <rect
            x="22"
            y="22"
            width="34"
            height="34"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.15"
            transform="rotate(45 39 39)"
          />
          <rect
            x="64"
            y="22"
            width="34"
            height="34"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.15"
            transform="rotate(45 81 39)"
          />
          <rect
            x="22"
            y="64"
            width="34"
            height="34"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.15"
            transform="rotate(45 39 81)"
          />
          <rect
            x="64"
            y="64"
            width="34"
            height="34"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.15"
            transform="rotate(45 81 81)"
          />
          <rect
            x="48"
            y="48"
            width="24"
            height="24"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.1"
            transform="rotate(45 60 60)"
          />
        </svg>
      );
    case 'arch':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
          <path
            d="M22 112V54C22 33.013 39.013 16 60 16C80.987 16 98 33.013 98 54V112"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M34 112V58C34 43.641 45.641 32 60 32C74.359 32 86 43.641 86 58V112"
            stroke="currentColor"
            strokeWidth="1.1"
          />
          <rect
            x="53"
            y="44"
            width="14"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.1"
            transform="rotate(45 60 51)"
          />
        </svg>
      );
    case 'crescent':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
          <circle cx="56" cy="62" r="44" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="68" cy="56" r="34" stroke="currentColor" strokeWidth="1.1" />
          <rect
            x="76"
            y="28"
            width="16"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.1"
          />
          <rect
            x="76"
            y="28"
            width="16"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.1"
            transform="rotate(45 84 36)"
          />
        </svg>
      );
    case 'medallion':
    default:
      return (
        <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
          <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="1.15" />
          <rect x="22" y="22" width="76" height="76" rx="3" stroke="currentColor" strokeWidth="1.15" />
          <rect
            x="22"
            y="22"
            width="76"
            height="76"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.15"
            transform="rotate(45 60 60)"
          />
          <circle cx="60" cy="60" r="28" stroke="currentColor" strokeWidth="1.1" />
          <rect
            x="48"
            y="48"
            width="24"
            height="24"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.1"
            transform="rotate(45 60 60)"
          />
          <circle cx="60" cy="60" r="4" fill="currentColor" />
        </svg>
      );
  }
}

interface ArabesqueBackdropProps {
  variant?: ArabesqueVariant;
  pattern?: ArabesquePattern;
  className?: string;
}

export function ArabesqueBackdrop({
  variant = 'subtle',
  pattern = 'medallion',
  className = '',
}: ArabesqueBackdropProps) {
  if (variant === 'corner') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden text-primary ${className}`}
        aria-hidden="true"
      >
        <MotifSvg
          pattern={pattern}
          className="absolute -bottom-8 -end-8 h-32 w-32 opacity-[0.065]"
        />
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden text-primary ${className}`}
        aria-hidden="true"
      >
        <MotifSvg
          pattern={pattern}
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 opacity-[0.04]"
        />
        <MotifSvg
          pattern={pattern}
          className="absolute -end-12 -top-12 h-44 w-44 opacity-[0.08]"
        />
        <MotifSvg
          pattern={pattern}
          className="absolute -bottom-12 -start-10 h-36 w-36 opacity-[0.07]"
        />
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden text-primary ${className}`}
      aria-hidden="true"
    >
      <MotifSvg
        pattern={pattern}
        className="absolute -end-10 -top-10 h-36 w-36 opacity-[0.06]"
      />
      <MotifSvg
        pattern={pattern}
        className="absolute -bottom-10 -start-10 h-28 w-28 opacity-[0.05]"
      />
    </div>
  );
}
