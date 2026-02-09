# Product Requirements Document: quran.sh

> A fast, offline-first Quran CLI and TUI reader built with Bun and TypeScript.

---

## 1. Overview

**quran.sh** is a terminal-native Quran reader that provides both a quick-access CLI for verse lookups and an immersive, multi-pane Terminal User Interface (TUI) for sustained reading and study. It is designed to be the first serious TypeScript TUI for the Quran -- combining modern developer tooling with classical Islamic aesthetics.

The product ships as a single npm package (`quran.sh`) installable globally via `npm install -g quran.sh` or `bun install -g quran.sh`, exposing the `quran` command.

---

## 2. Problem Statement

Existing Quran CLI tools are limited to basic text output. No existing tool offers:

- A multi-pane interactive terminal reader
- Reading streak tracking and gamification
- Personal annotations or reflections attached to verses
- Quick-navigation cue slots
- Theming systems that honor Islamic manuscript traditions
- Offline-first operation with bundled data

quran.sh fills this gap by providing a fully offline, keyboard-driven, aesthetically rich Quran study environment in the terminal.

---

## 3. Target Users

| Persona | Description |
|---------|-------------|
| **Muslim developers** | Engineers who spend most of their time in terminals and want quick Quran access without switching contexts |
| **Terminal enthusiasts** | Users who prefer keyboard-driven workflows and appreciate well-designed TUI applications |
| **Quran students** | Individuals studying the Quran who want to take notes, bookmark verses, and track reading consistency |
| **CLI power users** | Users who want to pipe, grep, or script against Quran text data |

---

## 4. Product Goals

1. **Offline-first**: All Quranic text is bundled -- zero network dependency for core reading
2. **Dual interface**: Fast CLI for quick lookups + immersive TUI for deep reading
3. **Reading accountability**: Streak tracking gamifies daily reading consistency
4. **Personal study**: Bookmarks, reflections, and cues make the Quran a personalized study tool
5. **Cultural authenticity**: Dynasty themes connect the UI to 1300+ years of Islamic manuscript art
6. **Keyboard-native**: Every action is reachable through keyboard shortcuts

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Runtime** | Bun | Fast startup, built-in SQLite, TypeScript-native |
| **Language** | TypeScript (strict) | Type safety across the entire codebase |
| **TUI Framework** | OpenTUI (`@opentui/core` + `@opentui/solid`) | Zig-powered renderer, Yoga flexbox layout, production-proven (powers OpenCode) |
| **Reactive UI** | Solid.js | Fine-grained reactivity, minimal overhead, JSX-based |
| **Layout Engine** | Yoga (`yoga-layout`) | CSS Flexbox semantics in the terminal |
| **Data Source** | `quran-json` | Offline-bundled JSON with 114 surahs, 6236 verses, 10 languages |
| **Local Storage** | `bun:sqlite` | XDG-compliant local database for user data |
| **BiDi Support** | `bidi-js` (optional) | Arabic text direction handling (passthrough strategy) |

### 5.2 Project Structure

```
quran.sh/
  src/
    index.ts                              # Entry point: CLI router + TUI launcher
    data/
      db.ts                               # SQLite setup, WAL mode, migrations
      quran.ts                            # Quran text data access (lazy, cached)
      bookmarks.ts                        # Bookmark CRUD
      log.ts                              # Reading log persistence
      streaks.ts                          # Streak calculation engine
      reflections.ts                      # Personal notes CRUD
      cues.ts                             # Quick-navigation slot CRUD (1-9)
      preferences.ts                      # Key-value user settings store
    tui/
      app.tsx                             # Root component, global state, keyboard handler
      router.tsx                          # Context-based route provider
      theme.tsx                           # 11 dynasty themes + light/dark derivation
      mode.tsx                            # Light/Dark/Auto color mode management
      components/
        layout.tsx                        # 3-column responsive layout
        reader.tsx                        # Multi-pane Quran text viewer
        surah-list.tsx                    # Surah selection with fuzzy search
        command-palette.tsx               # Searchable command overlay (Ctrl+P)
        help-dialog.tsx                   # Keyboard shortcut reference
        reflection-dialog.tsx             # Note input dialog
        streak-chart.tsx                  # ASCII activity heatmap
        panel.tsx                         # Tabbed sidebar (Bookmarks/Cues/Reflections)
      utils/
        rtl.ts                            # RTL text utilities
  migrations/
    001_init.sql                          # reading_log + bookmarks schema
    002_user_preferences.sql              # Key-value preferences
    003_cues_reflections.sql              # Cue slots + reflections schema
  test/                                   # Integration tests
  scripts/                                # Data verification scripts
  demos/                                  # Demo recording automation
```

