# المِلّة (Al-Millah)

## Design System and UI/UX Reference

Document status: Design reference\
Version: 1.0\
Last updated: 2026-11-20

This document defines the visual and interaction direction for المِلّة.
Read it together with `PROJECT_BRIEF.md`.

------------------------------------------------------------------------

## 1. Design objective

Design a modern, calm, accessible Quran memorization application
inspired by the traditional Tunisian ملّة learning method.

The interface should feel: - Peaceful. - Clear. - Respectful. - Warm. -
Modern. - Trustworthy. - Easy for elderly users. - Comfortable for long
Quran reading sessions.

The design must support the product's central loop: review yesterday,
review older material, memorize new verses, self-test, and connect
verses.

Do not design a generic Quran reader with unrelated dashboard features.

------------------------------------------------------------------------

## 2. Brand direction

### Brand name

Arabic: المِلّة\
Latin: Al-Millah

Suggested tagline: رحلتك مع حفظ القرآن

The product name should be rendered correctly in Arabic, with proper
shaping and RTL behavior.

### Visual concept: Quiet devotion

Combine: - Modern editorial layouts. - Minimal Islamic visual
language. - Warm paper-like reading surfaces. - Strong Arabic
typography. - Restrained color accents. - Generous whitespace.

Avoid: - Excessive gold. - Decorative mosque silhouettes. - Crescent
icons as generic decoration. - Heavy ornamental borders. - Strong
gradients. - Excessive shadows. - Dense dashboards. - Overly playful
gamification. - Generic template-like Islamic visuals.

The product should feel contemporary without losing the calm and respect
appropriate to Quran reading.

------------------------------------------------------------------------

## 3. Color tokens

### Core palette

  -----------------------------------------------------------------------
  Token                   Hex                     Role
  ----------------------- ----------------------- -----------------------
  Forest Green            #073D35                 Primary actions, active
                                                  states, key navigation

  Warm Ivory              #F7F5ED                 Main background and
                                                  reading surfaces

  Coral                   #FF8E79                 Restrained accent and
                                                  highlights

  Charcoal                #242A25                 Main text

  Secondary Text          #777B74                 Supporting text and
                                                  metadata

  Light Green Surface     #E7EDE5                 Secondary surfaces

  White                   #FFFFFF                 Cards and contrast
                                                  surfaces

  Border                  #E8E7DF                 Dividers and subtle
                                                  outlines
  -----------------------------------------------------------------------

### Color balance

Use approximately: - 75% ivory and neutral surfaces. - 20% forest
green. - 5% coral.

These percentages are a visual guideline, not a hard layout rule.

### Usage rules

Forest Green: - Primary buttons. - Active navigation. - Selected
controls. - Key progress indicators. - Important interface states.

Warm Ivory: - Main app background. - Reading background. - Large calm
surfaces.

Coral: - Small highlights. - Selected emphasis. - Small progress
accents. - Important but non-destructive attention cues.

Charcoal: - Primary text on light surfaces.

Secondary Text: - Supporting information. - Dates. - Hints. - Secondary
labels.

### Contrast rules

-   Check all text/background combinations for WCAG contrast.
-   Do not use coral as small text on ivory or white without verifying
    contrast.
-   Never communicate status by color alone.
-   Pair colors with text, icons, or shapes.
-   Define dark-theme equivalents intentionally. Do not mechanically
    invert the palette.

------------------------------------------------------------------------

## 4. Typography

### Quran text

Preferred: - Noto Naskh Arabic. - Amiri.

Requirements: - Correct Arabic shaping. - Correct diacritics. - Clear
verse spacing. - Comfortable line height. - Adjustable size. - Distinct
visual treatment from UI text.

Quran text must never be generated, rewritten, or normalized by an AI
design or implementation agent. Use verified source data.

### Arabic interface

Preferred: IBM Plex Sans Arabic.

Use for: - Navigation. - Buttons. - Headings. - Settings. - Supporting
labels. - Progress information.

### Latin interface

Preferred: Inter.

Use for: - English. - French. - Latin transliteration. - Numeric
metadata where appropriate.

### Type hierarchy

Define reusable tokens for: - Display heading. - Page title. - Section
title. - Card title. - Body. - Supporting body. - Metadata. - Button
label. - Quran verse text.

The Quran text scale must be independent of the general UI text scale.

### Readability

-   Avoid long lines of Arabic UI text.
-   Use comfortable line height.
-   Avoid overly thin font weights.
-   Keep labels concise.
-   Ensure verse numbers are distinguishable from the verse text.
-   Test Arabic, French, and English layouts separately.

------------------------------------------------------------------------

## 5. Layout and spacing

### General principles

-   Mobile-first.
-   Generous whitespace.
-   Clear hierarchy.
-   One dominant action per screen where possible.
-   Avoid unnecessary cards.
-   Avoid dense information.
-   Keep important controls in predictable locations.

