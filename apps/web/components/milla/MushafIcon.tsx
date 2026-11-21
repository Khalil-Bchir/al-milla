interface MushafIconProps {
  className?: string;
}

/**
 * Clean line-art icon of an open Mushaf resting on a traditional rehal stand.
 */
export function MushafIcon({ className = 'h-4 w-4' }: MushafIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Open Mushaf pages */}
      <path d="M12 6.5C10.2 5.2 7.5 4.8 4 5.2v9.3c3.5-.4 6.2 0 8 1.3" />
      <path d="M12 6.5c1.8-1.3 4.5-1.7 8-1.3v9.3c-3.5-.4-6.2 0-8 1.3" />
      <path d="M12 6.5v9.3" />
      {/* Subtle script lines */}
      <path d="M6.5 8.5h3" />
      <path d="M6.5 11.2h3" />
      <path d="M14.5 8.5h3" />
      <path d="M14.5 11.2h3" />
      {/* Traditional Rehal (Quran stand) */}
      <path d="M7 15.8l10 5.2" />
      <path d="M17 15.8L7 21" />
    </svg>
  );
}