### 5.3 Data Flow

```
CLI args?
  |
  +-- YES --> Parse command (read|log|search|streak) --> stdout --> exit
  |
  +-- NO  --> render(() => <App />) --> TUI loop
                  |
                  +-- ModeProvider (light/dark/auto)
                       |
                       +-- ThemeProvider (11 dynasty themes)
                            |
                            +-- RouteProvider
                                 |
                                 +-- AppContent (global state + keyboard)
                                      |
                                      +-- Layout (sidebar | reader | panel)
```

---

## 6. Feature Specifications

### 6.1 CLI Interface

The CLI provides stateless, scriptable access to Quran data and reading tracking.

#### 6.1.1 `quran read <ref>`

Read a surah or verse and output to stdout.

| Input Format | Example | Behavior |
|-------------|---------|----------|
| Surah number | `quran read 1` | Outputs all verses of Al-Fatihah |
| Surah name | `quran read al-fatihah` | Case-insensitive transliteration match |
| Verse reference | `quran read 2:255` | Outputs single verse (Ayat al-Kursi) |

**Output format:**
```
Surah 1: Al-Fatihah (The Opener)

In the name of Allah, the Most Gracious, the Most Merciful.
All praise is for Allah, Lord of all worlds,
...
```

**Error cases:** Invalid surah number/name, invalid verse reference, out-of-range verse.

#### 6.1.2 `quran search <query>`

Full-text search across English translations.

- Case-insensitive substring matching
- Searches all 6236 verses
- Returns `[surah:verse] translation` format
- Displays result count
- Exits with code 1 if no results

#### 6.1.3 `quran log <ref>`

Record reading progress.

| Input | Behavior |
|-------|----------|
| `quran log 2:255` | Logs single verse |
| `quran log 1` | Logs all 7 verses of Al-Fatihah (transactional) |
| `quran log al-fatihah` | Same, by name |

Each verse gets its own `reading_log` row with timestamp for granular streak tracking.

#### 6.1.4 `quran streak`

Display reading statistics:
- Current streak (consecutive days)
- Longest streak (all-time)
- Total reading days

#### 6.1.5 `quran --help`

Usage reference with command list, reference formats, and examples.

---

### 6.2 TUI Interface

The TUI launches when `quran` is invoked with no arguments.

#### 6.2.1 Layout Architecture

The TUI uses a responsive 3-column layout:

```
+------------------+--------------------+------------------+
|    SIDEBAR       |      READER        |     PANEL        |
|    (25%)         |    (50-100%)       |    (25%)         |
|                  |                    |                  |
| Streak Chart     | Arabic    (top 50%)| Bookmarks tab    |
| (top 25%)        |                    | Cues tab         |
|                  | Translation  (bot) | Reflections tab  |
| Surah List       | Transliteration    |                  |
| (bottom 75%)     |                    |                  |
+------------------+--------------------+------------------+
| Status Bar: Theme name | Era | Color Mode               |
+----------------------------------------------------------+
```

- **Sidebar**: Toggleable (`s`). Contains streak chart (top 25%) and surah list (bottom 75%)
- **Reader**: Expands to fill available space. Contains up to 3 sub-panes
- **Panel**: Toggleable (`B`). Activity panel with 3 tabs
- **Status Bar**: 1-line footer showing current theme name, era, and color mode

Width is dynamically recalculated: reader gets 100% minus any visible sidebars (each 25%).

#### 6.2.2 Reader Component

The reader displays Quranic text in up to 3 simultaneously scrollable panes:

