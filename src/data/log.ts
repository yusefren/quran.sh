/**
 * Reading log persistence for quran.sh
 *
 * Inserts reading records into the `reading_log` SQLite table.
 * Uses openDatabase() so the production DB path is consistent.
 */
import { openDatabase } from "./db.ts";
import { getVerse } from "./quran.ts";
import type { Surah } from "./quran.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LogResult {
  ok: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Insert a single reading_log row.
 * Returns the inserted row id.
 */
function insertLogEntry(
  surah: number,
  ayah: number,
  verseRef: string,
): void {
  const db = openDatabase();
  try {
    db.query(
      "INSERT INTO reading_log (surah, ayah, verse_ref) VALUES (?, ?, ?)",
    ).run(surah, ayah, verseRef);
  } finally {
    db.close();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Log a single verse by colon-notation reference (e.g. "2:255").
 */
export function logVerse(ref: string): LogResult {
  const verse = getVerse(ref);
  if (!verse) {
    return {
      ok: false,
      message: `Error: Verse "${ref}" not found. Use format "surah:verse" (e.g. 1:1, 2:255).`,
    };
  }

  insertLogEntry(verse.surahId, verse.verseId, verse.reference);
  return {
    ok: true,
    message: `✓ Logged verse ${verse.reference}`,
  };
}

/**
 * Log every verse in a surah (by numeric ID or transliterated name).
 * Each verse gets its own row for granular progress tracking.
 */
export function logSurah(surah: Surah): LogResult {
  const db = openDatabase();
  try {
    const stmt = db.query(
      "INSERT INTO reading_log (surah, ayah, verse_ref) VALUES (?, ?, ?)",
    );

    const transaction = db.transaction(() => {
      for (const verse of surah.verses) {
        stmt.run(surah.id, verse.id, `${surah.id}:${verse.id}`);
      }
    });

    transaction();
  } finally {
    db.close();
  }

  return {
    ok: true,
    message: `✓ Logged ${surah.totalVerses} verses from Surah ${surah.id} (${surah.transliteration})`,
  };
}
