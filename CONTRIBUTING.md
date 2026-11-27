# Contributing to المِلّة (Al-Millah)

Thank you for your interest in contributing to **Al-Millah**! Every contribution should preserve our **Quiet Devotion** philosophy: individual-only, free, ad-free, local-first, and respectful of verified Quranic text.

## Core Principles

1. **Verified Quranic text only:** Never generate, paraphrase, or alter Quranic Arabic text, diacritics, or tafsir with an LLM. Use verified source data only.
2. **Calm, distraction-free scope:** Do not introduce leaderboards, social comparison, streaks-for-guilt, ads, or paid tiers.
3. **Strict TypeScript:** Never use `any` or `unknown` in types, interfaces, function parameters, return types, or state. Define explicit types or derive them with `zod` (`z.infer<typeof Schema>`).
4. **Scoped changes:** Keep pull requests focused on a single bug fix, feature, or documentation improvement. Do not reformat unrelated files.

## Development Setup

### Prerequisites

- **Node.js** `22.x`
- **pnpm** `9.0.0`

### Setup

```bash
git clone https://github.com/Khalil-Bchir/al-milla.git
cd al-milla
pnpm install
```

### Verification Commands

Before opening a pull request, run the relevant checks for the workspaces you touched:

```bash
# Core domain logic & unit tests
pnpm --filter @al-milla/core build
pnpm --filter @al-milla/core test

# TypeScript checks
pnpm --filter @al-milla/mobile typecheck
pnpm --dir apps/landing exec tsc --noEmit

# Monorepo lint & formatting
pnpm lint
pnpm check-types
```

## Commit & Branch Conventions

- **Branching:** Target `main` for feature/fix pull requests.
- **Conventional Commits:** Commits are validated via `commitlint` + `husky`:
  - `feat: ...` for new features
  - `fix: ...` for bug fixes
  - `docs: ...` for documentation updates
  - `chore: ...` for maintenance and tooling
  - `refactor: ...` for code restructuring without behavior changes
  - `test: ...` for test additions or updates

## Environment & Secrets

- Never commit `.env.*` files, API keys, sync keys, or credentials.
- Use `.env.example` templates if adding new environment variables.

## Pull Request Checklist

- [ ] Changes stay within the project's individual-only, local-first scope.
- [ ] No Quranic Arabic text or diacritics were generated or modified manually/via LLM.
- [ ] Relevant tests and typechecks pass locally.
- [ ] Commit messages follow Conventional Commits.
