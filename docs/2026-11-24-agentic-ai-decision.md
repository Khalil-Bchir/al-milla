# المِلّة (Al-Millah) — Agentic & AI Architecture Decision Record

Date: 2026-11-24  
Status: Decision reference  
Related docs: [PROJECT_BRIEF.md](./references/PROJECT_BRIEF.md), [DESIGN.md](./references/DESIGN.md)

---

## 1. Context

This document captures the architectural review of **المِلّة (Al-Millah)** following two key updates:
1. Pivoting the primary client from a Next.js PWA to a native **Expo 58** mobile app (`apps/mobile`) backed by `expo-sqlite`, `expo-audio`, and `@al-milla/core`.
2. Evaluating whether to make the app more **agentic and AI-assisted** (using `apps/api` on Vercel and a model hosted on Hugging Face) while respecting the product principles in `PROJECT_BRIEF.md` and `DESIGN.md`.

---

## 2. Current `apps/mobile` Architecture (As Built)

### 2.1 Local Persistence (`expo-sqlite`)
`apps/mobile/src/db/database.ts` stores user state and cached Quran data in an on-device SQLite database (`al_milla.db`) with six tables:
- `settings` — preferences, `syncKey`, `syncVersion`, `lastSyncedAt`, `dailyStages`, `surahCursors`, `mutashabihatMastered`, `lastSessionKeys`
- `verse_records` — per-verse memorization status (`memorized`, `in_progress`, `weak`), timestamps, `interval_days`, `last_evaluation`, `review_count`, and `dirty` flag
- `bookmarks` — bookmarked verse keys
- `activity_dates` — active learning dates
- `cached_surahs` — cached surah ayahs and translations
- `cached_pages` — cached Madinah Mushaf pages (1–604)

### 2.2 Current Usage of `apps/api` (Vercel)
`apps/mobile` currently uses `apps/api` in **one place only**: optional cloud backup and restore via `syncKey`.
- `apps/mobile/src/services/sync.ts` calls `POST /api/v1/sync` (`syncPortfolioWithCloud`) and `GET /api/v1/sync?syncKey=...` (`restorePortfolioFromCloud`) against `EXPO_PUBLIC_API_URL`.
- Triggered from `apps/mobile/src/context/MillaContext.tsx` (manual sync/restore in `apps/mobile/app/settings.tsx` and background fire-and-forget sync on session completion).
- Network errors are caught and returned as `{ ok: false }`; `apps/api` unavailability never blocks local usage.
- Other `apps/api` routes (`authentication`, `users`, `reviews`) are not currently called by `apps/mobile`.

### 2.3 Offline vs. Online Reality Today
The current mobile app is **offline-first**, not 100% offline for every asset out of the box:

| Capability | Current Offline Status | Implementation Details |
| :--- | :--- | :--- |
| Memorization, revision queues, progress, bookmarks, settings | **100% Offline** | Read/written directly in `expo-sqlite` (`al_milla.db`). |
| Bundled or previously opened Surahs & Mushaf pages | **100% Offline** | `apps/mobile/src/services/quran.ts` reads from `cached_surahs` / `cached_pages` in SQLite or `@al-milla/core` bundled data first. |
| Uncached Surahs & Mushaf pages (1–604) | **Needs Internet Once** | `quran.ts` fetches from `api.alquran.cloud` on first open, then caches into `expo-sqlite` for offline reuse. |
| Quran Audio Playback | **Needs Internet** | `apps/mobile/src/services/audio.ts` streams directly from EveryAyah URLs (`getEveryAyahAudioUrl(...)`); local MP3 caching is not implemented yet. |
| Cloud Sync / Restore | **Needs Internet (Optional)** | Calls `apps/api` `/api/v1/sync`. |

---

## 3. Core Tensions with "Agentic / AI Assistant"

Any AI addition must account for four constraints defined in `PROJECT_BRIEF.md` and `DESIGN.md`:

