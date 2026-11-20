# المِلّة (Al-Millah) — Quran Memorization & Revision Companion

Open-source, local-first Quran memorization and revision application inspired by the traditional Tunisian **ملّة (Millah)** methodology, built with a **Turborepo** monorepo (`Next.js 16 Static PWA` + `Hono.js OpenAPI` + `Prisma` + `Supabase`).

- **Live Production App**: [https://al-milla.khalilbchir.pro](https://al-milla.khalilbchir.pro)
- **Design System**: *Quiet Devotion* ([docs/references/DESIGN.md](docs/references/DESIGN.md))
- **Product Specification**: [docs/references/PROJECT_BRIEF.md](docs/references/PROJECT_BRIEF.md)

---

## Core Product Philosophy

1. **Five-Stage Tunisian Millah Daily Loop**:
   - `١. مراجعة الأمس` (Review yesterday's lesson)
   - `٢. المراجعة السابقة — المِلّة الكبرى` (Spaced-repetition review across `1 → 3 → 7 → 14 → 30` day intervals)
   - `٣. الحفظ الجديد` (Manageable daily portion, default 3–4 verses)
   - `٤. التسميع الذاتي` (Blind recall with hide/reveal, audio reference, and honest self-evaluation)
   - `٥. ربط الآيات` (Connecting new verses with preceding material)
2. **Local-First & Privacy-Preserving**:
   - **Zero registration wall**: Learners begin immediately; preferences and spaced-repetition schedules persist in `localStorage` and full verified Surahs cache offline in `IndexedDB`.
   - **Optional Cloud Backup (`/api/v1/sync`)**: Learners can optionally sync or restore their Hafiz portfolio across devices using a private `syncKey` via the Hono + Prisma + PostgreSQL API, or export/import a local JSON backup file.
3. **Elderly-First Accessibility (*Quiet Devotion*)**:
   - Warm Ivory (`#F7F5ED`), Forest Green (`#073D35`), and restrained Coral (`#FF8E79`) palette.
   - Independent adjustable Quran typography (`Amiri` / `Noto Naskh Arabic`, `18px–36px`) and Arabic/Latin UI (`IBM Plex Sans Arabic` / `Inter`).
   - Minimum `48×48px` interactive targets with explicit text labels and trilingual support (`العربية`, `English`, `Français`).

---

## Monorepo Architecture

```text
.
├── apps/
│   ├── web/                  # @al-milla/web — Next.js 16 App Router Static PWA + Tailwind v4 + Zustand + IndexedDB
│   └── api/                  # @al-milla/api — Hono.js ESM OpenAPI REST API (@hono/zod-openapi + hono-autoload)
├── packages/
│   ├── database/             # @al-milla/database — Prisma schema (HafizPortfolio, MemorizedVerse, RevisionAttempt)
│   ├── types/                # @al-milla/types — Shared TypeScript types
│   ├── eslint-config/        # @al-milla/eslint-config — Shared ESLint configuration
│   └── typescript-config/    # @al-milla/typescript-config — Shared tsconfig presets
└── docs/
    └── references/           # DESIGN.md & PROJECT_BRIEF.md
```

---

## Getting Started Locally

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Files

- Root `.env.development` (copied from `.env.example`) for `@al-milla/api` and `@al-milla/database`.
- `apps/web/.env.local` for `@al-milla/web` (`NEXT_PUBLIC_API_URL=http://localhost:3000`).

### 3. Generate Prisma Client & Build Shared Packages

```bash
pnpm --filter @al-milla/database db:generate
pnpm --filter @al-milla/database build
pnpm --filter @al-milla/types build
```

### 4. Run Development Servers

```bash
pnpm dev
```

- **Web PWA (`@al-milla/web`)**: `http://localhost:3001`
- **API & Swagger UI (`@al-milla/api`)**: `http://localhost:3000/docs`
- **Cloud Sync Endpoint**: `GET / POST /api/v1/sync`
