# 📖 quran.sh

> A fast, offline-first Quran CLI and TUI reader built with Bun and TypeScript

[![npm](https://img.shields.io/npm/v/quran.sh)](https://www.npmjs.com/package/quran.sh)
[![License](https://img.shields.io/github/license/smashah/quran.sh)](LICENSE)

## Features

- **Offline-First**: All data bundled, works without internet
- **Fast CLI**: Quick verse lookup (`quran read 2:255`)
- **Multi-Pane TUI**: Arabic top, Translation + Transliteration split below
- **Toggleable Sidebar**: Press `s` to show/hide the surah list
- **Rich Colors**: Gold Arabic, teal transliteration, green accents
- **Dynasty Themes**: 11 themes inspired by Islamic manuscript illumination (Madinah, Mamluk, Ottoman, Safavid, Andalusian, Maghribi, Umayyad, Abbasid, Fatimid, Seljuk, Mughal) — press `T` to cycle
- **Focus Indicators**: Heavy borders + diamond icon on focused pane
- **Verse Spacing**: `+`/`-` to adjust spacing between verses
- **Progress Tracking**: Reading logs and streak tracking
- **Bookmarks**: Mark and revisit favorite verses
- **Search**: Full-text search across all translations
- **Multi-Language**: Cycle through translation languages

## Installation

```bash
# Global install
npm install -g quran.sh

# Or with Bun
bun install -g quran.sh
```

## Usage

### CLI Commands

```bash
# Read a surah (by number or name)
quran read 1
quran read al-fatihah

# Read a specific verse
quran read 2:255

# Search for verses
quran search "merciful"

# Log reading progress
quran log 1
quran log 2:255

# View reading streak
quran streak
```

### TUI (Interactive Mode)

Simply run:
```bash
quran
```

**Keyboard Shortcuts:**

| Key | Action |
|-----|--------|
| `Tab` | Cycle focus: Sidebar → Arabic → Translation → Transliteration |
| `↑/↓` or `j/k` | Navigate surahs or verses |
| `Enter` | Select surah (in sidebar) |
| `b` | Toggle bookmark on current verse |
| `R` | Add reflection (bookmark with note) |
| `1-9` | Jump to quick-navigation cue |
| `! to (` | Set cue 1-9 (Shift+1-9) |
| `a` | Toggle Arabic pane |
| `t` | Toggle Translation pane |
| `r` | Toggle Transliteration pane |
| `l` | Cycle translation language |
| `D` | Cycle light/dark mode |
| `T` | Cycle theme (Madinah, Mamluk, Ottoman, Safavid, Andalusian, Maghribi, Umayyad, Abbasid, Fatimid, Seljuk, Mughal) |
| `Ctrl+P` | Open command palette |
| `s` | Toggle sidebar |
| `B` | Toggle right panel (Bookmarks/Cues/Reflections) |
| `+`/`-` | Increase/decrease verse spacing |
| `/` | Search verses |
| `?` | Show/hide help dialog |
| `ESC` | Dismiss dialog / Clear search |
| `q` | Quit |

## Data Source

- Translations from [quran-json](https://github.com/risan/quran-json)
- 114 surahs, 6236 verses

## Recording Demos

Demo recording scripts are in `demos/`. To record a TUI demo:

```bash
# 1. Start a tmux session
tmux new-session -d -s demo -x 120 -y 35

# 2. Start terminalizer inside it
tmux send-keys -t demo 'terminalizer record --config demos/tui-demo.yml demos/tui-full -k' Enter

# 3. Run the keystroke automation (in another terminal)
bash demos/send-keys.sh

# 4. Render to GIF
terminalizer render demos/tui-full
```

## Development

```bash
# Clone
git clone https://github.com/smashah/quran.sh.git
cd quran.sh

# Install dependencies
bun install

# Run CLI
bun run src/index.ts read 1

# Run TUI
bun run src/index.ts

# Run tests
bun test
```

## License

MIT © smashah

## Credits

- Built with [Bun](https://bun.sh)
- UI powered by [OpenTUI](https://github.com/opentui/opentui)
- Data from [quran-json](https://github.com/risan/quran-json)

---

Made with ❤️ for the Muslim community
