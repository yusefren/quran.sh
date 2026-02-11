/**
 * Fuzzy search layer for Quran verses.
 *
 * Indexes all 6,236 verses across translation, transliteration, and Arabic text
 * using @m31coding/fuzzy-search. Lazily initialised on first query.
 */
import { Config, SearcherFactory, Query } from "@m31coding/fuzzy-search";
import type { DynamicSearcher } from "@m31coding/fuzzy-search";
import { createRequire } from "node:module";
import type { VerseRef } from "./quran";

// ---------------------------------------------------------------------------
// Raw types (same shape as quran-json)
// ---------------------------------------------------------------------------

interface RawVerse {
  id: number;
  text: string;
  translation: string;
  transliteration: string;
}

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
// Searcher singleton
// ---------------------------------------------------------------------------

const _require = createRequire(import.meta.url);

let _searcher: DynamicSearcher<VerseRef, string> | null = null;

/**
 * Whether the search index has been built and is ready for queries.
 */
export function isIndexReady(): boolean {
  return _searcher !== null;
}

/**
 * Trigger index building asynchronously (defers to next tick so the UI
 * can render an "Indexing…" indicator before the synchronous work blocks).
 */
export function ensureSearcherAsync(): Promise<void> {
  if (_searcher) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(() => {
      ensureSearcher();
      resolve();
    }, 0);
  });
}

function ensureSearcher(): DynamicSearcher<VerseRef, string> {
  if (_searcher) return _searcher;

  // Allow all characters (Arabic, diacritics, etc.)
  const config = Config.createDefaultConfig();
  config.normalizerConfig.allowCharacter = (_c: string) => true;

  const searcher = SearcherFactory.createSearcher<VerseRef, string>(config);

  // Load monolithic English data (contains Arabic text + transliteration too)
  const chapters = _require("quran-json/dist/quran_en.json") as RawChapter[];

  const entities: VerseRef[] = [];

  for (const ch of chapters) {
    for (const v of ch.verses) {
      entities.push({
        surahId: ch.id,
        surahName: ch.name,
        surahTransliteration: ch.transliteration,
        verseId: v.id,
        text: v.text,
        translation: v.translation,
        transliteration: v.transliteration || undefined,
        reference: `${ch.id}:${v.id}`,
      });
    }
  }

  searcher.indexEntities(
    entities,
    (e) => e.reference,
    (e) => {
      const terms: string[] = [e.translation, e.text];
      if (e.transliteration) terms.push(e.transliteration);
      return terms;
    },
  );

  _searcher = searcher;
  return searcher;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface FuzzySearchResult {
  verse: VerseRef;
  quality: number;
  matchedString: string;
}

/**
 * Perform a fuzzy search across all Quran verses.
 *
 * Searches translation (English), Arabic text, and transliteration.
 * Results are ranked by match quality (highest first).
 *
 * @param query - The search string.
 * @param topN  - Maximum results to return (default 20).
 */
export function fuzzySearch(query: string, topN = 20): FuzzySearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const searcher = ensureSearcher();
  const result = searcher.getMatches(new Query(trimmed, topN));

  return result.matches.map((m) => ({
    verse: m.entity,
    quality: m.quality,
    matchedString: m.matchedString,
  }));
}
