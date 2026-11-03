import { expect, it, vi } from "vitest";
import { shelfBook } from "../features/shelf/fixtures";
import { bookStatusPatch, saveBookReview, setBookStatus } from "./bookReading";
import type { BooksClient } from "./books";

function fake(response: { data?: unknown; error?: { code: string } | null }) {
  const query = {
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn(async () => response),
  };
  return { client: { from: vi.fn(() => query) } as unknown as BooksClient, query };
}

it("preserves lifecycle dates and never invents progress", () => {
  const book = shelfBook({
    status: "finished",
    started_at: "2024-01-01",
    finished_at: "2024-02-01",
  });
  expect(bookStatusPatch(book, "finished", "2025-01-01")).toEqual({
    status: "finished",
    started_at: "2024-01-01",
    finished_at: "2024-02-01",
  });
  expect(bookStatusPatch(book, "reading", "2025-01-01")).toEqual({
    status: "reading",
    started_at: "2024-01-01",
    finished_at: null,
  });
  expect(bookStatusPatch({ ...book, started_at: null }, "reading", "2025-01-01").started_at).toBe(
    "2025-01-01",
  );
});

it("scopes review updates, trims notes and rejects invalid ratings", async () => {
  const { client, query } = fake({ data: { id: "book" } });
  await saveBookReview(client, "owner", "book", { rating: 4, notes: "  note  " });
  expect(query.update).toHaveBeenCalledWith({ rating: 4, notes: "note" });
  expect(query.eq.mock.calls).toEqual([
    ["owner", "owner"],
    ["id", "book"],
  ]);
  await expect(
    saveBookReview(client, "owner", "book", { rating: 1.5, notes: null }),
  ).rejects.toThrow();
  await saveBookReview(client, "owner", "book", { rating: null, notes: "  " });
  expect(query.update).toHaveBeenLastCalledWith({ rating: null, notes: null });
  await expect(
    saveBookReview(fake({ data: null }).client, "owner", "book", { rating: null, notes: null }),
  ).rejects.toThrow();
});

it("reports conflicts and missing status rows", async () => {
  const book = shelfBook({ status: "want" });
  await expect(
    setBookStatus(
      fake({ error: { code: "23505" } }).client,
      "owner",
      book,
      "reading",
      "2026-01-01",
    ),
  ).rejects.toThrow("Another book is already being read. Only one book can be active at a time.");
  await expect(
    setBookStatus(fake({ data: null }).client, "owner", book, "finished", "2026-01-01"),
  ).rejects.toThrow("Could not update reading status. Try again.");
});
