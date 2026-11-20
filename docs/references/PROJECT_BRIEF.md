# المِلّة (Al-Millah)

## Product Brief and Agent Implementation Reference

Document status: Working product specification\
Version: 1.0\
Last updated: 2026-11-20\
Product type: Free, individual Quran reading, memorization, and revision
application\
Primary inspiration: The traditional Tunisian ملّة memorization routine

------------------------------------------------------------------------

## 1. Executive summary

المِلّة is a completely free Quran learning companion inspired by the
traditional Tunisian ملّة practice. In this practice, learners gather
with an imam between Maghrib and Isha, memorize a small number of verses
each day, and revise material learned on previous days.

The application adapts the learning method for individual use. Each
learner follows a personal daily program without needing a group,
teacher account, group management, or physical gathering.

The product's central job is to help a person: 1. Read the Quran. 2.
Memorize a manageable amount of new material. 3. Revise material learned
yesterday. 4. Revisit older memorized material. 5. Identify weak verses
and strengthen retention. 6. Build a sustainable Quran learning habit.

The product should be useful to elderly people, beginners, non-native
Arabic speakers, and people who find memorization difficult.

### Product positioning

A personal Quran memorization companion based on the Tunisian ملّة
methodology.

Suggested Arabic tagline: رحلتك مع حفظ القرآن

### Product principles

-   Free access to the core product, with no subscriptions, paid tiers,
    or advertisements.
-   Individual learning only in the initial product. Do not build group
    circles, teacher dashboards, group invitations, or leaderboards.
-   The daily learning method takes priority over feature volume.
-   Accessibility is a core requirement.
-   Quran text and recitation accuracy take priority over visual
    novelty.
-   Encourage consistency without guilt, pressure, competition, or
    punitive streak mechanics.
-   Prefer local-first storage and offline support.
-   Do not require an account to begin learning.

------------------------------------------------------------------------

## 2. Background and learning inspiration

### Traditional Tunisian ملّة

The product takes its learning structure from a Tunisian practice where
a group gathers with an imam between Maghrib and Isha. The imam guides
the learners through a small daily portion, commonly around three to
four verses, and learners revise material from the previous day and
earlier lessons.

### Digital adaptation

The application preserves the daily learning rhythm but makes the
learner independent:

-   One user follows their own memorization plan.
-   The app proposes a manageable daily portion.
-   The learner revises yesterday's lesson.
-   The learner reviews older material.
-   The learner memorizes new verses.
-   The learner tests recall and records how well the session went.
-   The schedule adapts to the learner's pace and recall.

Do not represent the digital product as a replacement for qualified
Quran teachers, Tajweed teachers, or human correction of recitation.

------------------------------------------------------------------------

## 3. Audience and user needs

### Primary audience 1: Elderly people

Needs: - Large, comfortable Arabic text. - Simple navigation and clear
labels. - Large touch targets. - Few steps to start a session. - Audio
controls that are easy to understand. - Persistent reading and
memorization position. - High contrast and screen-reader compatibility.

Risks: - Dense dashboards. - Small icons without labels. - Hidden
gestures. - Complex onboarding. - Too many settings or choices at once.

### Primary audience 2: Non-native Arabic speakers

Needs: - Interface localization. - Translation support. - Optional
transliteration. - Word-by-word meaning. - Clear audio playback. - Slow
recitation playback. - Word-level highlighting where reliable
synchronized data exists.

Important distinction: Transliteration is a learning aid. It is not a
substitute for learning correct Arabic pronunciation or receiving
qualified Tajweed guidance.

### Primary audience 3: Beginners

Needs: - A clear starting point. - Guided learning steps. - A manageable
daily goal. - Simple explanations of the session stages. - Ability to
repeat a verse without pressure.

### Primary audience 4: People who struggle with memorization

Needs: - Small learning portions. - Repetition controls. - Gradual
hiding of words and verses. - Self-testing. - Revision scheduling. -
Identification of weak verses. - Ability to repeat a lesson or slow down
without losing progress.

------------------------------------------------------------------------

## 4. Product scope

### In scope

