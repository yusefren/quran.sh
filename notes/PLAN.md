# quran.sh - Comprehensive Research & Plan

> A CLI/TUI for reading the Quran, tracking progress, and studying Islamic texts - built with TypeScript and Bun.

---

## Part 1: Research Findings

### 1.1 TUI Framework Landscape

#### Charm Bracelet (charm.sh) - Go Ecosystem
- **Language**: Go (not TypeScript)
- **Libraries**: Bubble Tea (Elm architecture), Lip Gloss (styling), Huh (forms), Wish (SSH apps), Glow (markdown)
- **Architecture**: Elm-style Model/Update/View pattern
- **Why it matters**: Set the gold standard for modern TUIs. Inspired many frameworks. **No TypeScript port exists.**
- **Verdict**: Inspirational but not usable directly (wrong language)

#### Ink (vadimdemedes/ink) - React for CLIs
- **Language**: TypeScript/JavaScript
- **Architecture**: React reconciler targeting terminal
- **Stars**: ~27K
- **Status**: Active, powers Gemini CLI, Claude Code
- **Layout**: Yoga (CSS Flexbox) for terminal layout
- **Limitation**: Designed for simpler CLIs, not full-screen multi-panel TUIs. No RTL support.

#### OpenTUI (sst/opentui) - THE WINNER
- **Language**: TypeScript + Zig (native rendering)
- **Stars**: 8.3K (growing fast)
- **Architecture**: Core imperative API + React reconciler + SolidJS reconciler
- **Layout**: Yoga (CSS Flexbox) - same as Ink but much more powerful
- **Runtime**: Bun-native (matches our project)
- **Components**: Box, Text, Input, Select, ScrollBox, Textarea, Code, Diff, Markdown, TabSelect, Slider
- **Features**: Keyboard handling, mouse support, themes, syntax highlighting (tree-sitter), clipboard, built-in console
- **Used by**: OpenCode (the coding assistant), terminal.shop
- **Version**: 0.1.77 (active development)
- **Key advantage**: Since OpenCode uses it with Solid.js, we have a production-grade reference implementation to learn from

**Framework Decision: OpenTUI + Solid.js** (same stack as OpenCode)

Rationale:
1. TypeScript-native with Bun support
2. Zig-powered renderer = high performance
3. Yoga layout = CSS Flexbox in terminal
4. Both React and Solid.js reconcilers available
5. Production-proven (OpenCode uses it daily)
6. Rich component library (ScrollBox, Textarea, Markdown, etc.)
7. Active development with 8K+ stars

#### How OpenCode's TUI Works (our reference implementation)

```
Solid.js Components (JSX)
  |
@opentui/solid reconciler
  |
OpenTUI Core Renderables (Box, Text, ScrollBox, etc.)
  |
Zig Native Renderer (double-buffered, diff-based updates)
  |
Terminal Output (ANSI escape codes)
```

Key patterns from OpenCode:
- **Context providers** for dependency injection (Theme, Route, Dialog stack, Keybinds, etc.)
- **Route-based navigation** (Home view, Session view)
- **Dialog stack pattern** for modals (ESC to dismiss)
- **Event bus** for cross-component communication
- **Worker thread** for background data processing
- **30+ built-in themes** with RGBA color system

---

### 1.2 Arabic Text Rendering in Terminals

#### The Hard Truth

| Terminal | RTL/BiDi Support | Notes |
|----------|-----------------|-------|
| mlterm | Full | Best Arabic support, variable-width fonts |
| GNOME Terminal | Full | Via libvte BiDi spec |
| Konsole | Full | KDE terminal |
| Alacritty | None | Open issue since 2017 |
| Kitty | None | Enhancement requested |
| WezTerm | None | Feature request since 2021 |
| iTerm2 | Partial | Text shaping but no mirroring |
| Windows Terminal | Broken | Known regression |
| Ghostty | None | No BiDi support |

**Summary**: Most popular modern terminals (Alacritty, Kitty, WezTerm, iTerm2, Ghostty) do NOT support RTL/BiDi. This is unlikely to change soon given multi-year-old open issues.

