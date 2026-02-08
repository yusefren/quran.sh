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
