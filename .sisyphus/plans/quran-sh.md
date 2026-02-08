# Plan: quran.sh (MVP)

## TL;DR

> **Quick Summary**: A fast, offline-first Quran CLI and TUI reader built with **Bun**, **OpenTUI**, and **Solid.js**.
> 
> **Deliverables**:
> - NPM Package (`quran.sh`) with `quran` binary
> - **CLI**: Quick read (`quran read 2:255`), search, and progress logging
> - **TUI**: 2-panel immersive reader (Surah List | Verse Reader) with vim-style navigation
> - **Data**: Offline-first via `quran-json` and `bun:sqlite`
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - Sequential Phases (0 -> 1 -> 2 -> 3 -> 4)
> **Critical Path**: Toolchain Spike → Data Layer → CLI → TUI Layout → Features

---

## Context

### Research Summary
- **Framework**: **OpenTUI + Solid.js** (Production stack used by OpenCode).
- **Runtime**: **Bun** (Native TypeScript, built-in SQLite, fast startup).
- **Arabic Constraints**: Most terminals lack BiDi support. **Strategy: Translation-First** (Arabic is opt-in Phase 4).
- **Data**: `quran-json` (Bundled, offline) + `bun:sqlite` (User data).

### Metis Gap Analysis (Incorporated)
- **Scope Reduction**: MVP is **2-Panel TUI** (No Context/Hadith panel).
- **Strict Guardrails**: `tsconfig.json` settings for OpenTUI/Solid, WAL mode for SQLite.
- **Testing**: Mandatory `testRender()` for TUI components.
- **Pathing**: Use XDG standards (`~/.local/share/quran.sh`) for DB.

---

## Work Objectives

### Core Objective
Build a robust, offline-first Quran reader that works in any terminal (translation-first) and provides reading tracking.

### Concrete Deliverables
- `src/index.ts` (CLI entry point)
- `src/tui/app.tsx` (TUI entry point)
- `src/data/quran.ts` (Data access layer)
- `~/.local/share/quran.sh/quran.db` (User database)

### Definition of Done
- [ ] `quran read 1` outputs Al-Fatihah translation
- [ ] `quran` launches TUI with 2-panel layout
- [ ] TUI navigation works (Arrow keys/Vim keys)
- [ ] Reading progress saves to SQLite
- [ ] `bun test` passes all logic and component tests

### Must Have
- Offline capability (0 internet required after install)
- Translation-first display (guaranteed readability)
- Vim-style navigation (`j`/`k`)
- Persistent reading logs

### Must NOT Have (MVP Guardrails)
- **NO Audio playback**
- **NO Online API dependencies** (tafsir, etc.)
- **NO Hadith integration** (Phase 4+)
- **NO Arabic-first default** (opt-in only)
- **NO 3-Panel layout** (start with 2)

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> All verification must be automated via `bun test` or Agent-Executed QA.

### Test Architecture
- **Logic**: `bun test` (Unit tests for data, search, formatting)
- **TUI**: `testRender()` from `@opentui/solid` (Headless component tests)
- **CLI**: Integration tests via `bun run` + stdout assertions

### Agent-Executed QA Scenarios

**Scenario: CLI Read**
```
Tool: Bash
Steps:
  1. bun run src/index.ts read 1:1
  2. Assert stdout contains "In the name of Allah"
  3. Assert exit code 0
```

**Scenario: TUI Navigation (Headless)**
```
Tool: Bun Test (testRender)
Steps:
  1. Render <App /> with mocked terminal size
  2. Assert "Al-Fatihah" is visible/focused
  3. Simulate "Enter" keypress
  4. Assert Reader panel is focused and populated
```

---

## Execution Strategy

**Phased Approach**:
1. **Phase 0: Validation Spike** (Toolchain setup, Hello World)
2. **Phase 1: Core Data & CLI** (SQLite, `read`, `log`)
3. **Phase 2: Basic TUI** (Layout, Navigation, Reader)
4. **Phase 3: Features** (Bookmarks, Streaks, Polish)

---

## TODOs

### Phase 0: Toolchain Validation Spike (CRITICAL)