#### Arabic-Specific Challenges
1. **Letter shaping**: Arabic letters change form based on position (initial/medial/final/standalone). Most terminals don't handle this.
2. **Harakat/diacritics**: Fatha, Kasra, Damma, Sukun, Shadda, Tanwin - stacking above/below letters. Unreliable in terminals.
3. **Tajweed markers**: Color-coded pronunciation guides. No terminal support.
4. **Monospace constraint**: Arabic is inherently variable-width. Forced into fixed-width cells = visual artifacts.

#### Our Strategy: Multi-Mode Rendering

```
Terminal detected
  |
  +-- BiDi supported (mlterm/GNOME/Konsole)?
  |     |
  |     +-- YES: Render Arabic natively with RTL alignment
  |     |
  |     +-- NO: Use preprocessing + transliteration fallback
  |
  +-- Render Mode Options:
       1. Arabic + Translation side-by-side (default)
       2. Translation only (safest fallback)
       3. Transliteration + Translation
       4. Arabic only (for supported terminals)
```

**Key tools for workarounds:**
- `latiif/ara` (Go) - Correctly displays Arabic in terminals (RTL wrap, shaping, ligatures)
- `midnqp/rtl-arabic` (JavaScript) - Reorganizes characters for non-BiDi terminals
- We can port the character reordering logic to TypeScript for our use

**Practical design decision**: Default to **Translation + Transliteration** mode, with Arabic as an opt-in mode. Show a terminal compatibility warning on first launch.

---

### 1.3 Quran Data Sources

#### APIs

| Source | Auth | Offline | TypeScript SDK | Best For |
|--------|------|---------|---------------|----------|
| **Quran.com API** (api.quran.com) | Optional | No | `@quranjs/api` | Authenticated data, translations, tafsir, audio |
| **Al Quran Cloud** (api.alquran.cloud) | None | No | None | No-auth quick access, multiple editions |
| **quran-json** (npm) | N/A | Yes | N/A | Offline-first, CDN-available, 11 languages |

**Recommendation**: Use `quran-json` for offline data (bundled), `@quranjs/api` for online features (tafsir, audio, search).

#### Hadith Sources

| Source | Type | Notes |
|--------|------|-------|
| **hadith** (npm, v1.3.0) | SQLite + CLI | 16 collections, 139 MB, TypeScript, full-text search |
| **fawazahmed0/hadith-api** | CDN/JSON | Free, no rate limits, multiple languages |

#### Search

- **quran-search-engine** (npm): Pure TypeScript, Arabic normalization, lemma + root matching, highlight ranges. Perfect for our use case.

---

### 1.4 Existing Quran CLI Tools (Gap Analysis)

| Tool | Language | Stars | Has TUI? | Arabic Rendering | Progress Tracking | Streaks |
|------|----------|-------|----------|-----------------|-------------------|---------|
| QuranCLI (anonfaded) | Python | 39 | Basic | Limited | No | No |
| quran-cli (sarfraznawaz2005) | Go | 115 | No | No | No | No |
| Qurani CLI (MahdiDbh) | Shell | - | No | Limited | No | No |
| quran-cli (omeiirr) | Go | - | No | No | No | No |

**The gap is massive**: No existing tool has a proper multi-panel TUI, progress tracking, streak visualization, personal notes, or hadith cross-referencing. quran.sh would be first-of-its-kind.

---

## Part 2: Architecture Plan

### 2.1 Tech Stack

```
Runtime:        Bun
Language:       TypeScript (strict)
TUI Framework:  @opentui/core + @opentui/solid
UI Paradigm:    Solid.js (reactive, fine-grained updates)
Layout:         Yoga (CSS Flexbox via OpenTUI)
Data (offline): quran-json (bundled JSON)
Data (online):  @quranjs/api (Quran.com SDK)
Search:         quran-search-engine
Hadith:         hadith npm package (SQLite)
Storage:        bun:sqlite (local user data)
CLI Parser:     commander or citty
```

### 2.2 Project Structure

