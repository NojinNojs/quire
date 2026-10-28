import { describe, expect, it } from "vitest";
import { pacePerDay, pagesLeft, percent } from "./progress";

describe("progress with a known page count", () => {
  it("counts pages left", () => {
    expect(pagesLeft({ current: 214, total: 550 })).toBe(336);
  });

  it("never goes below zero", () => {
    expect(pagesLeft({ current: 600, total: 550 })).toBe(0);
  });

  it("gives a whole percentage", () => {
    expect(percent({ current: 214, total: 550 })).toBe(39);
    expect(percent({ current: 550, total: 550 })).toBe(100);
    expect(percent({ current: 900, total: 550 })).toBe(100);
  });

  it("computes a daily pace", () => {
    expect(pacePerDay({ current: 214, total: 550 }, 14)).toBe(24);
  });
});

describe("progress with an unknown page count", () => {
  it("returns null instead of inventing a denominator", () => {
    expect(pagesLeft({ current: 40, total: null })).toBeNull();
    expect(percent({ current: 40, total: null })).toBeNull();
    expect(pacePerDay({ current: 40, total: null }, 10)).toBeNull();
  });
});
