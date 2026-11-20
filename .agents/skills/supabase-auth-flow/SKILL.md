---
name: supabase-auth-flow
description: >-
  Use this skill when working on authentication, session cookies, JWT refresh,
  role-based access control, or Supabase Auth + Prisma user sync across apps/api
  and apps/web.
---

# Supabase Auth & Session Flow

Reference [docs/AUTH.md](../../../docs/AUTH.md) for complete endpoint and flow details.

## Architecture

1. **Supabase Auth** issues `access_token` and `refresh_token` (email/password, Google OAuth, password reset, email verification).
2. **Backend (`apps/api`)** sets HTTP-only cookies, validates tokens via `src/middleware/authorization.ts`, and syncs user profiles/roles (`USER`, `ADMIN`, `DEMO` in `@repo/types`) with PostgreSQL via Prisma.
3. **Frontend (`apps/web`)** calls the API using `createCookieAuthApiClient` / `createApiClient` (`lib/api-client.ts`) with automatic 401 refresh-and-retry, and stores non-sensitive profile state in `store/auth-store.ts`.

## Security & Production Rules

- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, or `COOKIE_SECRET` to `apps/web` or client bundles; keep them server-only in `apps/api`.
- In production, serve over HTTPS with `HttpOnly`, `Secure`, and `SameSite` cookie attributes, and lock down Supabase redirect URLs (`SUPABASE_EMAIL_REDIRECT_URL`, `SUPABASE_RESET_REDIRECT_URL`, `SUPABASE_OAUTH_REDIRECT_URL`) to your exact production `WEB_URL`.
- Never log JWTs, refresh tokens, or session cookies in `pino` logs.
- **Al-Millah Product Constraint**: Core Quran reading, memorization, and revision must work **without mandatory registration** (local-first); keep auth optional.
