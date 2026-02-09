/** @jsxImportSource @opentui/solid */
import { createContext, useContext, createSignal, createMemo, JSX, Component } from "solid-js";
import type { BorderStyle } from "@opentui/core";
import { getPreference, setPreference } from "../data/preferences.ts";
import { useMode } from "./mode";

// ---------------------------------------------------------------------------
// Theme interface — each dynasty defines colors, border style & ornaments
// ---------------------------------------------------------------------------

import { BorderCharacters } from "@opentui/core";

export interface ThemeOrnaments {
  /** Character placed before the currently-focused verse */
  verseMarker: string;
  /** Character for bookmarked verses */
  bookmarkIcon: string;
  /** Decorative character flanking surah titles (left) */
  headerLeft: string;
  /** Decorative character flanking surah titles (right) */
  headerRight: string;
  /** Horizontal divider pattern (repeated to fill width) */
  dividerUnit: string;
  /** Rub el Hizb / section marker */
  sectionMarker: string;
  /** Decorative bullet for list items */
  bullet: string;
  /** Panel title prefix when focused */
  focusIcon: string;
  /** Scrollbar thumb character */
  scrollbarThumb: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
  borderFocused: string;
  highlight: string;
  muted: string;
  arabic: string;
  translation: string;
  transliteration: string;
  verseNum: string;
  bookmark: string;
  header: string;
  statusBar: string;
}

export interface Theme {
  /** Machine name */
  id: string;
  /** Display name */
  name: string;
  /** Dynasty / era description */
  era: string;
  /** Short tagline */
  description: string;
  /** OpenTUI border style for panels */
  borderStyle: BorderStyle;
  /** Border style used when a panel has focus */
  borderStyleFocused: BorderStyle;
  /** Optional custom border characters for ornamental corners */
  borderChars?: BorderCharacters;
  /** Ornamental characters drawn from the ornamentation research */
  ornaments: ThemeOrnaments;
  colors: ThemeColors;
  lightColors: ThemeColors;
}

// ---------------------------------------------------------------------------
// Color Utilities & Light Mode Derivation
// ---------------------------------------------------------------------------

/**
 * Adjust hex color brightness.
 * @param hex - Hex color string (e.g., "#123456")
 * @param amount - Amount to adjust (positive to lighten, negative to darken)
 */