| Pane | Position | Toggle | Color |
|------|----------|--------|-------|
| Arabic | Top 50% | `a` | Theme `arabic` color (typically gold) |
| Translation | Bottom-left | `t` | Theme `translation` color |
| Transliteration | Bottom-right | `r` | Theme `transliteration` color |

**Behaviors:**
- Panes can be independently shown/hidden
- All visible panes scroll synchronously when navigating verses
- Auto-scroll centers the current verse in each scrollbox
- Arabic text is right-aligned with RTL rendering
- Current verse is highlighted with the theme's `highlight` color
- Bookmarked verses show a themed bookmark icon
- Verse numbers display as `[surah:verse]` with verse marker prefix

**Verse Spacing:**
- Adjustable with `+` / `-` (range: 0-5 lines padding)

**Search Mode:**
- Activated by `/`
- Inline search input replaces the reader header
- On `Enter`, results replace the reader content with a scrollable list
- `ESC` dismisses search results and returns to surah view

#### 6.2.3 Surah List

A scrollable list of all 114 surahs with:
- Surah number, transliterated name, and Arabic name
- Fuzzy text filtering while sidebar is focused
- Uses OpenTUI's native `<select>` component
- `Enter` to select and load a surah into the reader
- Resets verse position to 1 on surah change

#### 6.2.4 Streak Chart

An ASCII-based 28-day activity heatmap displayed in the sidebar:
- Uses Unicode block characters (`░` `▓` `█`) for intensity
- Color-coded by theme colors (muted, primary, header, highlight)
- Displays current streak and longest streak as numbers
- Data sourced from `reading_log` table aggregated by date

#### 6.2.5 Activity Panel (Right Sidebar)

A tabbed panel with 3 views:

| Tab | Content | Data Source |
|-----|---------|-------------|
| **Bookmarks** | List of bookmarked verse refs with optional labels | `bookmarks` table |
| **Cues** | Slots 1-9 showing assigned verse refs | `cues` table |
| **Reflections** | Verse refs with truncated note previews (20 chars) | `reflections` table |

**Navigation:**
- `h`/`l` or `Left`/`Right` to switch tabs
- `j`/`k` or `Up`/`Down` to browse items
- `Enter` to jump the reader to the selected verse
- `Enter` on a reflection also opens the reflection dialog for editing

#### 6.2.6 Command Palette

Triggered by `Ctrl+P`. A full-screen overlay listing all available commands:
- Navigable with `j`/`k` or arrow keys
- `Enter` to execute the selected command
- `ESC` to dismiss
- Each command shows a key shortcut, label, and description

**Available commands:** Toggle Arabic, Toggle Translation, Toggle Transliteration, Cycle Language, Cycle Mode, Cycle Theme, Toggle Sidebar, Toggle Panel, Increase/Decrease Spacing, Toggle Bookmark, Add Reflection, Cycle Focus, Search, Help, Quit.

#### 6.2.7 Help Dialog

Triggered by `?`. A full-screen overlay showing a formatted table of all keyboard shortcuts organized by category: Navigation, Toggles, Actions, Visuals.

Dismissed by `ESC`, `q`, or `?`.

#### 6.2.8 Reflection Dialog

Triggered by `R`. An inline text input dialog for adding/editing personal notes on the current verse.

- Auto-fills with existing reflection text if one exists
- Character-by-character input with backspace support
- `Enter` to save (persists to `reflections` table)
- `ESC` to cancel
- Flash message confirms save ("Reflection saved")

#### 6.2.9 Flash Messages

Temporary overlay in the bottom-right corner for action feedback:
- Appears for 2 seconds then auto-dismisses
- Used for: cue set/jump confirmation, reflection saved, etc.
- Styled with theme `secondary` color on `background`

---

### 6.3 Keyboard Shortcut Map

#### Global Shortcuts (always active)

