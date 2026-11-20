# Web Guidelines (`apps/web`)

Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + shadcn/ui (`new-york`, Radix UI) + Zustand + React Hook Form + Zod.

## Server / Client Boundaries

- Default to React Server Components (RSC). Add `'use client'` only when using browser APIs, state, effects, refs, or event handlers.
- Never reference `window`, `document`, `localStorage`, or `navigator` in Server Components.
- Prefer `next/image` for images, `Suspense` for async boundaries, and dynamic imports for heavy non-critical UI.

## Styling & Components

- Use Tailwind CSS v4 utility classes (`app/globals.css`) and `cn` (`clsx` + `tailwind-merge`) + `class-variance-authority`.
- Follow existing shadcn/ui + Radix patterns (`components/ui/`, `components/common/`, `features/`) before adding new UI libraries.
- Forms must use `react-hook-form` with `@hookform/resolvers/zod` and shared/boundary-validated schemas.
- **Strict TypeScript**: **Never** use `any` or `unknown` in component props, hooks, Zustand stores, or API helpers—everything must have explicit interfaces/types or `z.infer<typeof Schema>`.
- Wrap API calls (`lib/api-client.ts`), IndexedDB/`localStorage`, and audio playback operations in `try/catch` with `ApiError` / `Error` narrowing and clear UI error/retry states (never swallow errors silently).
- Provide `error.tsx`, `loading.tsx`, and `not-found.tsx` boundaries for route segments.

## Design System: Quiet Devotion (`docs/references/DESIGN.md`)

- **Core Palette** (aim for ~75% ivory/neutral, ~20% forest green, ~5% coral):
  - Forest Green `#073D35` (primary actions, active nav, key progress)
  - Warm Ivory `#F7F5ED` (main & reading background)
  - Coral `#FF8E79` (sparingly for small highlights/accents; never small text on light backgrounds without WCAG contrast check)
  - Charcoal `#242A25` (primary text), Secondary Text `#777B74`, Light Green Surface `#E7EDE5`, White `#FFFFFF`, Border `#E8E7DF`
- **Typography**:
  - Quran text: `Noto Naskh Arabic` or `Amiri` (independent adjustable scale, clear diacritics and verse numbers).
  - Arabic UI: `IBM Plex Sans Arabic`; Latin UI: `Inter`.
- **Navigation & Layout**:
  - Mobile-first, generous whitespace, 12–18px corner radii, subtle borders over heavy shadows, no nested cards-inside-cards.
  - Four primary destinations: الرئيسية (Home), الحفظ (Memorization), المراجعة (Revision), حسابي (Account/Progress).
- **Accessibility & Cultural Respect**:
  - Minimum `44x44px` touch targets; no tiny icon-only buttons without labels; support RTL and LTR independently; respect `prefers-reduced-motion`; never communicate status by color alone.
  - Avoid decorative mosque silhouettes, excessive gold, streaks/guilt mechanics, leaderboards, or ads.
  - Never generate or alter Quranic text with AI; always render verified source data.
