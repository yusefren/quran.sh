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
 * Check whether every verse in a surah has already been logged today.
 * Used as a data-layer safety net to prevent duplicate batch inserts.
 */
export function isSurahLoggedToday(surahId: number, totalVerses: number): boolean {
  const db = openDatabase();
  try {
    const row = db.query(
      "SELECT COUNT(DISTINCT ayah) as cnt FROM reading_log WHERE surah = ? AND date(read_at) = date('now')",
    ).get(surahId) as { cnt: number } | null;
    return (row?.cnt ?? 0) >= totalVerses;
  } finally {
    db.close();
  }
}

/**
 * Log every verse in a surah (by numeric ID or transliterated name).
 * Each verse gets its own row for granular progress tracking.
 * Skips insertion if the surah was already fully logged today (issue #5).
 */
export function logSurah(surah: Surah): LogResult {
  // Data-layer dedup: skip if already fully logged today
  if (isSurahLoggedToday(surah.id, surah.totalVerses)) {
    return {
      ok: true,
      message: `✓ Surah ${surah.id} (${surah.transliteration}) already logged today — skipped`,
    };
  }

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