function adjustBrightness(hex: string, amount: number): string {
  const color = hex.startsWith("#") ? hex.slice(1) : hex;
  const num = parseInt(color, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Mix a color with white (tint) or black (shade).
 * @param hex - Hex color
 * @param weight - 0 to 1 (1 is pure white/black)
 */
function mixWith(hex: string, targetHex: string, weight: number): string {
  const color = hex.startsWith("#") ? hex.slice(1) : hex;
  const target = targetHex.startsWith("#") ? targetHex.slice(1) : targetHex;
  const c1 = parseInt(color, 16);
  const c2 = parseInt(target, 16);

  const r1 = c1 >> 16, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
  const r2 = c2 >> 16, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;

  const r = Math.round(r1 * (1 - weight) + r2 * weight);
  const g = Math.round(g1 * (1 - weight) + g2 * weight);
  const b = Math.round(b1 * (1 - weight) + b2 * weight);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Algorithmic derivation of a light palette from a dark one.
 */
function deriveLightPalette(dark: ThemeColors, id: string): ThemeColors {
  // Themes categorized as "cool" (blues/teals/greens) vs "warm" (golds/reds/browns)
  const coolThemes = ["mamluk", "ottoman", "madinah", "fatimid", "seljuk", "abbasid"];
  const isCool = coolThemes.includes(id);

  return {
    background: isCool ? "#F5F7FA" : "#FAF8F5",
    text: "#1A1A2E",
    primary: dark.primary, // Keep accent colors saturated
    secondary: dark.secondary,
    border: mixWith(dark.border, "#FFFFFF", 0.4),
    borderFocused: adjustBrightness(dark.secondary, -30),
    highlight: adjustBrightness(dark.highlight, -50),
    muted: "#9CA3AF",
    statusBar: mixWith(dark.statusBar, "#FFFFFF", 0.6),
    // For text-like accents, darken for contrast against light bg
    arabic: adjustBrightness(dark.arabic, -60),
    translation: "#1A1A2E",
    transliteration: adjustBrightness(dark.transliteration, -40),
    verseNum: adjustBrightness(dark.verseNum, -40),
    bookmark: adjustBrightness(dark.bookmark, -30),
    header: adjustBrightness(dark.header, -40),
  };
}


// ---------------------------------------------------------------------------
// Dynasty themes — colours derived from historical pigment research,
// ornaments from the ASCII Quranic Page Ornamentation study
// ---------------------------------------------------------------------------

/**
 * MAMLUK (Cairo, 1250-1517)
 * Heavy, monumental geometric illumination.  Lapis lazuli blue, burnished
 * gold, vermilion.  Massive full-page star patterns carved in stone.
 * ASCII signature: Block Elements (U+2588 U+2593 U+2591) — weight & permanence.
 */
export const mamlukTheme: Theme = {
  id: "mamluk",
  name: "Mamluk",
  era: "Cairo 1250\u20131517",
  description: "Geometric monumentality \u2014 lapis & gold",
  borderStyle: "single",
  borderStyleFocused: "heavy",
  ornaments: {
    verseMarker: "\u25B8",
    bookmarkIcon: "\u2726",
    headerLeft: "\u2588\u2593\u2592",
    headerRight: "\u2592\u2593\u2588",
    dividerUnit: "\u25AC",
    sectionMarker: "\u06DE",
    bullet: "\u25A0",
    focusIcon: "\u25C6",
  },
  colors: {
    primary: "#1E3A8A",        // Lapis lazuli blue
    secondary: "#D4AF37",      // Burnished gold
    background: "#0D1117",     // Dark ground
    text: "#E8DFD0",           // Warm vellum white
    border: "#1E3A8A",         // Lapis border
    borderFocused: "#D4AF37",  // Gold when focused
    highlight: "#FFD700",      // Bright gold highlight
    muted: "#4A5568",          // Stone gray
    arabic: "#D4AF37",         // Gold for Arabic script
    translation: "#E8DFD0",    // Vellum for translation
    transliteration: "#7FB3D3",// Soft azure
    verseNum: "#6B8EC4",       // Muted lapis
    bookmark: "#E34234",       // Vermilion/cinnabar
    header: "#D4AF37",         // Gold headers
    statusBar: "#0F1D45",      // Deep lapis ground
  },
  get lightColors() { return deriveLightPalette(this.colors, this.id); },
};

/**
 * OTTOMAN (Istanbul, 1299-1922)
 * Disciplined Rumi/Hatayi motifs, navy cobalt + gold, Zencirek chain borders.
 * The most "architectural" style with rigid double-line interlocking frames.
 * ASCII signature: Box Drawing double-lines (U+2550 U+2551 U+2554 U+2557) — the Zencirek braid.
 */
export const ottomanTheme: Theme = {
  id: "ottoman",
  name: "Ottoman",
  era: "Istanbul 1299\u20131922",
  description: "Zencirek chain borders \u2014 cobalt & gold",
  borderStyle: "single",
  borderStyleFocused: "double",
  ornaments: {
    verseMarker: "\u276F",
    bookmarkIcon: "\u2605",
    headerLeft: "\u2560\u2550\u2550",
    headerRight: "\u2550\u2550\u2563",
    dividerUnit: "\u2550\u2564\u2550",
    sectionMarker: "\u06DE",
    bullet: "\u25C8",
    focusIcon: "\u25C6",
    scrollbarThumb: "\u25C8",
  },
  colors: {
    primary: "#0A2342",        // Navy cobalt
    secondary: "#FFD700",      // Bright gold
    background: "#0A0E27",     // Very dark navy
    text: "#E0E8F0",           // Cool white
    border: "#1A3A6A",         // Mid-navy
    borderFocused: "#FFD700",  // Gold when focused
    highlight: "#FFD700",      // Gold highlight
    muted: "#4A6080",          // Muted navy
    arabic: "#FFD700",         // Gold Arabic
    translation: "#E0E8F0",    // Cool white
    transliteration: "#40E0D0",// Turquoise (Iznik)
    verseNum: "#5B8DB8",       // Soft cobalt
    bookmark: "#FFD700",       // Gold bookmark
    header: "#FFD700",         // Gold headers
    statusBar: "#061229",      // Darkest navy
  },
  get lightColors() { return deriveLightPalette(this.colors, this.id); },
};

/**
 * SAFAVID (Isfahan, 1501-1736)
 * Fluid cloud-band (Chi) motifs, floral sprays, light & ethereal.
 * Persian style dematerializes the grid — text floats in clouds.
 * ASCII signature: Rounded corners, sparse punctuation (. , ' ~ *) — dithered clouds.
 */
export const safavidTheme: Theme = {
  id: "safavid",
  name: "Safavid",
  era: "Isfahan 1501\u20131736",
  description: "Cloud-band florals \u2014 azure & rose",
  borderStyle: "rounded",
  borderStyleFocused: "rounded",
  ornaments: {
    verseMarker: "\u2740",
    bookmarkIcon: "\u273F",
    headerLeft: "*\u00B7.",
    headerRight: ".\u00B7*",
    dividerUnit: "\u00B7.\u00B7",
    sectionMarker: "\u06DE",
    bullet: "\u2727",
    focusIcon: "\u2756",
  },
  colors: {
    primary: "#4169E1",        // Cloud-band royal blue
    secondary: "#C5A059",      // Antique gold
    background: "#0F172A",     // Dark slate
    text: "#E2D8C8",           // Warm parchment
    border: "#2D4A7A",         // Soft blue
    borderFocused: "#C5A059",  // Antique gold focused
    highlight: "#E8C87A",      // Warm gold
    muted: "#506080",          // Soft gray-blue
    arabic: "#C5A059",         // Antique gold Arabic
    translation: "#E2D8C8",    // Parchment
    transliteration: "#7ECFC0",// Soft teal
    verseNum: "#6A8FBF",       // Medium blue
    bookmark: "#DC143C",       // Crimson (cinnabar)
    header: "#C5A059",         // Antique gold headers
    statusBar: "#0B1120",      // Deep dark slate
  },
  get lightColors() { return deriveLightPalette(this.colors, this.id); },
};

/**
 * ANDALUSIAN (Cordoba, 711-1492)
 * Geometric zellige interlace of the Alhambra. Azurite blue, goldenrod,
 * terracotta — the warmth of Mediterranean Islam.
 * ASCII signature: Single-line precision with diagonal accents — clean geometry.
 */
export const andalusianTheme: Theme = {
  id: "andalusian",
  name: "Andalusian",
  era: "C\u00F3rdoba 711\u20131492",
  description: "Zellige geometry \u2014 azurite & terracotta",
  borderStyle: "single",
  borderStyleFocused: "heavy",
  ornaments: {
    verseMarker: "\u25B9",
    bookmarkIcon: "\u2736",
    headerLeft: "\u2524",
    headerRight: "\u251C",
    dividerUnit: "\u2500\u254C\u2500",
    sectionMarker: "\u06DE",
    bullet: "\u25C7",
    focusIcon: "\u25C6",
    scrollbarThumb: "\u2736",
  },
  colors: {
    primary: "#1C39BB",        // Alhambra azurite blue
    secondary: "#DAA520",      // Goldenrod
    background: "#0D1B2A",     // Deep blue-black
    text: "#F0E6D3",           // Warm sandstone
    border: "#2A4A7A",         // Mid azurite
    borderFocused: "#DAA520",  // Goldenrod focused
    highlight: "#F0C040",      // Bright gold
    muted: "#5A6A7A",          // Slate
    arabic: "#DAA520",         // Goldenrod Arabic
    translation: "#F0E6D3",    // Sandstone
    transliteration: "#C75B39",// Terracotta transliteration
    verseNum: "#6B90C0",       // Soft blue
    bookmark: "#C75B39",       // Terracotta bookmark
    header: "#DAA520",         // Goldenrod headers
    statusBar: "#081420",      // Darkest blue
  },
  get lightColors() { return deriveLightPalette(this.colors, this.id); },
};

/**
 * MAGHRIBI (Fez/Morocco, 12th-19th c.)
 * North African Qurans: Celtic-style braided knots, geometric Kufic script.
 * Indigo, dark goldenrod, ochre earth pigments.
 * ASCII signature: Double-line braids — complex knotwork borders.
 */
export const maghribiTheme: Theme = {
  id: "maghribi",
  name: "Maghribi",
  era: "Fez/Morocco 12th\u201319th c.",
  description: "Braided knotwork \u2014 indigo & ochre",
  borderStyle: "single",
  borderStyleFocused: "double",
  ornaments: {
    verseMarker: "\u25B6",
    bookmarkIcon: "\u2734",
    headerLeft: "\u2554\u2550\u2550",
    headerRight: "\u2550\u2550\u2557",
    dividerUnit: "\u2567\u2550\u2550\u2567",
    sectionMarker: "\u06DE",
    bullet: "\u25AA",
    focusIcon: "\u25C6",
  },
  colors: {
    primary: "#003366",        // Moroccan indigo blue
    secondary: "#B8860B",      // Dark goldenrod
    background: "#0A1628",     // Very dark blue
    text: "#E8DCC8",           // Warm sand
    border: "#1A3656",         // Deep indigo
    borderFocused: "#B8860B",  // Goldenrod focused
    highlight: "#CC7722",      // Ochre highlight
    muted: "#4A5A6A",          // Slate gray
    arabic: "#B8860B",         // Goldenrod Arabic
    translation: "#E8DCC8",    // Warm sand
    transliteration: "#8AB4C0",// Soft teal
    verseNum: "#5A8AAA",       // Steel blue
    bookmark: "#CC7722",       // Ochre bookmark
    header: "#B8860B",         // Goldenrod headers
    statusBar: "#061020",      // Darkest indigo
  },
  get lightColors() { return deriveLightPalette(this.colors, this.id); },
};

/**
 * MADINAH — the original default. Islamic green + teal + gold.
 * A modern "spiritual green" theme, not tied to a specific dynasty.
 */
export const madinahTheme: Theme = {
  id: "madinah",
  name: "Madinah",
  era: "Modern",
  description: "Spiritual green \u2014 the classic default",
  borderStyle: "rounded",
  borderStyleFocused: "heavy",
  ornaments: {
    verseMarker: "\u25B8",
    bookmarkIcon: "\u2605",
    headerLeft: "\u2550\u2550\u2550",
    headerRight: "\u2550\u2550\u2550",
    dividerUnit: "\u2500\u2500",
    sectionMarker: "\u06DE",
    bullet: "\u25CF",
    focusIcon: "\u25C6",
    scrollbarThumb: "\u06DE",
  },
  colors: {
    primary: "#2E7D32",
    secondary: "#00ACC1",
    background: "#000000",
    text: "#E0E0E0",
    border: "#2E7D32",
    borderFocused: "#00E676",
    highlight: "#FFD54F",
    muted: "#757575",
    arabic: "#D4A574",
    translation: "#E0E0E0",
    transliteration: "#4DD0E1",
    verseNum: "#81C784",
    bookmark: "#FFD54F",
    header: "#00E676",
    statusBar: "#1B5E20",
  },
  get lightColors() { return deriveLightPalette(this.colors, this.id); },
};

/**
 * UMAYYAD (Damascus, 661-750)
 * The first dynastic caliphate — austere, monumental, early.
 * Desert golds and deep vermilion on parchment ground, minimal ornament.
 * ASCII signature: Simple box-drawing (U+2500 U+2502) — understated authority.
 */
export const umayyadTheme: Theme = {
  id: "umayyad",
  name: "Umayyad",
  era: "Damascus 661\u2013750",
  description: "Desert austerity \u2014 gold & vermilion",
  borderStyle: "single",
  borderStyleFocused: "heavy",
  ornaments: {
    verseMarker: "\u25B8",
    bookmarkIcon: "\u2726",
    headerLeft: "\u2500\u2500\u2500",
    headerRight: "\u2500\u2500\u2500",
    dividerUnit: "\u2500\u2500",
    sectionMarker: "\u06DE",
    bullet: "\u25CF",
    focusIcon: "\u25C6",
    scrollbarThumb: "\u06DE",
  },
  colors: {
    primary: "#B8860B",        // Dark goldenrod — desert gold
    secondary: "#CD3700",      // Deep vermilion red
    background: "#110E0A",     // Dark parchment ground
    text: "#E8DCC0",           // Warm vellum
    border: "#8B6914",         // Aged gold
    borderFocused: "#CD3700",  // Vermilion when focused
    highlight: "#FFD700",      // Bright gold highlight
    muted: "#7A6A50",          // Sandy mute
    arabic: "#DAA520",         // Goldenrod Arabic
    translation: "#E8DCC0",    // Warm vellum
    transliteration: "#C19A6B",// Fawn / desert sand
    verseNum: "#A08050",       // Muted gold
    bookmark: "#CD3700",       // Vermilion bookmark
    header: "#DAA520",         // Goldenrod headers
    statusBar: "#0D0A06",      // Darkest parchment
  },
  get lightColors() { return deriveLightPalette(this.colors, this.id); },
};

/**
 * ABBASID (Baghdad, 750-1258)
 * The Islamic Golden Age — Sarlawh complex illumination, lapis & gold,
 * scholarly grandeur.  Full-page carpet openings with dense geometry.
 * ASCII signature: Block Elements shading (U+2593 U+2592 U+2591) — Sarlawh layering.
 */
export const abbasidTheme: Theme = {
  id: "abbasid",
  name: "Abbasid",
  era: "Baghdad 750\u20131258",
  description: "Golden Age splendour \u2014 lapis & emerald",
  borderStyle: "single",
  borderStyleFocused: "heavy",
  ornaments: {
    verseMarker: "\u25B8",
    bookmarkIcon: "\u2726",
    headerLeft: "\u2593\u2592\u2591",
    headerRight: "\u2591\u2592\u2593",
    dividerUnit: "\u2593\u2591",
    sectionMarker: "\u06DE",
    bullet: "\u25A0",
    focusIcon: "\u25C6",
  },
  colors: {
    primary: "#1A237E",        // Deep lapis lazuli
    secondary: "#FFD700",      // Burnished gold
    background: "#0A0D1A",     // Dark indigo ground
    text: "#E8E0D0",           // Warm ivory
    border: "#1A237E",         // Lapis border
    borderFocused: "#FFD700",  // Gold when focused
    highlight: "#FFD700",      // Bright gold
    muted: "#4A5570",          // Blue-gray mute
    arabic: "#FFD700",         // Gold Arabic
    translation: "#E8E0D0",    // Warm ivory
    transliteration: "#50C878",// Emerald green
    verseNum: "#5C6BC0",       // Indigo verse numbers
    bookmark: "#50C878",       // Emerald bookmark
    header: "#FFD700",         // Gold headers
    statusBar: "#060810",      // Deepest indigo
  },
  get lightColors() { return deriveLightPalette(this.colors, this.id); },
};

/**
 * FATIMID (Cairo, 909-1171)
 * North African Shamsa medallion illumination — solar radiance on deep indigo.
 * Gold, turquoise, and white — the Fatimid palette reflects Mediterranean light.
 * ASCII signature: Shamsa medallion ۞ with bracket framing — radiant centre.
 */
export const fatimidTheme: Theme = {
  id: "fatimid",
  name: "Fatimid",
  era: "Cairo 909\u20131171",
  description: "Shamsa medallions \u2014 gold on indigo",
  borderStyle: "rounded",
  borderStyleFocused: "heavy",
  ornaments: {
    verseMarker: "\u25B9",
    bookmarkIcon: "\u2739",
    headerLeft: "\u276E \u06DE",
    headerRight: "\u06DE \u276F",
    dividerUnit: "\u00B7\u2500\u00B7",
    sectionMarker: "\u06DE",
    bullet: "\u25C9",
    focusIcon: "\u2756",
    scrollbarThumb: "\u06DE",
  },
  colors: {
    primary: "#191970",        // Midnight blue / deep indigo
    secondary: "#FFD700",      // Brilliant gold
    background: "#0C0E1A",     // Dark indigo ground
    text: "#F0E8D8",           // Light parchment
    border: "#283593",         // Royal blue
    borderFocused: "#FFD700",  // Gold when focused
    highlight: "#FFD700",      // Gold highlight
    muted: "#506080",          // Slate blue mute
    arabic: "#FFD700",         // Gold Arabic
    translation: "#F0E8D8",    // Light parchment
    transliteration: "#40E0D0",// Turquoise
    verseNum: "#5C7FBA",       // Soft indigo
    bookmark: "#40E0D0",       // Turquoise bookmark
    header: "#FFD700",         // Gold headers
    statusBar: "#080A14",      // Deepest indigo
  },
  get lightColors() { return deriveLightPalette(this.colors, this.id); },
};

/**
 * SELJUK (Isfahan/Konya, 1037-1194)
 * Kufic geometric frieze — architectural brick patterns, Banna'i tilework.
 * Turquoise and cobalt on a warm brick-red ground, structural clarity.
 * ASCII signature: Half-blocks ▀▄█ for maze meander — Timurid/Banna'i geometry.
 */
export const seljukTheme: Theme = {
  id: "seljuk",
  name: "Seljuk",
  era: "Isfahan/Konya 1037\u20131194",
  description: "Kufic frieze \u2014 turquoise & cobalt",
  borderStyle: "single",
  borderStyleFocused: "heavy",
  ornaments: {
    verseMarker: "\u25BA",
    bookmarkIcon: "\u2736",
    headerLeft: "\u2588\u2584\u2580",
    headerRight: "\u2580\u2584\u2588",
    dividerUnit: "\u2580\u2584",
    sectionMarker: "\u06DE",
    bullet: "\u25AA",
    focusIcon: "\u25C6",
  },
  colors: {
    primary: "#00838F",        // Deep turquoise
    secondary: "#0D47A1",      // Cobalt blue
    background: "#0A1214",     // Dark teal ground
    text: "#E0E8EC",           // Cool white
    border: "#00838F",         // Turquoise border
    borderFocused: "#00BCD4",  // Bright turquoise focused
    highlight: "#00BCD4",      // Turquoise highlight
    muted: "#546E7A",          // Blue-gray mute
    arabic: "#00BCD4",         // Bright turquoise Arabic
    translation: "#E0E8EC",    // Cool white
    transliteration: "#F4511E",// Brick red
    verseNum: "#4DB6AC",       // Soft teal
    bookmark: "#F4511E",       // Brick red bookmark
    header: "#00BCD4",         // Turquoise headers
    statusBar: "#060E10",      // Darkest teal
  },
  get lightColors() { return deriveLightPalette(this.colors, this.id); },
};

/**
 * MUGHAL (Delhi/Agra, 1526-1857)
 * Persian-Indian synthesis — Mughal miniature painting palette.
 * Rich red, deep green, soft rose pink, and gold.  Layered floral borders.
 * ASCII signature: Double-line borders with floral-adjacent Unicode — layered opulence.
 */
export const mughalTheme: Theme = {
  id: "mughal",
  name: "Mughal",
  era: "Delhi/Agra 1526\u20131857",
  description: "Layered florals \u2014 gold, red & rose",
  borderStyle: "double",
  borderStyleFocused: "heavy",
  ornaments: {
    verseMarker: "\u25B8",
    bookmarkIcon: "\u2740",
    headerLeft: "\u2740 \u2550\u2550",
    headerRight: "\u2550\u2550 \u2740",
    dividerUnit: "\u2550\u2550\u2550",
    sectionMarker: "\u06DE",
    bullet: "\u2727",
    focusIcon: "\u2756",
  },
  colors: {
    primary: "#8B0000",        // Deep Mughal red
    secondary: "#DAA520",      // Goldenrod
    background: "#0F0A0A",     // Dark warm ground
    text: "#F0E0D0",           // Warm cream
    border: "#8B0000",         // Deep red border
    borderFocused: "#DAA520",  // Gold when focused
    highlight: "#FFD700",      // Bright gold
    muted: "#6A5050",          // Warm muted
    arabic: "#DAA520",         // Goldenrod Arabic
    translation: "#F0E0D0",    // Warm cream
    transliteration: "#F08080",// Light coral / rose
    verseNum: "#C07050",       // Muted red-gold
    bookmark: "#2E8B57",       // Sea green bookmark
    header: "#DAA520",         // Goldenrod headers
    statusBar: "#0A0606",      // Darkest warm
  },
  get lightColors() { return deriveLightPalette(this.colors, this.id); },
};

// ---------------------------------------------------------------------------
// Theme registry — ordered for cycling with keyboard shortcut (T)
// ---------------------------------------------------------------------------

export const THEMES: readonly Theme[] = [
  madinahTheme,
  mamlukTheme,
  ottomanTheme,
  safavidTheme,
  andalusianTheme,
  maghribiTheme,
  umayyadTheme,
  abbasidTheme,
  fatimidTheme,
  seljukTheme,
  mughalTheme,
] as const;

export const THEME_IDS = THEMES.map((t) => t.id);

export const defaultTheme = madinahTheme;

// ---------------------------------------------------------------------------
// Context provider with cycling support
// ---------------------------------------------------------------------------

interface ThemeContextType {
  theme: () => Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>();

export const ThemeProvider: Component<{ children: JSX.Element }> = (props) => {
  const { resolvedMode } = useMode();
  
  // Synchronously load saved theme preference before signal creation (no flash)
  let initialTheme = defaultTheme;
  try {
    const savedId = getPreference("theme");
    if (savedId) {
      const found = THEMES.find((t) => t.id === savedId);
      if (found) initialTheme = found;
    }
  } catch {
    // DB may not be available (tests, first run, etc.)
  }

  const [rawTheme, setTheme] = createSignal<Theme>(initialTheme);

  const theme = createMemo(() => {
    const t = rawTheme();
    const mode = resolvedMode();
    return {
      ...t,
      colors: mode === "dark" ? t.colors : t.lightColors,
    };
  });

  const cycleTheme = () => {
    const current = rawTheme();
    const idx = THEMES.findIndex((t) => t.id === current.id);
    const next = THEMES[(idx + 1) % THEMES.length] ?? THEMES[0]!;
    setTheme(next);
    try { setPreference("theme", next.id); } catch { /* DB may not be available */ }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: (t: Theme) => setTheme(t), cycleTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