```
quran.sh/
  src/
    index.ts                    # Entry point - CLI router
    cli/                        # CLI commands (non-TUI)
      read.ts                   # Quick read command
      log.ts                    # Log reading progress
      streak.ts                 # Show streak chart
      search.ts                 # Search Quran
      hadith.ts                 # Hadith lookup
      config.ts                 # User config
    tui/                        # TUI application
      app.tsx                   # Main TUI entry
      worker.ts                 # Background data worker
      context/
        theme.tsx               # Theme system (Islamic aesthetic)
        route.tsx               # Navigation (Surah list, Reader, Notes, Streaks)
        data.tsx                # Quran data provider
        settings.tsx            # User settings (language, translation, display mode)
        progress.tsx            # Reading progress state
        keybind.tsx             # Keyboard shortcuts
      routes/
        home.tsx                # Welcome / Dashboard
        reader.tsx              # Main Quran reader (3-panel layout)
        search.tsx              # Search view
        streaks.tsx             # GitHub-style reading chart
        bookmarks.tsx           # Bookmarks & notes
        hadith.tsx              # Hadith browser
        settings.tsx            # Settings view
      components/
        surah-list.tsx          # Surah/chapter sidebar
        verse-display.tsx       # Verse rendering (Arabic + translation)
        tafsir-panel.tsx        # Commentary panel
        hadith-panel.tsx        # Related hadith panel
        notes-editor.tsx        # Personal notes
        progress-bar.tsx        # Reading progress indicator
        streak-chart.tsx        # GitHub-style contribution chart
        arabic-text.tsx         # Arabic text renderer (handles RTL/fallback)
        status-bar.tsx          # Bottom status bar
        menu.tsx                # Command menu (like OpenCode's)
      ui/
        dialog.tsx              # Base dialog
        dialog-translation.tsx  # Translation picker
        dialog-reciter.tsx      # Reciter picker
        dialog-display-mode.tsx # Display mode (Arabic/Translation/Both)
        toast.tsx               # Toast notifications
    data/
      quran.ts                  # Quran data access layer
      hadith.ts                 # Hadith data access layer
      search.ts                 # Search engine wrapper
      progress.ts               # Progress/streak storage (SQLite)
      notes.ts                  # Notes storage (SQLite)
      bookmarks.ts              # Bookmarks storage (SQLite)
    lib/
      arabic.ts                 # Arabic text preprocessing/RTL handling
      terminal-detect.ts        # Terminal BiDi capability detection
      streak-calc.ts            # Streak calculation logic
      format.ts                 # Text formatting utilities
```

---

## Part 3: TUI Design

### 3.1 Main Reader Layout (3-Panel)

```
+-----------------------------------------------------------------------+
| quran.sh                              Al-Baqarah (2)    [?] Help      |
+-------------------+-----------------------------------+---------------+
|                   |                                   |               |
| CHAPTERS          | READER                            | CONTEXT       |
|                   |                                   |               |
| > 1. Al-Fatihah   | 2:255 (Ayat al-Kursi)            | TRANSLATION   |
|   2. Al-Baqarah * |                                   | Allah! There  |
|   3. Ali 'Imran   | [Arabic text or transliteration]  | is no god     |
|   4. An-Nisa      |                                   | but He, the   |
|   5. Al-Ma'idah   | --                                | Living, the   |
|   6. Al-An'am     |                                   | Self-Subs...  |
|   7. Al-A'raf     | 2:256                             |               |
|   8. Al-Anfal     |                                   | TAFSIR        |
|   ...             | [Arabic text or transliteration]  | Ibn Kathir:   |
|                   |                                   | This verse... |
| [114 surahs]      | --                                |               |
|                   |                                   | HADITH        |
| --- JUZ ---       | 2:257                             | Bukhari 6459: |
| Juz 1             |                                   | The Prophet   |
| Juz 2  *          | [Arabic text or transliteration]  | (PBUH) said.. |
| Juz 3             |                                   |               |
|                   |                                   | MY NOTES      |
|                   |                                   | [Add note...] |
+-------------------+-----------------------------------+---------------+
| [/] Search  [t] Translation  [m] Mode  [b] Bookmark  | Streak: 7 d  |
+-----------------------------------------------------------------------+
```

### 3.2 Key Views

