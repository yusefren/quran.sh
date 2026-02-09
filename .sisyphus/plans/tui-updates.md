# TUI Bug Fixes & New Features

## TL;DR

> **Quick Summary**: Fix 4 rendering/usability bugs (broken RTL Arabic, scroll desync, full-width Arabic, light-mode unusable) and add 4 new features (light/dark mode system, quick-navigation cues, bookmarks/cues/reflections right-side panel, reflections with user notes). Includes setting up TDD infrastructure.
>
> **Deliverables**:
> - Fixed RTL Arabic rendering via `bidi-js` pre-processing
> - Synchronized scroll across Arabic/Translation/Transliteration panes
> - Light/dark mode with auto-detection and 11 dual-palette themes
> - Cue system (1–9) with persistent cross-surah navigation
> - Toggleable right-side panel with Bookmarks/Cues/Reflections tabs
> - Reflections system with note input dialog
> - `bun test` infrastructure with TDD for data layer
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 5 waves
> **Critical Path**: Task 0 → Task 1 → Task 2 → Task 5 → Task 10

---

## Context

### Original Request
Fix broken RTL Arabic rendering, scroll sync between panes, light-mode terminal usability, and Arabic pane width. Add light/dark mode system, quick-navigation cues (1–9 keys), a dedicated Bookmarks/Cues/Reflections viewer panel, and reflections (bookmarks with user notes).

### Interview Summary
**Key Discussions**:
- Light/dark mode: Auto-detect terminal background on startup + manual toggle via `Shift+D`. Each of the 11 dynasty themes gets both a dark and light color palette. Persisted in `user_preferences`.
- Cues: Persist in DB (survive restart). Cross-surah: store full `surah:verse`. Shift+N sets, N jumps. Overridable. Max 9.
- Bookmarks/Cues/Reflections UI: Dedicated right-side panel (NOT modal). Three tabs, left/right to switch, up/down to traverse, Enter to jump or open. Toggle keybinding.
- Reflections: Bookmarks + user text notes. Text input dialog for adding notes. New DB table.
- Test strategy: Setup bun test + TDD for data layer.

