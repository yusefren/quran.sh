# 📖 quran.sh

> A fast, offline-first Quran CLI and TUI reader built with Bun and TypeScript

[![npm](https://img.shields.io/npm/v/quran.sh)](https://www.npmjs.com/package/quran.sh)
[![License](https://img.shields.io/github/license/smashah/quran.sh)](LICENSE)

## Features

- ✅ **Offline-First**: All data bundled, works without internet
- ✅ **Translation-First**: English translations for maximum readability
- ✅ **Fast CLI**: Quick verse lookup (`quran read 2:255`)
- ✅ **Beautiful TUI**: Immersive 2-panel reader with vim-style navigation
- ✅ **Progress Tracking**: Reading logs and streak tracking
- ✅ **Bookmarks**: Mark and revisit favorite verses
- ✅ **Search**: Full-text search across all translations

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
- `Tab`: Switch between sidebar and reader
- `↑/↓` or `j/k`: Navigate
- `Enter`: Select surah
- `b`: Toggle bookmark on current verse
- `/`: Search
- `a`: Toggle Arabic text
- `t`: Toggle translation
- `r`: Toggle transliteration
- `l`: Cycle translation language
- `?`: Show help
- `q`: Quit

## Data Source

- Translations from [quran-json](https://github.com/risan/quran-json)
- 114 surahs, 6236 verses

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