#### Home / Dashboard
```
+-----------------------------------------------------------------------+
|                                                                       |
|                     bismillah                                         |
|                     quran.sh                                          |
|                                                                       |
|  Last Read: Al-Baqarah 2:255                      [Enter to continue]|
|  Progress:  [=========>              ] 12.4% (778/6236 ayahs)         |
|  Streak:    7 days                                                    |
|                                                                       |
|  +------------------------------------------------------------------+|
|  | Streak Chart (last 52 weeks)                                      ||
|  |  Mon  .  .  #  .  #  #  .  #  #  #  .  .  #  #  #  #  ...       ||
|  |  Wed  .  #  #  .  #  .  .  #  #  #  .  #  #  .  #  #  ...       ||
|  |  Fri  .  .  #  #  #  #  .  .  #  #  #  #  #  .  #  #  ...       ||
|  +------------------------------------------------------------------+|
|                                                                       |
|  Quick Actions:                                                       |
|  [r] Resume reading   [s] Search   [j] Jump to surah                 |
|  [h] Hadith of day    [b] Bookmarks  [?] Help                        |
|                                                                       |
+-----------------------------------------------------------------------+
```

#### Streak View (GitHub-style)
```
+-----------------------------------------------------------------------+
| Reading Streak                                                        |
+-----------------------------------------------------------------------+
|                                                                       |
|  Current Streak: 7 days          Longest Streak: 23 days              |
|  Total Ayahs Read: 778          Total Days Active: 45                 |
|                                                                       |
|  Jan    Feb    Mar    Apr    May    Jun    Jul    Aug                  |
|  Mon .  .  #  .  #  #  .  #  #  #  .  .  #  #  #  #  #  .  .  #    |
|  Tue .  #  #  .  #  .  .  #  #  #  .  #  #  .  #  #  #  .  #  #    |
|  Wed .  .  #  #  #  #  .  .  #  #  #  #  #  .  #  #  #  .  .  #    |
|  Thu #  .  #  .  #  #  .  #  #  #  .  #  .  .  #  #  #  #  .  #    |
|  Fri #  #  #  .  #  .  .  #  #  #  .  .  #  #  #  #  #  .  #  #    |
|  Sat .  .  .  .  .  .  .  .  #  .  .  .  .  .  #  .  #  .  .  .    |
|  Sun .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  #  .  .  .    |
|                                                                       |
|  Legend: . = no reading  # = light  # = moderate  # = heavy           |
|                                                                       |
|  Monthly Breakdown:                                                   |
|  Jul 2025: 145 ayahs across 22 days                                  |
|  Jun 2025: 89 ayahs across 15 days                                   |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 3.3 Menu System (OpenCode-style)

Pressing `Ctrl+K` or `/` opens a command palette:

```
+----------------------------------+
| > Type a command...              |
+----------------------------------+
| Read          Open Quran reader  |
| Search        Search the Quran   |
| Bookmarks     View bookmarks     |
| Notes         View notes         |
| Streaks       View reading chart |
| Hadith        Browse hadiths     |
| ---                              |
| Translation   Switch translation |
| Display Mode  Arabic/English/... |
| Theme         Change theme       |
| Settings      App settings       |
+----------------------------------+
```

### 3.4 Keyboard Navigation

| Key | Action |
|-----|--------|
| `j` / `k` or Arrow keys | Navigate up/down |
| `h` / `l` or Arrow keys | Navigate left/right panels |
| `Enter` | Select / Open surah |
| `Space` | Page down in reader |
| `g` / `G` | Go to top / bottom |
| `/` | Search |
| `b` | Toggle bookmark |
| `n` | Add note |
| `t` | Cycle translation |
| `m` | Cycle display mode |
| `Tab` | Switch panel focus |
| `Ctrl+K` | Command palette |
| `1-4` | Jump to panel |
| `q` / `Ctrl+C` | Quit |
| `?` | Help |

### 3.5 Theme System

Islamic-inspired themes:

| Theme | Description |
|-------|-------------|
| `madinah` (default) | Deep green (#1B4332) + gold (#D4A843) + cream text |
| `makkah` | Black (#0A0A0A) + white + gold accents |
| `desert` | Warm sand (#F5E6CC) + brown (#8B6914) |
| `ocean` | Deep blue (#0D1B2A) + teal (#1B998B) |
| `night` | Dark (#1A1A2E) + purple (#E94560) + moonlight |
| `classic` | Paper white + black text (high readability) |
| `nord` | Nord color palette |
| `dracula` | Dracula color palette |

---

## Part 4: CLI Commands

### 4.1 Command Overview

```bash
# Launch TUI (default - no args)
quran

