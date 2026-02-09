# Dynasty Themes Completion

## TL;DR

> **Quick Summary**: Complete the dynasty/era theme system by adding 5 missing Islamic dynasty themes (Umayyad, Abbasid, Fatimid, Seljuk, Mughal), implementing SQLite persistence so the chosen theme survives restarts, and adding a status bar showing the active dynasty name + era.
> 
> **Deliverables**:
> - 5 new dynasty theme definitions in `src/tui/theme.tsx`
> - User preferences SQLite persistence layer (`migrations/002_user_preferences.sql` + `src/data/preferences.ts`)
> - Theme persistence in `ThemeProvider` (load on init, save on cycle)
> - Status bar component showing active dynasty name + era
> - Updated README reflecting 11 themes
> 
> **Estimated Effort**: Short
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 2 → Task 3 → Task 4

---

## Context

### Original Request
Add 5 remaining Islamic dynasty themes (Umayyad, Abbasid, Fatimid, Seljuk, Mughal) to complete the original 10-theme plan. Persist the user's theme choice in SQLite so it loads on next launch. Add a status bar showing the active dynasty name and era.

### What's Already Implemented
The previous Sisyphus session completed significant foundational work:
- **Extended `Theme` interface** with `ThemeOrnaments`, `id`, `era`, `description`, `borderStyle`, `borderStyleFocused`
- **6 themes defined**: Madinah, Mamluk, Ottoman, Safavid, Andalusian, Maghribi
- **`THEMES` array**, `THEME_IDS`, and `cycleTheme()` in ThemeProvider
- **`T` key handler** in `app.tsx` calls `cycleTheme()`
- **All components** (Layout, Reader, HelpDialog) already consume theme ornaments
- **README** updated with `T` shortcut and 6 themes listed
- **ZIP file** unzipped to `ASCII_Quranic_Page_Ornamentation/`

### Interview Summary
**Key Discussions**:
- Theme cycling key: User originally wanted `d`, implementation settled on `T` (Shift+T) — already wired
- Theme scope: Colors + decorative Unicode chars (not just colors)
- Persistence: SQLite DB using key-value `user_preferences` table
- Theme indicator: Status bar / footer showing dynasty name + era
- Ornament-to-dynasty mapping from user's inline ASCII patterns + reference ZIP

**Research Findings**:
- `BorderStyle` type from `@opentui/core` is limited to `"single" | "double" | "rounded" | "heavy"` — only 4 options
- Migration system re-runs ALL `.sql` files on every `openDatabase()` call — MUST use `IF NOT EXISTS`
- `bookmarks.ts` open-close-per-call pattern is the established data access pattern
- bun:sqlite is synchronous — theme can be loaded before signal creation (no flash)

### Metis Review
**Identified Gaps** (all resolved):
- Migration idempotency → enforced via `CREATE TABLE IF NOT EXISTS` (same as `001_init.sql`)
- Mughal "wide/layered borders" impossible in OpenTUI → use `"double"` + `"heavy"` (distinctiveness via ornaments/colors)
- Corrupted preference value → fallback to `defaultTheme` if saved ID not in `THEME_IDS`
- DB unavailable during save → `try/catch`, same pattern as bookmarks (`app.tsx:43-47`)
- Theme flash on load → sync load before signal creation (bun:sqlite is sync)
- Status bar overlap with help dialog footer → acceptable (help dialog is modal/temporary)
- README count → update from "6 themes" to "11 themes"

---

## Work Objectives

### Core Objective
Complete the 10-dynasty theme system by adding 5 remaining themes and making the user's choice persistent across sessions, with a visible status indicator.

### Concrete Deliverables
- 5 new `Theme` objects in `src/tui/theme.tsx`: `umayyadTheme`, `abbasidTheme`, `fatimidTheme`, `seljukTheme`, `mughalTheme`
- `migrations/002_user_preferences.sql` — key-value preferences table
- `src/data/preferences.ts` — `getPreference()` / `setPreference()` functions
- Updated `ThemeProvider` in `src/tui/theme.tsx` — sync load + persist on cycle
- Status bar in `src/tui/components/layout.tsx` — 1-row bottom bar with dynasty info
- Updated `README.md` — 11 themes listed

### Definition of Done
- [x] `THEMES.length === 11` — all 11 dynasty themes defined and compile
- [x] Theme choice persists to SQLite and loads on restart
- [x] Status bar visible at bottom showing dynasty name + era
- [x] `bun test` passes with zero regressions