-   Quran reading.
-   Guided verse memorization.
-   Daily memorization plan.
-   Review of yesterday's lesson.
-   Long-term revision.
-   Weak-verse tracking.
-   Self-testing and reveal/hide interactions.
-   Audio playback and repetition.
-   Arabic, English, and French interface direction.
-   Qalun and Hafs narration support as a product requirement, subject
    to verified content availability and licensing.
-   Accessibility settings.
-   Personal progress.
-   Offline-first behavior where content licensing and storage
    constraints permit.
-   Local persistence without mandatory registration.

### Explicitly out of scope for the initial product

-   Group learning circles.
-   Teacher or imam accounts.
-   Group administration.
-   Group invitations or join codes.
-   Public profiles.
-   Leaderboards or competitive rankings.
-   Social feeds, comments, or messaging.
-   Paid subscriptions or premium feature tiers.
-   Advertisements.
-   Mandatory account creation.
-   Automated Tajweed certification.
-   AI-based recitation grading in the MVP.

### Later possibilities, not MVP commitments

-   Optional account and backup/synchronization.
-   Family-assisted setup for elderly users.
-   Speech recognition or recitation feedback, only after accuracy and
    reliability validation.
-   Additional interface languages.
-   More reciters and licensed audio collections.
-   Advanced learning analytics.

------------------------------------------------------------------------

## 5. Core learning methodology

The daily session follows five stages. The order is important.

### Stage 1: مراجعة الأمس (Review yesterday)

The learner revises the verses memorized during the previous session
before starting new material.

Requirements: - Show the previous lesson's surah and verse range. -
Offer audio playback. - Offer a hide-text self-test. - Allow the learner
to mark the result. - Do not mark verses as mastered solely because the
learner opened or listened to them.

### Stage 2: المراجعة السابقة (Review older material)

The learner reviews older memorized verses according to a revision
schedule.

Requirements: - Show due verses or verse ranges. - Prioritize weak
material. - Keep the queue manageable. - Allow the learner to complete,
defer, or repeat a review. - Preserve a record of review outcomes.

### Stage 3: الحفظ الجديد (New memorization)

Default starting goal: three to four verses per day.

Requirements: - The daily quantity is adjustable. - A learner who
struggles should repeat or reduce the portion. - The app must not force
progression after a fixed number of repetitions. - Show the exact surah
and verse range. - Support verse-by-verse learning.

### Stage 4: التسميع (Self-testing)

The learner attempts to recite without looking at the verse.

Requirements: - Hide the verse text. - Allow the learner to reveal it. -
Provide optional audio playback. - Ask the learner to self-evaluate:
Difficult, Good, or Easy. - Store the evaluation and use it to inform
future revision. - Make clear that self-evaluation is not an
authoritative Tajweed assessment.

### Stage 5: ربط الآيات (Connecting verses)

The learner practices connecting the new verses with the preceding
verses.

Requirements: - Offer a combined recitation range. - Allow playback from
the beginning of the combined range. - Allow the learner to test the
transition between verses. - Record completion separately from new
memorization.

### Session completion

At the end of a session: - Summarize completed stages. - Show today's
memorization range. - Save review outcomes. - Update the next revision
date. - Offer a clear next step. - Avoid guilt-based messaging when the
learner does not complete the session.

------------------------------------------------------------------------

## 6. Functional requirements

### 6.1 Onboarding

Goals: - Let the user start quickly. - Set only essential preferences. -
Avoid requiring registration.

Potential onboarding settings: - Interface language: Arabic, English,
French. - Quran narration: Qalun or Hafs, subject to available verified
datasets. - Daily memorization quantity, default three to four verses. -
Text size preference. - Optional translation and transliteration
preferences. - Optional daily reminder.

Requirements: - Provide a skip path for nonessential choices. - Provide
a start-without-account path. - Explain that settings are editable
later. - Do not ask for personal data without a clear product need.

### 6.2 Home screen

The home screen answers: 1. Where did I stop? 2. What is due today? 3.
How do I continue?

Recommended content order: 1. Greeting and concise encouragement. 2.
Continue today's session. 3. Yesterday's revision task. 4. Older
revision task. 5. New memorization assignment. 6. Small personal
progress summary.

