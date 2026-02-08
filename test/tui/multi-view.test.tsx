import { describe, expect, test } from "bun:test";
import { testRender } from "@opentui/solid";
import { Reader } from "../../src/tui/components/reader";
import { ThemeProvider } from "../../src/tui/theme";

describe("Multi-View Reader", () => {
  test("renders Arabic by default (or when enabled)", async () => {
    const { captureSpans, renderOnce } = await testRender(() => (
      <ThemeProvider>
        <Reader surahId={1} focused={true} showArabic={true} />
      </ThemeProvider>
    ));
    await renderOnce();

    const output = captureSpans().lines
      .map((line) => line.spans.map((s) => s.text).join(""))
      .join("\n");

    // Check for Arabic Bismillah
    expect(output).toContain("بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ");
  });

  test("hides Arabic when disabled", async () => {
    const { captureSpans, renderOnce } = await testRender(() => (
      <ThemeProvider>
        <Reader surahId={1} focused={true} showArabic={false} />
      </ThemeProvider>
    ));
    await renderOnce();

    const output = captureSpans().lines
      .map((line) => line.spans.map((s) => s.text).join(""))
      .join("\n");

    // Should NOT contain Arabic Bismillah
    expect(output).not.toContain("بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ");
    // Should still contain translation
    expect(output).toContain("In the name of Allah");
  });

  test("shows transliteration when enabled", async () => {
    const { captureSpans, renderOnce } = await testRender(() => (
      <ThemeProvider>
        <Reader surahId={1} focused={true} showTransliteration={true} />
      </ThemeProvider>
    ));
    await renderOnce();

    const output = captureSpans().lines
      .map((line) => line.spans.map((s) => s.text).join(""))
      .join("\n");

    // Check for transliteration
    expect(output).toContain("Bismi Allahi alrrahmani alrraheemi");
  });

  test("switches language to French", async () => {
    const { captureSpans, renderOnce } = await testRender(() => (
      <ThemeProvider>
        <Reader surahId={1} focused={true} language="fr" />
      </ThemeProvider>
    ));
    await renderOnce();

    const output = captureSpans().lines
      .map((line) => line.spans.map((s) => s.text).join(""))
      .join("\n");

    // Check for French translation
    expect(output).toContain("Au nom d'Allah");
  });
});