Use a consistent spacing scale. Suggested base scale: - 4px - 8px -
12px - 16px - 20px - 24px - 32px - 40px - 48px

Use a consistent content gutter across screens.

### Corners and surfaces

-   Typical corner radius: 12--18px.
-   Use larger radii sparingly for prominent containers.
-   Prefer subtle borders over heavy shadows.
-   Use shadows only when they clarify layering.
-   Avoid nesting multiple cards inside cards.

### Touch targets

Target at least 44 by 44 CSS pixels for interactive controls, with
larger controls where elderly users benefit.

Do not rely on small icon-only buttons. Add labels or accessible names.

------------------------------------------------------------------------

## 6. Navigation

Use four primary destinations:

1.  الرئيسية
2.  الحفظ
3.  المراجعة
4.  حسابي

Navigation requirements: - Persistent and consistent. - Icon plus text
label. - Clear active state. - Large touch areas. - RTL-aware
ordering. - No hidden gesture as the only route to a destination.

The Quran reader should be reachable from memorization and revision
flows. Avoid adding a fifth navigation item without evidence from
usability testing.

------------------------------------------------------------------------

## 7. Screen specifications

### 7.1 Onboarding

Purpose: get the learner started with minimal friction.

Content: - App name and tagline. - Interface language. - Narration
preference. - Daily verse goal. - Text-size preference. - Optional
translation/transliteration preferences. - Optional reminder. - Start
without registration.

Design: - Short, calm sequence. - Clear progress indicator if multiple
steps are used. - Skip nonessential preferences. - Large options. -
Explain settings can be changed later. - No account wall.

### 7.2 Home: الرئيسية

Purpose: answer immediately: 1. Where did I stop? 2. What is due today?
3. How do I continue?

Recommended hierarchy: 1. Greeting. 2. Main Continue Learning action. 3.
Today's revision. 4. Older revision. 5. New memorization. 6. Small
progress summary.

Design rules: - Keep the primary action prominent. - Use concise Arabic
labels. - Avoid a crowded statistics dashboard. - Use coral sparingly. -
Do not add streak pressure. - Make unfinished tasks clear without guilt.

### 7.3 Guided memorization: الحفظ

Purpose: support one verse or a small range at a time.

Content: - Surah name. - Verse reference. - Large Quran text. - Audio
playback. - Repeat control and count. - Playback speed where
supported. - Previous and next. - Hide/reveal word or verse. - Optional
translation. - Optional transliteration. - Memorization status.

Design rules: - Quran text is the main visual focus. - Controls should
not compete with the verse. - Audio state must be obvious. - Repeat
count must be readable. - Provide a clear way to pause and resume. -
Avoid decorative elements around Quran text. - Preserve the learner's
place after interruption.

### 7.4 Revision: المراجعة

Separate three categories: - مراجعة الأمس - المراجعة السابقة - الآيات
الضعيفة

Each item should show: - Surah. - Verse or range. - Due status. -
Previous evaluation where useful. - Start review action.

Design rules: - Prioritize weak and due content. - Avoid overwhelming
lists. - Show progress through the queue. - Distinguish overdue, due,
and upcoming without relying on color alone.

### 7.5 Self-test: التسميع

Purpose: let the learner attempt recall without reading the verse.

Content: - Surah and verse reference. - Hidden verse state. - Reveal
control. - Optional audio reference. - Evaluation: Difficult, Good,
Easy.

Design rules: - Distraction-free. - Large controls. - Clear
hidden/revealed state. - Avoid claiming that self-evaluation verifies
Tajweed. - Allow repeat and retry without penalty.

### 7.6 Quran reader: المصحف

Purpose: comfortable, accurate Quran reading.

Content: - Surah and verse navigation. - Accurate Arabic text. - Verse
numbers. - Adjustable Quran font size. - Translation toggle. -
Transliteration toggle. - Audio playback. - Bookmark. - Narration
selection where supported.

Design rules: - Warm ivory reading surface is the default direction. -
Quran typography should be generous and legible. - Keep controls
secondary to the text. - Avoid placing distracting cards between
verses. - Preserve reading position. - Ensure Arabic diacritics render
correctly.

### 7.7 Progress: تقدمي

Show: - Memorized verses. - Surahs with memorized material. - Session
history. - Revision history. - Weak verses. - Personal milestones.

Design rules: - Calm, informative visualizations. - No leaderboards. -
No comparison with other users. - No religious score. - No guilt-based
messaging.

### 7.8 Settings: الإعدادات

Include: - Interface language. - Narration. - Quran text size. - UI text
size where appropriate. - Theme. - Translation language. -
Transliteration. - Audio preferences. - Reminders. - Offline
downloads. - Accessibility.

Group settings by understandable categories. Avoid a long, unstructured
list.

------------------------------------------------------------------------

## 8. Interaction patterns

### Primary buttons

-   Forest green background.
-   Clear text label.
-   High contrast.
-   Large touch target.
-   Visible pressed, disabled, and loading states.