1. **Free, Local-First, No Mandatory Account (`PROJECT_BRIEF.md §1`)**
   - A model hosted on Hugging Face cannot run offline.
   - Public AI endpoints on Vercel without rate limiting or auth risk abuse and unexpected compute bills.
2. **Quran Integrity & Qalun Safety (`PROJECT_BRIEF.md §9`, `§4`)**
   - LLMs must **never** generate, paraphrase, or alter Quranic Arabic text or diacritics.
   - Off-the-shelf Arabic LLMs and ASR models are heavily biased toward **Hafs** and can falsely flag valid **Qalun** text or recitation differences.
3. **Elderly-First Accessibility (`PROJECT_BRIEF.md §3`)**
   - Open-ended chat boxes create typing and prompting friction for elderly users. Large, predictable 1-tap choices (or optional voice commands) fit far better.
4. **"Quiet Devotion" & 4-Tab Simplicity (`DESIGN.md §2`, `§6`)**
   - Floating chat bubbles, sparkle badges, or adding a 5th "AI Chat" navigation tab conflict with the calm, paper-like reading experience.

---

## 4. The Three Options

### Option A: Pure Deterministic *(Stay Strictly Within Current Spec)*
No LLM, no Hugging Face, and no conversational AI. All scheduling and guidance are deterministic rules in `@al-milla/core` over `expo-sqlite`.

- **Pros:**
  - Zero hallucination or theological risk (100% verified Quran & tafsir data only).
  - Zero AI hosting cost, zero Hugging Face cold-start latency, no API abuse surface.
  - Fastest to ship and simplest to maintain for elderly users.
  - 100% aligned with `PROJECT_BRIEF.md` and `DESIGN.md` as written.
- **Cons:**
  - Static when life interrupts (e.g., missed weeks pile up queues instead of gently re-balancing).
  - Less contextual help for beginners / non-native speakers beyond static translations.
  - No hands-free voice control.
- **Best if:** Top priority is shipping a zero-cost, 100% offline MVP quickly and deferring AI to v2.

---

### Option B: "Quiet Agentic Companion" *(Recommended)*
Models the agentic behavior after **the imam in a traditional Tunisian ملّة** — observant, gentle, adaptive, and unobtrusive — split into two layers so the core app remains 100% offline.

#### Layer 1: On-Device Agentic Planner (100% Offline, \$0 Cost)
Runs purely in TypeScript (`@al-milla/core` + `apps/mobile` over `expo-sqlite`):
- **Adaptive Daily Plan:** Reads `verse_records` and `activity_dates` to propose calm, 1-tap adjustments on Home (e.g., pausing new verses when weak verses spike, with **Accept** / **Keep normal plan** buttons).
- **Guilt-Free Catch-Up:** Automatically re-spreads overdue reviews after missed days instead of dumping an overwhelming backlog.
- **Smart *Mutashabihat* Injection:** Surfaces similar-verse warnings during Stage 5 (*rabt*) right where confusion is likely.
- **Offline Cache for AI Notes:** Serves any previously fetched AI explanations directly from `expo-sqlite`.

#### Layer 2: Bounded AI Assistant (Online Bonus via `apps/api` → Hugging Face)
Runs only when online, proxied through `apps/api` on Vercel (never called directly from the mobile client):
- **Why proxy through `apps/api`:** Protects Hugging Face credentials, enforces rate limits, and injects **verified Quran & tafsir context** into prompts so the model summarizes trusted sources rather than generating Quranic text from memory.
- **Targeted Capabilities:**
  1. **Grounded Verse & Tafsir Helper:** Explains difficult words or themes in Arabic, French, or English, and pre-fetches notes for today's and tomorrow's verses into `expo-sqlite` while on Wi-Fi.
  2. **Structured Plan Adjustments:** Converts natural-language requests (e.g., *"I'm traveling for 4 days, keep my revision light"*) into typed JSON actions confirmed by 1-tap UI.
  3. **Hands-Free Session Voice Control (Optional):** Controls playback/hiding (*"repeat 3 times"*, *"hide verse"*) without claiming to grade Tajweed.
