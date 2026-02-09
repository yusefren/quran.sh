# Draft: TUI Updates & New Features

## Requirements (confirmed)

### Bug Fixes
- **RTL Arabic text broken**: Arabic text in the TUI renders garbled/reversed. Needs BiDi algorithm processing via `bidi-js` library. Currently no RTL handling at all — raw Unicode is dumped LTR.
- **Arabic pane taking full width**: Text spans full pane width instead of being right-aligned and properly sized (like quran.com reference).
- **Scroll sync broken**: Arabic, Translation, and Transliteration panes scroll independently. When user scrolls one, the others should keep the same verse in view.
- **Light mode terminal unusable**: No background color set on the root container, so in light terminals the text is invisible. Needs explicit background color.

### New Features
- **Light/Dark mode system**: Separate from dynasty themes. Themes must react to mode changes. Sets background color explicitly.
- **Cues (1-9)**: Quick navigation bookmarks using number keys. Shift+N sets cue at current position. N jumps to cue. Overridable. Max 9 cues.
- **Bookmarks viewer**: Bookmarks already exist in DB but no dedicated viewer UI. Need a viewer/browser modal.
- **Reflections**: Like bookmarks but with user-added notes/text. New concept.

## Technical Decisions
- **RTL approach**: Use `bidi-js` npm library for Unicode BiDi Algorithm processing. Pre-process Arabic text before rendering to OpenTUI.
- **Framework**: OpenTUI (Solid.js-based) — no change needed
- **Database**: SQLite via bun:sqlite — will need new tables for cues and reflections
- **State persistence**: Via `user_preferences` key-value table for mode preference, new tables for cues/reflections

## Research Findings
- **RTL in terminals**: Most terminals don't support BiDi natively. Pre-processing with bidi-js is the universal approach.
- **Libraries**: `bidi-js` (pure JS, UAX #9 v13.0.0, no deps) is the recommended library.
- **Theme system**: 11 themes exist with dark backgrounds. Each has 15 color properties. Adding light/dark variants means each theme needs two color palettes.
- **Scroll sync**: Currently each pane is an independent `<scrollbox>`. Sync requires verse-level state tracking (already exists as `currentVerseId`).

## Resolved Decisions (from interview)

### Light/Dark Mode
- **Auto-detect + manual toggle**: Detect terminal background on startup, allow manual toggle (Shift+D).
- Each of the 11 dynasty themes needs both a dark and light color palette.
- Persisted in `user_preferences` (key: "mode", value: "dark"/"light"/"auto").

### Cues
- **Persist in DB**: Cues survive app restart. Stored in SQLite `cues` table.
- **Cross-surah**: Cue stores full surah:verse position. Pressing a cue number jumps to that surah and verse.
- Shift+1-9 to set, 1-9 to jump. Overridable.

### Bookmarks/Cues/Reflections UI
- **Dedicated right-side pane** (NOT modal). One pane with 3 tabs: Bookmarks, Cues, Reflections.
- Left/right arrows to switch between tabs.
- Up/down to traverse items within the active tab.
- Enter to jump to the verse location.
- Enter on a Reflection opens its note content as a dialog.
- Needs a keybinding to toggle this pane open/closed (TBD — something like `B`).

### Reflections
- Like bookmarks but with user text. Stored in new `reflections` table.
- Note text input: When user adds a reflection, a text input dialog opens.
- Stored per verse: surah, ayah, verse_ref, note text.

### Test Strategy
- **Setup tests + TDD**: Add bun test infrastructure. Write tests for new data layer functions first (TDD).
- Agent-Executed QA for TUI verification.

## Open Questions
- (NONE — all resolved)

## Scope Boundaries
- INCLUDE: RTL fix, scroll sync, light/dark mode, cues, bookmarks viewer, reflections, test setup + TDD
- EXCLUDE: Audio playback, new themes, verse-by-verse reading mode changes