### Research Findings
- **RTL**: `bidi-js` (pure JS, UAX #9 v13.0.0, zero deps) is the standard library for BiDi text processing. Pre-processing before rendering is the universal terminal approach since most terminals lack native BiDi.
- **OpenTUI**: Uses Zig-based terminal renderer. Arabic character widths after BiDi reordering need spike validation.
- **Scroll sync**: `currentVerseId` signal already exists in `app.tsx`. All three panes render from same verse array. Sync = ensure all scrollboxes scroll to keep `currentVerseId` visible.
- **Themes**: 11 themes × 15 color properties = 165 colors currently (all dark palette). Light variants can be algorithmically derived with hand-tuned adjustments.
- **Digit keys**: Terminal sends `!@#$%^&*(` for Shift+1-9. Implementation must map these symbols to set cue operations.

### Metis Review
**Identified Gaps** (addressed):
- **BiDi spike risk**: OpenTUI's Zig renderer may not handle Arabic character widths correctly after BiDi reordering. Added Task 1 as early validation spike.
- **Digit key safety**: Cue digit keys (1-9) must be gated against search mode, palette mode, and all text input modes to prevent regressions.
- **Scroll sync approach**: Chose verse-highlight-sync (cheapest, sufficient) — when `currentVerseId` changes, all panes auto-scroll to keep that verse visible.
- **Light mode color strategy**: Algorithmic derivation from dark palettes with hand-tuned adjustments for readability — avoids 308 hand-crafted color values.
- **viewportCulling**: Available on `<scrollbox>` but not enabled. Should enable for performance with long surahs (Al-Baqarah = 286 verses).

---

## Work Objectives

### Core Objective
Fix critical rendering and usability bugs in the Quran TUI, then add a light/dark mode system and a personal navigation/notes system (cues, bookmarks viewer, reflections).

### Concrete Deliverables
- `src/tui/utils/rtl.ts` — RTL processing module using `bidi-js`
- Updated `src/tui/components/reader.tsx` — RTL rendering, right-alignment, scroll sync
- `src/tui/mode.tsx` — Light/dark mode context provider with auto-detection
- Updated `src/tui/theme.tsx` — Dual dark/light palettes for all 11 themes
- `src/data/cues.ts` — Cues data layer (CRUD)
- `src/data/reflections.ts` — Reflections data layer (CRUD)
- `migrations/003_cues_reflections.sql` — DB schema for cues and reflections
- `src/tui/components/panel.tsx` — Right-side panel with Bookmarks/Cues/Reflections tabs
- `src/tui/components/reflection-dialog.tsx` — Text input dialog for reflections
- Updated `src/tui/app.tsx` — Cue keybindings, panel toggle, mode toggle, reflection input
- Updated `src/tui/components/layout.tsx` — Right-side panel integration
- Updated `src/tui/components/help-dialog.tsx` — New keybindings documented
- Test files for all new data layer modules

### Definition of Done
- [ ] `bun run src/index.ts` launches TUI with correct RTL Arabic (verified visually)
- [ ] Scrolling one pane keeps `currentVerseId` visible in all panes
- [ ] TUI is usable in both light and dark terminal backgrounds
- [ ] Cues 1–9 set/jump correctly across surahs
- [ ] Right-side panel toggles, shows all three tabs, navigates items
- [ ] Reflections can be added, viewed, and navigated to
- [ ] `bun test` passes with ≥80% data layer coverage
- [ ] All existing keybindings still work unchanged

### Must Have
- BiDi processing for Arabic text
- Right-to-left alignment for Arabic pane
- Scroll sync driven by `currentVerseId`
- Explicit background color on all theme-aware containers
- Light/dark mode auto-detection
- Manual mode toggle (`Shift+D`)
- Cue set/jump with DB persistence
- Right-side panel with 3 tabs
- Reflections with note text input
- bun test infrastructure

### Must NOT Have (Guardrails)
- **No font/glyph rendering changes**: We process text with BiDi algorithm, we do NOT ship custom fonts or harfbuzzjs
- **No OpenTUI source modifications**: Work within the OpenTUI API, don't patch the library
- **No digit key conflicts**: 1-9 cue jumps MUST be gated — disabled during search mode, command palette, help dialog, any text input mode
- **No theme proliferation**: Don't create separate theme objects for light mode. Use algorithmic derivation from existing dark palettes
- **No excessive error handling**: Wrap DB calls in try/catch (existing pattern), don't add multi-level error recovery
- **No bookmark label editing**: Existing bookmarks have a `label` field but editing it is out of scope
- **No audio/recitation**: Out of scope
- **No new dynasty themes**: Only add light variants of existing 11 themes

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: NO (will be set up in Task 0)
- **Automated tests**: YES (TDD for data layer)
- **Framework**: `bun test` (built-in)

### If TDD Enabled

Each data layer task follows RED-GREEN-REFACTOR:

**Task Structure:**
1. **RED**: Write failing test first
   - Test file: `src/data/__tests__/{module}.test.ts`
   - Test command: `bun test src/data/__tests__/{module}.test.ts`
   - Expected: FAIL (test exists, implementation doesn't)
2. **GREEN**: Implement minimum code to pass
   - Command: `bun test src/data/__tests__/{module}.test.ts`
   - Expected: PASS
3. **REFACTOR**: Clean up while keeping green
   - Command: `bun test`
   - Expected: PASS (all tests)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **TUI Rendering** | interactive_bash (tmux) | Launch app, screenshot with tmux capture-pane, validate output |
| **Data Layer** | Bash (bun test) | Run tests, assert pass count |
| **Keybindings** | interactive_bash (tmux) | Send keystrokes, verify state changes |
| **DB Schema** | Bash (bun) | Run migration, query sqlite3 to verify tables |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 (Foundation — Start Immediately):
├── Task 0: Setup bun test infrastructure
└── Task 1: BiDi spike — validate bidi-js + OpenTUI Arabic rendering

Wave 1 (Core Bug Fixes — After Wave 0):
├── Task 2: Fix RTL Arabic rendering + right-alignment
├── Task 3: Fix scroll sync across panes
└── Task 4: Add explicit background colors to all containers

Wave 2 (Mode + Data Layer — After Wave 1):
├── Task 5: Light/dark mode system (depends: Task 4)
├── Task 6: DB migration for cues + reflections tables
├── Task 7: Cues data layer (TDD) (depends: Task 6)
└── Task 8: Reflections data layer (TDD) (depends: Task 6)

Wave 3 (UI Features — After Wave 2):
├── Task 9: Cue keybindings (depends: Task 7)
├── Task 10: Right-side panel (Bookmarks/Cues/Reflections) (depends: Tasks 7, 8)
└── Task 11: Reflection text input dialog (depends: Task 8)

Wave 4 (Polish — After Wave 3):
├── Task 12: Update help dialog, command palette, README
└── Task 13: Final integration QA

Critical Path: Task 0 → Task 1 → Task 2 → Task 4 → Task 5 → Task 10
Parallel Speedup: ~35% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|-----------|--------|---------------------|
| 0 | None | 1, 7, 8 | 1 |
| 1 | None | 2 | 0 |
| 2 | 1 | 5 | 3, 4 |
| 3 | 0 | 10 | 2, 4 |
| 4 | 0 | 5 | 2, 3 |
| 5 | 2, 4 | 10, 11 | 6, 7, 8 |
| 6 | 0 | 7, 8 | 2, 3, 4, 5 |
| 7 | 6 | 9, 10 | 8 |
| 8 | 6 | 10, 11 | 7 |
| 9 | 7 | 12, 13 | 10, 11 |
| 10 | 7, 8 | 12, 13 | 9, 11 |
| 11 | 8, 10 | 12, 13 | 9 |
| 12 | 9, 10, 11 | 13 | None |
| 13 | 12 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 0 | 0, 1 | quick (test setup), deep (spike) |
| 1 | 2, 3, 4 | unspecified-high (RTL), unspecified-low (sync, bg) |
| 2 | 5, 6, 7, 8 | visual-engineering (mode), quick (migration), unspecified-low (data layer) |
| 3 | 9, 10, 11 | unspecified-high (keybindings), visual-engineering (panel), visual-engineering (dialog) |
| 4 | 12, 13 | quick (help update), deep (QA) |

---

## TODOs

- [ ] 0. Setup bun test infrastructure

  **What to do**:
  - Bun has a built-in test runner (`bun test`) that discovers `*.test.ts` files automatically — no config needed
  - However, package.json has no `"test"` script. Add `"scripts": { "test": "bun test" }` to package.json for consistency
  - Create test directory structure: `src/data/__tests__/`
  - Create a smoke test file `src/data/__tests__/quran.test.ts` that tests `getSurah(1)` returns Al-Fatihah
  - Create a smoke test for `calculateStreaks` (pure function in `streaks.ts`) — use the `today` parameter to avoid date-sensitive failures
  - Verify all tests pass with `bun test`

  **Must NOT do**:
  - Don't install jest, vitest, or any external test framework
  - Don't modify existing source files

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple test infrastructure setup with no architectural decisions
  - **Skills**: []
    - No special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Task 1)
  - **Blocks**: Tasks 7, 8 (TDD requires test infra)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/data/streaks.ts:16-75` — `calculateStreaks()` is a pure function, ideal smoke test target
  - `src/data/quran.ts:259-278` — `getSurah()` public API to verify data loading works

  **Test References**:
  - No existing tests — this creates the first ones

  **Documentation References**:
  - Bun test docs: https://bun.sh/docs/cli/test

  **Acceptance Criteria**:

  - [ ] Directory `src/data/__tests__/` exists
  - [ ] `src/data/__tests__/quran.test.ts` exists and tests `getSurah(1)` returns surah with `transliteration === "Al-Fatihah"`
  - [ ] `src/data/__tests__/streaks.test.ts` exists and tests `calculateStreaks(["2025-01-01", "2025-01-02"], "2025-01-02")` returns `{ currentStreak: 2, longestStreak: 2 }` (using the `today` param to pin the date)
  - [ ] `"scripts": { "test": "bun test" }` added to package.json
  - [ ] `bun test` → PASS (2+ tests, 0 failures)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: bun test runs and passes
    Tool: Bash
    Preconditions: Test files created
    Steps:
      1. Run: bun test
      2. Assert: exit code 0
      3. Assert: output contains "pass" and "0 fail"
    Expected Result: All smoke tests pass
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `test: setup bun test infrastructure with smoke tests`
  - Files: `src/data/__tests__/quran.test.ts`, `src/data/__tests__/streaks.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 1. BiDi spike — validate bidi-js + OpenTUI Arabic rendering

  **What to do**:
  - Install `bidi-js`: `bun add bidi-js`
  - Create `src/tui/spike-bidi.tsx` — a minimal OpenTUI app that:
    1. Loads Al-Fatihah verse 1 Arabic text (`بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ`)
    2. Processes it through `bidi-js` to get visual order
    3. Renders it in an OpenTUI `<text>` component
    4. Shows BOTH raw and processed text side by side for comparison
  - Run the spike with `bun run src/tui/spike-bidi.tsx`
  - Validate: processed text renders correctly in the terminal (right-to-left, proper character order)
  - Document findings in a comment at the top of the spike file
  - If bidi-js alone is insufficient, investigate `arabic-reshaper` as a supplement
  - The spike file can remain in the codebase as a reference

  **Must NOT do**:
  - Don't integrate into the main app yet
  - Don't install harfbuzzjs or any heavy WASM libraries
  - Don't modify any existing source files

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Investigative spike with unknown outcome — need deep analysis
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Task 0)
  - **Blocks**: Task 2 (RTL fix depends on spike findings)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/tui/spike.tsx` — Existing spike file shows the pattern for standalone OpenTUI test apps
  - `src/data/quran.ts:64-73` — `Verse` interface with `text` field (Arabic)

  **External References**:
  - bidi-js: https://www.npmjs.com/package/bidi-js — Pure JS UAX #9 implementation
  - arabic-reshaper: https://www.npmjs.com/package/arabic-reshaper — Arabic Presentation Forms conversion

  **Acceptance Criteria**:

  - [ ] `bidi-js` installed in package.json dependencies
  - [ ] `src/tui/spike-bidi.tsx` exists and runs with `bun run src/tui/spike-bidi.tsx`
  - [ ] Comment at top of spike file documents: does bidi-js produce correct visual order for Arabic Quran text?
  - [ ] If bidi-js works: note "VALIDATED — proceed with integration"
  - [ ] If bidi-js fails: note specific failure mode and recommended alternative

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: BiDi spike renders Arabic text
    Tool: interactive_bash (tmux)
    Preconditions: bidi-js installed, spike file created
    Steps:
      1. tmux new-session: bun run src/tui/spike-bidi.tsx
      2. Wait for: output visible (timeout: 5s)
      3. Capture pane with: tmux capture-pane -t <session> -p
      4. Assert: captured output contains Arabic characters (U+0600-U+06FF range)
      5. Assert: spike file has comment documenting result
      6. Send: q (to quit)
    Expected Result: Arabic text visible in terminal, findings documented
    Evidence: tmux capture-pane output saved to .sisyphus/evidence/task-1-bidi-spike.txt
  ```

  **Commit**: YES
  - Message: `spike: validate bidi-js Arabic rendering with OpenTUI`
  - Files: `src/tui/spike-bidi.tsx`, `package.json`
  - Pre-commit: `bun run src/tui/spike-bidi.tsx` (verify it launches)

---