| Key | Action |
|-----|--------|
| `q` | Quit |
| `?` | Toggle help dialog |
| `Ctrl+P` | Toggle command palette |
| `Tab` | Cycle focus between visible panes |
| `s` | Toggle sidebar visibility |
| `B` | Toggle right panel visibility |
| `a` | Toggle Arabic pane |
| `t` | Toggle Translation pane |
| `r` | Toggle Transliteration pane |
| `l` | Cycle translation language (bn, en, es, fr, id, ru, sv, tr, ur, zh) |
| `T` | Cycle dynasty theme |
| `D` | Cycle color mode (auto -> dark -> light) |
| `R` | Open reflection dialog for current verse |
| `+` / `=` | Increase verse spacing (max 5) |
| `-` | Decrease verse spacing (min 0) |
| `/` | Enter search mode |
| `ESC` | Clear search results / dismiss dialogs |

#### Reader Pane Shortcuts (when a reader pane is focused)

| Key | Action |
|-----|--------|
| `j` / `Down` | Next verse |
| `k` / `Up` | Previous verse |
| `b` | Toggle bookmark on current verse |
| `h` | Show help |
| `1`-`9` | Jump to cue slot |
| `!` `@` `#` `$` `%` `^` `&` `*` `(` | Set cue 1-9 to current verse |

#### Panel Shortcuts (when panel is focused)

| Key | Action |
|-----|--------|
| `h` / `Left` | Previous tab |
| `l` / `Right` | Next tab |
| `j` / `Down` | Next item |
| `k` / `Up` | Previous item |
| `Enter` | Jump to verse / edit reflection |

#### Modal Priority (highest to lowest)

1. Command Palette
2. Reflection Dialog
3. Help Dialog
4. Search Mode
5. Normal mode

---

### 6.4 Theme System

#### 6.4.1 Dynasty Themes

11 themes inspired by Islamic manuscript illumination traditions, each with historically accurate color palettes:

| Theme | Era | Primary Accent | Signature |
|-------|-----|---------------|-----------|
| **Madinah** (default) | Modern | Green + Teal | Spiritual green, the classic default |
| **Mamluk** | Cairo 1250-1517 | Lapis Blue + Gold | Geometric monumentality |
| **Ottoman** | Istanbul 1299-1922 | Navy Cobalt + Gold | Zencirek chain borders |
| **Safavid** | Isfahan 1501-1736 | Royal Blue + Rose | Cloud-band florals |
| **Andalusian** | Cordoba 711-1492 | Azurite + Terracotta | Zellige geometry |
| **Maghribi** | Fez 12th-19th c. | Indigo + Ochre | Braided knotwork |
| **Umayyad** | Damascus 661-750 | Gold + Vermilion | Desert austerity |
| **Abbasid** | Baghdad 750-1258 | Lapis + Emerald | Golden Age splendour |
| **Fatimid** | Cairo 909-1171 | Indigo + Gold | Shamsa medallions |
| **Seljuk** | Isfahan/Konya 1037-1194 | Turquoise + Cobalt | Kufic frieze |
| **Mughal** | Delhi/Agra 1526-1857 | Red + Gold | Layered florals |

#### 6.4.2 Theme Structure

Each theme defines:

**Colors (14 semantic tokens):**
- `primary`, `secondary` -- accent colors
- `background`, `text` -- base colors
- `border`, `borderFocused` -- panel borders
- `highlight`, `muted` -- emphasis and de-emphasis
- `arabic`, `translation`, `transliteration` -- text-type-specific colors
- `verseNum`, `bookmark`, `header`, `statusBar` -- UI element colors

**Ornaments (9 decorative characters):**
- `verseMarker` -- prefix for the focused verse
- `bookmarkIcon` -- indicator for bookmarked verses
- `headerLeft` / `headerRight` -- decorative flanking for surah titles
- `dividerUnit` -- horizontal divider pattern
- `sectionMarker` -- Rub el Hizb (U+06DE)
- `bullet` -- list item prefix
- `focusIcon` -- panel title prefix when focused
- `scrollbarThumb` -- scrollbar character

**Border styles:**
- Default border style (single, rounded, double)
- Focused border style (heavy, double)
- Optional custom border characters

#### 6.4.3 Light Mode Derivation

Instead of hand-crafting 22 color sets (11 themes x 2 modes), light palettes are **algorithmically derived** from dark palettes:

- Cool themes (Mamluk, Ottoman, Madinah, Fatimid, Seljuk, Abbasid) get a cool white background (`#F5F7FA`)
- Warm themes get a warm white background (`#FAF8F5`)
- Accent colors (`primary`, `secondary`) are preserved
- Text-like colors are darkened for contrast
- Borders and status bars are mixed with white

