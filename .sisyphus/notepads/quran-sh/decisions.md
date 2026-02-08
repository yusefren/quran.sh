# Architectural Decisions - quran-sh

## Stack Decisions (From Plan)
- **Runtime**: Bun (native TypeScript, built-in SQLite)
- **TUI Framework**: OpenTUI + Solid.js (production stack)
- **Data Source**: quran-json (offline-first)
- **Storage**: bun:sqlite with WAL mode
- **Strategy**: Translation-first (Arabic is opt-in Phase 4)
