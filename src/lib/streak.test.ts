import { describe, expect, it } from "vitest";
import { emptyStreak, isBroken, logReadingDay } from "./streak";

describe("logReadingDay", () => {
  it("starts a streak at one on the first day", () => {
    const next = logReadingDay(emptyStreak, "2026-10-28");
    expect(next.current).toBe(1);
    expect(next.lastDay).toBe("2026-10-28");
  });

  it("adds one for a consecutive day", () => {
    const first = logReadingDay(emptyStreak, "2026-10-28");
    const next = logReadingDay(first, "2026-10-29");
    expect(next.current).toBe(2);
    expect(next.longest).toBe(2);
  });

  it("ignores a second log on the same day", () => {
    const first = logReadingDay(emptyStreak, "2026-10-28");
    const next = logReadingDay({ ...first, current: 5 }, "2026-10-28");
    expect(next.current).toBe(5);
  });

  it("restores a single missed day once, then refuses the second time", () => {
    const start = logReadingDay(emptyStreak, "2026-10-10");
    const restored = logReadingDay({ ...start, current: 4 }, "2026-10-12");
    expect(restored.current).toBe(5);
    expect(restored.restoreLeft).toBe(0);
    expect(restored.restoreMonth).toBe("2026-10");

    const second = logReadingDay(restored, "2026-10-14");
    expect(second.current).toBe(1);
  });

  it("allows a fresh restore in a new month", () => {
    const start = {
      ...emptyStreak,
      current: 9,
      longest: 9,
      lastDay: "2026-10-30",
      restoreLeft: 1,
      restoreMonth: "2026-09",
    };
    const next = logReadingDay(start, "2026-11-01");
    expect(next.current).toBe(10);
    expect(next.restoreLeft).toBe(0);
    expect(next.restoreMonth).toBe("2026-11");
  });

  it("refuses a restore already used this month", () => {
    const start = {
      ...emptyStreak,
      current: 9,
      longest: 9,
      lastDay: "2026-10-30",
      restoreLeft: 0,
      restoreMonth: "2026-10",
    };
    const next = logReadingDay(start, "2026-11-01");
    expect(next.current).toBe(1);
  });

  it("resets after a gap of two or more days without restore", () => {
    const start = { ...emptyStreak, current: 12, longest: 12, lastDay: "2026-10-20" };
    const next = logReadingDay(start, "2026-10-25");
    expect(next.current).toBe(1);
    expect(next.longest).toBe(12);
  });

  it("keeps the longest streak when the current one breaks", () => {
    const start = { ...emptyStreak, current: 3, longest: 21, lastDay: "2026-10-20" };
    const next = logReadingDay(start, "2026-10-24");
    expect(next.longest).toBe(21);
  });
});

describe("isBroken", () => {
  it("is false for yesterday and today", () => {
    const state = { ...emptyStreak, lastDay: "2026-10-27" };
    expect(isBroken(state, "2026-10-28")).toBe(false);
  });

  it("is true when two days have passed", () => {
    const state = { ...emptyStreak, lastDay: "2026-10-25" };
    expect(isBroken(state, "2026-10-28")).toBe(true);
  });
});