- [x] 1. **Setup OpenTUI + Solid + Bun Toolchain**
  **What to do**:
  - Install deps: `@opentui/core`, `@opentui/solid`, `solid-js`, `yoga-layout`
  - Configure `tsconfig.json`: `jsx: "preserve"`, `jsxImportSource: "@opentui/solid"`
  - Configure `bunfig.toml`: `preload = ["@opentui/solid/preload"]`
  - Create `src/tui/spike.tsx`: Hello World TUI
  - Create `test/spike.test.tsx`: Verify `testRender()` works
  - Verify: `bun run src/tui/spike.tsx` renders output
  - Verify: `bun test` passes
  **Reference**: `@opentui/solid` npm docs

- [x] 2. **Validate Data & Storage Layer**
  **What to do**:
  - Install `quran-json`
  - Create `src/data/db.ts`: Setup `bun:sqlite` with WAL mode
  - Create `migrations/001_init.sql`: `reading_log`, `bookmarks` tables
  - Verify: Script imports JSON and creates DB at `~/.local/share/quran.sh/test.db`

### Phase 1: Core Data & CLI

- [ ] 3. **Implement Data Access Layer**
  **What to do**:
  - Create `src/data/quran.ts`: Typed interface for `quran-json`
  - Methods: `getSurah(id)`, `getVerse(ref)`, `search(query)`
  - Tests: Unit tests for data retrieval
  - **Guardrail**: Handle verse numbering (ensure 1-based consistency)

- [ ] 4. **Implement CLI: `quran read`**
  **What to do**:
  - Setup CLI router (commander or custom)
  - Implement `read <ref>` command
  - Support refs: `1`, `1:1`, `al-fatihah`, `2:255`
  - Output: Plain text translation (no Arabic yet)
  - Verify: `bun run src/index.ts read 1` outputs text

- [ ] 5. **Implement CLI: `quran log`**
  **What to do**:
  - Implement `log <ref>` command
  - Insert into `reading_log` table in SQLite
  - Verify: `bun run src/index.ts log 1:1` adds row to DB

### Phase 2: Basic TUI (2-Panel)

- [ ] 6. **TUI Layout & Router**
  **What to do**:
  - Create `src/tui/app.tsx` with `RouteProvider` and `ThemeProvider`
  - Create `src/tui/components/layout.tsx`: 2-panel Flexbox (`BoxRenderable`)
  - Left: Sidebar (30%), Right: Main (70%)
  - Test: `testRender` verifies layout structure

- [ ] 7. **Component: Surah List (Sidebar)**
  **What to do**:
  - List 114 Surahs in `ScrollBox` or `Select`
  - Handle `Up`/`Down` navigation
  - Handle `Enter` to select
  - Test: `testRender` navigation logic

- [ ] 8. **Component: Reader View (Main)**
  **What to do**:
  - Display verses for selected Surah in `ScrollBox`
  - Format: `[Ref] Translation`
  - Handle scrolling (`Space`, `j`/`k`)
  - Test: Verify content updates on surah change

- [ ] 9. **Navigation System**
  **What to do**:
  - Implement global focus management (Sidebar <-> Reader)
  - `Tab` to switch panels
  - `q` to quit
  - Integration: Connect Sidebar selection to Reader state

### Phase 3: Features & Polish

- [ ] 10. **Feature: Bookmarks**
  **What to do**:
  - TUI: Press `b` to toggle bookmark on current verse
  - DB: Persist to `bookmarks` table
  - UI: Show `*` indicator next to bookmarked verses

- [ ] 11. **Feature: Reading Streak**
  **What to do**:
  - Calculate streaks from `reading_log`
  - Create `src/tui/components/streak-chart.tsx` (GitHub style grid)
  - Display on Home/Dashboard view
  - CLI: `quran streak` command

- [ ] 12. **Search Integration**
  **What to do**:
  - CLI: `quran search <query>`
  - TUI: `/` opens search dialog (using `DialogPrompt`)
  - Display results in Reader panel

- [ ] 13. **Final Polish & Release**
  **What to do**:
  - Help dialog (`?`)
  - Theme support (start with `madinah`)
  - `README.md` documentation
  - `package.json` bin configuration

---

## Success Criteria
- [ ] `bun test` passes (Logic + TUI components)
- [ ] CLI `read` and `log` commands work
- [ ] TUI navigates 114 surahs and displays text
- [ ] User progress is persisted to SQLite
- [ ] No crash on resize or missing data
