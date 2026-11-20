---
name: production-readiness-shipping
description: >-
  Use this skill when preparing features, services, or releases for staging or
  production, auditing security/resilience/performance, or running pre-release
  verification gates across the monorepo.
---

# Enterprise & Production Readiness Checklist

Use this runbook before shipping any feature or release to staging/production.

## 1. Code Quality & Defensive Error Handling

- **Boundary `try/catch`**: Wrap all database, Supabase, HTTP, filesystem, IndexedDB, JSON-parse, and audio I/O calls in explicit `try/catch` blocks.
- **No swallowed errors**: Never use empty `catch {}`. Narrow caught errors immediately (`error instanceof Error`), log structured context (`logger.error({ error, requestId }, ...)` on API), and surface safe, actionable messages or fallback UI states.
- **Strict end-to-end typing**: **Never** use `any` or `unknown` in types, props, state, or function signatures—every value must be explicitly typed or inferred via `z.infer<typeof Schema>` and `@repo/types`. Use guard clauses / early returns, keep functions small and single-purpose, and avoid code duplication.

## 2. Security & Secrets Hygiene

- **No secrets in client bundles**: Only `NEXT_PUBLIC_*` variables belong in `apps/web`; keep `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `COOKIE_SECRET`, `DATABASE_URL`, and `DIRECT_URL` strictly server-side.
- **CORS (`apps/api/src/middleware/cors.ts`)**: Set `NODE_ENV=production` and an explicit comma-separated `ALLOWED_ORIGINS`; if unset in production, all cross-origin requests are rejected.
- **Security headers (`apps/api/src/middleware/helmet.ts`)**: Keep `helmet` enabled (`X-Frame-Options: DENY`, `nosniff`, `HSTS`, `Referrer-Policy`, `Permissions-Policy`).
- **Input & error boundaries**: Validate all inputs with `zod` / `@hono/zod-openapi`; never return raw stack traces, SQL errors, or internal keys in API responses.
- **Auth cookies**: Ensure HTTP-only, `Secure`, and appropriate `SameSite` flags in production, and verify Supabase redirect URLs match the production `WEB_URL`.

## 3. Database & Migration Safety (`packages/database`)

- **Expand-and-contract migrations**: Prefer backward-compatible, additive schema changes so zero-downtime deploys work while old instances are still draining.
- **Production migration command**: Always use `prisma migrate deploy` via `pnpm --filter @repo/database db:migrate:prod` (or `db:migrate:staging`), **never** `db:migrate:dev`, `db:push`, or `db:drop`.
- **Connection pooling**: Use PgBouncer (`DATABASE_URL` port `6543`, `?pgbouncer=true`) for runtime queries and `DIRECT_URL` (port `5432`) for migrations.
- **Type sync**: Regenerate Prisma client and `packages/types/src/types.ts` before building.

## 4. API Resilience & Observability (`apps/api`)

- **Health & readiness**: Verify `/health` (`under-pressure` memory/uptime) and `/api/v1/health` (live PostgreSQL `SELECT 1` + Supabase connectivity returning `200` or `503`).
- **Load shedding**: `under-pressure` enforces `MAX_REQUESTS_PER_MINUTE` and returns `503` with `retryAfter` under overload; tune limits and timeouts for your traffic profile.
- **Structured logging**: Log with `pino` including `requestId` (`c.get('requestId')`); redact tokens, passwords, and PII.
- **Graceful shutdown & side-effect-free imports**: Keep startup deterministic and avoid top-level network/DB side effects at import time.

## 5. Frontend Resilience, Performance & A11y (`apps/web`)

- **Resilience**: Provide `error.tsx`, `not-found.tsx`, `loading.tsx` / `Suspense` boundaries, and offline/retry UI states.
- **Performance**: Minimize `'use client'`, lazy-load heavy components, optimize images with `next/image`, and keep bundle size lean.
- **Accessibility & i18n**: Verify WCAG contrast, keyboard navigation, `44x44px`+ touch targets, RTL/LTR parity, and `prefers-reduced-motion`.

## 6. Pre-Release Gate & Deployment Order

1. Run full monorepo verification:
   ```bash
   pnpm check-types && pnpm lint && pnpm build
   ```
2. Run database migrations first (`pnpm --filter @repo/database db:migrate:prod`).
3. Deploy `apps/api` (`pnpm --filter api build && pnpm --filter api start`) and verify `/api/v1/health` returns `200`.
4. Deploy `apps/web` (`pnpm --filter web build && pnpm --filter web start` or Vercel) with production `NEXT_PUBLIC_API_URL`.
