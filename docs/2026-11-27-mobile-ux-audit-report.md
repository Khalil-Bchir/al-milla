# Mobile UX Audit Report — المِلّة (Al-Millah `apps/mobile`)

**Framework:** `ux-heuristics` (Nielsen's 10 Usability Heuristics, Krug's Laws, WCAG 2.1 AA, Mobile UX 48dp / Thumb-Zone Standards)  
**Scope:** `apps/mobile/app/*` (`_layout.tsx`, `onboarding.tsx`, `index.tsx`, `memorize.tsx`, `memorize-session.tsx`, `revision.tsx`, `revision-session.tsx`, `settings.tsx`) & `apps/mobile/src/components/milla/*`  
**Audit Date:** 2026-11-27

---

## 1. Overall Score & Verdict

**Current UX Score: 6 / 10** *(Band 6–8: "Some major issues or several failed diagnostic rows")*

The app has a strong core architecture — local-first onboarding with zero registration wall, a persistent floating bottom dock (`FloatingBottomNav`), RTL-aware layouts, and thoughtful Quran typography (`QuranText`). However, it loses 4 points to **two Major (Severity 3) issues** and **two Minor (Severity 2) issues** that directly affect readability, Android ergonomics, screen-reader usability, and mid-session safety:

1. **Severity 3 (Major) — Light-mode secondary text fails WCAG AA 4.5:1 contrast** across all light surfaces (`3.72:1 – 4.31:1`).
2. **Severity 3 (Major) — Widespread sub-48dp touch targets** (`28px–44px`) on core navigation, audio, and modal controls.
3. **Severity 2 (Minor) — Incomplete screen-reader labeling & inconsistent font scaling** (`140` pressables + `7` `TextInput`s vs `157` total accessibility attributes; `largeUiMode` only scales text in `onboarding.tsx`).
4. **Severity 2 (Minor) — Unprotected mid-session back navigation & hardcoded Arabic-only strings** in `en`/`fr` locales.

---

## 2. Skills Check (Marketplace & Installed)

