# Draft: quran.sh Implementation

## Requirements (confirmed)
- **Core Objective**: CLI/TUI for reading Quran, tracking progress, and studying.
- **Tech Stack**: Bun + TypeScript.
- **TUI Framework**: OpenTUI + Solid.js (as used in OpenCode).
- **Features**:
  - TUI: 3-panel layout (Chapters, Reader, Context/Hadith).
  - CLI: Quick commands (`read`, `log`, `streak`).
  - Gamification: GitHub-style streak chart.
  - Data: Offline-first (`quran-json`), Hadith integration.

## Technical Decisions
- **Runtime**: Bun (native performance, built-in SQLite).
- **Architecture**: `Solid.js` reconciler for OpenTUI (declarative UI).
- **Data Source**: `quran-json` (bundled) for speed/offline; `@quranjs/api` for enrichment.
- **Storage**: `bun:sqlite` for user data (progress, bookmarks, notes).
- **Arabic Rendering**: Progressive enhancement strategy (detect BiDi support -> fallback to translation/transliteration).

## Test Strategy Decision
- **Infrastructure exists**: NO (will setup Bun Test).
- **Automated tests**: YES (TDD).
- **If setting up**: `bun test`.
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks regardless of test choice).

## Distribution Strategy
- **Format**: NPM Package (install via `bun add -g quran.sh` or `npx quran.sh`).

## Open Questions
- None. All requirements clear.

## Scope Boundaries
- **INCLUDE**: TUI reader, CLI commands, streak tracking, notes, search.
- **EXCLUDE**: Audio playback (phase 2), complex tajweed rendering (terminal limitation).
