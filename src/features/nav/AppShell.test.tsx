import { describe, expect, it } from "vitest";
import { parseRoute } from "./routes";

describe("shell routes", () => {
  it.each([
    ["#/today", "today"],
    ["#/shelf", "shelf"],
    ["#/search", "search"],
    ["#/settings", "settings"],
    ["#/journal", "journal"],
    ["#/stats", "stats"],
    ["#catalogue", "search"],
    ["#settings", "settings"],
    ["#/unknown", "today"],
    ["", "today"],
    ["#/shelf/unknown", "today"],
  ])("parses %j as %s", (hash, expected) => {
    expect(parseRoute(hash)).toBe(expected);
  });

  it("parses book detail links", () => {
    expect(parseRoute("#/book/example-id")).toEqual({ name: "book", id: "example-id" });
  });
});
