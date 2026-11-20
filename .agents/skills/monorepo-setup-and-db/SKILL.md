---
name: monorepo-setup-and-db
description: >-
  Use this skill when setting up the monorepo environment, configuring Supabase/Prisma
  connections, running database migrations, regenerating shared types, or verifying
  builds and typechecks across workspaces.
---

# Monorepo Setup, Database & Verification

Reference [docs/SETUP.md](../../../docs/SETUP.md) for full details.

## Environment Files

- **Root `.env.development`** (copied from `.env.example`):
  - `PORT=3000`, `API_URL=http://localhost:3000`, `WEB_URL=http://localhost:3001`, `ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001`
  - `DATABASE_URL` (Supabase PgBouncer pooling on port `6543`, `?pgbouncer=true`)
  - `DIRECT_URL` (Supabase direct connection on port `5432` for Prisma migrations)
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, redirect URLs, `JWT_SECRET`, `COOKIE_SECRET`
- **Web `apps/web/.env.local`**:
  - `NEXT_PUBLIC_API_URL=http://localhost:3000`
  - `NEXT_PUBLIC_APP_AUTH_STORAGE_KEY`, `NEXT_PUBLIC_APP_PREFERENCES_STORAGE_KEY`, `NEXT_PUBLIC_DEFAULT_THEME`, `NEXT_PUBLIC_DEFAULT_SIGNUP_ROLE`

## Schema Change & Type Generation Workflow

1. Edit `packages/database/prisma/schema.prisma` (never edit `prisma/migrations/` by hand).
2. Create and apply migration:
   ```bash
   pnpm --filter @repo/database db:migrate:dev
   ```
3. Regenerate Prisma client:
   ```bash
   pnpm --filter @repo/database db:generate
   ```
4. Regenerate Supabase TypeScript types into `packages/types`:
   ```bash
   pnpm dlx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > packages/types/src/types.ts
   ```
5. Verify across the monorepo:
   ```bash
   pnpm check-types && pnpm lint && pnpm build
   ```

## Local Development & Production Deployments

- Start all apps: `pnpm dev` (API on `:3000`, Swagger docs at `/docs`, Web on `:3001`).
- Start individually: `pnpm --filter api dev` or `pnpm --filter web dev`.
- **Staging/Production migrations**: Use `pnpm --filter @repo/database db:migrate:staging` or `db:migrate:prod` (`prisma migrate deploy`) — never `db:migrate:dev`, `db:push`, or `db:drop` in production.
- **Production build**: Run `pnpm check-types && pnpm lint && pnpm build` before deploying `apps/api` and `apps/web`.