# Quick read (no TUI needed)
quran read 2:255              # Read specific ayah
quran read al-fatihah          # Read entire surah by name
quran read 2:1-10              # Read range of ayahs
quran read --juz 30            # Read by juz

# Log reading progress (offline, quick)
quran log 2:255                # Mark ayah as read
quran log 2:1-50               # Mark range as read
quran log al-fatihah           # Mark entire surah as read
quran log --today               # Log today's reading interactively

# Streaks & progress
quran streak                   # Show streak chart (GitHub-style)
quran streak --week            # Show this week's progress
quran progress                 # Show overall reading progress
quran progress --detailed      # Show per-juz breakdown

# Search
quran search "mercy"           # Search in translation
quran search "rahman" --arabic # Search in Arabic
quran search "light" --surah 24 # Search within surah

# Hadith
quran hadith                   # Random hadith
quran hadith --daily           # Hadith of the day
quran hadith --related 2:255   # Hadiths related to a verse
quran hadith search "patience" # Search hadiths

# Bookmarks & Notes
quran bookmarks                # List bookmarks
quran bookmarks add 2:255 "Ayat al-Kursi - memorize" 
quran notes                    # List notes
quran notes add 2:255 "Deep reflection on God's sovereignty"

# Settings
quran config                   # Show current config
quran config set translation en.sahih  
quran config set theme madinah
quran config set display-mode dual     # arabic+translation

# Data management
quran sync                     # Sync data from Quran.com API
quran export                   # Export progress/notes to JSON
quran import progress.json     # Import from backup
```

### 4.2 CLI Output Examples

#### `quran read al-fatihah`
```
  Al-Fatihah (The Opening) - 7 Ayahs - Makki

  1  In the name of Allah, the Most Gracious, the Most Merciful.
  2  All praise is for Allah, Lord of all worlds,
  3  the Most Compassionate, Most Merciful,
  4  Master of the Day of Judgment.
  5  You alone we worship, and You alone we ask for help.
  6  Guide us along the Straight Path,
  7  the Path of those You have blessed - not those You are
     displeased with, or those who are astray.

  Translation: Sahih International
```

#### `quran streak`
```
  Reading Streak

  Current: 7 days    Longest: 23 days    Total: 778 ayahs

       Jan        Feb        Mar        Apr
  Mon  .  .  #  .  #  #  .  #  #  #  .  .  #  #
  Wed  .  #  #  .  #  .  .  #  #  #  .  #  #  .
  Fri  .  .  #  #  #  #  .  .  #  #  #  #  #  .

  This week: 45 ayahs read across 5 days
```

#### `quran progress`
```
  Quran Reading Progress

  Overall: [=========>                         ] 12.4%  (778/6236)

  Juz  1: [#############################] 100%  Al-Fatihah - Al-Baqarah:141
  Juz  2: [################>            ]  58%  Al-Baqarah:142-252
  Juz  3: [>                            ]   2%  Al-Baqarah:253 - Ali'Imran:91
  Juz  4-30: not started

  Last session: Al-Baqarah 2:253-260 (yesterday)
```

---

## Part 5: Data Model

### 5.1 SQLite Schema (User Data)

```sql
-- Reading progress
CREATE TABLE reading_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  surah INTEGER NOT NULL,         -- 1-114
  ayah_start INTEGER NOT NULL,    -- Starting ayah
  ayah_end INTEGER NOT NULL,      -- Ending ayah
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_seconds INTEGER,       -- Optional: time spent
  notes TEXT                      -- Optional: session notes
);

-- Bookmarks
CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  surah INTEGER NOT NULL,
  ayah INTEGER NOT NULL,
  label TEXT,
  color TEXT DEFAULT '#D4A843',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(surah, ayah)
);

-- Notes
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  surah INTEGER NOT NULL,
  ayah INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Streak cache (denormalized for fast queries)
