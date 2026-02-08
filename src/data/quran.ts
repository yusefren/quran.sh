/**
 * Data access layer for Quran text data.
 *
 * Provides typed access to surah and verse data from the quran-json package.
 * All verse numbering is 1-based to match Islamic scholarly convention.
 */
import { createRequire } from "node:module";

// ---------------------------------------------------------------------------
// Raw JSON types (matching quran-json/dist/quran_en.json structure)
// ---------------------------------------------------------------------------

/** Verse as stored in quran_en.json */
interface RawVerse {
  id: number;
  text: string;
  translation: string;
}

/** Chapter as stored in quran_en.json */
interface RawChapter {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: string;
  total_verses: number;
  verses: RawVerse[];
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Total number of surahs in the Quran */
export const TOTAL_SURAHS = 114;

/** A single verse (ayah) */
export interface Verse {
  /** 1-based verse number within the surah */
  id: number;
  /** Arabic text */
  text: string;
  /** English translation */
  translation: string;
}

/** A surah (chapter) with its verses */
export interface Surah {
  /** 1-based surah number (1–114) */
  id: number;
  /** Arabic name */
  name: string;
  /** Transliterated name (e.g. "Al-Fatihah") */
  transliteration: string;
  /** English meaning of the name (e.g. "The Opener") */
  translation: string;
  /** Revelation type */
  type: "meccan" | "medinan";
  /** Total verse count */
  totalVerses: number;
  /** All verses in the surah */
  verses: Verse[];
}

/** A verse with its surah context, returned by getVerse() and search() */
export interface VerseRef {
  surahId: number;
  surahName: string;
  surahTransliteration: string;
  verseId: number;
  text: string;
  translation: string;
  /** Colon-notation reference, e.g. "2:255" */
  reference: string;
}

// ---------------------------------------------------------------------------
// Data loading (lazy, cached)
// ---------------------------------------------------------------------------

const _require = createRequire(import.meta.url);

let _chapters: RawChapter[] | null = null;
let _byId: Map<number, RawChapter> | null = null;
let _byName: Map<string, RawChapter> | null = null;

function loadData(): RawChapter[] {
  if (_chapters === null) {
    _chapters = _require("quran-json/dist/quran_en.json") as RawChapter[];
    _byId = new Map<number, RawChapter>();
    _byName = new Map<string, RawChapter>();

    for (const ch of _chapters) {
      _byId.set(ch.id, ch);
      _byName.set(ch.transliteration.toLowerCase(), ch);
    }
  }
  return _chapters;
}

function chapterById(): Map<number, RawChapter> {
  loadData();
  return _byId!;
}

function chapterByName(): Map<string, RawChapter> {
  loadData();
  return _byName!;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function rawToSurah(raw: RawChapter): Surah {
  return {
    id: raw.id,
    name: raw.name,
    transliteration: raw.transliteration,
    translation: raw.translation,
    type: raw.type as "meccan" | "medinan",
    totalVerses: raw.total_verses,
    verses: raw.verses.map((v) => ({
      id: v.id,
      text: v.text,
      translation: v.translation,
    })),
  };
}

function rawToVerseRef(ch: RawChapter, v: RawVerse): VerseRef {
  return {
    surahId: ch.id,
    surahName: ch.name,
    surahTransliteration: ch.transliteration,
    verseId: v.id,
    text: v.text,
    translation: v.translation,
    reference: `${ch.id}:${v.id}`,
  };
}

/**
 * Parse a verse reference string like "1:1" or "2:255".
 * Returns null if the format is invalid.
 */
function parseVerseRef(ref: string): { surahId: number; verseId: number } | null {
  const parts = ref.split(":");
  const surahStr = parts[0];
  const verseStr = parts[1];

  if (parts.length !== 2 || surahStr === undefined || verseStr === undefined) {
    return null;
  }

  const surahId = Number(surahStr);
  const verseId = Number(verseStr);

  if (!Number.isInteger(surahId) || !Number.isInteger(verseId)) return null;
  if (surahId < 1 || surahId > TOTAL_SURAHS) return null;
  if (verseId < 1) return null;

  return { surahId, verseId };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a surah by its numeric ID (1–114) or transliterated name.
 *
 * Name matching is case-insensitive and trims whitespace.
 *
 * @example
 * ```ts
 * getSurah(1)              // Al-Fatihah
 * getSurah("al-baqarah")   // Al-Baqarah
 * getSurah("Al-Fatihah")   // Al-Fatihah
 * ```
 *
 * @returns The surah with all verses, or `null` if not found.
 */
export function getSurah(id: number | string): Surah | null {
  if (typeof id === "number") {
    if (!Number.isInteger(id) || id < 1 || id > TOTAL_SURAHS) return null;
    const raw = chapterById().get(id);
    return raw ? rawToSurah(raw) : null;
  }

  // String: case-insensitive transliteration match
  const normalized = id.trim().toLowerCase();
  if (normalized.length === 0) return null;

  const raw = chapterByName().get(normalized);
  return raw ? rawToSurah(raw) : null;
}

/**
 * Get a single verse by its colon-notation reference.
 *
 * @param ref - Reference in "surah:verse" format, e.g. "1:1", "2:255"
 * @returns The verse with surah context, or `null` if not found.
 */
export function getVerse(ref: string): VerseRef | null {
  const parsed = parseVerseRef(ref);
  if (!parsed) return null;

  const chapter = chapterById().get(parsed.surahId);
  if (!chapter) return null;

  // Verse IDs are 1-based in data; use find() to avoid off-by-one issues
  const verse = chapter.verses.find((v) => v.id === parsed.verseId);
  if (!verse) return null;

  return rawToVerseRef(chapter, verse);
}

/**
 * Search verse translations for a query string.
 *
 * @param query - Case-insensitive search term.
 * @returns Array of matching verses with references. Empty array if no matches
 *          or if query is empty/whitespace.
 */
export function search(query: string): VerseRef[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return [];

  const results: VerseRef[] = [];
  const chapters = loadData();

  for (const ch of chapters) {
    for (const v of ch.verses) {
      if (v.translation.toLowerCase().includes(trimmed)) {
        results.push(rawToVerseRef(ch, v));
      }
    }
  }

  return results;
}