#### 6.4.4 Color Mode System

Three modes cycled with `D`:

| Mode | Behavior |
|------|----------|
| `auto` | Detects terminal background via `COLORFGBG` env var |
| `dark` | Forces dark palette |
| `light` | Forces light palette |

Mode preference is persisted to SQLite (`user_preferences` table, key: `color_mode`).
Theme preference is persisted similarly (key: `theme`).

---

### 6.5 Data Layer

#### 6.5.1 Quran Text Access

**Source:** `quran-json` npm package (bundled, offline)

**Capabilities:**
- Lazy per-chapter loading from `quran-json/dist/chapters/{lang}/{id}.json`
- Per-chapter cache keyed by `${language}:${chapterId}` to avoid re-reads
- Lightweight chapter index for name-to-ID resolution (no verse data loaded)
- Monolithic English data loaded only for search (`quran_en.json`)

**Supported languages:** Bengali (`bn`), English (`en`), Spanish (`es`), French (`fr`), Indonesian (`id`), Russian (`ru`), Swedish (`sv`), Turkish (`tr`), Urdu (`ur`), Chinese (`zh`)

**Public API:**
- `getSurah(id: number | string, language?: string): Surah | null`
- `getVerse(ref: string, language?: string): VerseRef | null`
- `search(query: string): VerseRef[]`

All verse numbering is 1-based to match Islamic scholarly convention.

#### 6.5.2 SQLite Database

**Location:** `~/.local/share/quran.sh/quran.db` (XDG-compliant, overridable via `XDG_DATA_HOME`)

**Configuration:**
- WAL mode enabled for crash resilience and read concurrency
- Foreign keys enabled
- Migrations run automatically on open (idempotent `CREATE TABLE IF NOT EXISTS`)

**Connection pattern:** Each data module opens and closes its own connection per call. This prevents long-lived locks and simplifies testing with temporary database paths.

#### 6.5.3 Database Schema

```sql
-- Migration 001: Core tables
CREATE TABLE reading_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    surah       INTEGER NOT NULL,              -- 1-114
    ayah        INTEGER NOT NULL,              -- 1-based verse number
    verse_ref   TEXT    NOT NULL,              -- "2:255" canonical format
    read_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    duration_s  INTEGER,                       -- Optional duration tracking
    UNIQUE(surah, ayah, read_at)
);

CREATE TABLE bookmarks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    surah       INTEGER NOT NULL,
    ayah        INTEGER NOT NULL,
    verse_ref   TEXT    NOT NULL,
    label       TEXT,                          -- Optional user label
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE(surah, ayah)                        -- One bookmark per verse
);

-- Migration 002: Preferences
CREATE TABLE user_preferences (
    key    TEXT PRIMARY KEY,
    value  TEXT NOT NULL
);

-- Migration 003: Cues and Reflections
CREATE TABLE cues (
    slot     INTEGER PRIMARY KEY CHECK(slot BETWEEN 1 AND 9),
    surah    INTEGER NOT NULL,
    ayah     INTEGER NOT NULL,
    verse_ref TEXT NOT NULL,
    set_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE reflections (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    surah      INTEGER NOT NULL,
    ayah       INTEGER NOT NULL,
    verse_ref  TEXT NOT NULL,
    note       TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE(surah, ayah)
);
```

**Indexes:**
- `idx_reading_log_verse` on `reading_log(surah, ayah)`
- `idx_reading_log_time` on `reading_log(read_at)`
- `idx_bookmarks_verse` on `bookmarks(surah, ayah)`
- `idx_reflections_verse` on `reflections(surah, ayah)`

---

### 6.6 Streak Engine

The streak system tracks reading consistency by analyzing the `reading_log` table.

**Algorithm (`calculateStreaks`):**

1. Extract unique dates from `reading_log` (`strftime('%Y-%m-%d', read_at)`)
2. Sort and deduplicate dates
3. **Longest streak:** Walk forward through dates; increment counter when consecutive days differ by exactly 1; track maximum
4. **Current streak:** Walk backward from the last date; streak is active only if the last read date is today or yesterday

