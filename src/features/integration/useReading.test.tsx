// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type ReadingClient, useReading } from "./useReading";

const book = {
  id: "active",
  title: "The Hobbit",
  author: "J. R. R. Tolkien",
  publisher: "Allen & Unwin",
  year: 1937,
  edition: null,
  pages: 310,
  cover_url: null,
};
const progress = [
  { book_id: "active", day: "2026-10-28", pages: 12 },
  { book_id: "active", day: "2026-10-29", pages: 8 },
  { book_id: "other", day: "2026-10-27", pages: 5 },
];

function injected(
  active: typeof book | null = book,
  streak: { current: number; longest: number } | null = { current: 3, longest: 7 },
) {
  const queries: { table: string; eq: ReturnType<typeof vi.fn> }[] = [];
  let fail = false;
  const from = vi.fn((table: string) => {
    const response = () =>
      Promise.resolve({
        data: table === "books" ? active : table === "streaks" ? streak : progress,
        error: fail ? { message: "offline" } : null,
      });
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      lte: vi.fn(() => query),
      order: vi.fn(() => query),
      range: vi.fn(response),
      maybeSingle: vi.fn(response),
    };
    queries.push({ table, eq: query.eq });
    return query;
  });
  return {
    client: { from } as unknown as ReadingClient,
    from,
    queries,
    fail: (value: boolean) => {
      fail = value;
    },
  };
}

afterEach(cleanup);

describe("useReading with an injected client", () => {
  it("returns an honest empty state without an active book", async () => {
    const fake = injected(null);
    const { result } = renderHook(() => useReading(fake.client, "reader", "2026-10-29"));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(fake.from).not.toHaveBeenCalledWith("progress_log");
  });

  it("loads the active book, persisted streak and actual reading days", async () => {
    const fake = injected();
    const { result } = renderHook(() => useReading(fake.client, "reader", "2026-10-29"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toMatchObject({
      book: { id: "active", total: 310, editionLine: "Allen & Unwin · 1937" },
      streak: { current: 3, longest: 7 },
      current: 20,
      pagesToday: 8,
    });
    expect(
      result.current.data?.streak.days.filter((day) => day.read).map((day) => day.day),
    ).toEqual(["2026-10-27", "2026-10-28", "2026-10-29"]);
    for (const query of fake.queries) expect(query.eq).toHaveBeenCalledWith("owner", "reader");
    expect(fake.queries[0]?.eq).toHaveBeenCalledWith("status", "reading");
  });

  it("returns an empty state when the streak row is missing", async () => {
    const fake = injected(book, null);
    const { result } = renderHook(() => useReading(fake.client, "reader", "2026-10-29"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("reports errors and reloads on retry", async () => {
    const fake = injected();
    fake.fail(true);
    const { result } = renderHook(() => useReading(fake.client, "reader", "2026-10-29"));
    await waitFor(() =>
      expect(result.current.error).toBe("Could not load your reading. Try again."),
    );
    fake.fail(false);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.data?.book.id).toBe("active"));
    expect(result.current.error).toBeNull();
  });
});
