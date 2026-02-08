# Learnings - quran-sh

## [2026-02-08T17:09:03.613Z] Session Started
- Initial git repository setup complete
- Remote: git@github.com:smashah/quran.sh.git
- Branch: main

## OpenTUI + Solid + Bun Setup (2025-02-08)

### Configuration
- **tsconfig.json**: Requires `"jsx": "preserve"` and `"jsxImportSource": "@opentui/solid"`.
- **bunfig.toml**: The `preload` script is critical for JSX transformation. 
  - For `bun test`, the preload script MUST be included in the `[test]` section:
    ```toml
    [test]
    preload = ["@opentui/solid/preload"]
    ```
  - Top-level `preload` works for `bun run` but may be ignored by `bun test` in some environments.

### Testing
- Use `testRender` from `@opentui/solid` for component testing.
- The returned object from `await testRender(App)` exposes `captureCharFrame()` which returns the rendered string representation.
- Example pattern:
  ```tsx
  const { captureCharFrame } = await testRender(App);
  expect(captureCharFrame()).toContain("Hello World");
  ```
- Ensure `bun test` runs with the preload plugin active, otherwise imports of `jsxDEV` will fail.

### Dependencies
- Installed: `@opentui/core`, `@opentui/solid`, `solid-js`, `yoga-layout`.
- Note: `@opentui/solid` has peer dependency requirements on `solid-js` that might need alignment, but works with latest versions.

## Data & Storage Layer (2026-02-08)

### quran-json Package Structure (v3.1.2)
- **Main entry**: `dist/chapters/en/index.json` — array of 114 surahs (metadata only: id, name, transliteration, type, total_verses, link)
- **Per-chapter with translation**: `dist/chapters/en/{surah_id}.json` — includes `verses[]` with `id`, `text` (Arabic), `translation`, `transliteration`
- **Arabic-only**: `dist/quran.json` — flat array, `verses[]` has only `id` + `text` (no translation/transliteration)
- **Other languages**: `dist/chapters/{bn,es,fr,id,ru,sv,tr,ur,zh}/` — same structure per language
- **Full per-language**: `dist/quran_{lang}.json` — all surahs in one file
- **Access via `require()`**: Works in Bun with `verbatimModuleSyntax` since `require()` is runtime-available and typed via `@types/bun`. Avoids the `import ... with { type: "json" }` syntax.

### bun:sqlite API Patterns
- `new Database(path, { create: true })` — creates DB file if not present
- `db.exec(sql)` — run DDL/DML without returning results
- `db.query(sql).get()` — single row
- `db.query(sql).all()` — all rows
- **WAL mode**: `PRAGMA journal_mode = WAL;` — returns `{ journal_mode: "wal" }`
- **Foreign keys**: Off by default in SQLite, must enable per-connection: `PRAGMA foreign_keys = ON;`