### Secondary buttons

-   Neutral or light surface.
-   Clear border or text treatment.
-   Must remain visually distinct from primary actions.

### Audio controls

-   Play/pause must be unmistakable.
-   Repeat current verse must be distinct from repeat range.
-   Show current playback state.
-   Avoid tiny controls.
-   Provide accessible labels.

### Hide/reveal

-   Use an explicit control.
-   Make hidden and visible states obvious.
-   Avoid accidental reveal.
-   Preserve the selected hiding mode when appropriate.

### Evaluation

Use three clear options: - صعب / Difficult - جيد / Good - سهل / Easy

Do not rely on color alone. Pair each state with a label and, where
useful, an icon.

### Feedback

Use calm, concise feedback: - أحسنت، واصل. - خطوة صغيرة كل يوم. - لا
بأس، أعد المحاولة. - مراجعتك اليوم تثبّت حفظك.

Do not shame users for missing sessions.

------------------------------------------------------------------------

## 9. Accessibility specification

Accessibility is mandatory.

-   Large reading mode.
-   Adjustable Quran font size.
-   Large touch targets.
-   Strong contrast.
-   Screen-reader labels.
-   Semantic headings and controls.
-   Keyboard access where relevant.
-   Visible focus states.
-   Reduced-motion support.
-   No color-only status indicators.
-   No essential gesture-only actions.
-   Clear and consistent button labels.
-   RTL and LTR tested independently.
-   Long Arabic text tested on small screens.
-   Audio controls usable without precision tapping.

Test with elderly users and people who are not fluent Arabic readers. Do
not assume that a visually simple interface is automatically easy to
use.

------------------------------------------------------------------------

## 10. Responsive behavior

Primary target: mobile phone.

Also support: - Tablet. - Desktop browser.

Mobile: - Single-column layouts. - Persistent bottom navigation. - Large
controls. - Comfortable reading width. - Avoid horizontal scrolling.

Tablet: - Use additional width carefully. - Keep Quran reading
focused. - Do not stretch Arabic lines excessively.

Desktop: - Center the main content. - Use a sensible maximum reading
width. - Keep navigation clear. - Preserve the mobile interaction model
where appropriate.

------------------------------------------------------------------------

## 11. UI states agents must design

Every interactive component should include relevant states.

Required states: - Default. - Active/selected. - Pressed. - Disabled. -
Loading. - Empty. - Error. - Success/completed. - Offline. - Audio
unavailable. - Downloading. - Download complete.

Important examples: - No revision due today. - No memorized verses
yet. - Audio file unavailable. - Network unavailable. - Quran content
available offline. - Quran content not downloaded. - Session interrupted
and resumed. - User has selected extra-large text.

------------------------------------------------------------------------

## 12. Design tokens and implementation guidance

Create shared tokens for: - Colors. - Typography. - Spacing. - Radii. -
Borders. - Shadows. - Content widths. - Touch target sizes. - Motion
duration. - Z-index/layering where needed.

Create reusable components for: - Primary button. - Secondary button. -
Bottom navigation item. - Verse display. - Verse number. - Audio
player. - Repeat control. - Hide/reveal control. - Evaluation
selector. - Revision item. - Progress indicator. - Section heading. -
Language selector. - Font-size control. - Empty state. - Offline state.

Avoid one-off styling when a shared component is appropriate.

------------------------------------------------------------------------

## 13. Design quality checklist

Before approving a screen, check:

-   Does the screen have one clear primary purpose?
-   Is the next action obvious?
-   Is Quran text accurate and visually dominant where relevant?
-   Is the text comfortable to read?
-   Are controls large enough?
-   Are icons labeled?
-   Does the layout work in RTL?
-   Does the layout work in LTR?
-   Is coral used sparingly?
-   Is contrast sufficient?
-   Are loading, empty, error, and offline states considered?
-   Does the screen avoid unnecessary decoration?
-   Does the screen support elderly users?
-   Does the screen preserve the calm product personality?
-   Does the screen support the five-stage daily learning method?

------------------------------------------------------------------------

## 14. Instructions for design and implementation agents

Read `PROJECT_BRIEF.md` before implementing screens.

Treat this document as the design source of truth.

Do: - Preserve the exact core palette. - Preserve typography roles. -
Build reusable components. - Design for RTL and LTR. - Prioritize
mobile. - Make accessibility visible in component decisions. - Keep
Quran text central. - Keep the interface calm and uncluttered. - Design
all meaningful UI states.

Do not: - Add group features. - Add leaderboards or social features. -
Add advertisements or premium upsells. - Add decorative Islamic motifs
as filler. - Invent Quran text. - use unverified Arabic text in final
product screens. - Make color the only status indicator. - Use tiny
icon-only controls. - Add features outside the product scope without
documenting the reason.

When product behavior is unclear, consult `PROJECT_BRIEF.md` and record
the unresolved question rather than inventing a rule.