Avoid a dense analytics dashboard. Keep the primary action visually
dominant.

### 6.3 Guided memorization

Requirements: - Display one verse or a small connected range. - Display
accurate Arabic text and verse reference. - Provide audio playback. -
Repeat a verse configurable times: suggested presets 3, 5, 7, 10, and
custom. - Provide playback speed options when supported by the audio
implementation. - Provide previous/next controls. - Hide and reveal
words or the complete verse. - Optional transliteration and
translation. - Provide a manual memorization status. - Support replay
without losing session state.

### 6.4 Revision

Keep three conceptual queues separate: - Recent revision: yesterday's
and recently learned material. - Long-term revision: older memorized
material. - Weak verses: material repeatedly marked Difficult or failed
during self-testing.

Initial interval proposal: - 1 day - 3 days - 7 days - 14 days - 30 days

These are starting defaults, not scientifically universal intervals.
Treat the schedule as configurable product logic. Store review history
so the schedule can be refined later.

Suggested evaluation mapping: - Difficult: schedule sooner and increase
priority. - Good: keep or modestly extend the interval. - Easy: extend
the interval more than Good.

Do not silently classify a verse as mastered based only on elapsed time
or audio playback.

### 6.5 Self-testing

Requirements: - Hide the full verse or selected words. - Reveal the
verse on request. - Allow optional audio reference. - Record user
self-evaluation. - Provide a way to repeat the exercise. - Clearly
distinguish self-evaluation from expert recitation evaluation.

### 6.6 Quran reader

Requirements: - Complete Quran navigation. - Surah and verse
navigation. - Accurate Arabic text with diacritics. - Verse
references. - Adjustable font size. - Optional translation. - Optional
transliteration. - Audio playback. - Bookmarking. - Remember last
reading position. - Narration selection where verified content supports
it.

### 6.7 Audio

Requirements: - Play a verse. - Play a selected range. - Play a complete
surah. - Repeat current verse. - Repeat a selected range. - Pause and
resume. - Provide playback speed control when technically supported. -
Keep playback controls clear and accessible. - Show loading,
unavailable, and offline states.

Audio must come from sources with appropriate redistribution and
offline-storage permissions. Do not assume that publicly accessible
audio is free to redistribute.

### 6.8 Progress

Show useful personal information: - Total verses marked memorized. -
Surahs with memorized material. - Recent session history. - Revision
completion history. - Weak verses. - Personal milestones.

Do not present progress as a religious score or a measure of a person's
faith.

### 6.9 Accessibility

Accessibility requirements: - Large text mode. - Adjustable Quran text
size. - High-contrast controls. - Large touch targets. - Clear text
labels for controls. - Screen-reader labels and semantic structure. -
Keyboard navigation where applicable. - No essential hidden gestures. -
Avoid relying on color alone to communicate status. - Respect
reduced-motion preferences. - Clear focus states. - Comfortable line
height and Arabic verse spacing.

### 6.10 Offline and persistence

Preferred approach: - Local-first data storage. - No account required
for local use. - Save reading position, settings, memorization state,
and revision history locally. - Cache application shell and selected
content where feasible. - Allow users to choose audio downloads if
licensing permits. - Show which content is available offline. - Do not
imply that all audio is offline if only selected files are cached.

------------------------------------------------------------------------

## 7. Information architecture

Primary navigation has four destinations:

1.  الرئيسية: home and daily overview.
2.  الحفظ: guided memorization.
3.  المراجعة: revision queues.
4.  حسابي: preferences and personal progress.

The Quran reader should be accessible from relevant learning flows and
through a clear entry point. Avoid adding a fifth bottom-navigation
destination unless user testing proves a strong need.

Suggested screen inventory: - Onboarding and preferences. - Home. -
Daily session overview. - Review yesterday. - Review older material. -
New memorization. - Verse practice. - Hide/reveal self-test. - Session
completion. - Revision queue. - Quran reader. - Surah selection. -
Progress. - Settings. - Accessibility settings. - Audio settings.

------------------------------------------------------------------------

## 8. Design direction

The design direction is named "Quiet devotion".

