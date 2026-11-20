---
name: turborepo-monorepo
description: >-
  Use this skill when working with Turborepo tasks, pnpm workspaces, shared
  packages (@repo/types, @repo/database, @repo/eslint-config, @repo/typescript-config),
  or monorepo build/lint/typecheck pipelines.
---

# Turborepo & pnpm Workspace Workflow

## Workspace Layout

- `pnpm-workspace.yaml` includes `apps/*` (`api`, `web`) and `packages/*` (`database`, `types`, `eslint-config`, `typescript-config`).
- Repo pins `pnpm@9.0.0` and Node `22.x`.

## Task Pipeline (`turbo.json`)

- `build`: `dependsOn: ["^build"]`, `inputs: ["$TURBO_DEFAULT$", ".env*"]`, `outputs: ["dist/**", ".next/**", "!.next/cache/**", ".vercel/output/**"]`.
- `lint`: `dependsOn: ["^lint"]`.
- `check-types`: `dependsOn: ["^check-types"]`.
- `dev`: `cache: false`, `persistent: true`.

## Common Commands

- Run across all workspaces: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm check-types`, `pnpm format`.
- Target a single workspace: `pnpm --filter <name> <script>` (e.g. `pnpm --filter api dev`, `pnpm --filter web build`, `pnpm --filter @repo/database db:generate`).

## Adding or Updating Shared Packages

1. Reference internal packages using `"workspace:*"` in `package.json`.
2. Extend `@repo/typescript-config` (`base.json`, `nextjs.json`, `node.json`, `react-library.json`) and `@repo/eslint-config` (`base.js`, `next.js`, `react-internal.js`).
3. Ensure compiled packages (`@repo/database`, `@repo/types`) output to `dist/` so `^build` satisfies downstream apps (`apps/api`, `apps/web`).
4. When adding environment variables needed at build time, declare them in `turbo.json` under `tasks.build.env` without leaking secrets into global env.
5. Verify pipeline health after structural changes:
   ```bash
   pnpm check-types && pnpm lint && pnpm build
   ```
