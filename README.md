<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./apps/landing/public/images/al-milla-logo-dark.jpg" />
  <source media="(prefers-color-scheme: light)" srcset="./apps/landing/public/images/al-milla-logo.png" />
  <img src="./apps/landing/public/images/al-milla-logo.png" alt="المِلّة (Al-Millah)" width="112" />
</picture>

# المِلّة — Al-Millah

**Quiet, local-first Quran memorization and revision — free, ad-free, and distraction-free.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.0.0-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[Website](https://al-milla.khalilbchir.pro) · [Download Android APK](https://al-milla.khalilbchir.pro/download) · [GitHub Releases](https://github.com/Khalil-Bchir/al-milla/releases) · [Report a Bug](https://github.com/Khalil-Bchir/al-milla/issues/new?template=bug_report.yml) · [Request a Feature](https://github.com/Khalil-Bchir/al-milla/issues/new?template=feature_request.yml)

</div>

---

## Philosophy: Quiet Devotion

**المِلّة (Al-Millah)** is an individual-only Quran memorization and revision companion built around calm focus and consistency:

- **Individual & private:** No leaderboards, social feeds, ads, or paid tiers.
- **Local-first:** Progress is stored locally on-device (SQLite on mobile), with an optional private sync key to carry your progress across devices.
- **Verified Quranic text only:** Arabic script, diacritics, and **التفسير الميسّر** (`ar.muyassar`) come strictly from verified Quran sources — never generated or paraphrased by an LLM.
- **Calm 60-30-10 visual system:** Warm Parchment Light and Obsidian Dark themes with subtle Arabesque geometry designed for long, comfortable reading sessions.

---

## Core Learning Experience

### 1. Guided 4-Step Memorization Session
Every daily session follows a clear, unhurried 4-step flow with **one single rating at the final step**:

1. **مراجعة السابق (Review Previous):** Revisit recently memorized verses to anchor context before adding new lines.
2. **الحفظ مع التفسير الميسّر (Memorize with Tafsir):** Read each verse in Uthmani script alongside **التفسير الميسّر** (`ar.muyassar`), listen with verse-by-verse audio, and choose repetition count and playback speed.
3. **التسميع غيباً (Recite from Memory):** Practice recalling with three progressive masking levels — **سريع** (fast), **متوازن** (balanced), or **تدريجي** (gradual) — moving from full text to partial hiding to full concealment.
4. **الربط والتقييم (Link & Rate):** Connect the new verses together and submit one gentle session rating to schedule future revision.

### 2. Smart Revision & Gentle Care
- **Session-based spaced intervals:** Revision intervals follow `1 → 3 → 7 → 14 → 30` sessions rather than rigid calendar guilt.
- **Flexible daily pace:** Choose `3`, `4`, or `5` verses per day.
- **Focused revision modes:** Dedicated `5`, `10`, or `20`-minute sessions alongside continuous recitation, verse linking, random testing, and extra care for difficult verses.
- **8 reciters with live preview:** Preview any reciter before committing in settings, with playback speed control and verse repeat.
- **Daily reflection & quiet dhikr:** A daily authentic hadith card (*إشراقة يومية*) on the virtue of the Quran and a subtle dhikr counter on the home screen.

---

## Monorepo Architecture

This repository is a **Turborepo** + **pnpm** (`pnpm@9.0.0`, Node `22.x`) monorepo:

| Workspace | Package | Stack | Purpose |
| :--- | :--- | :--- | :--- |
| [`apps/mobile`](./apps/mobile) | `@al-milla/mobile` | Expo, React Native, SQLite | Primary Android app (Arabic UI, 4-step session, audio, local-first storage, APK updates) |
| [`apps/landing`](./apps/landing) | `@al-milla/landing` | Next.js 16, Tailwind CSS v4 | Public Arabic landing page, `/download` APK page, `/privacy`, `/terms`, and `version.json` |
| [`apps/api`](./apps/api) | `api` | Hono.js, `@hono/zod-openapi` | REST API for optional sync (`/api/v1/sync`) and Swagger docs (`/docs`) |
| [`packages/core`](./packages/core) | `@al-milla/core` | TypeScript | Shared domain engine (lesson planner, revision engine, verse masking, Quran metadata) |
| [`packages/database`](./packages/database) | `@al-milla/database` | Prisma | Database schema, migrations, and typed client |
| [`packages/types`](./packages/types) | `@repo/types` | TypeScript | Shared types and constants |
| [`packages/eslint-config`](./packages/eslint-config) | `@repo/eslint-config` | ESLint | Shared lint rules |
| [`packages/typescript-config`](./packages/typescript-config) | `@repo/typescript-config` | TypeScript | Shared `tsconfig` presets |

```mermaid
flowchart LR
  Mobile["apps/mobile (Expo + SQLite)"] --> Core["packages/core (Planner · Revision · Masking)"]
  Mobile -. "Optional syncKey (HTTPS)" .-> API["apps/api (Hono + Zod OpenAPI)"]
  API --> DB["packages/database (Prisma + Postgres)"]
  Landing["apps/landing (Next.js)"] -. "version.json / APK" .-> Mobile
```

### Sync & Privacy Model

- **Local by default:** All memorization progress, bookmarks, and revision schedules live in on-device SQLite (`apps/mobile`).
- **Pseudonymous sync key:** When you opt into cloud backup (`GET`/`POST /api/v1/sync`), your portfolio snapshot (narration, daily target, bookmarks, activity dates, and verse review states) is stored in Postgres keyed solely by your `syncKey`—with **no name, email, or account**.
- **Conflict-safe merging:** Updates are merged deterministically using `mergePortfolioStates()` in `packages/core` over HTTPS. (Snapshots are stored as structured JSON rather than client-side E2EE, so keep your `syncKey` private.)

---

## Getting Started

### Prerequisites

- **Node.js** `22.x`
- **pnpm** `9.0.0` (`corepack enable && corepack prepare pnpm@9.0.0 --activate`)

### Installation

```bash
git clone https://github.com/Khalil-Bchir/al-milla.git
cd al-milla
pnpm install
```

### Common Commands

```bash
# Run core domain unit tests
pnpm --filter @al-milla/core test

# Typecheck mobile and landing apps
pnpm --filter @al-milla/mobile typecheck
pnpm --dir apps/landing exec tsc --noEmit

# Start individual dev servers
pnpm --filter @al-milla/landing dev
pnpm --filter @al-milla/mobile start

# Monorepo-wide tasks via Turborepo
pnpm build
pnpm lint
pnpm check-types
pnpm format
```

> **Note:** Environment files (`.env.development`, `.env.staging`, `.env.production`) are gitignored and never committed. Use `.env.example` for `apps/api` / database setup, or copy `.env.unified.example` to `.env.unified` and run `pnpm env:sync` to populate all workspaces at once. See [CONTRIBUTING.md](./CONTRIBUTING.md) for contributor setup details.

---

## Documentation

- [Contributing Guide](./CONTRIBUTING.md) — Branching, Conventional Commits, and PR expectations
- [Security Policy](./SECURITY.md) — Responsible vulnerability reporting

---

## Contributing & License

Contributions that preserve Al-Millah's calm, individual-only, local-first philosophy are warmly welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

Licensed under the [MIT License](./LICENSE) — Copyright © 2026 Mohamed Khalil Bchir.