The interface should combine: - Modern editorial design. - Minimal
Islamic visual language. - Warm, paper-like reading surfaces. - Calm and
restrained color usage. - Strong Arabic typography. - Generous
whitespace. - Clear hierarchy. - Simple, predictable interactions.

Avoid: - Generic Islamic app templates. - Excessive gold decoration. -
Mosque silhouettes and decorative crescents used as filler. - Heavy
gradients. - Excessive shadows. - Cluttered dashboards. - Tiny icon-only
controls. - Childish gamification. - Aggressive streaks or competitive
elements.

### Official starting palette

-   Forest Green: #073D35
-   Warm Ivory: #F7F5ED
-   Coral: #FF8E79

Supporting colors: - Dark charcoal: #242A25 - Secondary text: #777B74 -
Light green surface: #E7EDE5 - White: #FFFFFF - Border: #E8E7DF

Suggested visual distribution: - 75% ivory and neutral surfaces. - 20%
forest green. - 5% coral.

Usage: - Ivory: primary background and reading surfaces. - Forest green:
primary actions, active navigation, key controls. - Coral: restrained
emphasis, selected highlights, small progress accents. - Charcoal:
primary text. - Secondary gray: supporting text and metadata.

Check contrast for every text/background combination. Coral is an
accent, not a default text color on light backgrounds.

### Typography

-   Quran Arabic: Noto Naskh Arabic or Amiri.
-   Arabic UI: IBM Plex Sans Arabic.
-   Latin UI: Inter.

Quran text and interface text must have distinct typographic roles. Do
not use a decorative display font for long Quran passages.

### Component style

-   Moderate corner radii, generally 12--18px.
-   Subtle borders.
-   Minimal shadows.
-   Large readable buttons.
-   Consistent spacing scale.
-   Clear selected, disabled, loading, success, and error states.
-   Motion should be subtle and respect reduced-motion preferences.

------------------------------------------------------------------------

## 9. Technical direction and constraints

The initial proposed stack is a recommendation, not a locked decision:

-   Frontend: Next.js and TypeScript.
-   Styling: Tailwind CSS.
-   UI: custom reusable component system.
-   Local persistence: IndexedDB.
-   Offline support: Service Worker and cached application assets.
-   Hosting: free static hosting where compatible with the final
    architecture.
-   Backend: none required for the first local-first release.

Important implementation note: A Next.js application is not
automatically a fully static application. Decide the deployment mode
based on the final routing, rendering, and offline requirements. Keep
the first release free of backend dependencies where possible.

### Data architecture concepts

Suggested entities: - UserPreferences - MemorizationPlan -
MemorizationSession - MemorizedVerse - RevisionItem - RevisionAttempt -
Bookmark - AudioAssetMetadata - ReadingPosition

Potential fields:

UserPreferences: - interfaceLanguage - narration - dailyVerseTarget -
arabicFontScale - translationLanguage - transliterationEnabled -
remindersEnabled - theme - accessibilitySettings

MemorizedVerse: - surahNumber - verseNumber - status -
firstMemorizedAt - lastReviewedAt - nextReviewAt - difficultyLevel -
reviewCount

RevisionAttempt: - surahNumber - verseNumber or verseRange -
attemptedAt - selfEvaluation: difficult \| good \| easy - source: recent
\| long_term \| weak - completed

MemorizationSession: - date - newVerseRange - completedStages -
repetitionCounts - sessionStatus - completedAt

These are conceptual models. Agents should validate the final schema
against the implementation and Quran content data source.

### Quran content integrity

This is a high-priority requirement: - Never generate Quran text using
an LLM. - Never paraphrase Quran text. - Never alter diacritics or verse
numbering. - Use a trusted, documented Quran text source. - Validate
surah and verse counts. - Validate Qalun and Hafs datasets separately. -
Keep source attribution and dataset version metadata. - Verify
audio-to-verse alignment. - Do not publish translations or audio without
distribution rights. - Treat translation as a translation, not as Quran
Arabic text.

------------------------------------------------------------------------

## 10. Non-functional requirements

