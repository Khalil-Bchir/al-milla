# Monorepo Guidelines

This is a **Turborepo** + **pnpm** (`pnpm@9.0.0`, Node `22.x`) monorepo for **المِلّة (Al-Millah)**, built on a Next.js + Hono + Supabase + Prisma boilerplate.

## Workspace Map

- `apps/web`: Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + shadcn/ui (Radix) + Zustand.
- `apps/api`: Hono.js ESM API on Node with `@hono/zod-openapi` and `hono-autoload`.
- `packages/database`: Prisma schema, migrations, seeding, and `@prisma/client` wrapper (`dist/`).
- `packages/types`: Shared TypeScript types (including generated Supabase types in `src/types.ts`) and constants.
- `packages/eslint-config`: Shared ESLint configurations.
- `packages/typescript-config`: Shared TypeScript configurations.

## Rule Precedence

- Subproject `AGENTS.md` files (`apps/api/AGENTS.md`, `apps/web/AGENTS.md`, `packages/database/AGENTS.md`) take precedence over this root file when working inside those directories.

## Product & Design Alignment

- Before designing or implementing product features or screens, read `docs/references/PROJECT_BRIEF.md` and `docs/references/DESIGN.md`.
- Preserve the individual-only, free, local-first product scope (no group circles, leaderboards, ads, or paid tiers).
- Never generate, paraphrase, or alter Quranic Arabic text or diacritics with an LLM; use verified source data only.

## Repo-Wide Conventions

- Use `pnpm` and `turbo run <task>` (`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm check-types`, `pnpm format`).
- Keep TypeScript 100% strictly typed: **never** use `any` or `unknown` in types, interfaces, function parameters, return types, or state. Define explicit types or derive them with `z.infer<typeof Schema>`.
- Keep changes scoped to the task; do not reformat or refactor unrelated files.
- Environment files live at the repo root (`.env.development`, `.env.staging`, `.env.production`) and `apps/web/.env.local`. Never hardcode secrets or commit `.env.*` files.
- Commits follow Conventional Commits (enforced via `commitlint` + `husky`).

## Code Quality & Error Handling

- Keep functions small, single-purpose, and shallow using guard clauses / early returns.
- Wrap all async I/O, database, network, storage, and parsing boundaries in explicit `try/catch` blocks.
- Narrow caught errors (`error instanceof Error ? error.message : 'Unknown error'`); never swallow errors with empty `catch {}` blocks or expose raw internal stack traces to users.
- Avoid duplicating logic across modules; extract shared helpers and validate untyped inputs with `zod`.