CREATE TABLE daily_progress (
  date TEXT PRIMARY KEY,          -- YYYY-MM-DD
  ayahs_read INTEGER DEFAULT 0,
  surahs_touched TEXT,            -- JSON array of surah numbers
  total_seconds INTEGER DEFAULT 0
);
```

### 5.2 Default Settings

```json
{
  "translation": "en.sahih",
  "display_mode": "dual",
  "theme": "madinah",
  "arabic_font": "auto",
  "show_arabic": true,
  "show_transliteration": false,
  "show_ayah_numbers": true,
  "verses_per_page": 10,
  "auto_log_progress": true,
  "streak_goal_ayahs": 10,
  "streak_start_day": "monday"
}
```

---

## Part 6: Implementation Phases

### Phase 1: Foundation (MVP)
1. Project setup (Bun + TypeScript + OpenTUI + Solid.js)
2. Quran data layer (quran-json for offline, basic loader)
3. CLI: `quran read <surah>` command
4. CLI: `quran search <term>` command
5. Basic TUI: Surah list + simple reader (translation only)
6. SQLite setup for progress tracking

### Phase 2: Core TUI
1. 3-panel layout (chapters | reader | context)
2. Keyboard navigation (vim-style)
3. Command palette (Ctrl+K)
4. Translation switching
5. Bookmarks (toggle with `b`)
6. Theme system (madinah default)

### Phase 3: Progress & Streaks
1. `quran log` command
2. Auto-logging in TUI mode
3. `quran streak` with GitHub-style chart
4. `quran progress` with per-juz breakdown
5. Dashboard home view with streak widget

### Phase 4: Arabic & Study
1. Terminal BiDi detection
2. Arabic text preprocessing (rtl-arabic port)
3. Dual display mode (Arabic + translation)
4. Transliteration mode
5. Notes editor in TUI
6. Tafsir panel (via Quran.com API)

### Phase 5: Hadith & Polish
1. Hadith integration (hadith npm package)
2. Related hadith panel in reader
3. `quran hadith` CLI commands
4. Export/import (backup)
5. Audio playback (stretch goal)
6. Cross-reference system (verses <-> hadith)

---

## Part 7: Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Arabic rendering in terminals | **HIGH** | Default to translation mode; Arabic as opt-in; terminal detection |
| OpenTUI is pre-1.0 | Medium | Pin versions; it's actively developed and used in production by OpenCode |
| Large data size (quran-json 82MB) | Medium | Lazy-load surahs on demand; only bundle metadata initially |
| SQLite in Bun | Low | `bun:sqlite` is built-in and battle-tested |
| Hadith package size (139MB) | Medium | Make hadith an optional install (`quran install hadith`) |
| Zig build dependency for OpenTUI | Medium | OpenTUI publishes prebuilt binaries for major platforms |

---

## Part 8: Key Dependencies

```json
{
  "dependencies": {
    "@opentui/core": "^0.1.77",
    "@opentui/solid": "^0.1.77",
    "solid-js": "^1.9",
    "yoga-layout": "^3.2",
    "quran-search-engine": "^0.1.5",
    "commander": "^13"
  },
  "optionalDependencies": {
    "@quranjs/api": "^2.1",
    "hadith": "^1.3"
  }
}
```

Quran JSON data would be bundled or downloaded on first run.

---

## Summary

**What makes quran.sh unique:**
1. **First TypeScript TUI for Quran** - nothing like it exists
2. **OpenTUI framework** - same production stack as OpenCode
3. **GitHub-style streak tracking** - gamified reading motivation
4. **Dual CLI + TUI** - quick `quran read 2:255` OR full immersive TUI
5. **Offline-first** - works without internet via bundled JSON data
6. **Study-oriented** - notes, bookmarks, tafsir, hadith cross-references
7. **Beautiful themes** - Islamic-inspired color palettes
8. **Smart Arabic handling** - detects terminal capabilities, provides fallbacks

**The Arabic rendering challenge is real but manageable** - by defaulting to translation mode and treating Arabic as a progressive enhancement, we ensure the tool works everywhere while still providing the best possible Arabic experience on capable terminals.