**Activity grid:** A `Record<string, number>` mapping dates to reading event counts, used by the streak chart component.

**Output (`StreakStats`):**
- `currentStreak: number` -- days in the active streak
- `longestStreak: number` -- all-time best
- `totalDays: number` -- total unique reading days
- `lastReadDate: string | null` -- most recent reading date
- `activityGrid: Record<string, number>` -- date-to-count mapping

---

### 6.7 Bookmark System

**Constraint:** One bookmark per verse (`UNIQUE(surah, ayah)`).

**Operations:**
- `addBookmark(surahId, ayahId, verseRef, label?)` -- `INSERT OR IGNORE`
- `removeBookmark(surahId, ayahId)` -- `DELETE`
- `toggleBookmark(surahId, ayahId, verseRef, label?)` -- Add/remove toggle, returns `true` if added
- `getBookmark(surahId, ayahId)` -- Single lookup
- `getAllBookmarks()` -- Ordered by creation (newest first)
- `getBookmarkedAyahs(surahId)` -- Returns `Set<number>` for O(1) rendering checks

---

### 6.8 Cue System (Quick Navigation Slots)

9 persistent slots for instant verse jumping.

**Setting cues:** `Shift+1` through `Shift+9` (`!@#$%^&*(`) assigns the current verse to the corresponding slot.

**Jumping to cues:** `1`-`9` navigates the reader to the stored verse reference.

**Operations:**
- `setCue(slot, surahId, ayahId, verseRef)` -- `INSERT OR REPLACE` (slot is PRIMARY KEY)
- `getCue(slot)` -- Returns `Cue | null`
- `getAllCues()` -- Ordered by slot ascending
- `clearCue(slot)` -- `DELETE`

**Validation:** Slot must be 1-9 (enforced in both application code and DB CHECK constraint).

---

### 6.9 Reflection System

Personal notes attached to specific verses.

**Constraint:** One reflection per verse (`UNIQUE(surah, ayah)`). Setting a new reflection for the same verse replaces the existing one.

**Operations:**
- `addReflection(surahId, ayahId, verseRef, note)` -- `INSERT OR REPLACE`
- `getReflection(surahId, ayahId)` -- Single lookup
- `updateReflection(surahId, ayahId, note)` -- Updates note and `updated_at` timestamp
- `removeReflection(surahId, ayahId)` -- `DELETE`
- `getAllReflections()` -- Ordered by creation (newest first)
- `getReflectionsForSurah(surahId)` -- Ordered by ayah ascending

---

### 6.10 RTL Text Handling

**Challenge:** Most modern terminals (Alacritty, Kitty, WezTerm, iTerm2, Ghostty) do not support RTL/BiDi natively. Some (GNOME Terminal, Konsole, mlterm) do.

**Strategy: Raw logical order + right-alignment.**

After experimentation (documented in `spike-bidi.tsx`), the project found that applying software-based BiDi reordering (via `bidi-js`) on terminals with native BiDi support causes "double reversal" -- garbling the text. The solution is:

1. Output Arabic text in its natural logical order
2. Right-align the Arabic pane (`alignItems: "flex-end"`)
3. Wrap text with Unicode RLE (`U+202B`) / PDF (`U+202C`) markers as BiDi hints
4. Handle combining marks (tashkeel/diacritics) to avoid width calculation errors

**Utility functions (`rtl.ts`):**
- `isCombiningMark(codePoint)` -- Detects Arabic diacritics that don't occupy visual width
- `renderArabicVerse(text)` -- Wraps text with RLE/PDF markers

---

### 6.11 Multi-Language Support

Translation language is cycled with `l`. The reader re-fetches surah data from `quran-json` per-chapter files for the selected language.

**Supported languages (10):**

| Code | Language |
|------|----------|
| `bn` | Bengali |
| `en` | English (default) |
| `es` | Spanish |
| `fr` | French |
| `id` | Indonesian |
| `ru` | Russian |
| `sv` | Swedish |
| `tr` | Turkish |
| `ur` | Urdu |
| `zh` | Chinese |

---