- **Already Installed & Used:**
  - `ux-heuristics` (Nielsen's 10 heuristics, severity scale 0–4, WCAG 2.1 AA checklist)
  - `al-millah-design-system` (Quiet Devotion tokens, 5-stage memorization loop, RTL/LTR & accessibility rules)
  - `refactoring-ui`, `design-everyday-things`, `ios-hig-design`
- **Agent Marketplace Search:** Searched `ux`, `mobile`, `accessibility`, `mobile ux`, `heuristic review`. No separate third-party UX heuristic or accessibility audit skills exist in the marketplace (only `Dart and Flutter` and `TestMu AI` were returned). No external skills needed to be installed.

---

## 3. Heuristic Review (Nielsen's 10 Rules)

| # | Heuristic | Status | Findings & Evidence | Severity |
|---|-----------|--------|---------------------|----------|
| 1 | **Visibility of System Status** | Partial | Good loading indicators (`ActivityIndicator`), progress bars (`SurahProgressBar`), and audio progress animation in `AudioPlayerBar.tsx`. However, `settings.tsx` status banners (`statusMessage`) appear only at the top of the scroll view; if a user triggers sync/update from lower on the page, feedback can be off-screen. | **2 (Minor)** |
| 2 | **Match Between System & Real World** | Partial | Warm, culturally authentic Arabic terminology (`ورد اليوم`, `تعاهَد محفوظك برفق`). **Gap:** Several screens hardcode Arabic strings even when `language` is `en` or `fr` (e.g., `index.tsx:313` `"جلسة"`, `memorize.tsx:221-225`, `revision.tsx:35-39` `TIME_PRESETS`, `revision-session.tsx:200-206`, `memorize-session.tsx:818, 829`). | **2 (Minor)** |
| 3 | **User Control & Freedom** | Partial | `FloatingBottomNav` allows instant tab switching; `MemorizeSettingsModal` uses draft state with Cancel/Save. **Gap:** No `BackHandler` / `usePreventRemove` guard in `memorize-session.tsx` or `revision-session.tsx`, and `router.back()` exits immediately without confirming if unsaved session progress will be lost or drafted. | **2 (Minor)** |
| 4 | **Consistency & Standards** | Partial | Consistent `AppShell` and card radii (`RADII.card = 16`). **Gap:** `Home` (`index.tsx`) and `Memorize` (`memorize.tsx`) both display Today's Wird hero cards with slightly different copy/badges, and `largeUiMode` scales fonts in `onboarding.tsx` (`fs()`) but is ignored on `index.tsx`, `memorize.tsx`, `revision.tsx`, and `settings.tsx`. | **2 (Minor)** |
| 5 | **Error Prevention** | Good | `resetLocalProgress` in `settings.tsx:315` requires `Alert.alert` confirmation; `memorize-session.tsx` constrains ayah/repeat inputs and disables locked future steps (`disabled={!canTap}`). | **0–1** |
| 6 | **Recognition Rather Than Recall** | Good | `FloatingBottomNav` pairs icons with text labels; `memorize.tsx` and `revision.tsx` show surah progress percentages and due counts directly on cards. | **0** |
| 7 | **Flexibility & Efficiency** | Good | `index.tsx` provides 4 contextual Quick Actions (`Quick Review`, `Gentle Care` / `Random Recall`, `Connection Drill` / `Surah Flow`, `Portion & Voice`) and `onboarding.tsx` offers a clear `Skip & start now` exit. | **0** |
| 8 | **Aesthetic & Minimalist Design** | Good | Calm Quiet Devotion palette, generous spacing (`SPACING.xl = 20`), clean single-column layout (`contentMaxWidth = 680`). Minor clutter: `index.tsx` stacks 6 full-width/grid blocks, pushing `QuietDhikrCard` below the fold. | **1 (Cosmetic)** |
| 9 | **Help Users Recognize, Diagnose & Recover from Errors** | Partial | Audio previews (`onboarding.tsx:223`, `AudioPlayerBar.tsx:173`) handle offline failures gracefully with plain-language messages. **Gap:** In `settings.tsx:309`, update errors interpolate raw `error.message` directly into user-facing text. | **1 (Cosmetic)** |
| 10 | **Help & Documentation** | Good | Contextual info buttons (`MemorizeInfoModal`, revision guide modal) sit cleanly in the top-right/top-left header without cluttering the main flow. | **0** |

---

## 4. Mobile UX Basics

### Touch Targets (Minimum 48dp Requirement)
`tokens.ts:84` sets `MIN_TOUCH_TARGET = 44` (iOS 44pt), which falls short of the **48dp** Android/Material standard — and many controls are even smaller:

| Component / File | Element / Style | Measured Size | Gap vs 48dp |
|------------------|-----------------|---------------|-------------|
| `QuietDhikrCard.tsx:190,197` | `nextBtn` / banner controls | `height: 28`, `minHeight: 36` | **-12 to -20dp** |
| `DailyQuoteCard.tsx:279` | Action button | `height: 32` | **-16dp** |
| `revision-session.tsx:558` | Small pill / action | `minHeight: 32` | **-16dp** |
| `memorize.tsx:1321,1451,1498` | Info/chip buttons | `height: 34`, `minHeight: 34` | **-14dp** |
| `MillaPicker.tsx:345,381` | Search clear / chip | `minHeight: 34`, `height: 44` | **-4 to -14dp** |
| `onboarding.tsx:1427,1435,1457` | `headerIconBtn` / step buttons | `height: 36`, `minWidth/Height: 36` | **-12dp** |
| `settings.tsx:1585,1627,1638` | Stepper / action pills | `height: 36`, `height: 40` | **-8 to -12dp** |
| `revision-session.tsx:534` & `memorize-session.tsx:1923` | `backPill` | `minHeight: 38` | **-10dp** |
| `AudioPlayerBar.tsx:514,572` | Secondary / speed controls | `height: 40`, `height: 44` | **-4 to -8dp** |
| `MemorizeModals.tsx:633,641` | Modal icon/close button | `minWidth: 40`, `minHeight: 40` | **-8dp** |
| `FloatingBottomNav.tsx:274` | `navItem` | `minHeight: 46` | **-2dp** |

### Thumb-Friendly Layout & Navigation
- **Strengths:** Primary navigation (`FloatingBottomNav`) is anchored at the bottom thumb zone with safe-area padding (`Math.max(insets.bottom, 10) + 2`) and uses `router.replace` so tabs don't pile up on the back stack. Primary Hero CTAs (`heroCta`, `minHeight: 50`) are large and easy to reach.
- **Weaknesses:** Session back buttons (`backPill`) and info buttons (`infoIconBtn`) sit at the top edge (harder for one-handed reach), and `FloatingBottomNav` (`minHeight: 46`) is 2dp under 48dp.

### Predictable Back Behavior
- **Gap:** Zero `BackHandler`, `usePreventRemove`, or `beforeRemove` listeners exist across `apps/mobile`.
  - Pressing hardware Back on Android during `memorize-session` or `revision-session` immediately pops the screen without warning or explicit save-draft confirmation.
  - Note: Modal components (`Modal`) handle hardware back via `onRequestClose` (good, though worth verifying each modal sets `onRequestClose`).

---

## 5. Flow Review (Tap Counts & Dead Ends)

| Key Task | Path | Tap Count | Friction / Dead-End Check |
|----------|------|-----------|---------------------------|
| **First-run Onboarding (Full)** | Language -> Reciter -> Surah -> Daily Goal -> Home | **8–10 taps** (or **1–2 taps** via Skip) | Clean, linear, no account wall. |
| **Start Today's Memorization** | Home -> `Start Memorizing` / `Continue` CTA | **1 tap** | Very fast. |
| **Complete 1 Memorize Session** | Step 1 (Revise + eval) -> Step 2 (Listen/Repeat x5 + Next per ayah) -> Step 3 (Hide/Reveal + Eval) -> Step 4 (Link + Finish) | **~12–20+ taps** (depending on `dailyTarget` and `mandatoryRepeats`) | **Friction:** In Step 2, users must tap through each ayah individually; if audio is unavailable offline, they still have to manually tap through repeats. |
| **Start Smart Revision** | Home -> `Quick Review` **OR** Bottom Nav `Revision` -> `Start Revision` | **1 tap** (from Home) / **2 taps** (from Revision tab) | If `smartQueue` is empty, `handleLaunchSmart` (`revision.tsx:113`) either opens a surah modal or pushes `/memorize` — helpful recovery, no dead end! |
| **Change Reciter / Daily Target** | Bottom Nav `My Space` -> `Memorization` sheet -> Select -> `Save` (or Home -> `Portion & Voice`) | **3–4 taps** | **Minor confusion:** Two separate entry points (`Home` -> `Portion & Voice` modal vs `My Space` -> `Memorize` sheet) edit the same settings. |

---

## 6. Visual Design (Contrast, Typography, Spacing)

### Color Contrast (WCAG 2.1 AA — 4.5:1 Normal Text, 3:1 Large Text)
Computed directly from `apps/mobile/src/theme/tokens.ts`:

| Theme Pair | Hex Values | Contrast Ratio | WCAG AA (4.5:1) |
|------------|------------|----------------|-----------------|
| **Light `mutedForeground` on `muted`** | `#777b74` on `#eaf0e8` | **3.72 : 1** | **FAIL** |
| **Light `mutedForeground` on `background`** | `#777b74` on `#f7f5ed` | **3.95 : 1** | **FAIL** |
| **Light `mutedForeground` on `card`** | `#777b74` on `#ffffff` | **4.31 : 1** | **FAIL** |
| Light `foreground` on `background` | `#242a25` on `#f7f5ed` | 13.43 : 1 | PASS |
| Light `foreground` on `card` | `#242a25` on `#ffffff` | 14.66 : 1 | PASS |
| Light `primary` on `background` | `#073d35` on `#f7f5ed` | 11.13 : 1 | PASS |
| Light `accent` on `heroBg` | `#ff8e79` on `#073d35` | 5.44 : 1 | PASS |
| Light `destructive` on `card` | `#ba1a1a` on `#ffffff` | 6.46 : 1 | PASS |
| Dark `mutedForeground` on `secondary` | `#9E9D96` on `#1B1D1B` | 6.23 : 1 | PASS |
| Dark `mutedForeground` on `card` | `#9E9D96` on `#141413` | 6.77 : 1 | PASS |
| Dark `foreground` on `background` | `#F2EFE6` on `#0B0B0A` | 17.13 : 1 | PASS |

**Fix:** Darken `LIGHT_THEME.mutedForeground` from `#777b74` to **`#5B6059`** (gives ~**5.6:1** on `#f7f5ed`, ~**6.3:1** on `#ffffff`, and ~**5.3:1** on `#eaf0e8`).

### Typography & Spacing
- **Spacing:** Cleanly adheres to the `4, 8, 12, 16, 20, 24, 32` scale (`SPACING` in `tokens.ts`).
- **Small Text:** Multiple labels use `fontSize: 10` (`index.tsx:646`, `memorize.tsx:1383`, `memorize-session.tsx:1919, 2002`, `settings.tsx:1556`) and `fontSize: 11` (`FloatingBottomNav.tsx:286`, `QuietDhikrCard.tsx:225`, `MillaPicker.tsx:388`, `SplashOverlay.tsx:517`). On mobile screens, body/UI labels should be `>= 12px` (badges `>= 11px`).

---

## 7. Accessibility (Screen Readers & Dynamic Type)

1. **Missing Screen-Reader Labels & Roles:**
   - Across `apps/mobile/app` and `apps/mobile/src/components`, there are **140** pressables (`125 <Pressable>` + `15 <AnimatedPressable>`) and **7** `<TextInput>` fields, but only **157** total `accessibilityLabel` / `accessibilityRole` / `accessibilityHint` / `accessibilityState` attributes.
   - All **7 `<TextInput>`** elements (surah search inputs in `memorize.tsx`, `revision.tsx`, `MillaPicker.tsx`, and sync key / feedback inputs in `settings.tsx`) rely solely on `placeholder` without `accessibilityLabel`.
   - `FloatingBottomNav.tsx:202` uses `accessibilityRole="button"` instead of `accessibilityRole="tab"` (inside a container with `accessibilityRole="tablist"`).
   - Decorative hero/banner `<Image>` elements (`index.tsx:284`, `memorize.tsx:313`, `revision.tsx:301`, `settings.tsx:390`, `QuietDhikrCard.tsx:76`) lack `accessible={false}` / `importantForAccessibility="no"`.

2. **Larger Fonts / Dynamic Type Support:**
   - `QuranText.tsx` properly sets `allowFontScaling`, and a few components cap scaling with `maxFontSizeMultiplier` (`1.15–1.25` in `index.tsx`, `revision.tsx`, `AudioPlayerBar.tsx`).
   - However, `largeUiMode` (exposed prominently in Onboarding & Settings) **only scales text in `onboarding.tsx`** (`const fs = ...`). It has no effect on `Home`, `Memorize`, `Revision`, `My Space`, or session screens.

---

## 8. Prioritized Remediation Roadmap (To Reach 10/10)

1. **[P0 / Major] Fix Light-Mode Contrast (`tokens.ts`):** Update `LIGHT_THEME.mutedForeground` from `#777b74` to `#5B6059` (or darker) so all muted text passes `>= 4.5:1` on `#f7f5ed`, `#ffffff`, and `#eaf0e8`.
2. **[P0 / Major] Raise All Touch Targets to `>= 48dp`:** Update `MIN_TOUCH_TARGET` in `tokens.ts` from `44` to `48`, and audit/update `FloatingBottomNav` (`46 -> 48`), `QuietDhikrCard` (`28/36 -> 48`), `DailyQuoteCard` (`32 -> 48`), `onboarding.tsx` (`36 -> 48`), `memorize.tsx` (`34 -> 48`), `revision.tsx` (`34-38 -> 48`), `backPill` (`38 -> 48`), `AudioPlayerBar` (`40/44 -> 48`), and `MemorizeModals` (`40 -> 48`) using `minHeight: 48` or `hitSlop`.
3. **[P1 / Minor] Complete Screen-Reader Support:** Add `accessibilityLabel` to all 7 `<TextInput>`s and remaining unlabeled `<Pressable>`s; set `accessibilityRole="tablist"` / `"tab"` on `FloatingBottomNav`; mark decorative `<Image>`s `accessible={false}`.
4. **[P1 / Minor] Wire `largeUiMode` App-Wide & Bump `10px` Text:** Apply a shared font-scaling helper (or `useMilla()` `fs()` helper) across all screens and raise `10px` text to `>= 12px`.
5. **[P2 / Minor] Guard Session Back Navigation & Complete `en`/`fr` Localization:** Add `usePreventRemove` / `BackHandler` confirmation (or explicit draft-saved toast) on `memorize-session.tsx` and `revision-session.tsx`, and replace remaining hardcoded Arabic strings with `MILLA_COPY` keys.
