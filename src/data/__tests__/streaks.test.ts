import { test, expect, describe } from "bun:test";
import { calculateStreaks } from "../streaks";

describe("streaks data layer", () => {
  test("calculateStreaks returns correct stats for continuous days", () => {
    const dates = ["2025-01-01", "2025-01-02"];
    const today = "2025-01-02";
    const result = calculateStreaks(dates, today);
    
    expect(result).toEqual({
      currentStreak: 2,
      longestStreak: 2,
    });
  });

  test("calculateStreaks handles broken streaks", () => {
    const dates = ["2025-01-01", "2025-01-03"];
    const today = "2025-01-03";
    const result = calculateStreaks(dates, today);
    
    expect(result).toEqual({
      currentStreak: 1,
      longestStreak: 1,
    });
  });
});