- [ ] 2. Fix RTL Arabic rendering + right-alignment

  **What to do**:
  - Create `src/tui/utils/rtl.ts` — RTL processing module:
    - `processArabicText(text: string): string` — Apply bidi-js to convert logical order → visual order
    - `alignRTL(text: string, width: number): string` — Right-align text within given width
    - Export a single `renderArabicVerse(text: string): string` function that combines both
  - Update `src/tui/components/reader.tsx`:
    - Import the RTL module
    - In `renderVerseList()` when `mode === "arabic"`, pre-process `v.text` through `renderArabicVerse()` before rendering
    - Add right-alignment to Arabic text elements (use `textAlign` or manual padding)
    - The Arabic pane should NOT span full width — add horizontal padding or constrain text within the pane
  - Test with Al-Fatihah (7 short verses) and Al-Baqarah (286 long verses with mixed Arabic/numbers)

  **Must NOT do**:
  - Don't change the overall pane layout structure (Arabic top, Translation/Transliteration bottom)
  - Don't install harfbuzzjs or heavy libraries
  - Don't remove tashkeel/diacritics by default

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires careful BiDi integration and understanding of terminal text rendering
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 3, 4)
  - **Blocks**: Task 5 (light/dark mode builds on fixed rendering)
  - **Blocked By**: Task 1 (spike must validate approach first)

  **References**:

  **Pattern References**:
  - `src/tui/components/reader.tsx:67-121` — `renderVerseList()` function that renders verse text. Line 98: `textContent = v.text` is where Arabic is used raw — this is where BiDi processing goes
  - `src/tui/components/reader.tsx:108-117` — JSX for each verse's text rendering with `<text>` component
  - `src/tui/spike-bidi.tsx` — Spike findings (from Task 1) documenting how bidi-js works

  **API/Type References**:
  - `src/data/quran.ts:64-73` — `Verse` interface: `text` field contains Arabic, `translation` and `transliteration` are LTR

  **External References**:
  - bidi-js API: `import bidiFactory from 'bidi-js'; const bidi = bidiFactory();` — Creates a bidi instance with `getReorderSegments()`, `getEmbeddingLevels()` methods

  **Acceptance Criteria**:

  - [ ] `src/tui/utils/rtl.ts` exists with `processArabicText()` and `renderArabicVerse()` exports
  - [ ] Arabic text in TUI renders in correct right-to-left visual order
  - [ ] Arabic text is right-aligned within the pane (not spanning full width left-to-right)
  - [ ] Al-Fatihah 1:1 (`بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ`) displays correctly
  - [ ] Translation and Transliteration panes are NOT affected (still LTR)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Arabic text renders RTL in TUI
    Tool: interactive_bash (tmux)
    Preconditions: Dev environment ready, bidi-js installed
    Steps:
      1. tmux new-session -x 120 -y 35: bun run src/index.ts
      2. Wait for: TUI loads (timeout: 5s)
      3. Capture pane: tmux capture-pane -p
      4. Assert: Arabic section contains بِسْمِ (bismillah opening)
      5. Assert: Arabic text appears right-aligned (leading spaces on left)
      6. Assert: Translation pane shows English text left-aligned
      7. Send: q (quit)
    Expected Result: Arabic renders correctly, right-aligned; English unaffected
    Evidence: .sisyphus/evidence/task-2-rtl-fix.txt

  Scenario: Long surah Arabic rendering (Al-Baqarah)
    Tool: interactive_bash (tmux)
    Preconditions: TUI running
    Steps:
      1. Navigate sidebar to Al-Baqarah (surah 2)
      2. Press Enter to select
      3. Press Tab to focus Arabic pane
      4. Press j 5 times to scroll through verses
      5. Capture pane output
      6. Assert: Arabic text still renders correctly after scrolling
    Expected Result: Multi-verse Arabic rendering works
    Evidence: .sisyphus/evidence/task-2-long-surah.txt
  ```

  **Commit**: YES
  - Message: `fix: Arabic RTL rendering with bidi-js pre-processing and right-alignment`
  - Files: `src/tui/utils/rtl.ts`, `src/tui/components/reader.tsx`
  - Pre-commit: `bun test`

---

- [ ] 3. Fix scroll sync across panes

  **What to do**:
  - The `currentVerseId` signal already exists in `app.tsx` and is passed to `<Reader>` as a prop
  - Currently, each `<scrollbox>` in `reader.tsx` scrolls independently
  - Modify `renderVerseList()` in `reader.tsx`:
    - When the `currentVerseId` prop changes, ALL three panes should scroll to keep that verse visible
    - Use a Solid.js `createEffect()` to watch `props.currentVerseId` and programmatically scroll each scrollbox
    - OpenTUI's `<scrollbox>` may support ref-based scroll control or `scrollTo` — investigate and use
    - If programmatic scroll isn't available, use a workaround: make `currentVerseId` the anchor point and ensure all panes have the same verse at the same relative position
  - Enable `viewportCulling` on all `<scrollbox>` components for performance with long surahs
  - Test with Al-Baqarah (286 verses) — scroll to verse 255 and verify all panes show it

  **Must NOT do**:
  - Don't make panes scroll pixel-by-pixel in sync (verse-level sync is sufficient)
  - Don't modify OpenTUI source code
  - Don't add external scrolling libraries

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires understanding OpenTUI scrollbox API and Solid.js reactive effects
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 4)
  - **Blocks**: Task 10 (panel needs reliable scroll context)
  - **Blocked By**: Task 0 (test infrastructure)

  **References**:

  **Pattern References**:
  - `src/tui/app.tsx:29` — `const [currentVerseId, setCurrentVerseId] = createSignal(1)` — the shared verse state
  - `src/tui/app.tsx:258-269` — `j`/`k` keybindings that update `currentVerseId`
  - `src/tui/components/reader.tsx:74-121` — `renderVerseList()` creates individual `<scrollbox>` per pane
  - `src/tui/components/reader.tsx:75-84` — `<scrollbox>` props: `scrollable={true}`, `scrollbar={true}`, `focused={focused}`

  **External References**:
  - OpenTUI scrollbox API: Check `@opentui/core` types for `scrollTo()`, `scrollToIndex()` or ref-based scrolling
  - Solid.js effects: `createEffect(() => { /* runs when signals change */ })`

  **Acceptance Criteria**:

  - [ ] Pressing `j`/`k` in any reader pane scrolls ALL visible panes to the same verse
  - [ ] `viewportCulling` enabled on all `<scrollbox>` components
  - [ ] Al-Baqarah verse 255 visible in all panes when navigated to
  - [ ] No performance regression with long surahs

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Scroll sync across panes
    Tool: interactive_bash (tmux)
    Preconditions: TUI running with Al-Fatihah loaded, Translation and Arabic both visible
    Steps:
      1. Press Tab to focus Arabic pane
      2. Press j 3 times (move to verse 4)
      3. Capture pane output
      4. Assert: Arabic pane shows verse [1:4] with verse marker ►
      5. Assert: Translation pane also shows verse [1:4] visible
      6. Press k 2 times (move to verse 2)
      7. Capture pane output
      8. Assert: Both panes show verse [1:2]
    Expected Result: All panes stay synchronized
    Evidence: .sisyphus/evidence/task-3-scroll-sync.txt

  Scenario: Scroll sync with long surah
    Tool: interactive_bash (tmux)
    Preconditions: TUI running
    Steps:
      1. Navigate to Al-Baqarah (surah 2) via sidebar
      2. Press Tab to focus Arabic pane
      3. Hold j for ~20 presses (jump ahead)
      4. Capture pane
      5. Assert: verse marker ► visible in Arabic pane
      6. Assert: same verse number visible in Translation pane
    Expected Result: Sync holds for long surahs
    Evidence: .sisyphus/evidence/task-3-long-scroll.txt
  ```

  **Commit**: YES
  - Message: `fix: synchronize scroll across Arabic/Translation/Transliteration panes`
  - Files: `src/tui/components/reader.tsx`
  - Pre-commit: `bun test`

---

