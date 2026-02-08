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
