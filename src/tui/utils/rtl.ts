/**
 * RTL (Right-to-Left) text processing utilities for Arabic Quran text.
 *
 * Based on spike findings (src/tui/spike-bidi.tsx):
 * - Modern terminals handle BiDi reordering natively
 * - Applying bidi-js on top causes double-reversal (broken text)
 * - This module focuses on alignment and width rather than text reordering
 * - bidi-js is kept as a dependency for future use with terminals lacking native BiDi
 */

/**
 * Process Arabic text for terminal display.
 *
 * Currently a passthrough — the terminal's native BiDi support handles
 * character reordering correctly. If we need to support terminals without
 * native BiDi, this function can be updated to apply bidi-js processing.
 */
export function processArabicText(text: string): string {
  // Terminal handles BiDi natively — no reordering needed
  return text;
}

/**
 * Right-align text by padding with spaces on the left.
 * Used for Arabic text which should appear on the right side of the pane.
 *
 * @param text - The text to align
 * @param width - Total available width in characters
 * @returns Text padded with leading spaces for right-alignment
 */
export function alignRTL(text: string, width: number): string {
  // For terminal rendering, we use visual character width
  const textWidth = getVisualWidth(text);
  if (textWidth >= width) return text;
  return " ".repeat(width - textWidth) + text;
}

/**
 * Combined function: process Arabic text and prepare for rendering.
 * This is the main export used by reader.tsx.
 */
export function renderArabicVerse(text: string): string {
  return processArabicText(text);
}

/**
 * Estimate the visual width of a string in terminal columns.
 * Arabic characters with diacritics (tashkeel) need special handling
 * as combining marks don't occupy their own column.
 */
function getVisualWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    const code = char.codePointAt(0)!;
    // Combining marks (Arabic tashkeel, etc.) — zero width
    if (isCombiningMark(code)) continue;
    // Most Arabic base characters are single-width in terminal
    width += 1;
  }
  return width;
}

/**
 * Check if a Unicode codepoint is a combining mark (zero-width).
 * Covers Arabic diacritical marks (tashkeel) and general combining marks.
 */
function isCombiningMark(code: number): boolean {
  return (
    // Combining Diacritical Marks
    (code >= 0x0300 && code <= 0x036f) ||
    // Arabic diacritics (Fathah, Dammah, Kasrah, Shadda, Sukun, etc.)
    (code >= 0x0610 && code <= 0x061a) ||
    (code >= 0x064b && code <= 0x065f) ||
    (code >= 0x0670 && code <= 0x0670) ||
    (code >= 0x06d6 && code <= 0x06dc) ||
    (code >= 0x06df && code <= 0x06e4) ||
    (code >= 0x06e7 && code <= 0x06e8) ||
    (code >= 0x06ea && code <= 0x06ed) ||
    // Quran-specific marks (small alef, etc.)
    (code >= 0x08d3 && code <= 0x08ff) ||
    // General combining marks
    (code >= 0xfe20 && code <= 0xfe2f)
  );
}
