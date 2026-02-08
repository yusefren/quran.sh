/**
 * Verification script for Task 2: Data & Storage Layer
 *
 * Validates:
 * 1. quran-json is importable and has expected structure
 * 2. Database creates at the specified path with WAL mode
 * 3. Migrations run and tables exist with correct schema
 *
 * Run: bun run scripts/verify-data-layer.ts
 */
import { openDatabase } from "../src/data/db";
import { existsSync, unlinkSync, rmSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// Use the test path specified in the task
const TEST_DB_DIR = join(homedir(), ".local", "share", "quran.sh");
const TEST_DB_PATH = join(TEST_DB_DIR, "test.db");

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  \u2705 ${label}`);
    passed++;
  } else {
    console.log(`  \u274c ${label}${detail ? ` -- ${detail}` : ""}`);
    failed++;
  }
}

// ---- Cleanup any previous test DB ----
if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH);
// Also clean WAL/SHM files
for (const ext of ["-wal", "-shm"]) {
  const f = TEST_DB_PATH + ext;
  if (existsSync(f)) unlinkSync(f);
}

// ---- 1. quran-json ----
console.log("\n1. quran-json package");

// The main export is the English chapters index
const chaptersIndex = require("quran-json");
assert("Default import is an array", Array.isArray(chaptersIndex));
assert("Has 114 surahs", chaptersIndex.length === 114);

const first = chaptersIndex[0];
assert("First surah has expected fields", first.id === 1 && first.transliteration === "Al-Fatihah");

// Load a specific chapter with translation
const alFatihah = require("quran-json/dist/chapters/en/1.json");
assert("Chapter JSON has verses", Array.isArray(alFatihah.verses) && alFatihah.verses.length === 7);
assert("Verse has translation field", typeof alFatihah.verses[0].translation === "string");

// ---- 2. Database creation ----
console.log("\n2. Database creation");

const db = openDatabase(TEST_DB_PATH);
assert("DB file created", existsSync(TEST_DB_PATH));

// Check WAL mode
const journalMode = db.query("PRAGMA journal_mode;").get() as { journal_mode: string };
assert("WAL mode enabled", journalMode.journal_mode === "wal");

// Check foreign keys
const fk = db.query("PRAGMA foreign_keys;").get() as { foreign_keys: number };
assert("Foreign keys enabled", fk.foreign_keys === 1);

// ---- 3. Tables ----
console.log("\n3. Schema verification");

const tables = db
  .query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
  .all() as { name: string }[];
const tableNames = tables.map((t) => t.name);

assert("reading_log table exists", tableNames.includes("reading_log"));
assert("bookmarks table exists", tableNames.includes("bookmarks"));

// Verify reading_log columns
const rlCols = db.query("PRAGMA table_info(reading_log);").all() as { name: string }[];
const rlColNames = rlCols.map((c) => c.name);
assert("reading_log has id", rlColNames.includes("id"));
assert("reading_log has verse_ref", rlColNames.includes("verse_ref"));
assert("reading_log has surah", rlColNames.includes("surah"));
assert("reading_log has ayah", rlColNames.includes("ayah"));
assert("reading_log has read_at", rlColNames.includes("read_at"));

// Verify bookmarks columns
const bmCols = db.query("PRAGMA table_info(bookmarks);").all() as { name: string }[];
const bmColNames = bmCols.map((c) => c.name);
assert("bookmarks has id", bmColNames.includes("id"));
assert("bookmarks has verse_ref", bmColNames.includes("verse_ref"));
assert("bookmarks has surah", bmColNames.includes("surah"));
assert("bookmarks has ayah", bmColNames.includes("ayah"));
assert("bookmarks has created_at", bmColNames.includes("created_at"));
assert("bookmarks has label", bmColNames.includes("label"));

// ---- 4. Smoke test: insert & query ----
console.log("\n4. Smoke test");

db.exec(`INSERT INTO bookmarks (surah, ayah, verse_ref, label) VALUES (2, 255, '2:255', 'Ayat al-Kursi')`);
const bm = db.query("SELECT * FROM bookmarks WHERE verse_ref = '2:255'").get() as Record<string, unknown>;
assert("Can insert bookmark", bm !== null);
assert("Bookmark label correct", bm?.["label"] === "Ayat al-Kursi");

db.exec(`INSERT INTO reading_log (surah, ayah, verse_ref) VALUES (1, 1, '1:1')`);
const rl = db.query("SELECT * FROM reading_log WHERE verse_ref = '1:1'").get() as Record<string, unknown>;
assert("Can insert reading_log", rl !== null);
assert("read_at auto-populated", typeof rl?.["read_at"] === "string");

// ---- Cleanup ----
db.close();

// ---- Summary ----
console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("All checks passed!\n");
}
