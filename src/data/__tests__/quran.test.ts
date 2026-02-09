import { test, expect, describe } from "bun:test";
import { getSurah } from "../quran";

describe("quran data layer", () => {
  test("getSurah(1) returns Al-Fatihah", () => {
    const surah = getSurah(1);
    expect(surah).not.toBeNull();
    expect(surah?.transliteration).toBe("Al-Fatihah");
  });
});