- [ ] 4. Add explicit background colors to all containers

  **What to do**:
  - Add `backgroundColor={theme().colors.background}` to the root `<box>` in `layout.tsx` (line 21)
  - Add `backgroundColor={theme().colors.background}` to the reader container in `reader.tsx` (line 156)
  - Add `backgroundColor={theme().colors.background}` to the sidebar container in `layout.tsx`
  - Add `backgroundColor={theme().colors.statusBar}` to the status bar in `layout.tsx` (line 47)
  - Add `backgroundColor` to help dialog and command palette overlays (they already have it — verify)
  - Add `backgroundColor` to `<scrollbox>` components in `reader.tsx`
  - Test: Launch TUI in a light-background terminal and verify all areas have dark backgrounds

  **Must NOT do**:
  - Don't change any color values — just apply existing `theme().colors.background` where missing
  - Don't add new color properties to themes yet (that's Task 5)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple prop additions to existing components
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 5 (light/dark mode needs background handling in place)
  - **Blocked By**: Task 0

  **References**:

  **Pattern References**:
  - `src/tui/components/layout.tsx:21` — Root `<box>` missing `backgroundColor`
  - `src/tui/components/layout.tsx:47` — Status bar `<box>` — should use `theme().colors.statusBar`
  - `src/tui/components/reader.tsx:156` — Reader container `<box>` missing `backgroundColor`
  - `src/tui/components/command-palette.tsx:33` — Already has `backgroundColor={theme().colors.background}` — good pattern to follow
  - `src/tui/components/help-dialog.tsx:43` — Already has `backgroundColor` — verify correct

  **Acceptance Criteria**:

  - [ ] Root layout `<box>` has `backgroundColor={theme().colors.background}`
  - [ ] Reader container has `backgroundColor`
  - [ ] Sidebar container has `backgroundColor`
  - [ ] Status bar has `backgroundColor={theme().colors.statusBar}`
  - [ ] All `<scrollbox>` components have `backgroundColor`
  - [ ] TUI renders with dark background even in a light terminal

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: TUI has explicit backgrounds in light terminal
    Tool: interactive_bash (tmux)
    Preconditions: None
    Steps:
      1. Set COLORFGBG=15;0 (simulate light terminal)
      2. tmux new-session: bun run src/index.ts
      3. Wait for TUI (timeout: 5s)
      4. Capture pane
      5. Assert: background is dark (theme colors visible, text readable)
      6. Press T (cycle theme)
      7. Capture pane
      8. Assert: new theme's background color applied
    Expected Result: Dark background visible regardless of terminal setting
    Evidence: .sisyphus/evidence/task-4-background.txt
  ```

  **Commit**: YES
  - Message: `fix: add explicit background colors to all containers for light terminal compatibility`
  - Files: `src/tui/components/layout.tsx`, `src/tui/components/reader.tsx`
  - Pre-commit: `bun test`

---

- [ ] 5. Light/dark mode system

  **What to do**:
  - Create `src/tui/mode.tsx` — Mode context provider:
    - `type ColorMode = "dark" | "light" | "auto"`
    - `ModeProvider` context with `mode()`, `resolvedMode()` (auto → dark/light), `toggleMode()`, `cycleMode()`
    - Auto-detection: check `COLORFGBG` env var (common terminal convention: `"fg;bg"` — bg > 6 = light), or default to dark
    - Persist preference: `setPreference("color_mode", mode)` / `getPreference("color_mode")`
  - Update `src/tui/theme.tsx`:
    - Add `lightColors` property to `Theme` interface alongside existing `colors`
    - For each of the 11 themes, derive light palette using this algorithm:
      - `background` → For cool themes (lapis/cobalt/indigo tint): `#F5F7FA`. For warm themes (gold/sand/parchment tint): `#FAF8F5`
      - `text` → `#1A1A2E` (dark navy for readability)
      - `border` → lighten by 40% (mix with white). `borderFocused` → darken accent by 10%
      - `muted` → `#9CA3AF` (medium gray for light backgrounds)
      - `statusBar` → lighten by 60% from dark statusBar value
      - `arabic`, `translation`, `transliteration`, `verseNum`, `bookmark`, `header`, `highlight` → darken each by 20-30% from dark palette value for WCAG AA contrast on light bg (minimum 4.5:1 ratio)
      - `primary`, `secondary` → keep as-is (already saturated accent colors)
    - The derivation function (`deriveLightPalette(darkColors: ThemeColors): ThemeColors`) should be a single utility function, NOT 11 hand-crafted objects
    - Add helper: `getEffectiveColors(theme: Theme, mode: "dark" | "light"): ThemeColors`
    - Update `useTheme()` to return `effectiveColors()` that auto-selects dark/light based on mode
  - Update `src/tui/app.tsx`:
    - Wrap in `<ModeProvider>`
    - Add `Shift+D` keybinding → `cycleMode()` (auto → dark → light → auto)
    - Replace all `theme().colors.*` with `effectiveColors().*` (or update `useTheme` to do this transparently)
  - Update all components that reference `theme().colors` to use the mode-aware colors

  **Must NOT do**:
  - Don't create 11 separate light theme objects — use algorithmic derivation
  - Don't change ornaments or border styles for light mode (only colors change)
  - Don't auto-switch mode based on time of day

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Color palette design requires aesthetic judgment for light variants
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Light/dark color palette design needs UI/UX sensibility

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8)
  - **Blocks**: Tasks 10, 11 (panel needs mode-aware colors)
  - **Blocked By**: Tasks 2, 4 (RTL fix + background colors must be in place)

  **References**:

  **Pattern References**:
  - `src/tui/theme.tsx:562-596` — `ThemeProvider` with context, cycling, and preference persistence — mode provider follows same pattern
  - `src/tui/theme.tsx:44-61` — `Theme.colors` interface — light variants must match same shape
  - `src/tui/theme.tsx:282-316` — `madinahTheme` — example theme with all color properties that need light variants
  - `src/data/preferences.ts:17-44` — `getPreference()`/`setPreference()` for persistence

  **External References**:
  - `COLORFGBG` convention: Many terminals set this env var. Format is `"foreground;background"`. Background index > 6 typically means light background.

  **Acceptance Criteria**:

  - [ ] `src/tui/mode.tsx` exists with `ModeProvider`, `useMode()`, `cycleMode()`
  - [ ] Auto-detection: if terminal has light background, defaults to light mode
  - [ ] `Shift+D` cycles through auto → dark → light → auto
  - [ ] Mode preference persisted in `user_preferences` table (key: `"color_mode"`)
  - [ ] Each theme has derived light colors (background, text, and accent adjustments)
  - [ ] Light mode: background is light (`#F5F7FA` for cool themes, `#FAF8F5` for warm themes), text is dark (`#1A1A2E`), accents darkened 20-30% for WCAG AA contrast (≥4.5:1)
  - [ ] `deriveLightPalette()` utility function exists (not 11 hand-crafted objects)
  - [ ] Dark mode: unchanged from current behavior
  - [ ] Cycling themes (`T`) works correctly in both light and dark mode
  - [ ] Status bar reflects current mode indicator

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Toggle light/dark mode
    Tool: interactive_bash (tmux)
    Preconditions: TUI running in dark mode (default)
    Steps:
      1. tmux new-session: bun run src/index.ts
      2. Capture pane (dark mode baseline)
      3. Press Shift+D (cycle to dark mode explicitly)
      4. Press Shift+D again (cycle to light mode)
      5. Capture pane
      6. Assert: background is light colored
      7. Assert: text is dark colored and readable
      8. Assert: Arabic text still has accent color (not invisible)
      9. Press T (cycle theme in light mode)
      10. Assert: theme changes but stays in light mode
      11. Press q
    Expected Result: Mode toggles independently of theme
    Evidence: .sisyphus/evidence/task-5-lightmode.txt

  Scenario: Mode persists across restarts
    Tool: interactive_bash (tmux)
    Preconditions: None
    Steps:
      1. Launch TUI, press Shift+D twice (to light mode)
      2. Press q (quit)
      3. Re-launch: bun run src/index.ts
      4. Capture pane
      5. Assert: TUI starts in light mode (persisted)
      6. Press q
    Expected Result: Mode preference survives restart
    Evidence: .sisyphus/evidence/task-5-persist.txt
  ```

  **Commit**: YES
  - Message: `feat: light/dark mode system with auto-detection and per-theme dual palettes`
  - Files: `src/tui/mode.tsx`, `src/tui/theme.tsx`, `src/tui/app.tsx`, `src/tui/components/layout.tsx`, `src/tui/components/reader.tsx`
  - Pre-commit: `bun test`

---

- [ ] 6. Database migration for cues + reflections tables

  **What to do**:
  - Create `migrations/003_cues_reflections.sql`:
    ```sql
    -- Cues: 1-9 quick navigation slots
    CREATE TABLE IF NOT EXISTS cues (
        slot     INTEGER PRIMARY KEY CHECK(slot BETWEEN 1 AND 9),
        surah    INTEGER NOT NULL,
        ayah     INTEGER NOT NULL,
        verse_ref TEXT NOT NULL,
        set_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    -- Reflections: bookmarks with user notes
    CREATE TABLE IF NOT EXISTS reflections (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        surah      INTEGER NOT NULL,
        ayah       INTEGER NOT NULL,
        verse_ref  TEXT NOT NULL,
        note       TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        UNIQUE(surah, ayah)
    );

    CREATE INDEX IF NOT EXISTS idx_reflections_verse ON reflections(surah, ayah);
    ```
  - Verify migration runs successfully by opening the database

  **Must NOT do**:
  - Don't modify existing tables (reading_log, bookmarks, user_preferences)
  - Don't add foreign key constraints to other tables

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single SQL migration file
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7, 8)
  - **Blocks**: Tasks 7, 8 (data layers need the tables)
  - **Blocked By**: Task 0

  **References**:

  **Pattern References**:
  - `migrations/001_init.sql` — Schema pattern: `CREATE TABLE IF NOT EXISTS`, timestamps with `strftime`, UNIQUE constraints, indices
  - `migrations/002_user_preferences.sql` — Simple migration pattern
  - `src/data/db.ts:38-49` — `runMigrations()` auto-runs all `.sql` files in `migrations/` sorted by name

  **Acceptance Criteria**:

  - [ ] `migrations/003_cues_reflections.sql` exists
  - [ ] `cues` table: columns `slot` (PK, 1-9), `surah`, `ayah`, `verse_ref`, `set_at`
  - [ ] `reflections` table: columns `id` (autoincrement), `surah`, `ayah`, `verse_ref`, `note`, `created_at`, `updated_at`, UNIQUE(surah, ayah)
  - [ ] Migration runs without errors when database is opened

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Migration creates tables
    Tool: Bash
    Preconditions: Database file exists or will be created
    Steps:
      1. Run: bun -e "import { openDatabase } from './src/data/db.ts'; const db = openDatabase('/tmp/test-quran.db'); console.log(JSON.stringify(db.query(\"SELECT name FROM sqlite_master WHERE type='table'\").all())); db.close();"
      2. Assert: output contains "cues"
      3. Assert: output contains "reflections"
      4. Cleanup: rm /tmp/test-quran.db
    Expected Result: Both tables created by migration
    Evidence: Command output captured
  ```

  **Commit**: YES (group with Task 7)
  - Message: `feat: add database schema for cues and reflections`
  - Files: `migrations/003_cues_reflections.sql`

---

- [ ] 7. Cues data layer (TDD)

  **What to do**:
  - **RED**: Create `src/data/__tests__/cues.test.ts` with tests:
    - `setCue(slot, surahId, ayahId, verseRef)` stores a cue
    - `getCue(slot)` retrieves it
    - `setCue` on same slot overwrites previous value
    - `getCue` returns null for empty slot
    - `getAllCues()` returns array of all set cues
    - `clearCue(slot)` removes a cue
    - Slot validation: only 1-9 allowed
  - **GREEN**: Create `src/data/cues.ts` following `bookmarks.ts` pattern:
    - Same open-close-per-call DB pattern
    - `setCue(slot: number, surahId: number, ayahId: number, verseRef: string): void`
    - `getCue(slot: number): Cue | null`
    - `getAllCues(): Cue[]`
    - `clearCue(slot: number): void`
    - Interface `Cue { slot: number; surah: number; ayah: number; verseRef: string; setAt: string }`
  - **REFACTOR**: Clean up, ensure consistent naming

  **Must NOT do**:
  - Don't add UI logic in this task
  - Don't allow slots outside 1-9

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Straightforward CRUD following existing patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 8)
  - **Blocks**: Tasks 9, 10 (cue keybindings and panel need data layer)
  - **Blocked By**: Tasks 0, 6 (test infra + migration)

  **References**:

  **Pattern References**:
  - `src/data/bookmarks.ts:31-110` — EXACT pattern to follow: `openDatabase()`, try/finally, query/run, map rows to typed objects
  - `src/data/bookmarks.ts:13-20` — `Bookmark` interface pattern for `Cue` interface
  - `src/data/bookmarks.ts:97-110` — `toggleBookmark()` pattern for `setCue()` (upsert behavior)

  **Acceptance Criteria**:

  - [ ] RED: `bun test src/data/__tests__/cues.test.ts` → FAIL (tests exist, implementation doesn't)
  - [ ] GREEN: `bun test src/data/__tests__/cues.test.ts` → PASS (7+ tests)
  - [ ] `setCue(1, 2, 255, "2:255")` stores cue in slot 1
  - [ ] `getCue(1)` returns `{ slot: 1, surah: 2, ayah: 255, verseRef: "2:255", setAt: "..." }`
  - [ ] `setCue(1, 1, 1, "1:1")` overwrites slot 1
  - [ ] `getCue(5)` returns null (empty slot)
  - [ ] `clearCue(1)` removes the cue
  - [ ] `getAllCues()` returns all set cues
  - [ ] `bun test` → ALL pass (0 failures)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Cues TDD cycle
    Tool: Bash
    Preconditions: Test infrastructure ready, migration applied
    Steps:
      1. Run: bun test src/data/__tests__/cues.test.ts
      2. Assert: all tests pass
      3. Assert: output shows 7+ tests passed
    Expected Result: Full test coverage for cues CRUD
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat: cues data layer with TDD (set, get, clear, list)`
  - Files: `src/data/cues.ts`, `src/data/__tests__/cues.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 8. Reflections data layer (TDD)

  **What to do**:
  - **RED**: Create `src/data/__tests__/reflections.test.ts` with tests:
    - `addReflection(surahId, ayahId, verseRef, note)` creates a reflection
    - `getReflection(surahId, ayahId)` retrieves it
    - `updateReflection(surahId, ayahId, note)` updates the note text
    - `removeReflection(surahId, ayahId)` deletes it
    - `getAllReflections()` returns all reflections ordered by creation
    - `getReflectionsForSurah(surahId)` returns reflections for a specific surah
    - Duplicate surah:ayah is handled (upsert or error — use INSERT OR REPLACE)
  - **GREEN**: Create `src/data/reflections.ts` following `bookmarks.ts` pattern:
    - `addReflection(surahId: number, ayahId: number, verseRef: string, note: string): void`
    - `getReflection(surahId: number, ayahId: number): Reflection | null`
    - `updateReflection(surahId: number, ayahId: number, note: string): void`
    - `removeReflection(surahId: number, ayahId: number): void`
    - `getAllReflections(): Reflection[]`
    - `getReflectionsForSurah(surahId: number): Reflection[]`
    - Interface `Reflection { id: number; surah: number; ayah: number; verseRef: string; note: string; createdAt: string; updatedAt: string }`
  - **REFACTOR**: Clean up

  **Must NOT do**:
  - Don't add UI or text input logic
  - Don't add full-text search on notes (out of scope)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Straightforward CRUD following existing patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 7)
  - **Blocks**: Tasks 10, 11 (panel and dialog need data layer)
  - **Blocked By**: Tasks 0, 6 (test infra + migration)

  **References**:

  **Pattern References**:
  - `src/data/bookmarks.ts:31-153` — Full CRUD pattern to follow exactly
  - `src/data/bookmarks.ts:115-135` — `getAllBookmarks()` pattern with ordered results
  - `src/data/bookmarks.ts:141-152` — `getBookmarkedAyahs()` pattern for `getReflectionsForSurah()`

  **Acceptance Criteria**:

  - [ ] RED: `bun test src/data/__tests__/reflections.test.ts` → FAIL
  - [ ] GREEN: `bun test src/data/__tests__/reflections.test.ts` → PASS (7+ tests)
  - [ ] `addReflection(1, 1, "1:1", "Opening of the Quran")` stores reflection
  - [ ] `getReflection(1, 1)` returns reflection with note text
  - [ ] `updateReflection(1, 1, "Updated note")` changes the note
  - [ ] `removeReflection(1, 1)` deletes it
  - [ ] `getAllReflections()` ordered by `created_at DESC`
  - [ ] `bun test` → ALL pass

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Reflections TDD cycle
    Tool: Bash
    Preconditions: Test infrastructure ready, migration applied
    Steps:
      1. Run: bun test src/data/__tests__/reflections.test.ts
      2. Assert: all tests pass
      3. Assert: output shows 7+ tests passed
    Expected Result: Full test coverage for reflections CRUD
    Evidence: Test output captured
  ```

  **Commit**: YES
  - Message: `feat: reflections data layer with TDD (add, get, update, remove, list)`
  - Files: `src/data/reflections.ts`, `src/data/__tests__/reflections.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 9. Cue keybindings (Shift+N to set, N to jump)

  **What to do**:
  - Update `src/tui/app.tsx` keyboard handler:
    - **Set cue**: Map Shift+1-9 to set cue at current position. In terminal, Shift+1 produces `!`, Shift+2 → `@`, etc.:
      - `!` → setCue(1, ...), `@` → setCue(2, ...), `#` → setCue(3, ...), `$` → setCue(4, ...), `%` → setCue(5, ...), `^` → setCue(6, ...), `&` → setCue(7, ...), `*` → setCue(8, ...), `(` → setCue(9, ...)
    - **Jump to cue**: Map digit keys 1-9 to jump: `getCue(N)` → if exists, `setSelectedSurahId(cue.surah)`, `setCurrentVerseId(cue.ayah)`
    - **CRITICAL GUARD**: These keybindings MUST only fire when:
      - NOT in search mode (`!isSearchMode()`)
      - NOT in command palette (`!showPalette()`)
      - NOT in help dialog (`!showHelp()`)
      - NOT in reflection dialog (`!showReflectionDialog()`) — from Task 11
      - NOT in any text input mode
      - Focus is on a reader pane (`isReaderPane(focusedPanel())`) — NOT sidebar (digits navigate surah list), NOT panel (digits should not trigger there either)
  - Add `[cuesState, setCuesState]` signal to track loaded cues for UI feedback
  - Show brief flash message when cue is set (e.g., "Cue 1 set → 2:255")

  **Must NOT do**:
  - Don't fire digit keys during text input modes (search, reflection editing)
  - Don't fire digit keys when sidebar is focused (interferes with surah number navigation)
  - Don't fire digit keys when panel is focused (up/down navigate panel, not cues)
  - Don't use `Ctrl+N` — `Ctrl` combos should be reserved for system shortcuts

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Keyboard handler is complex with modal priority chain — high risk of regressions
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 10, 11)
  - **Blocks**: Task 12 (help dialog needs cue shortcuts listed)
  - **Blocked By**: Task 7 (cues data layer)

  **References**:

  **Pattern References**:
  - `src/tui/app.tsx:116-281` — Full keyboard handler with modal priority chain: help → palette → search → normal mode
  - `src/tui/app.tsx:258-269` — Verse navigation pattern (`j`/`k`) — cue jump follows same pattern
  - `src/tui/app.tsx:270-280` — Bookmark toggle pattern — cue set follows similar pattern
  - `src/tui/app.tsx:153-180` — Search mode input handling — shows how text input guards work

  **API/Type References**:
  - `src/data/cues.ts` (from Task 7) — `setCue()`, `getCue()`, `getAllCues()`

  **Acceptance Criteria**:

  - [ ] Pressing `!` (Shift+1) in reader pane sets cue 1 at current surah:verse
  - [ ] Pressing `1` in reader pane jumps to cue 1 location (changes surah if needed)
  - [ ] Pressing `1` when cue 1 is empty does nothing
  - [ ] Cue keybindings DO NOT fire during search mode
  - [ ] Cue keybindings DO NOT fire during command palette
  - [ ] Cue keybindings DO NOT fire during help dialog
  - [ ] Cue keybindings DO NOT fire during reflection dialog (text input mode)
  - [ ] Cue keybindings DO NOT fire when panel is focused
  - [ ] Cue keybindings DO NOT fire when sidebar is focused (digits navigate surah list)
  - [ ] Brief feedback message shown when cue is set
  - [ ] Cues persist across app restarts (DB-backed)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Set and jump to cue
    Tool: interactive_bash (tmux)
    Preconditions: TUI running with Al-Fatihah
    Steps:
      1. Press Tab (focus Arabic pane)
      2. Press j j j (move to verse 4)
      3. Press ! (Shift+1 → set cue 1 at 1:4)
      4. Navigate to Al-Baqarah via sidebar (surah 2)
      5. Press Tab (focus Arabic pane)
      6. Press 1 (jump to cue 1)
      7. Capture pane
      8. Assert: Now viewing Al-Fatihah verse 4
    Expected Result: Cross-surah cue navigation works
    Evidence: .sisyphus/evidence/task-9-cue-jump.txt

  Scenario: Digit keys blocked during search
    Tool: interactive_bash (tmux)
    Preconditions: TUI running, cue 1 set
    Steps:
      1. Press / (enter search mode)
      2. Type: 123test
      3. Assert: search input shows "123test" (digits treated as text input, not cue jumps)
      4. Press Escape
    Expected Result: Digits are text input in search mode, not cue triggers
    Evidence: .sisyphus/evidence/task-9-search-guard.txt
  ```

  **Commit**: YES
  - Message: `feat: cue keybindings (Shift+1-9 to set, 1-9 to jump) with modal guards`
  - Files: `src/tui/app.tsx`
  - Pre-commit: `bun test`

---

- [ ] 10. Right-side panel (Bookmarks/Cues/Reflections tabs)

  **What to do**:
  - Create `src/tui/components/panel.tsx`:
    - Three tabs: **Bookmarks** | **Cues** | **Reflections**
    - Tab switching: left/right arrow keys when panel is focused
    - Item traversal: up/down arrow keys within active tab
    - Enter: jump to verse location (changes surah + verse)
    - Enter on Reflection: opens `ReflectionDialog` (Task 11) showing the note
    - Tab indicators in panel title (e.g., `[◄ Bookmarks ►]`)
    - Each tab lists items from their respective data sources:
      - Bookmarks: `getAllBookmarks()` — show `verseRef` + optional `label`
      - Cues: `getAllCues()` — show `slot: verseRef`
      - Reflections: `getAllReflections()` — show `verseRef` + truncated note preview
    - Selected item highlighted with theme accent colors
  - Update `src/tui/components/layout.tsx`:
    - Add right-side panel slot (like sidebar but on the right)
    - When panel visible: Sidebar (25%) | Reader (50%) | Panel (25%)
    - When panel hidden: Sidebar (30%) | Reader (70%) (current behavior)
    - When both sidebar and panel hidden: Reader (100%)
  - Update `src/tui/app.tsx`:
    - Add `showPanel` signal (default: false)
    - Add `B` (Shift+B) keybinding to toggle panel
    - Add `"panel"` to `FocusablePane` type
    - Update `cycleFocus()` to include panel when visible
    - Panel-specific keyboard handling (left/right for tabs, up/down for items, Enter for action)

  **Must NOT do**:
  - Don't implement reflection editing in this task (that's Task 11)
  - Don't allow reordering items
  - Don't add search/filter within the panel
  - Don't make the panel a modal/overlay — it's a persistent pane

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex UI component with tabs, navigation, and layout integration
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Panel layout design, tab interaction patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 11)
  - **Blocks**: Tasks 11, 12 (dialog and help update need panel)
  - **Blocked By**: Tasks 7, 8 (needs cues and reflections data layers)

  **References**:

  **Pattern References**:
  - `src/tui/components/layout.tsx:14-54` — Layout structure with sidebar toggle — follow same pattern for right panel
  - `src/tui/components/surah-list.tsx:18-89` — `<select>` component with `selectedIndex`, `on:itemSelected`, `on:selectionChanged` — similar interaction for panel lists
  - `src/tui/components/command-palette.tsx:17-77` — Navigable list with `selectedIndex`, `j`/`k` navigation
  - `src/tui/app.tsx:57-68` — `cycleFocus()` — needs to include `"panel"` when visible

  **API/Type References**:
  - `src/data/bookmarks.ts:115-135` — `getAllBookmarks()` returns `Bookmark[]`
  - `src/data/cues.ts` (Task 7) — `getAllCues()` returns `Cue[]`
  - `src/data/reflections.ts` (Task 8) — `getAllReflections()` returns `Reflection[]`
  - `src/tui/app.tsx:22` — `FocusablePane` type to extend with `"panel"`

  **Acceptance Criteria**:

  - [ ] `src/tui/components/panel.tsx` exists with three tabs
  - [ ] `B` (Shift+B) toggles the right panel open/closed
  - [ ] Panel shows Bookmarks tab by default
  - [ ] Left/right arrows switch between Bookmarks, Cues, Reflections tabs
  - [ ] Up/down arrows navigate items within active tab
  - [ ] Enter on a bookmark/cue item jumps to that verse
  - [ ] Layout adjusts: with panel, reader shrinks; without panel, reader expands
  - [ ] Tab cycling (`Tab`) includes panel when visible
  - [ ] Panel uses theme-aware colors (works in both light and dark mode)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Toggle panel and navigate tabs
    Tool: interactive_bash (tmux)
    Preconditions: TUI running, at least 1 bookmark exists
    Steps:
      1. Press B (toggle panel open)
      2. Capture pane
      3. Assert: right panel visible with "Bookmarks" tab
      4. Press Tab until panel is focused
      5. Press Right arrow (switch to Cues tab)
      6. Assert: Cues tab heading visible
      7. Press Right arrow (switch to Reflections tab)
      8. Assert: Reflections tab heading visible
      9. Press B (toggle panel closed)
      10. Capture pane
      11. Assert: panel gone, reader expanded
    Expected Result: Panel toggles, tabs switch
    Evidence: .sisyphus/evidence/task-10-panel.txt

  Scenario: Jump to bookmarked verse from panel
    Tool: interactive_bash (tmux)
    Preconditions: TUI running, bookmark exists at 1:3
    Steps:
      1. Navigate to Al-Baqarah (surah 2)
      2. Press B (open panel)
      3. Tab to panel, select bookmark for 1:3
      4. Press Enter
      5. Capture pane
      6. Assert: Now viewing Al-Fatihah verse 3
    Expected Result: Jumping from panel works cross-surah
    Evidence: .sisyphus/evidence/task-10-jump.txt
  ```

  **Commit**: YES
  - Message: `feat: right-side panel with Bookmarks/Cues/Reflections tabs`
  - Files: `src/tui/components/panel.tsx`, `src/tui/components/layout.tsx`, `src/tui/app.tsx`
  - Pre-commit: `bun test`