### Must Have
- All 5 new theme objects following exact `Theme` interface structure
- Each theme has historically-researched colors, ornaments, border styles
- Preference round-trip works (set → close → reopen → get returns same value)
- Graceful fallback to `defaultTheme` on corrupted/missing preference

### Must NOT Have (Guardrails)
- **DO NOT** modify any of the 6 existing theme objects (Madinah, Mamluk, Ottoman, Safavid, Andalusian, Maghribi)
- **DO NOT** change the `Theme` or `ThemeOrnaments` interface — it's frozen
- **DO NOT** add theme preview, import/export, or custom theme creation
- **DO NOT** add content beyond theme name + era to the status bar
- **DO NOT** add new theme-specific tests (follow existing coverage patterns — no theme tests exist)
- **DO NOT** change the `T` key handler in `app.tsx` — persistence belongs inside `cycleTheme()` in ThemeProvider
- **DO NOT** reorder existing themes in the `THEMES` array — append new themes after existing entries
- **DO NOT** use border styles other than `"single" | "double" | "rounded" | "heavy"`

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL verification is executed by the agent using tools. No human action permitted.

### Test Decision
- **Infrastructure exists**: YES (bun test, 8 test files)
- **Automated tests**: NO (follow existing patterns — no theme tests exist in codebase)
- **Framework**: bun test (for regression check only)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

All scenarios use `Bash` with `bun run --bun -e "..."` for programmatic verification, plus `interactive_bash` (tmux) for TUI visual verification where noted.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Add 5 dynasty theme definitions [no dependencies]
└── Task 2: Create migration + preferences module [no dependencies]

Wave 2 (After Wave 1):
└── Task 3: Update ThemeProvider for persistence [depends: 1, 2]

Wave 3 (After Wave 2):
├── Task 4: Add status bar to Layout [depends: 3 — needs theme().name]
└── Task 5: Update README [depends: 1 — needs final theme count/names]

Critical Path: Task 2 → Task 3
Parallel Speedup: ~35% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 5 | 2 |
| 2 | None | 3 | 1 |
| 3 | 1, 2 | 4 | None |
| 4 | 3 | None | 5 |
| 5 | 1 | None | 4 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|--------------------|
| 1 | 1, 2 | task(category="unspecified-low") — pattern-following data entry |
| 2 | 3 | task(category="unspecified-low") — small ThemeProvider edit |
| 3 | 4, 5 | task(category="quick") — small component + README edit |

---

## TODOs

