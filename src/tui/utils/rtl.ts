/**
 * RTL (Right-to-Left) text processing utilities for Arabic Quran text.
 *
 * Uses `arabic-reshaper` to convert standard Arabic characters (U+0600 block)
 * to Unicode Presentation Forms B (U+FE70 block) which have pre-shaped
 * contextual forms (initial, medial, final, isolated). This ensures Arabic
 * letters appear connected even in cell-based terminal renderers like OpenTUI
 * that place one character per cell.
 *
 * The reshaped text is then reversed character-by-character to counteract the
 * terminal's native BiDi algorithm, which would otherwise re-order the
 * already-placed characters.
 */
// @ts-ignore — no type declarations
import ArabicReshaper from "arabic-reshaper";

/**
 * Process Arabic text for terminal display in OpenTUI.
 *
 * 1. Reshapes Arabic characters to Presentation Forms B (connected glyphs)
 * 2. Reverses the character order to counteract terminal BiDi reordering
 *
 * This produces text that looks correctly shaped and ordered when rendered
 * cell-by-cell by OpenTUI's rendering engine.
 */
export function processArabicText(text: string): string {
  const shaped = ArabicReshaper.convertArabic(text) as string;
  return [...shaped].reverse().join("");
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
  const textWidth = getVisualWidth(text);
  if (textWidth >= width) return text;
  return " ".repeat(width - textWidth) + text;
}

/**
 * Combined function: process Arabic text and prepare for rendering.
 * This is the main export used by reader.tsx.
 *
 * @param text - Raw Arabic verse text
 * @param zoom - Zoom level (0-5). Each level adds one space between base characters,
 *               making the Arabic text visually wider/larger in the terminal.
 */
export function renderArabicVerse(text: string, zoom: number = 0): string {
  const shaped = processArabicText(text);
  if (zoom <= 0) return shaped;

  // Add spaces between base characters (skip combining marks so diacritics stay attached)
  const chars = [...shaped];
  const result: string[] = [];
  const spacer = " ".repeat(zoom);

  for (let i = 0; i < chars.length; i++) {
    result.push(chars[i]!);
    // Add spacing after this character, but only if:
    // 1. It's not the last character
    // 2. The next character is not a combining mark (so marks stay attached)
    // 3. Current character is not a space
    if (
      i < chars.length - 1 &&
      !isCombiningMark(chars[i + 1]!.codePointAt(0)!) &&
      chars[i] !== " "
    ) {
      result.push(spacer);
    }
  }

  return result.join("");
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
    if (isCombiningMark(code)) continue;
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