---

- [ ] 11. Reflection text input dialog

  **What to do**:
  - Create `src/tui/components/reflection-dialog.tsx`:
    - Modal dialog for adding/viewing/editing reflection notes
    - **Add mode**: Appears when user presses a keybinding to add reflection at current verse
      - Shows verse reference at top (e.g., "Reflection for 2:255")
      - Multi-line text input area
      - Keybindings: `Escape` to cancel, `Ctrl+S` to save
    - **View mode**: Appears when pressing Enter on a reflection in the panel
      - Shows verse reference + full note text (read-only)
      - Keybindings: `Escape` to close, `e` to enter edit mode
    - **Edit mode**: Like add mode but pre-populated with existing note
  - Update `src/tui/app.tsx`:
    - Add `R` (Shift+R) keybinding to add reflection at current verse
    - Add `showReflectionDialog` signal
    - Add reflection dialog input handling (text input mode — blocks all other keybindings)
    - Wire reflection dialog save to `addReflection()` / `updateReflection()`
  - Text input handling:
    - Track cursor position within the note text
    - Support: character input, backspace, Enter (newline), arrow keys for cursor movement
    - Escape to cancel, Ctrl+S to save

  **Must NOT do**:
  - Don't implement rich text editing (markdown, formatting)
  - Don't add character limits
  - Don't implement clipboard paste (complex in terminal)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Text input dialog with cursor management is a complex UI component
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Dialog design, text input UX patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10)
  - **Blocks**: Task 12 (help dialog needs reflection shortcuts)
  - **Blocked By**: Tasks 8, 10 (needs reflections data + panel for view mode trigger)

  **References**:

  **Pattern References**:
  - `src/tui/components/help-dialog.tsx:9-75` — Modal dialog pattern: `position="absolute"`, `zIndex={100}`, `backgroundColor`, `borderStyle`
  - `src/tui/app.tsx:153-180` — Search mode text input handling: character input, backspace, return — same pattern for reflection text input
  - `src/tui/components/command-palette.tsx:20-76` — Modal overlay styling pattern

  **API/Type References**:
  - `src/data/reflections.ts` (Task 8) — `addReflection()`, `updateReflection()`, `getReflection()`

  **Acceptance Criteria**:

  - [ ] `src/tui/components/reflection-dialog.tsx` exists
  - [ ] `R` (Shift+R) opens add-reflection dialog at current verse
  - [ ] Dialog shows verse reference (e.g., "Reflection for 1:1")
  - [ ] Text input works: typing, backspace, Enter for newlines
  - [ ] `Ctrl+S` saves the reflection and closes dialog
  - [ ] `Escape` cancels without saving
  - [ ] Enter on reflection in panel opens view mode with full note
  - [ ] `e` in view mode enters edit mode with pre-populated text
  - [ ] All other keybindings blocked while dialog is open

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Add a reflection
    Tool: interactive_bash (tmux)
    Preconditions: TUI running, viewing Al-Fatihah verse 1
    Steps:
      1. Press Tab (focus Arabic pane)
      2. Press R (open reflection dialog)
      3. Assert: dialog visible with "Reflection for 1:1"
      4. Type: "The opening of the Quran"
      5. Press Ctrl+S (save)
      6. Assert: dialog closes
      7. Press B (open panel)
      8. Press Right Right (go to Reflections tab)
      9. Assert: reflection for 1:1 visible with note preview
    Expected Result: Reflection saved and visible in panel
    Evidence: .sisyphus/evidence/task-11-add-reflection.txt

  Scenario: View and edit reflection
    Tool: interactive_bash (tmux)
    Preconditions: Reflection exists for 1:1
    Steps:
      1. Open panel, navigate to Reflections tab
      2. Select 1:1 reflection
      3. Press Enter (view mode)
      4. Assert: dialog shows full note text
      5. Press e (edit mode)
      6. Type additional text
      7. Press Ctrl+S (save)
      8. Assert: dialog closes, note updated
    Expected Result: View and edit cycle works
    Evidence: .sisyphus/evidence/task-11-edit.txt
  ```

  **Commit**: YES
  - Message: `feat: reflection text input dialog (add, view, edit modes)`
  - Files: `src/tui/components/reflection-dialog.tsx`, `src/tui/app.tsx`
  - Pre-commit: `bun test`

---

- [ ] 12. Update help dialog, command palette, and README

  **What to do**:
  - Update `src/tui/components/help-dialog.tsx`:
    - Add new shortcuts: `Shift+D` (cycle mode), `B` (toggle panel), `R` (add reflection), `!-(`/`1-9` (cues)
  - Update `src/tui/components/command-palette.tsx`:
    - Add palette entries: Toggle Panel, Cycle Mode, Add Reflection
  - Update `README.md`:
    - Add new keyboard shortcuts to the table
    - Add "Cues", "Reflections", "Light/Dark Mode" to features list
    - Add "Panel" to features list
  - Update command palette `paletteCommands` array in `app.tsx`

  **Must NOT do**:
  - Don't add new features — this is documentation only
  - Don't change any behavior

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Documentation and string updates only
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential)
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 9, 10, 11 (all features must be done)

  **References**:

  **Pattern References**:
  - `src/tui/components/help-dialog.tsx:12-29` — Shortcuts array pattern
  - `src/tui/app.tsx:75-102` — `paletteCommands` array pattern
  - `README.md` — Keyboard shortcuts table

  **Acceptance Criteria**:

  - [ ] Help dialog shows: Shift+D, B, R, 1-9/Shift+1-9 shortcuts
  - [ ] Command palette includes: Toggle Panel, Cycle Mode, Add Reflection
  - [ ] README features list includes: Cues, Reflections, Light/Dark Mode, Panel
  - [ ] README keyboard shortcuts table includes all new keybindings

  **Commit**: YES
  - Message: `docs: update help dialog, command palette, and README with new features`
  - Files: `src/tui/components/help-dialog.tsx`, `src/tui/components/command-palette.tsx`, `src/tui/app.tsx`, `README.md`
  - Pre-commit: `bun test`

---

- [ ] 13. Final integration QA

  **What to do**:
  - Run full test suite: `bun test`
  - Launch TUI and perform comprehensive QA:
    - Verify all original keybindings still work (Tab, j/k, Enter, b, a, t, r, l, T, s, +/-, /, ?, Ctrl+P, q)
    - Verify RTL rendering on multiple surahs
    - Verify scroll sync
    - Verify light/dark mode toggle
    - Verify cue set/jump workflow
    - Verify panel open/close/navigate
    - Verify reflection add/view/edit workflow
    - Verify theme cycling works in both modes
    - Verify mode persistence across restart
    - Verify cue persistence across restart
  - Fix any integration issues found
  - Ensure no regressions in existing functionality

  **Must NOT do**:
  - Don't add new features
  - Don't refactor existing code

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Comprehensive integration testing requires thoroughness
  - **Skills**: [`playwright`]
    - `playwright`: For any browser-based verification if needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (final, after Task 12)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 12 (all features must be documented)

  **References**:

  **Pattern References**:
  - All files modified in Tasks 0-12

  **Acceptance Criteria**:

  - [ ] `bun test` → ALL PASS (0 failures)
  - [ ] All original keybindings work unchanged
  - [ ] RTL Arabic renders correctly on Al-Fatihah and Al-Baqarah
  - [ ] Scroll sync works across all visible panes
  - [ ] Light mode usable (text readable, backgrounds correct)
  - [ ] Dark mode unchanged from before
  - [ ] Cues set/jump/persist correctly
  - [ ] Panel toggles, tabs navigate, items jump to verse
  - [ ] Reflections add/view/edit/persist correctly
  - [ ] No visual glitches or broken layouts

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full integration smoke test
    Tool: interactive_bash (tmux)
    Preconditions: All tasks complete
    Steps:
      1. tmux new-session -x 120 -y 35: bun run src/index.ts
      2. Wait for TUI load
      3. Press Tab (cycle focus) — verify border changes
      4. Press j j j (verse 4) — verify all panes sync
      5. Press b (bookmark verse 4) — verify bookmark icon
      6. Press ! (set cue 1 at 1:4) — verify feedback
      7. Press R (add reflection) — type "Test note" → Ctrl+S
      8. Navigate to surah 2 via sidebar
      9. Press 1 (jump to cue 1) — verify back at 1:4
      10. Press B (open panel) — verify 3 tabs
      11. Navigate to Reflections tab — verify note visible
      12. Press Enter on reflection — verify dialog shows note
      13. Press Escape to close
      14. Press Shift+D (toggle to light mode) — verify colors change
      15. Press T (cycle theme) — verify theme + light mode
      16. Press Shift+D twice (back to auto)
      17. Press ? (help) — verify new shortcuts listed
      18. Press Escape
      19. Press Ctrl+P (palette) — verify new commands
      20. Press Escape
      21. Press q — verify clean exit
    Expected Result: All features work together
    Evidence: .sisyphus/evidence/task-13-integration.txt
  ```

  **Commit**: YES (if fixes needed)
  - Message: `fix: integration issues from final QA`
  - Pre-commit: `bun test`

---

## Commit Strategy

| After Task | Message | Key Files | Verification |
|------------|---------|-----------|-------------|
| 0 | `test: setup bun test infrastructure with smoke tests` | `src/data/__tests__/*.test.ts` | `bun test` |
| 1 | `spike: validate bidi-js Arabic rendering with OpenTUI` | `src/tui/spike-bidi.tsx`, `package.json` | Manual launch |
| 2 | `fix: Arabic RTL rendering with bidi-js pre-processing and right-alignment` | `src/tui/utils/rtl.ts`, `reader.tsx` | `bun test` |
| 3 | `fix: synchronize scroll across Arabic/Translation/Transliteration panes` | `reader.tsx` | `bun test` |
| 4 | `fix: add explicit background colors for light terminal compatibility` | `layout.tsx`, `reader.tsx` | `bun test` |
| 5 | `feat: light/dark mode system with auto-detection and dual palettes` | `mode.tsx`, `theme.tsx`, `app.tsx` | `bun test` |
| 6+7 | `feat: cues data layer with TDD (set, get, clear, list)` | `003_cues_reflections.sql`, `cues.ts`, tests | `bun test` |
| 8 | `feat: reflections data layer with TDD` | `reflections.ts`, tests | `bun test` |
| 9 | `feat: cue keybindings (Shift+1-9 to set, 1-9 to jump)` | `app.tsx` | `bun test` |
| 10 | `feat: right-side panel with Bookmarks/Cues/Reflections tabs` | `panel.tsx`, `layout.tsx`, `app.tsx` | `bun test` |
| 11 | `feat: reflection text input dialog (add, view, edit)` | `reflection-dialog.tsx`, `app.tsx` | `bun test` |
| 12 | `docs: update help dialog, command palette, and README` | `help-dialog.tsx`, `command-palette.tsx`, `README.md` | `bun test` |
| 13 | `fix: integration issues from final QA` (if needed) | varies | `bun test` |

---

## Success Criteria

### Verification Commands
```bash
bun test                    # Expected: ALL PASS, 0 failures
bun run src/index.ts        # Expected: TUI launches with correct rendering
```

### Final Checklist
- [ ] All "Must Have" features present and working
- [ ] All "Must NOT Have" guardrails respected
- [ ] All tests pass (`bun test`)
- [ ] Arabic text renders RTL correctly
- [ ] Panes scroll in sync
- [ ] Light mode usable with readable text
- [ ] Dark mode unchanged
- [ ] Cues persist and navigate cross-surah
- [ ] Panel toggles with 3 functional tabs
- [ ] Reflections can be added, viewed, edited
- [ ] No regressions in existing keybindings
- [ ] README and help dialog document all new features
