import { describe, expect, it } from "vitest";
import type { Book } from "../data/types";
import { summarizeReading } from "./readingStats";

const books = [
  { id: "a", language: null, status: "finished", finished_at: "2024-12-31" },
  { id: "b", language: "Unknown", status: "finished", finished_at: null },
] as Book[];
const logs = [
  { id: "1", book_id: "a", day: "2024-02-29", pages: 10 },
  { id: "2", book_id: "a", day: "2024-12-31", pages: 20 },
  { id: "3", book_id: "b", day: "2025-01-01", pages: 7 },
];
describe("reading statistics", () => {
  it("respects year boundaries and leap days", () => {
    const result = summarizeReading(books, logs, 2024, { kind: "all" });
    expect(result).toMatchObject({ pages: 30, activeDays: 2, finished: 1 });
    expect(result.days).toHaveLength(366);
    expect(result.days.find((day) => day.day === "2024-02-29")?.pages).toBe(10);
    expect(summarizeReading(books, logs, 2025, { kind: "all" })).toMatchObject({
      pages: 7,
      finished: 0,
    });
  });
  it("keeps early years and unknown language distinct from a literal name", () => {
    expect(summarizeReading(books, [], 4, { kind: "all" }).days).toHaveLength(366);
    expect(summarizeReading(books, [], 1, { kind: "all" }).days[0]?.day).toBe("0001-01-01");
    expect(summarizeReading(books, logs, 2025, { kind: "unknown" }).pages).toBe(0);
    expect(summarizeReading(books, logs, 2025, { kind: "language", value: "Unknown" }).pages).toBe(
      7,
    );
  });
});
