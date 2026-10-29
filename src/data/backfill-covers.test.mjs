import { describe, expect, it, vi } from "vitest";
import { backfillCovers } from "../../scripts/backfill-covers.mjs";

function database(rows) {
  return {
    from() {
      const filters = [];
      let patch;
      const query = {
        select: () => query,
        is: (key, value) => {
          filters.push((row) => row[key] === value);
          return query;
        },
        eq: (key, value) => {
          filters.push((row) => row[key] === value);
          return query;
        },
        gt: (key, value) => {
          filters.push((row) => row[key] > value);
          return query;
        },
        order: () => query,
        limit: () => query,
        update: (value) => {
          patch = value;
          return query;
        },
        // biome-ignore lint/suspicious/noThenProperty: Supabase queries are awaitable builders.
        then(resolve) {
          const data = rows.filter((row) => filters.every((match) => match(row))).slice(0, 100);
          if (patch) for (const row of data) Object.assign(row, patch);
          return Promise.resolve({ data, error: null }).then(resolve);
        },
      };
      return query;
    },
  };
}
const row = (id, extra = {}) => ({
  id,
  title: `Book ${id}`,
  cover_url: null,
  cover_path: null,
  ...extra,
});

describe("backfill covers", () => {
  it("never overwrites an uploaded cover, including an upload during lookup", async () => {
    const uploaded = row("a", { cover_path: "owner/a/cover.webp" });
    const racing = row("b");
    const existing = row("c", { cover_url: "https://covers.test/existing" });
    const empty = row("d");
    const findCover = vi.fn(async (book) => {
      if (book.id === "b") racing.cover_path = "owner/b/cover.webp";
      return "https://covers.test/found";
    });
    const result = await backfillCovers(database([uploaded, racing, existing, empty]), {
      findCover,
      log: vi.fn(),
    });
    expect(result).toEqual({ found: 2, saved: 1 });
    expect(findCover.mock.calls.map(([book]) => book.id)).toEqual(["b", "d"]);
    expect(uploaded.cover_url).toBeNull();
    expect(racing.cover_url).toBeNull();
    expect(existing.cover_url).toBe("https://covers.test/existing");
    expect(empty.cover_url).toBe("https://covers.test/found");
  });
  it("prints dry-run results without writing and scopes the owner", async () => {
    const books = [
      row("a", { owner: "one" }),
      row("b", { owner: "two" }),
      row("c", { owner: "one" }),
    ];
    const log = vi.fn();
    await backfillCovers(database(books), {
      dryRun: true,
      owner: "one",
      log,
      findCover: async (book) => (book.id === "a" ? "https://covers.test/found" : null),
    });
    expect(books.every((book) => book.cover_url === null)).toBe(true);
    expect(log.mock.calls.flat()).toEqual([
      "Book a -> https://covers.test/found",
      "Book c -> none",
      "Dry run: 1 found, 0 saved",
    ]);
  });
  it("paginates without skipping rows as the missing-cover set shrinks", async () => {
    const books = Array.from({ length: 103 }, (_, i) => row(String(i).padStart(3, "0")));
    const result = await backfillCovers(database(books), {
      findCover: async () => "https://covers.test/found",
      log: vi.fn(),
    });
    expect(result.saved).toBe(103);
    expect(books.every((book) => book.cover_url)).toBe(true);
  });
});
