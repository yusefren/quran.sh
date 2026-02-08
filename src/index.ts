#!/usr/bin/env bun
/**
 * quran.sh — CLI entry point.
 *
 * Usage:
 *   quran.sh read <ref>
 *
 * Reference formats:
 *   1            — full surah by number
 *   1:1          — single verse by surah:verse
 *   al-fatihah   — full surah by transliterated name
 */
import { getSurah, getVerse, TOTAL_SURAHS } from "./data/quran.ts";
import type { Surah, VerseRef } from "./data/quran.ts";
import { logVerse, logSurah } from "./data/log.ts";
import { getReadingStats } from "./data/streaks.ts";
import { getReadingStats } from "./data/streaks.ts";

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

function formatSurah(surah: Surah): string {
  const header = `Surah ${surah.id}: ${surah.transliteration} (${surah.translation})`;
  const verses = surah.verses
    .map((v) => v.translation)
    .join("\n");
  return `${header}\n\n${verses}`;
}

function formatVerse(verse: VerseRef): string {
  return `[${verse.reference}] ${verse.translation}`;
}

// ---------------------------------------------------------------------------
// Reference parsing & dispatch
// ---------------------------------------------------------------------------

/**
 * Detect the type of reference and fetch the appropriate data.
 * Returns formatted output string or an error message.
 */
function handleRead(ref: string): { ok: boolean; output: string } {
  // Verse reference: contains ":"
  if (ref.includes(":")) {
    const verse = getVerse(ref);
    if (!verse) {
      return {
        ok: false,
        output: `Error: Verse "${ref}" not found. Use format "surah:verse" (e.g. 1:1, 2:255).`,
      };
    }
    return { ok: true, output: formatVerse(verse) };
  }

  // Numeric surah ID: all digits
  if (/^\d+$/.test(ref)) {
    const id = Number(ref);
    const surah = getSurah(id);
    if (!surah) {
      return {
        ok: false,
        output: `Error: Surah ${id} not found. Valid range: 1-${TOTAL_SURAHS}.`,
      };
    }
    return { ok: true, output: formatSurah(surah) };
  }

  // Surah name (transliteration)
  const surah = getSurah(ref);
  if (!surah) {
    return {
      ok: false,
      output: `Error: Surah "${ref}" not found. Use transliterated name (e.g. al-fatihah, al-baqarah).`,
    };
  }
  return { ok: true, output: formatSurah(surah) };
}

// ---------------------------------------------------------------------------
// Log command
// ---------------------------------------------------------------------------

/**
 * Handle the `log <ref>` command.
 * Supports the same reference formats as `read`: surah:verse, surah number, surah name.
 */
function handleLog(ref: string): { ok: boolean; output: string } {
  // Verse reference: contains ":"
  if (ref.includes(":")) {
    const result = logVerse(ref);
    return { ok: result.ok, output: result.message };
  }

  // Numeric surah ID: all digits
  if (/^\d+$/.test(ref)) {
    const id = Number(ref);
    const surah = getSurah(id);
    if (!surah) {
      return {
        ok: false,
        output: `Error: Surah ${id} not found. Valid range: 1-${TOTAL_SURAHS}.`,
      };
    }
    const result = logSurah(surah);
    return { ok: result.ok, output: result.message };
  }

  // Surah name (transliteration)
  const surah = getSurah(ref);
  if (!surah) {
    return {
      ok: false,
      output: `Error: Surah "${ref}" not found. Use transliterated name (e.g. al-fatihah, al-baqarah).`,
    };
  }
  const result = logSurah(surah);
  return { ok: result.ok, output: result.message };
}

// ---------------------------------------------------------------------------
// Streak command
// ---------------------------------------------------------------------------

function handleStreak(): void {
  const stats = getReadingStats();
  console.log("📖 Reading Streak");
  console.log("──────────────────");
  console.log(`Current Streak: ${stats.currentStreak} days`);
  console.log(`Longest Streak: ${stats.longestStreak} days`);
  console.log(`Total Reading Days: ${stats.totalDays} days`);
}

// ---------------------------------------------------------------------------
// Streak command
// ---------------------------------------------------------------------------

function handleStreak(): void {
  const stats = getReadingStats();
  console.log("📖 Reading Streak");
  console.log("──────────────────");
  console.log(`Current Streak: ${stats.currentStreak} days`);
  console.log(`Longest Streak: ${stats.longestStreak} days`);
  console.log(`Total Reading Days: ${stats.totalDays} days`);
}

// ---------------------------------------------------------------------------
// CLI router
// ---------------------------------------------------------------------------

function showUsage(): void {
  console.log(`quran.sh — Read the Quran from your terminal

Usage:
  quran.sh read   <ref>  Read a surah or verse
  quran.sh log    <ref>  Log a surah or verse as read
  quran.sh streak        Show reading stats and streaks

Reference formats:
  1              Full surah by number (1-${TOTAL_SURAHS})
  1:1            Single verse (surah:verse)
  al-fatihah     Full surah by name

Examples:
  quran.sh read 1          Al-Fatihah (full surah)
  quran.sh read 1:1        First verse of Al-Fatihah
  quran.sh read 2:255      Ayat al-Kursi
  quran.sh read al-fatihah Al-Fatihah by name
  quran.sh log  1:1        Log verse 1:1 as read
  quran.sh log  1          Log all verses in Surah 1
  quran.sh streak          Show current streak`);
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    showUsage();
    process.exit(0);
  }

  if (command === "streak") {
    handleStreak();
    process.exit(0);
  }

  if (command !== "read" && command !== "log") {
    console.error(`Error: Unknown command "${command}". Run with --help for usage.`);
    process.exit(1);
  }

  const ref = args[1];
  if (!ref) {
    console.error(`Error: Missing reference. Usage: quran.sh ${command} <ref>`);
    console.error(`  Examples: ${command} 1, ${command} 1:1, ${command} al-fatihah`);
    process.exit(1);
  }

  const handler = command === "read" ? handleRead : handleLog;
  const result = handler(ref);
  if (result.ok) {
    console.log(result.output);
    process.exit(0);
  } else {
    console.error(result.output);
    process.exit(1);
  }
}

main();