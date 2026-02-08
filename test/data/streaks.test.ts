import { describe, expect, it } from "bun:test";
import { calculateStreaks } from "../../src/data/streaks.ts";

describe("calculateStreaks", () => {
  const TODAY = "2023-10-30";
  
  it("returns 0 for empty dates", () => {
    expect(calculateStreaks([], TODAY)).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it("returns 1 for a single date (today)", () => {
    expect(calculateStreaks(["2023-10-30"], TODAY)).toEqual({ currentStreak: 1, longestStreak: 1 });
  });

  it("returns 1 for a single date (yesterday)", () => {
    expect(calculateStreaks(["2023-10-29"], TODAY)).toEqual({ currentStreak: 1, longestStreak: 1 });
  });

  it("returns 0 current streak if last date was 2 days ago", () => {
    expect(calculateStreaks(["2023-10-28"], TODAY)).toEqual({ currentStreak: 0, longestStreak: 1 });
  });

  it("calculates simple consecutive streak ending today", () => {
    const dates = ["2023-10-28", "2023-10-29", "2023-10-30"];
    expect(calculateStreaks(dates, TODAY)).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it("calculates simple consecutive streak ending yesterday", () => {
    const dates = ["2023-10-27", "2023-10-28", "2023-10-29"];
    expect(calculateStreaks(dates, TODAY)).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it("handles unsorted input", () => {
    const dates = ["2023-10-30", "2023-10-28", "2023-10-29"];
    expect(calculateStreaks(dates, TODAY)).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it("handles duplicate dates", () => {
    const dates = ["2023-10-29", "2023-10-30", "2023-10-30"];
    expect(calculateStreaks(dates, TODAY)).toEqual({ currentStreak: 2, longestStreak: 2 });
  });

  it("identifies longest streak in the past", () => {
    const dates = [
      "2023-01-01", "2023-01-02", "2023-01-03", "2023-01-04", // 4 days
      "2023-06-01", "2023-06-02", // 2 days
      "2023-10-29", "2023-10-30"  // 2 days (current)
    ];
    expect(calculateStreaks(dates, TODAY)).toEqual({ currentStreak: 2, longestStreak: 4 });
  });

  it("resets current streak if gap exists before today", () => {
    const dates = [
      "2023-10-20", "2023-10-21", // Old streak
      "2023-10-30" // Today only
    ];
    expect(calculateStreaks(dates, TODAY)).toEqual({ currentStreak: 1, longestStreak: 2 });
  });

  it("handles leap years correctly", () => {
    const leapYearToday = "2024-03-01";
    const dates = ["2024-02-28", "2024-02-29", "2024-03-01"];
    expect(calculateStreaks(dates, leapYearToday)).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it("handles year transition", () => {
    const newYearToday = "2024-01-01";
    const dates = ["2023-12-31", "2024-01-01"];
    expect(calculateStreaks(dates, newYearToday)).toEqual({ currentStreak: 2, longestStreak: 2 });
  });
});
