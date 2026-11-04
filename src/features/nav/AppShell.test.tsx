import { describe, expect, it } from "vitest";
import { activeDestination, destinationIndex, dockSlot } from "./navItems";
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

describe("shell navigation behaviour", () => {
  it("marks Journal and Reading year active instead of Today", () => {
    expect(activeDestination("journal")).toBe("journal");
    expect(activeDestination("stats")).toBe("stats");
    expect(destinationIndex("journal")).toBe(-1);
    expect(destinationIndex("stats")).toBe(-1);
    expect(destinationIndex("today")).toBe(0);
    expect(destinationIndex("shelf")).toBe(1);
    expect(destinationIndex("search")).toBe(2);
    expect(activeDestination({ name: "book", id: "example-id" })).toBe("shelf");
    expect(activeDestination("settings")).toBeNull();
    expect(destinationIndex("settings")).toBe(-1);
    expect(dockSlot("journal")).toBe(-1);
    expect(dockSlot("stats")).toBe(-1);
  });
});