### Migration Patterns
- File-based migrations: `migrations/NNN_name.sql`, sorted lexicographically
- Use `IF NOT EXISTS` on all CREATE TABLE/INDEX for idempotency
- ISO 8601 timestamps via SQLite: `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
- `UNIQUE` constraints prevent duplicate bookmarks per verse

### XDG Paths
- Data dir: `~/.local/share/quran.sh/` (respects `XDG_DATA_HOME` env var)
- DB file: `quran.db` (production) or `test.db` (verification)
- `dirname()` from `node:path` preferred over `join(path, "..")` for parent dir resolution

## Task 3: Data Access Layer (src/data/quran.ts)

### quran-json data structure (confirmed)
- `quran-json/dist/quran_en.json`: Single JSON file containing ALL 114 chapters with embedded verses
- Main export (`dist/chapters/en/index.json`): Same data but chapter metadata only (with CDN links, no embedded verses for individual chapters)
- Individual chapter files at `dist/chapters/en/{id}.json`: Include `transliteration` field on verses (not present in quran_en.json per-verse transliteration data)
- Each chapter object: `{ id, name, transliteration, translation, type, total_verses, verses: [...] }`
- Each verse object: `{ id, text, translation }` — verse `id` is already 1-based in the data
- `type` is always "meccan" or "medinan"

### Verse reference parsing
- Colon format "surah:verse" (e.g. "2:255") is the standard reference notation
- Both surah and verse parts must be valid positive integers
- Verse IDs in quran-json are already 1-based, so `find()` by ID is safe (no off-by-one)
- Float values like "1.5:2" must be rejected (use Number.isInteger check)

### Data loading strategy
- Using `createRequire` from `node:module` for JSON import (works with `verbatimModuleSyntax`)
- Lazy loading with caching: data loaded once on first access, then cached in module-level variables
- Built two lookup maps: by ID (number) and by transliteration name (lowercase string)
- Using `quran_en.json` (monolithic file) rather than per-chapter files — simpler, single I/O

### Gotchas
- `noUncheckedIndexedAccess` is enabled in tsconfig — all array/map access requires null checks
- quran-json has no TypeScript types — needed to define RawChapter/RawVerse interfaces manually
- The `type` field in raw data is `string`, needs casting to `"meccan" | "medinan"` union
- `quran_en.json` doesn't include verse transliteration; individual chapter files (`dist/chapters/en/{id}.json`) do

### Test coverage highlights
- 47 tests, 593 expect() calls
- All 114 surahs verified accessible with correct ID and non-empty verses
- 1-based verse numbering verified (first verse ID = 1, last verse ID = totalVerses)
- Edge cases: surah 0, 115, negative, NaN, floats, empty strings, whitespace
- Search: case-insensitivity, empty/whitespace queries, nonsense queries, known matches

## Task 4: CLI `read` Command (2026-02-08)

### CLI Argument Parsing
- Used simple `process.argv.slice(2)` — no external dependency needed (no commander/yargs)
- Pattern: `args[0]` = command, `args[1]` = argument
- Bun strips its own args automatically; `process.argv[0]` is bun path, `[1]` is script path
- For a single-command CLI, this is perfectly adequate; consider commander only when subcommand count > 3

### Reference Detection Strategy
- Three-branch detection in order: (1) contains `:` → verse ref, (2) all digits → surah ID, (3) else → surah name
- This ordering avoids ambiguity since surah names never contain `:` or consist of only digits
- Regex `/^\d+$/` for numeric detection is safe and simple

### Output Formatting
- Full surah: `Surah {id}: {transliteration} ({translation})\n\n{verse translations joined by \n}`
- Single verse: `[{surah}:{verse}] {translation}`
- No Arabic text (translation-first strategy per plan)

### Error Handling
- All error paths exit with code 1, success paths with code 0
- Errors written to stderr (`console.error`), output to stdout (`console.log`)
- Three error categories: missing ref, invalid format/not found, unknown command
- Each error includes helpful suggestion of correct format

### Gotchas
- `noUncheckedIndexedAccess` means `args[0]` and `args[1]` are `string | undefined` — handled with falsy checks
- Name lookup is case-insensitive (handled by data layer's `getSurah()`)
- No separate `src/cli/read.ts` file needed — single-file CLI is clean enough for current scope

## Task 5: CLI `log` Command (2026-02-08)

### Architecture
- Created `src/data/log.ts` — separate module for log persistence, parallel to `quran.ts` for data access
- `logVerse(ref)` — validates via `getVerse()`, inserts single row, returns `LogResult`
- `logSurah(surah)` — accepts `Surah` object (resolved in CLI router), inserts all verses in a transaction
- Surah resolution (by ID or name) happens in `index.ts` via `getSurah()`, not in log module — cleaner separation

### Database Interaction
- Each `logVerse`/`logSurah` call opens and closes its own DB connection (`openDatabase()` + `db.close()`)
- `db.query(sql).run(params...)` for parameterized INSERT — prevents SQL injection
- `db.transaction(() => { ... })` for batch surah logging — all-or-nothing, much faster than individual inserts
- UNIQUE(surah, ayah, read_at) constraint: same verse CAN be logged multiple times (different timestamps); only exact millisecond collision would violate — effectively no issue in practice

### Logging Strategy
- **Individual verses**: Each verse gets its own `reading_log` row, even for surah-level logging
- Rationale: granular progress tracking — can later query "which verses have I read?" at verse level
- For `log 1`: inserts 7 rows (one per verse of Al-Fatihah), all within a single transaction
- `verse_ref` column stores canonical `surah:ayah` notation (e.g. "2:255")

### CLI Router Updates
- Extended command check: `command !== "read" && command !== "log"` (was just `!== "read"`)
- `handleLog()` mirrors `handleRead()` structure — same 3-branch ref detection (colon → verse, digits → surah ID, else → name)
- Usage text updated to show both `read` and `log` commands with examples
- Error messages in `log` are identical format to `read` — consistency

### Gotchas
- Unused import: initially imported `getSurah` in log.ts but it's not needed there (surah resolution is in index.ts)
- `Surah` type import kept as `import type` — only needed for the function signature, not runtime
- OpenTUI Layout: Used <box flexDirection="row"> with width="30%" and width="70%" for 2-panel layout. Yoga layout supports percentage strings in OpenTUI.
- Solid Context: Implemented minimal RouteProvider and ThemeProvider using createContext and createSignal.
- Testing: testRender from @opentui/solid works well with bun test. Captured output shows borders correctly for nested boxes.
- OpenTUI SelectRenderable emits index (number) in 'itemSelected' and 'selectionChanged' events, not the option object. Need to look up option by index.
- OpenTUI SelectRenderable requires explicit focus management in tests. 'testRender' environment might not auto-focus the first element correctly without manual intervention.
- Component focus in OpenTUI + Solid might need 'ref' based focus trigger in 'onMount' or explicit 'focusable={true}' prop handling.

## Task 8: Reader Component (Main Panel)

### OpenTUI ScrollBox
- Used `<scrollbox>` intrinsic element for scrollable content.
- Key props: `scrollable={true}`, `scrollbar={true}`, `focusable={true}`, `focused={true}`, `keys={true}`.
- Handles arrow keys (Up/Down) natively when focused.
- Content clipping works as expected (verified in tests).

### Component Structure
- `Reader` takes `surahId` and `focused` props.
- Uses `createMemo` to reactively update Surah data when `surahId` changes.
- Layout: Outer `box` with title/border -> Inner `scrollbox` -> List of `box` (one per verse).
- Error state: Renders simple "Surah not found" message if ID is invalid.

### Testing TUI Components
- `testRender` from `@opentui/solid` allows verifying TUI output.
- `captureSpans()` returns structured text data (lines/spans).
- `mockInput.pressArrow("down")` simulates user input.
- `await renderOnce()` or `await new Promise(...)` needed to allow layout/scroll updates.
- Verified scrolling by checking visibility of verses that are initially out of view.


### Future Improvements
- `ScrollBox` handles standard arrow keys (Up/Down/PageUp/PageDown).
- Custom key bindings (like `j`/`k`) require further investigation into OpenTUI event system (e.g. `on:keypress` or `useInput` hook).


## Navigation System Implementation
- **Global Key Handling**: implemented using `process.stdin` in raw mode with `readline.emitKeypressEvents`.
- **State Management**: Used `createSignal` in `App` component to manage `selectedSurahId` and `focusedPanel`.
- **Component Integration**:
  - Decoupled `SurahList` and `Reader` by lifting state to `App`.
  - Passed `focused` prop to components to visually indicate active panel.
  - Used `onSelect` callback in `SurahList` to update parent state.
- **TUI Focus**: Explicitly managing focus state allows better control than relying on implicit focus traversal, especially for specific shortcuts like Tab.


## Task 10: Bookmarks Feature (2026-02-08)

### Bookmark Data Layer (`src/data/bookmarks.ts`)
- Follows same pattern as `log.ts`: open DB → query → close in `finally`
- `INSERT OR IGNORE` for `addBookmark()` respects UNIQUE(surah, ayah) — silently skips duplicates
- `toggleBookmark()` composes `getBookmark()` + `addBookmark()`/`removeBookmark()` — no raw SQL needed
- `getBookmarkedAyahs(surahId)` returns `Set<number>` for O(1) lookup in render loop
- Each function opens/closes its own DB connection (consistent with `log.ts` pattern)

### Current Verse Tracking in App
- Added `currentVerseId` signal to App component (1-based, resets to 1 on surah change)
- `j`/`k` and arrow keys (when reader focused) navigate verse selection
- Bounds checking: `currentVerseId > 1` for up, `currentVerseId < surah.totalVerses` for down
- Current verse shown with `>` prefix and cyan color vs yellow for non-current

### Bookmark Toggle via Keyboard
- `b` key in reader panel toggles bookmark for `selectedSurahId:currentVerseId`
- After toggle, calls `refreshBookmarks()` to update `bookmarkedAyahs` signal
- `bookmarkedAyahs` Set passed as prop to Reader for `*` indicator rendering
- Wrapped DB calls in try/catch for environments where DB is unavailable (e.g. test render)

### Reader Component Changes
- New props: `currentVerseId` (number), `bookmarkedAyahs` (Set<number>)
- Verse label format: `{marker} [{surahId}:{verseId}]{bookmark}` where marker is `>` or ` ` and bookmark is ` *` or ``
- Props are optional with sensible defaults (currentVerseId defaults to 1, bookmarkedAyahs defaults to empty check)

### Testing Bookmarks
- **GOTCHA**: WAL journaling means file deletion doesn't fully clean the DB. Tests must `DELETE FROM bookmarks` instead of `unlinkSync(db_path)`.
- Set `XDG_DATA_HOME` env var before importing modules to control DB path in tests
- 17 bookmark tests, 46 expect() calls
- Covers: add, remove, toggle (round-trip), getAll, getBookmarkedAyahs (per-surah filtering), duplicate handling, shapes
- Streak calculation logic: straightforward date difference check on sorted unique dates (YYYY-MM-DD).
- SQLite date functions: used strftime('%Y-%m-%d', read_at) to extract date part.
- TUI components: built using @opentui/solid, leveraging intrinsic elements like <box> and <text>.
- CLI structure: simple argument parsing in src/index.ts, dispatching to handler functions.

## Task 12: Search Integration (2026-02-08)

### CLI Search Command (`handleSearch`)
- Pattern follows `handleRead`/`handleLog`: returns `{ ok, output }` for consistent exit code handling
- Multi-word search: uses `args.slice(1).join(" ")` instead of just `args[1]` to support queries like `search the merciful`
- Output format: `[surah:verse] translation` per line, preceded by result count header
- Edge cases: empty query → error to stderr, no results → error message, success → stdout with count

### TUI Search Mode (App key handler)
- **Search mode as state machine**: `isSearchMode` signal gates all key input
- When `isSearchMode === true`, ALL keypresses are intercepted for search input (no `q` quit, no `Tab` switch, etc.)
- `/` key enters search mode (sets `isSearchMode(true)`, focuses reader panel, clears input)
- **Enter**: executes `search(query)` from data layer, populates `searchResults` signal, exits search mode
- **ESC in search mode**: cancels search, clears input and results
- **ESC in normal mode**: clears existing search results (returns to surah view)
- **Backspace**: slices last char from `searchInput`
- **Printable chars**: appended only if `str.length === 1` and no ctrl/meta modifier (avoids capturing escape sequences)

### Reader Component Search Display
- New optional props: `searchResults`, `searchQuery`, `isSearchMode`, `searchInput`
- Three render modes: (1) search input active, (2) search results, (3) normal surah view
- Search results displayed in scrollbox with header showing count and query
- "Press ESC to return" hint shown below results header
- Panel title dynamically changes: "Search: _" during input, "Search: {query} (N results)" for results, surah name normally
- All new props are optional — existing tests pass without changes (backward compatible)

### Architecture Decision
- No `DialogPrompt` or `InputRenderable` from OpenTUI — no built-in text input widget found
- Implemented inline search input: simple `<text>` element showing `/{input}_` at top of reader
- This avoids external dependencies and keeps the implementation simple
- Search state (4 signals) lifted to App component, passed down as props to Reader

### Bug Fixes During Task
- Fixed duplicate `handleStreak()` function and duplicate `getReadingStats` import in `src/index.ts` (pre-existing issues from earlier tasks)
- Added `search` import to index.ts and `search`/`VerseRef` imports to app.tsx
