# Draft: Dynasty/Era Themes for quran.sh

## Requirements (confirmed)
- User added "ASCII Quranic Page Ornamentation.zip" to repo (needs git pull)
- Unzip and study the ornamentation reference material
- Implement a theme for each Islamic dynasty/era
- Each theme encompasses: border decorations + colors
- Keyboard shortcut to cycle through themes
- Existing `madinahTheme` already provides the Theme interface and context pattern

## Technical Understanding

### Current Architecture
- **Theme system**: `src/tui/theme.tsx` - single `madinahTheme`, 14 color props
- **Theme context**: `ThemeProvider` + `useTheme()` hook (Solid.js signals)
- **Rendering**: OpenTUI + Solid.js, uses `<box>` with `borderStyle`, `borderColor`, `title`
- **Key handling**: Raw stdin via `readline.emitKeypressEvents`, handlers in `app.tsx`
- **All components already use `useTheme()`** - no hardcoded colors

### Border System (OpenTUI)
- `borderStyle`: "heavy" | "rounded" (currently used)
- Also supports: "single", "double", "bold", "classic" (typical for TUI frameworks)
- `borderColor`: hex string
- `title`: string in corner of box
- `titleAlignment`: "left" | "center"

### Available Keys (not yet taken)
Taken: Tab, j/k/↑/↓, Enter, b, a, t, r, l, s, +/-, /, ?, ESC, q
Available: c, d, e, f, g, h, i, m, n, o, p, u, v, w, x, y, z, 0-9

## Dynasties to Implement (9 themes + existing madinah = 10 total)
1. **Madinah** (existing) - Deep Islamic green + gold
2. **Umayyad** (661-750) - Gold, deep red, earthy browns
3. **Abbasid** (750-1258) - Deep blue (lapis), gold, emerald
4. **Fatimid** (909-1171) - Gold on indigo, turquoise
5. **Seljuk** (1037-1194) - Turquoise blue, cobalt, white
6. **Mamluk** (1250-1517) - Red, green, blue, gold
7. **Ottoman** (1299-1922) - Iznik blue, turquoise, red
8. **Safavid** (1501-1736) - Gold, lapis blue, crimson
9. **Mughal** (1526-1857) - Gold, red, green, pink
10. **Andalusian** (711-1492) - Blue and white, gold, red

## Research Findings
- Detailed color palettes per dynasty from librarian agent
- Unicode decorative characters catalogued (stars, flowers, geometric shapes)
- Ornamentation reference material (zip) not yet examined - needs git pull + unzip

## Decisions Made
- Key: `d` cycles dynasty themes
- Persistence: YES, saved to SQLite DB (key-value user_preferences table)
- Theme scope: Colors + decorative chars (focusIcon, verseMarker, bookmarkIcon, titlePrefix/Suffix, divider)
- Theme indicator: Status bar / footer showing dynasty name and era

## User-Provided Ornament Reference (CRITICAL)
User provided 7 ornamental patterns inline:
1. **Sarlawh Complex** - Box-within-box, shading ▓▒░, central cartouche with ۞
2. **Zencirek Infinite Braid** - ╫╪ for woven strapwork, over/under interlacing
3. **Kufic Geometric Frieze** - Half-blocks ▀▄█ for maze meander (Timurid/Banna'i)
4. **Shamsa Medallion Divider** - Solar medallion ۞ with brackets/braces
5. **Wide Maghribi Border** - North African ribbon, alternating heavy/light nested boxes
6. **Complex Knotted Corner** - ╳ diagonal cross for tied knots at vertices
7. **Tughra Style Header** - Ottoman calligraphic swoops with artistic punctuation

These map to dynasties:
- Umayyad → Simple box-drawing (early, minimal)
- Abbasid → Sarlawh Complex style (Golden Age richness)
- Fatimid → Shamsa Medallion (North African)
- Seljuk → Kufic Geometric Frieze (Turkic/Timurid)
- Mamluk → Complex Knotted Corner (Egyptian geometric peak)
- Ottoman → Tughra Style + Zencirek Braid (imperial fluidity)
- Safavid → Shamsa + Sarlawh (Persian lavish illumination)
- Mughal → Wide/layered borders (Indian subcontinent blend)
- Andalusian → Zencirek Braid (Alhambra tessellation)

## Scope Boundaries
- INCLUDE: Color themes, decorative chars per dynasty, `d` key cycling, SQLite persistence, status bar, help dialog update
- INCLUDE: git pull + unzip reference material
- EXCLUDE: Custom box-drawing border rendering (use OpenTUI's built-in borderStyle)
- EXCLUDE: User-created custom themes
- EXCLUDE: Theme configuration files
