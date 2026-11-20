---
name: al-millah-design-system
description: >-
  Use this skill when designing or implementing UI components, pages, tokens, or
  user flows for المِلّة (Al-Millah) in apps/web to enforce the Quiet Devotion
  design system, 5-stage memorization loop, and accessibility rules.
---

# Al-Millah (المِلّة) Design System & Product Skill

Treat [DESIGN.md](../../../docs/references/DESIGN.md) and [PROJECT_BRIEF.md](../../../docs/references/PROJECT_BRIEF.md) as the sources of truth.

## Visual Direction: Quiet Devotion

- **Palette** (~75% ivory/neutral, ~20% forest green, ~5% coral):
  - Forest Green `#073D35` — primary actions, active nav, selected controls, progress.
  - Warm Ivory `#F7F5ED` — main app and reading background.
  - Coral `#FF8E79` — restrained highlights/accents only (verify WCAG contrast; avoid as small text on light surfaces).
  - Charcoal `#242A25` (primary text), Secondary `#777B74`, Light Green Surface `#E7EDE5`, White `#FFFFFF`, Border `#E8E7DF`.
- **Typography**:
  - Quran text: `Noto Naskh Arabic` or `Amiri` (independent adjustable scale, full diacritics, distinct verse numbers).
  - Arabic UI: `IBM Plex Sans Arabic`; Latin UI (EN/FR): `Inter`.
- **Surfaces & Layout**:
  - Mobile-first single column; centered max reading width on desktop.
  - Spacing scale: `4, 8, 12, 16, 20, 24, 32, 40, 48` px.
  - Corner radii `12–18px`, subtle borders, minimal shadows, no nested cards-inside-cards.

## Information Architecture & Core Loop

- **4 Primary Destinations**: `الرئيسية` (Home), `الحفظ` (Memorization), `المراجعة` (Revision), `حسابي` (Account/Progress).
- **5-Stage Daily Session** (preserve order):
  1. `مراجعة الأمس` (Review yesterday)
  2. `المراجعة السابقة` (Review older material)
  3. `الحفظ الجديد` (New memorization, default 3–4 verses/day, adjustable)
  4. `التسميع` (Self-testing with hide/reveal + Difficult/Good/Easy; clarify it is not Tajweed verification)
  5. `ربط الآيات` (Connecting verses)
- **Strict Scope Guardrails**: No registration wall to start, no group/teacher features, no leaderboards, no streaks/guilt messaging, no ads or paid tiers, no decorative Islamic filler, and never generate/alter Quran text with AI.

## Accessibility & Required UI States

- Touch targets `>= 44x44px`; pair all icons with labels/accessible names; no color-only status indicators; test RTL and LTR separately; respect `prefers-reduced-motion`.
- Design all meaningful states: default, active/selected, pressed, disabled, loading, empty, error, success, offline, audio unavailable, downloading, download complete.
