import { describe, expect, test, afterAll } from "bun:test";
import { addReflection, getReflection, updateReflection, removeReflection, getAllReflections, getReflectionsForSurah } from "../reflections";
import { unlinkSync, existsSync } from "node:fs";

const TEST_DB = "/tmp/test-reflections.db";

describe("Reflections Data Layer", () => {
  afterAll(() => {
    if (existsSync(TEST_DB)) {
      unlinkSync(TEST_DB);
    }
  });

  test("addReflection and getReflection", () => {
    addReflection(1, 1, "1:1", "Opening of the Quran", TEST_DB);
    const reflection = getReflection(1, 1, TEST_DB);
    expect(reflection).not.toBeNull();
    expect(reflection!.surah).toBe(1);
    expect(reflection!.ayah).toBe(1);
    expect(reflection!.note).toBe("Opening of the Quran");
    expect(reflection!.verseRef).toBe("1:1");
  });

  test("updateReflection changes the note", () => {
    updateReflection(1, 1, "Updated note", TEST_DB);
    const reflection = getReflection(1, 1, TEST_DB);
    expect(reflection!.note).toBe("Updated note");
  });

  test("addReflection handles duplicate surah:ayah via upsert", () => {
    addReflection(1, 1, "1:1", "Overwritten", TEST_DB);
    const reflection = getReflection(1, 1, TEST_DB);
    expect(reflection!.note).toBe("Overwritten");
  });

  test("getAllReflections returns all ordered by creation", () => {
    addReflection(2, 255, "2:255", "Ayatul Kursi", TEST_DB);
    const all = getAllReflections(TEST_DB);
    expect(all.length).toBe(2);
    // Ordered by created_at DESC (newest first)
    expect(all[0].surah).toBe(2);
    expect(all[1].surah).toBe(1);
  });

  test("getReflectionsForSurah returns specific surah reflections", () => {
    const reflections = getReflectionsForSurah(1, TEST_DB);
    expect(reflections.length).toBe(1);
    expect(reflections[0].surah).toBe(1);
  });

  test("removeReflection deletes it", () => {
    removeReflection(1, 1, TEST_DB);
    const reflection = getReflection(1, 1, TEST_DB);
    expect(reflection).toBeNull();
  });
});
