---
name: nextjs-app-router
description: >-
  Use this skill when building or modifying pages, layouts, components, Zustand
  stores, forms, or API clients in apps/web using Next.js 16 App Router, React 19,
  Tailwind CSS v4, and shadcn/ui.
---

# Next.js 16 App Router & Frontend Patterns (`apps/web`)

## Directory Structure

- `app/`: Route groups `(marketing)`, `(public)`, `(dashboard)`, `api/`, `layout.tsx`, `globals.css`.
- `features/`: Domain feature modules (`auth`, `overview`, `site`, `users`).
- `components/ui/`: shadcn/ui (`new-york` style, Radix UI + `lucide-react`) primitives.
- `components/common/`: Shared layout/theme components.
- `store/`: Zustand stores (`auth-store.ts`, `preferences-store.ts`, `user-store.ts`).
- `lib/`: `api-client.ts`, `api.ts`, `db-types.ts`, `strings.ts`, `utils.ts` (`cn`).
- `locales/`: Localization files (`ar/`, `en/`).

## Server & Client Boundaries

1. Default to Server Components. Add `'use client'` only for hooks, browser APIs, refs, or event handlers.
2. Never access `window`, `document`, `localStorage`, or `navigator` in Server Components.
3. For persisted Zustand stores, guard `localStorage` with `typeof window !== 'undefined'` (see `store/preferences-store.ts`).
4. Wrap async UI in `Suspense` with clear fallbacks; use `next/image` (remote patterns configured in `next.config.mjs`) and `next/font/google`.

## Styling, Forms & API Calls

- Use Tailwind CSS v4 tokens in `app/globals.css` (`@theme inline`) and `cn()` from `@/lib/utils`.
- Build forms with `react-hook-form` + `@hookform/resolvers/zod`.
- Use `createCookieAuthApiClient` or `createApiClient` from `lib/api-client.ts` (handles automatic 401 refresh and `ApiError` normalization).

## Production Readiness

- **Resilience**: Provide `error.tsx`, `not-found.tsx`, `loading.tsx`, and offline/empty states for every route segment.
- **Security**: Never reference server-only secrets in client components; only `NEXT_PUBLIC_*` env vars are exposed to the browser.
- **Performance & A11y**: Keep `'use client'` minimal, use `next/image` and dynamic imports for heavy widgets, and verify keyboard navigation, focus states, and RTL/LTR layout.
- Verify changes from root or `apps/web`:
  ```bash
  pnpm --filter web typecheck && pnpm --filter web build
  ```
