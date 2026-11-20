# Database Guidelines (`packages/database`)

Prisma ORM + PostgreSQL (Supabase), compiled to `dist/` (`./dist/index.js`).

## Schema & Migrations

- `prisma/schema.prisma` is the single source of truth for the database schema.
- **Never** create, edit, rename, or delete files under `prisma/migrations/` manually.
- Use `packages/database/package.json` scripts (via `dotenv-cli` loading root `.env.*`):
  - `pnpm --filter @al-milla/database db:generate` — regenerate Prisma Client after schema changes.
  - `pnpm --filter @al-milla/database db:migrate:dev` — create and apply local migrations.
  - `pnpm --filter @al-milla/database db:seed:dev` — run deterministic seed scripts.
  - `pnpm --filter @al-milla/database db:studio` — inspect data in Prisma Studio.
- After schema changes, also regenerate Supabase TypeScript types into `packages/types/src/types.ts` and run `pnpm check-types`.

## Safety & Environment

- Prefer additive migrations; document rationale for any destructive schema change.
- Never hardcode connection strings (`DATABASE_URL` port `6543` with PgBouncer for queries; `DIRECT_URL` port `5432` for migrations).