-   Fast initial load.
-   Responsive mobile-first layout.
-   Reliable local persistence.
-   Graceful behavior when offline.
-   Accessible keyboard and screen-reader interaction.
-   No unnecessary collection of personal data.
-   No advertising or tracking SDKs by default.
-   No mandatory authentication.
-   Robust handling of interrupted audio and sessions.
-   Preserve progress after refresh or application restart.
-   Clear error states when content or audio is unavailable.

------------------------------------------------------------------------

## 11. MVP acceptance criteria

The MVP is not complete until:

1.  A user starts without creating an account.
2.  A user selects an interface language.
3.  A user opens a surah and verse range.
4.  Quran text displays accurately from a verified source.
5.  A user plays and repeats a verse.
6.  A user completes a daily memorization session.
7.  Yesterday's memorized material appears in the revision flow.
8.  Older material receives a revision date.
9.  A user hides and reveals a verse.
10. A user records Difficult, Good, or Easy.
11. Weak material receives higher revision priority.
12. Reading position and progress persist after restart.
13. Text size is adjustable.
14. Core navigation works on mobile.
15. The app provides useful offline behavior for content already cached.
16. The interface does not contain group, teacher, or competitive
    features.
17. No paid tier, subscription, or advertisement appears.

------------------------------------------------------------------------

## 12. Product risks and mitigations

### Quran text or narration errors

Mitigation: use trusted datasets, source metadata, automated validation,
and human review.

### Audio licensing

Mitigation: verify explicit redistribution and offline-storage
permissions before bundling or caching audio.

### Incorrect revision logic

Mitigation: start with transparent, simple intervals and store review
history. Do not claim the schedule is universally optimal.

### Inaccurate automated recitation feedback

Mitigation: exclude automated grading from MVP. Require rigorous
validation before introducing it.

### Elderly users struggle with navigation

Mitigation: usability testing with older participants, large controls,
clear labels, and minimal steps.

### Feature overload

Mitigation: keep the daily learning loop central. Defer advanced
functionality until the core flow works well.

### "Completely free" conflicts with operating costs

Mitigation: avoid server requirements in the first release, use
permitted free infrastructure, document ongoing costs, and consider
voluntary donations only if needed. Never add ads or paid features
without changing the product's stated principles.

------------------------------------------------------------------------

## 13. Open decisions requiring explicit confirmation

Agents must not silently decide these questions or present assumptions
as confirmed facts:

1.  Initial platform: responsive PWA first, Android first, or native iOS
    and Android.
2.  Whether Qalun and Hafs both launch in the first release or one
    launches first.
3.  Exact Quran text provider and data license.
4.  Exact audio provider, reciters, and redistribution permissions.
5.  Translation providers and supported languages.
6.  Whether offline Quran text ships with the app or is downloaded on
    demand.
7.  Whether optional backup/synchronization is included later.
8.  Final revision scheduling rules and whether users configure them.
9.  Whether daily reminders are included in the MVP.
10. Whether the product name uses Arabic only, Latin transliteration, or
    both in branding.

Current product direction: - Individual learning only. - Free product. -
Arabic, English, and French are the intended initial interface
languages. - Qalun and Hafs are desired narrations. - Three to four new
verses per day is the default starting target, adjustable by the
learner. - No registration is required to start.

------------------------------------------------------------------------

## 14. Instructions for AI implementation agents

Treat this document and `DESIGN.md` as the primary product references.

Before implementation: 1. Read both documents fully. 2. Identify open
decisions that block implementation. 3. Do not invent Quran content,
audio sources, licenses, or religious rulings. 4. Preserve the
individual-only product scope. 5. Preserve the five-stage daily learning
method. 6. Preserve the color palette and typography roles. 7. Build
reusable components and consistent design tokens. 8. Keep product logic
separate from presentation. 9. Persist user progress reliably. 10.
Document assumptions and unresolved issues.

Implementation priorities: 1. Quran data integrity. 2. Daily learning
and revision logic. 3. Accessibility. 4. Reliable local persistence. 5.
Audio experience. 6. Visual polish.

Do not add features simply because they are common in other Quran
applications. Every feature must support reading, memorization,
revision, retention, or accessibility.
