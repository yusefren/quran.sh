/**
 * BiDi Spike — Validate bidi-js Arabic rendering with OpenTUI
 *
 * PURPOSE: Test whether bidi-js correctly reorders Arabic Quranic text
 * from logical (memory) order to visual (display) order for terminal rendering.
 *
 * FINDINGS:
 * STATUS: VALIDATED WITH CAVEAT — bidi-js works correctly, but terminal already has native BiDi.
 *
 * Observation 1: Raw Arabic text (logical order) renders CORRECTLY in the terminal
 *   as-is. The terminal emulator (and OpenTUI's Zig renderer) natively handle
 *   BiDi reordering, so Arabic appears in the correct right-to-left reading order
 *   without any pre-processing.
 *
 * Observation 2: bidi-js processed text appears BROKEN in the terminal because
 *   it double-reverses — bidi-js converts logical→visual order, then the terminal's
 *   native BiDi reverses it again, resulting in garbled left-to-right character soup.
 *   Example: Raw "بِسۡمِ ٱللَّهِ" → Processed "ِهَّللٱ ِمۡسِب" (broken)
 *
 * Observation 3: The combining diacritical marks (tashkeel) get separated from
 *   their base characters after bidi-js reordering, further breaking rendering.
 *
 * RECOMMENDATION for Task 2:
 *   - Do NOT apply bidi-js pre-processing for terminals with native BiDi support
 *   - The "broken RTL" issue is actually about LEFT-ALIGNMENT and WIDTH, not text order
 *   - Focus on: right-alignment of Arabic text within the pane + width constraints
 *   - Keep bidi-js as a dependency — use processArabicText() as a PASSTHROUGH (identity)
 *     that can be toggled on for terminals without native BiDi in the future
 *   - The rtl.ts module should focus on: alignment, padding, width calculation
 *
 * Run: bun run src/tui/spike-bidi.tsx
 */

import { render } from "@opentui/solid";
import bidiFactory from "bidi-js";
import { getSurah } from "../data/quran";

const bidi = bidiFactory();

function processArabicText(text: string): string {
  const embeddingLevels = bidi.getEmbeddingLevels(text, "auto");
  return bidi.getReorderedString(text, embeddingLevels);
}

const App = () => {
  const surah = getSurah(1);
  if (!surah) {
    return (
      <box flexDirection="column" padding={1}>
        <text color="red">ERROR: Could not load Al-Fatihah</text>
      </box>
    );
  }

  const verse1 = surah.verses[0];
  const rawText = verse1.text;
  const processedText = processArabicText(rawText);

  return (
    <box flexDirection="column" padding={1}>
      <text color="cyan">--- BiDi Spike: bidi-js Arabic Rendering ---</text>
      <text />
      <text color="yellow">Verse: Al-Fatihah 1:1</text>
      <text />
      <text color="green">Raw (logical order):</text>
      <text>{rawText}</text>
      <text />
      <text color="green">Processed (visual order via bidi-js):</text>
      <text>{processedText}</text>
      <text />
      <text color="yellow">Translation:</text>
      <text>{verse1.translation}</text>
      <text />
      <text color="cyan">--- Additional verses ---</text>
      {surah.verses.slice(1, 4).map((v) => (
        <box flexDirection="column">
          <text color="yellow">[1:{v.id}]</text>
          <text color="green">Raw: </text>
          <text>{v.text}</text>
          <text color="green">Processed: </text>
          <text>{processArabicText(v.text)}</text>
          <text />
        </box>
      ))}
      <text color="cyan">Press q to quit</text>
    </box>
  );
};

if (import.meta.main) {
  render(() => <App />);
}

export default App;