## 7. Non-Functional Requirements

### 7.1 Performance

- TUI startup < 500ms (Bun cold start + lazy chapter loading)
- Verse navigation responds within 1 frame (Zig renderer double-buffered)
- Search across 6236 verses completes in < 100ms (in-memory substring match)
- Viewport culling enabled on all scrollboxes for large surah rendering

### 7.2 Data Integrity

- SQLite WAL mode for crash resilience
- Foreign keys enabled
- All timestamps in ISO-8601 UTC format with millisecond precision
- Database open/close per operation (no leaked connections)
- Transactions used for bulk inserts (e.g., logging entire surah)

### 7.3 Portability

- XDG Base Directory compliance for data storage
- No platform-specific dependencies (Bun + TypeScript only)
- Terminal color mode auto-detection via `COLORFGBG`
- Graceful fallback when database is unavailable (catch blocks in TUI)

### 7.4 Testability

- Data layer tested with temporary SQLite databases (`/tmp/test-*.db`)
- TUI components tested via OpenTUI's `testRender` frame capture
- Streak calculation tested with deterministic "today" parameter
- All data modules accept optional `dbPath` for test isolation

---

## 8. Implementation Status

| Phase | Status | What's Implemented |
|-------|--------|--------------------|
| **Phase 1: Foundation** | Done | Bun/TS setup, quran-json integration, CLI `read`, `log`, `search`, `streak` commands, SQLite persistence |
| **Phase 2: Core TUI** | Done | Multi-pane layout, vim-style navigation, theme system (11 themes), bookmarks, sidebar, focus cycling |
| **Phase 3: Features** | Done | Command palette, cues (1-9), reflections, activity panel (3 tabs), streak chart, search mode, verse spacing, flash messages |
| **Phase 4: Arabic & Study** | In Progress | RTL rendering (raw logical order strategy), light/dark mode with auto-detection, scroll synchronization |
| **Phase 5: Contextual Study** | Planned | Hadith integration, Tafsir panel, audio playback, export/import |

---

## 9. Future Roadmap

### Near-term (Phase 4 completion)

- Improve scroll synchronization reliability across all 3 reader panes
- Terminal capability detection for Arabic rendering quality
- Progressive enhancement for BiDi-capable terminals

### Medium-term (Phase 5)

- **Hadith integration** via `hadith` npm package (16 collections, cross-referenced by verse)
- **Tafsir panel** via Quran.com API (`@quranjs/api`) for verse commentary
- **Audio playback** for verse recitation (stretch goal)
- **Export/Import** for reading progress and personal data backup
- **Advanced search** with Arabic normalization and root-word matching (`quran-search-engine`)

### Long-term

- **Juz navigation** for reading by the 30-part division
- **Reading plans** with configurable daily goals
- **SSH-deployable** (share reading state across machines)
- **Community features** (shared reflection collections)

---

## 10. Known Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Arabic rendering varies wildly across terminals | HIGH | Default to translation mode; Arabic is opt-in; raw logical order avoids double-reversal |
| OpenTUI is pre-1.0 | Medium | Pin versions; it's actively developed and used in production (OpenCode) |
| quran-json bundle size (~82MB) | Medium | Lazy per-chapter loading; only metadata loaded on startup |
| SQLite in Bun edge cases | Low | `bun:sqlite` is built-in and well-tested; WAL mode for safety |
| Hadith package size (~139MB) | Medium | Future: make hadith an optional install |

---

## 11. Data Source Attribution

- **Quran text & translations:** [quran-json](https://github.com/risan/quran-json) (114 surahs, 6236 verses, 10 languages)
- **TUI framework:** [OpenTUI](https://github.com/anthropics/opencode) by Anthropic/SST
- **Runtime:** [Bun](https://bun.sh)

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| CLI startup time | < 200ms |
| TUI render time | < 500ms to interactive |
| Search latency | < 100ms for full-text across 6236 verses |
| Test coverage (data layer) | > 80% of public API functions |
| Theme count | 11 dynasty themes with light/dark variants (22 total palettes) |
| Keyboard accessibility | 100% of features reachable without mouse |

---

*Made with care for the Muslim community.*