- **Guardrails:**
  - Handle Hugging Face cold starts (20–60s on serverless/free tiers) with short timeouts and calm offline/unavailable UI states (`DESIGN.md §11`).
  - Keep **automated Tajweed/recitation grading out of scope** until a Qalun + Hafs validated pipeline exists.
  - Do **not** bundle a 500MB–2GB local LLM inside the Expo binary; keep the app lightweight for elderly users' devices.

- **Pros:** Core loop works 100% offline; highest elderly friendliness (less manual planning, 1-tap confirmations); safe against Quran text hallucinations; uses Hugging Face where it adds real value.
- **Cons:** Online features still depend on network and Hugging Face availability/cold starts; requires minor updates to `PROJECT_BRIEF.md` and `DESIGN.md`.

---

### Option C: Full Conversational AI Tutor *(AI-First Experience)*
Makes Hugging Face AI a primary, always-present interface (dedicated chat tab/drawer, open-ended Islamic/Quran Q&A, dynamic lesson generation, and/or AI recitation grading).

- **Pros:** High perceived interactivity; beginners can ask arbitrary questions in AR/FR/EN; potential for real-time recitation feedback if backed by a specialized speech model.
- **Cons:**
  - Breaks offline-first for the app's primary value proposition.
  - Practically forces mandatory accounts, usage quotas, or paid tiers to control Vercel + Hugging Face compute costs.
  - High theological/accuracy risk (LLM hallucinations + Hafs-biased ASR penalizing Qalun reciters).
  - Prompting/chat friction and cold-start waits hurt elderly usability and violate the "Quiet Devotion" aesthetic.
- **Best if:** Pivoting المِلّة into an online-first AI Quran tutor with accounts/quotas and dedicated budget for Qalun + Hafs model validation.

---

## 5. Side-by-Side Comparison

| Criteria | Option A (Deterministic) | Option B (Quiet Agentic Companion) | Option C (Full AI Tutor) |
| :--- | :--- | :--- | :--- |
| **Core loop offline?** | Yes (100%) | Yes (100%) | No (AI-dependent) |
| **Needs accounts / rate limits?** | No | Optional / lightweight IP limit | Almost certainly Yes |
| **Qalun & Quran text safety** | Highest | High (tool-grounded, no generated Quran text) | High risk without custom validation |
| **Elderly friendliness** | High | **Highest** (adaptive 1-tap choices) | Low (chat/prompt friction) |
| **Use of Hugging Face** | None | Targeted, pre-cached helper & structured actions | Central chat / voice tutor |
| **Changes to `PROJECT_BRIEF.md`** | None | Minor extension (bounded AI layer + Expo update) | Major rewrite of core principles |

---

## 6. Recommended Path Forward

1. **Adopt Option B incrementally:**
   - Build **Layer 1** (deterministic adaptive planner + catch-up + *mutashabihat* prompts) in `@al-milla/core` and `apps/mobile` first so the app feels intelligent 100% offline.
   - Add **Layer 2** via a new route in `apps/api/src/routes/v1/` calling Hugging Face for **one** bounded capability first (e.g., grounded word/tafsir helper with local `expo-sqlite` caching).
2. **Close remaining non-AI offline gaps (optional but high-value):**
   - Bundle or offer bulk download for all 114 surahs into `cached_surahs`.
   - Add local audio file caching in `apps/mobile/src/services/audio.ts` for downloaded surahs.
3. **Update reference docs:**
   - Update `PROJECT_BRIEF.md` and `DESIGN.md` to record the Expo (`apps/mobile` + `expo-sqlite`) platform decision and the bounded Option B AI guidelines.