- [x] 1. Add 5 missing dynasty theme definitions

  **What to do**:
  - Add 5 new `Theme` objects to `src/tui/theme.tsx`, following the **exact** structure of `mamlukTheme` (lines 73-107) as template
  - Each theme must populate ALL fields: `id`, `name`, `era`, `description`, `borderStyle`, `borderStyleFocused`, `ornaments` (8 fields), `colors` (15 fields)
  - Append all 5 to the `THEMES` array (after existing 6 entries, before `] as const`)
  - Use the dynasty-to-ornament mapping below for each theme's character choices
  - Use historically-researched color palettes for each dynasty

  **Dynasty Specifications**:

  **Umayyad (661-750 CE, Damascus)**:
  - Style: Early Islamic, austere, minimal — simple box-drawing
  - Colors: Gold, deep red/vermilion, earthy brown, sand/parchment
  - Ornaments: Simple characters — `▸`, `✦`, basic `─` dividers, `●` bullets
  - Border: `single` / `heavy` (early, minimal)

  **Abbasid (750-1258 CE, Baghdad)**:
  - Style: Golden Age richness — Sarlawh Complex pattern (▓▒░ shading)
  - Colors: Deep lapis lazuli blue, gold, emerald green
  - Ornaments: Rich characters — `▓▒░` in headerLeft/Right, `۞` section marker, `◆` focus
  - Border: `single` / `heavy` (monumental, scholarly)

  **Fatimid (909-1171 CE, Cairo)**:
  - Style: North African Shamsa Medallion — solar medallion ۞ motif
  - Colors: Gold on indigo, turquoise, white
  - Ornaments: `۞` as headerLeft/Right wrapper, medallion-style characters
  - Border: `rounded` / `heavy` (fluid North African)

  **Seljuk (1037-1194 CE, Isfahan/Konya)**:
  - Style: Kufic Geometric Frieze — half-blocks ▀▄█ for maze meander (Timurid/Banna'i)
  - Colors: Turquoise blue, cobalt, white, brick red
  - Ornaments: `▀▄█` block elements, geometric characters
  - Border: `single` / `heavy` (architectural, structural)

  **Mughal (1526-1857 CE, Delhi/Agra)**:
  - Style: Wide/layered borders — Indian subcontinent blend of Persian + Hindu
  - Colors: Gold, rich red, deep green, soft pink/rose
  - Ornaments: Layered/decorated characters, floral-adjacent Unicode
  - Border: `double` / `heavy` (closest approximation to "wide/layered" — OpenTUI only supports `single|double|rounded|heavy`)

  **Must NOT do**:
  - Do NOT modify any existing theme definitions (lines 73-327)
  - Do NOT change the `Theme` or `ThemeOrnaments` interface
  - Do NOT use border styles outside `"single" | "double" | "rounded" | "heavy"`
  - Do NOT reorder existing entries in the `THEMES` array

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Pure data entry following an established template — no logic, no architectural decisions
  - **Skills**: `[]`
    - No specialized skills needed — this is pattern replication
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not applicable — this is data definition, not UI rendering

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 5
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/tui/theme.tsx:73-107` — `mamlukTheme` as the template: exact field structure, JSDoc comment style, color naming conventions
  - `src/tui/theme.tsx:115-149` — `ottomanTheme` for Zencirek-style ornament characters (`╫╪═`)
  - `src/tui/theme.tsx:157-191` — `safavidTheme` for rounded/floral ornament style
  - `src/tui/theme.tsx:199-233` — `andalusianTheme` for single-line geometric ornaments
  - `src/tui/theme.tsx:241-275` — `maghribiTheme` for double-line braid ornaments
  - `src/tui/theme.tsx:321-328` — `THEMES` array where new themes must be appended

  **Type References** (contracts to implement against):
  - `src/tui/theme.tsx:9-26` — `ThemeOrnaments` interface: 8 required string fields
  - `src/tui/theme.tsx:28-60` — `Theme` interface: `id`, `name`, `era`, `description`, `borderStyle`, `borderStyleFocused`, `ornaments`, `colors` (15 fields)
  - `@opentui/core/lib/border.d.ts:15` — `BorderStyle = "single" | "double" | "rounded" | "heavy"` — ONLY these 4 values

  **Documentation References**:
  - `.sisyphus/drafts/dynasty-themes.md:31-41` — Dynasty list with dates and primary color notes
  - `.sisyphus/drafts/dynasty-themes.md:54-73` — Ornament-to-dynasty mapping from user's ASCII research

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY**

  - [x] TypeScript compiles without errors: `bun build src/tui/theme.tsx --no-bundle` → exit code 0
  - [x] Theme count is exactly 11:

  ```
  Scenario: All 11 themes defined and valid
    Tool: Bash
    Preconditions: Source files saved
    Steps:
      1. bun run --bun -e "
           import { THEMES, THEME_IDS } from './src/tui/theme.tsx';
           console.log('Count:', THEMES.length);
           console.log('IDs:', THEME_IDS.join(', '));
           const required = ['umayyad','abbasid','fatimid','seljuk','mughal'];
           for (const id of required) {
             const t = THEMES.find(t => t.id === id);
             if (!t) { console.error('MISSING:', id); process.exit(1); }
             if (!t.ornaments.verseMarker) { console.error('BAD ORNAMENTS:', id); process.exit(1); }
             if (!t.colors.primary) { console.error('BAD COLORS:', id); process.exit(1); }
             if (!t.era) { console.error('BAD ERA:', id); process.exit(1); }
           }
           console.log('All 11 themes valid');
         "
      2. Assert stdout contains "Count: 11"
      3. Assert stdout contains "All 11 themes valid"
      4. Assert exit code 0
    Expected Result: All 11 themes present with valid ornaments, colors, and era fields
    Evidence: Terminal output captured
  ```

  - [x] No regressions: `bun test` → all existing tests pass

  **Commit**: YES
  - Message: `feat(theme): add Umayyad, Abbasid, Fatimid, Seljuk, Mughal dynasty themes`
  - Files: `src/tui/theme.tsx`
  - Pre-commit: `bun test`

---

- [x] 2. Create user preferences persistence layer

  **What to do**:
  - Create `migrations/002_user_preferences.sql` with a generic key-value table
  - Create `src/data/preferences.ts` with `getPreference(key)` and `setPreference(key, value)` functions
  - Follow the **exact** open-close-per-call pattern from `bookmarks.ts`
  - Migration MUST use `CREATE TABLE IF NOT EXISTS` (migrations re-run on every `openDatabase()` call)

  **Migration schema**:
  ```sql
  CREATE TABLE IF NOT EXISTS user_preferences (
      key    TEXT PRIMARY KEY,
      value  TEXT NOT NULL
  );
  ```

  **Preferences API**:
  ```typescript
  // getPreference(key: string): string | null
  // setPreference(key: string, value: string): void
  // Uses INSERT OR REPLACE for upsert
  ```

  **Must NOT do**:
  - Do NOT add namespacing or complex key formats — just plain `"theme"` as the key
  - Do NOT add a migration tracking system — the existing re-run-all approach works fine
  - Do NOT add caching or connection pooling — follow bookmarks.ts open/close pattern exactly

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Two small files following well-established patterns — boilerplate work
  - **Skills**: `[]`
    - No specialized skills needed
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed — simple file creation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/data/bookmarks.ts:31-44` — `addBookmark()` as template: `openDatabase()` → `try { db.query(...).run(...) } finally { db.close() }` pattern
  - `src/data/bookmarks.ts:66-91` — `getBookmark()` as template for reading: cast `db.query(...).get()` result, return typed value or `null`
  - `src/data/db.ts:38-49` — `runMigrations()`: reads ALL `.sql` files, sorts alphabetically, runs `db.exec(sql)` — proves migrations must be idempotent
  - `src/data/db.ts:62-77` — `openDatabase()`: creates DB, enables WAL, runs migrations

  **Type References**:
  - `src/data/db.ts:62` — `openDatabase(dbPath?: string): Database` signature

  **Documentation References**:
  - `migrations/001_init.sql` — Full template for migration file format: header comment, `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY**

  - [x] Migration file exists and is syntactically valid
  - [x] Preferences module compiles and round-trips correctly:

  ```
  Scenario: Preference round-trip (set then get)
    Tool: Bash
    Preconditions: Source files saved
    Steps:
      1. bun run --bun -e "
           process.env.XDG_DATA_HOME = '/tmp/quran-pref-test-' + Date.now();
           const { getPreference, setPreference } = await import('./src/data/preferences.ts');
           const before = getPreference('theme');
           console.log('Before:', before);
           setPreference('theme', 'ottoman');
           const after = getPreference('theme');
           console.log('After:', after);
           console.assert(before === null, 'Should be null before set');
           console.assert(after === 'ottoman', 'Should be ottoman after set');
           setPreference('theme', 'abbasid');
           const updated = getPreference('theme');
           console.log('Updated:', updated);
           console.assert(updated === 'abbasid', 'Should be abbasid after update');
           console.log('Round-trip OK');
         "
      2. Assert stdout contains "Before: null"
      3. Assert stdout contains "After: ottoman"
      4. Assert stdout contains "Updated: abbasid"
      5. Assert stdout contains "Round-trip OK"
      6. Assert exit code 0
    Expected Result: Preferences can be created, read, and overwritten
    Evidence: Terminal output captured

  Scenario: Migration is idempotent (double openDatabase)
    Tool: Bash
    Preconditions: Source files saved
    Steps:
      1. bun run --bun -e "
           process.env.XDG_DATA_HOME = '/tmp/quran-idempotent-' + Date.now();
           const { openDatabase } = await import('./src/data/db.ts');
           const dbPath = '/tmp/quran-idempotent-test.db';
           const db1 = openDatabase(dbPath);
           db1.close();
           const db2 = openDatabase(dbPath);
           const info = db2.query(\"SELECT name FROM sqlite_master WHERE type='table' AND name='user_preferences'\").get();
           console.log('Table exists:', !!info);
           db2.close();
           console.log('Idempotent OK');
         "
      2. Assert stdout contains "Table exists: true"
      3. Assert stdout contains "Idempotent OK"
      4. Assert exit code 0 (no crash on second migration run)
    Expected Result: Migration creates table and doesn't crash on re-run
    Evidence: Terminal output captured
  ```

  - [x] No regressions: `bun test` → all existing tests pass

  **Commit**: YES
  - Message: `feat(data): add user preferences persistence layer`
  - Files: `migrations/002_user_preferences.sql`, `src/data/preferences.ts`
  - Pre-commit: `bun test`

---

- [x] 3. Update ThemeProvider for persistence (load + save)

  **What to do**:
  - Modify `ThemeProvider` in `src/tui/theme.tsx` to:
    1. **On init (before `createSignal`)**: Synchronously read saved theme from DB via `getPreference("theme")`, find matching theme in `THEMES`, use as initial signal value (fallback to `defaultTheme` if not found or DB error)
    2. **On `cycleTheme()`**: After setting the new theme signal, persist the new theme's `id` via `setPreference("theme", next.id)` — wrapped in `try/catch` so cycling never breaks even if DB write fails
  - Import `getPreference` and `setPreference` from `../data/preferences.ts`
  - The sync load prevents any "flash" of default theme before saved theme loads

  **Implementation approach**:
  ```typescript
  // Before createSignal — sync load
  let initialTheme = defaultTheme;
  try {
    const savedId = getPreference("theme");
    if (savedId) {
      const found = THEMES.find(t => t.id === savedId);
      if (found) initialTheme = found;
    }
  } catch {
    // DB may not be available (tests, etc.)
  }
  const [theme, setTheme] = createSignal<Theme>(initialTheme);

  // In cycleTheme — persist after cycle
  const cycleTheme = () => {
    const current = theme();
    const idx = THEMES.findIndex(t => t.id === current.id);
    const next = THEMES[(idx + 1) % THEMES.length] ?? THEMES[0]!;
    setTheme(next);
    try { setPreference("theme", next.id); } catch { /* DB may not be available */ }
  };
  ```

  **Must NOT do**:
  - Do NOT use `onMount` for loading — load synchronously before signal creation (no flash)
  - Do NOT add async logic — bun:sqlite is synchronous
  - Do NOT change the `ThemeContextType` interface — `theme()`, `setTheme()`, `cycleTheme()` signatures stay the same
  - Do NOT modify the `T` key handler in `app.tsx` — persistence is encapsulated in `cycleTheme()`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Small surgical edit to one function in one file — ~15 lines changed
  - **Skills**: `[]`
    - No specialized skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential)
  - **Blocks**: Task 4
  - **Blocked By**: Tasks 1 and 2

  **References**:

  **Pattern References** (existing code to follow):
  - `src/tui/theme.tsx:346-361` — Current `ThemeProvider` component: this is the exact code to modify
  - `src/tui/theme.tsx:349-354` — Current `cycleTheme()` function: add `setPreference()` call after `setTheme(next)`
  - `src/tui/app.tsx:42-47` — `refreshBookmarks()` try/catch pattern for DB error handling: follow this exactly for preference loading

  **API References** (functions to import and use):
  - `src/data/preferences.ts` — `getPreference(key: string): string | null` and `setPreference(key: string, value: string): void` (created in Task 2)
  - `src/tui/theme.tsx:321-328` — `THEMES` array used for `find()` lookup of saved theme ID
  - `src/tui/theme.tsx:332` — `defaultTheme` used as fallback

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY**

  - [x] TypeScript compiles: `bun build src/tui/theme.tsx --no-bundle` → exit code 0
  - [x] Theme persistence integration works:

  ```
  Scenario: Theme persists across simulated restarts
    Tool: Bash
    Preconditions: Tasks 1 and 2 complete
    Steps:
      1. bun run --bun -e "
           process.env.XDG_DATA_HOME = '/tmp/quran-persist-' + Date.now();
           const { setPreference, getPreference } = await import('./src/data/preferences.ts');
           const { THEMES } = await import('./src/tui/theme.tsx');
           // Simulate cycleTheme persisting
           setPreference('theme', 'ottoman');
           const saved = getPreference('theme');
           const found = THEMES.find(t => t.id === saved);
           console.log('Saved ID:', saved);
           console.log('Found theme:', found?.name);
           console.assert(saved === 'ottoman', 'Should persist ottoman');
           console.assert(found?.name === 'Ottoman', 'Should find Ottoman theme');
           console.log('Persistence OK');
         "
      2. Assert stdout contains "Saved ID: ottoman"
      3. Assert stdout contains "Found theme: Ottoman"
      4. Assert stdout contains "Persistence OK"
    Expected Result: Saved theme ID maps to correct theme object
    Evidence: Terminal output captured

  Scenario: Corrupted preference falls back gracefully
    Tool: Bash
    Preconditions: Tasks 1 and 2 complete
    Steps:
      1. bun run --bun -e "
           process.env.XDG_DATA_HOME = '/tmp/quran-corrupt-' + Date.now();
           const { setPreference, getPreference } = await import('./src/data/preferences.ts');
           const { THEMES, defaultTheme } = await import('./src/tui/theme.tsx');
           setPreference('theme', 'nonexistent_garbage');
           const saved = getPreference('theme');
           const found = THEMES.find(t => t.id === saved);
           console.log('Found:', found ?? 'null');
           console.log('Fallback:', (found ?? defaultTheme).name);
           console.assert(!found, 'Should not find garbage ID');
           console.assert((found ?? defaultTheme).name === 'Madinah', 'Should fallback to Madinah');
           console.log('Fallback OK');
         "
      2. Assert stdout contains "Found: null"
      3. Assert stdout contains "Fallback: Madinah"
      4. Assert stdout contains "Fallback OK"
    Expected Result: Invalid preference value falls back to default theme
    Evidence: Terminal output captured
  ```

  - [x] No regressions: `bun test` → all existing tests pass

  **Commit**: YES (groups with Task 4)
  - Message: `feat(theme): persist theme choice to SQLite`
  - Files: `src/tui/theme.tsx`
  - Pre-commit: `bun test`

---

- [x] 4. Add status bar component to Layout

  **What to do**:
  - Add a 1-row-height status bar at the bottom of the Layout component in `src/tui/components/layout.tsx`
  - The status bar shows the active theme's `name` and `era` — e.g. `◆ Ottoman — Istanbul 1299–1922 ◆`
  - Use `theme().ornaments.focusIcon` as flanking character
  - Use `theme().colors.statusBar` as background, `theme().colors.muted` or `theme().colors.secondary` for text
  - The status bar is always visible (not toggleable)

  **Implementation approach**:
  - Wrap Layout's return in a column flexbox: main content (flexGrow=1) + status bar (height=1)
  - Status bar is a simple `<box>` with `<text>` inside

  ```tsx
  // Change Layout return structure:
  <box flexDirection="column" width="100%" height="100%">
    {/* Existing row layout (sidebar + content) */}
    <box flexDirection="row" width="100%" flexGrow={1}>
      {/* ... existing sidebar + children ... */}
    </box>
    {/* Status bar */}
    <box height={1} width="100%">
      <text color={theme().colors.secondary}>
        {` ${theme().ornaments.focusIcon} ${theme().name} — ${theme().era} ${theme().ornaments.focusIcon} `}
      </text>
    </box>
  </box>
  ```

  **Must NOT do**:
  - Do NOT add surah, verse, bookmark count, or any other information to the status bar — ONLY theme name + era
  - Do NOT make the status bar toggleable
  - Do NOT create a separate component file — inline it in `layout.tsx` (it's 5 lines)
  - Do NOT change existing Layout props interface

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: ~10-line surgical edit to one file
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: None
  - **Blocked By**: Task 3

  **References**:

  **Pattern References** (existing code to follow):
  - `src/tui/components/layout.tsx:14-45` — Current Layout component: this is the code to modify
  - `src/tui/components/layout.tsx:29` — Example of accessing `theme().ornaments.focusIcon` in a title string
  - `src/tui/components/help-dialog.tsx:67-69` — Example of displaying `theme().name` and `theme().era` together

  **Type References**:
  - `src/tui/theme.tsx:28-60` — `Theme` interface: `name` (string), `era` (string), `colors.statusBar` (string), `ornaments.focusIcon` (string)
  - `src/tui/components/layout.tsx:7-12` — `LayoutProps` interface: do NOT modify

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY**

  - [x] TypeScript compiles: `bun build src/tui/components/layout.tsx --no-bundle` → exit code 0
  - [x] Status bar renders with theme info:

  ```
  Scenario: Status bar shows dynasty name and era in TUI
    Tool: interactive_bash (tmux)
    Preconditions: All tasks 1-3 complete, app runs without errors
    Steps:
      1. tmux new-session -d -s quran-test -x 120 -y 35
      2. tmux send-keys -t quran-test 'bun run src/index.ts' Enter
      3. Wait 3 seconds for TUI to render
      4. tmux capture-pane -t quran-test -p > /tmp/quran-statusbar.txt
      5. Assert /tmp/quran-statusbar.txt contains "Madinah" (default theme name)
      6. Assert /tmp/quran-statusbar.txt contains "Modern" (default theme era)
      7. tmux send-keys -t quran-test 'q'
    Expected Result: Bottom row of TUI shows "◆ Madinah — Modern ◆"
    Evidence: /tmp/quran-statusbar.txt

  Scenario: Status bar updates when theme cycles
    Tool: interactive_bash (tmux)
    Preconditions: TUI running
    Steps:
      1. tmux new-session -d -s quran-cycle -x 120 -y 35
      2. tmux send-keys -t quran-cycle 'bun run src/index.ts' Enter
      3. Wait 3 seconds
      4. tmux send-keys -t quran-cycle 'T'
      5. Wait 1 second
      6. tmux capture-pane -t quran-cycle -p > /tmp/quran-cycle.txt
      7. Assert /tmp/quran-cycle.txt contains "Mamluk" (next theme after Madinah)
      8. tmux send-keys -t quran-cycle 'q'
    Expected Result: Status bar updates to show new dynasty after pressing T
    Evidence: /tmp/quran-cycle.txt
  ```

  - [x] No regressions: `bun test` → all existing tests pass

  **Commit**: YES (groups with Task 3)
  - Message: `feat(ui): add dynasty status bar to layout`
  - Files: `src/tui/components/layout.tsx`
  - Pre-commit: `bun test`

---

- [x] 5. Update README with all 11 themes

  **What to do**:
  - Update `README.md` "Dynasty Themes" bullet: change "6 themes" to "11 themes"
  - Update the theme list to include all 11 dynasty names
  - Update the keyboard shortcuts table `T` row to reflect "11 themes" instead of current list of 6

  **Must NOT do**:
  - Do NOT restructure the README
  - Do NOT add screenshots or detailed descriptions of each theme

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Two-line text edit in README
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 4)
  - **Blocks**: None
  - **Blocked By**: Task 1 (needs final theme names)

  **References**:

  **Pattern References**:
  - `README.md` line with "Dynasty Themes: 6 themes" — update count and list
  - `README.md` keyboard shortcuts table, `T` row — update theme list

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY**

  ```
  Scenario: README reflects 11 themes
    Tool: Bash
    Preconditions: README.md updated
    Steps:
      1. grep -c "11 themes" README.md
      2. Assert count >= 1
      3. grep "Umayyad" README.md
      4. Assert match found
      5. grep "Mughal" README.md
      6. Assert match found
    Expected Result: README mentions 11 themes and lists all dynasty names
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `docs: update README with all 11 dynasty themes`
  - Files: `README.md`
  - Pre-commit: `bun test`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(theme): add Umayyad, Abbasid, Fatimid, Seljuk, Mughal dynasty themes` | `src/tui/theme.tsx` | `bun test` |
| 2 | `feat(data): add user preferences persistence layer` | `migrations/002_user_preferences.sql`, `src/data/preferences.ts` | `bun test` |
| 3+4 | `feat(theme): persist theme choice and add dynasty status bar` | `src/tui/theme.tsx`, `src/tui/components/layout.tsx` | `bun test` |
| 5 | `docs: update README with all 11 dynasty themes` | `README.md` | `bun test` |

---

## Success Criteria

### Verification Commands
```bash
bun test                                    # All existing tests pass
bun run --bun -e "import { THEMES } from './src/tui/theme.tsx'; console.log(THEMES.length)"  # Expected: 11
bun run src/index.ts                        # TUI launches, shows status bar, T cycles through 11 themes
```

### Final Checklist
- [x] All 11 dynasty themes defined and compile
- [x] Preferences round-trip works (set → get)
- [x] Migration is idempotent (no crash on re-run)
- [x] ThemeProvider loads saved theme on init (sync, no flash)
- [x] ThemeProvider persists theme on cycle (with try/catch fallback)
- [x] Status bar visible at bottom of TUI showing dynasty name + era
- [x] Status bar updates when theme cycles
- [x] README lists 11 themes
- [x] `bun test` passes with zero regressions
- [x] All "Must NOT Have" guardrails respected
