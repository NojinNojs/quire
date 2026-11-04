import { expect, it, vi } from "vitest";
import type { BooksClient } from "./books";
import { loadReadingHistory } from "./readingHistory";

it("loads every ordered page within owner and date bounds", async () => {
  const rows = Array.from({ length: 1001 }, (_, id) => ({
    id: String(id),
    book_id: "a",
    day: "2024-01-01",
    pages: 1,
  }));
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(async (start: number, end: number) => ({
      data: rows.slice(start, end + 1),
      error: null,
    })),
  };
  const client = { from: vi.fn(() => query) } as unknown as BooksClient;
  expect(await loadReadingHistory(client, "owner", "2024-01-01", "2024-12-31")).toHaveLength(1001);
  expect(query.eq).toHaveBeenCalledWith("owner", "owner");
  expect(query.gte).toHaveBeenCalledWith("day", "2024-01-01");
  expect(query.lte).toHaveBeenCalledWith("day", "2024-12-31");
  expect(query.order.mock.calls).toEqual([["day"], ["id"], ["day"], ["id"]]);
  expect(query.range.mock.calls).toEqual([
    [0, 999],
    [1000, 1999],
  ]);
});

it("does not turn query failures into empty history", async () => {
  const query = {
    select: () => query,
    eq: () => query,
    gte: () => query,
    lte: () => query,
    order: () => query,
    range: async () => ({ data: null, error: { message: "offline" } }),
  };
  await expect(
    loadReadingHistory(
      { from: () => query } as unknown as BooksClient,
      "owner",
      "2024-01-01",
      "2024-12-31",
    ),
  ).rejects.toThrow();
});
