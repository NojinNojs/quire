import { describe, expect, it, vi } from "vitest";
import { lookupCover } from "./coverLookup";

const book = { isbn: "978-0141439518", title: "Pride & Prejudice", author: "Jane Austen" };
function fetcher(...values: unknown[]) {
  return vi.fn(async (_url: string, _options?: { signal: AbortSignal }) => {
    const value = values.shift();
    if (value instanceof Error) throw value;
    return { ok: true, json: async () => value };
  });
}

describe("cover enrichment", () => {
  it("takes the largest Google image over its thumbnail, upgrades http, and stops", async () => {
    const read = fetcher({
      items: [
        {
          volumeInfo: {
            imageLinks: {
              thumbnail: "https://books.test/small",
              extraLarge: "http://books.test/largest",
            },
          },
        },
      ],
    });
    expect(await lookupCover(book, read)).toBe("https://books.test/largest");
    expect(read).toHaveBeenCalledTimes(1);
    expect(read.mock.calls[0]).toEqual(
      expect.arrayContaining([expect.stringContaining("q=isbn:9780141439518")]),
    );
  });
  it("falls through Google to Open Library ISBN and requests large artwork", async () => {
    const read = fetcher({ items: [] }, { covers: [-1, 123] });
    expect(await lookupCover(book, read)).toBe(
      "https://covers.openlibrary.org/b/id/123-L.jpg?default=false",
    );
    expect(read.mock.calls.map((call) => call[0])).toEqual([
      "https://www.googleapis.com/books/v1/volumes?q=isbn:9780141439518",
      "https://openlibrary.org/isbn/9780141439518.json",
    ]);
  });
  it("falls through failures and missing ISBN artwork to title and author search", async () => {
    const read = fetcher(
      new TypeError("offline"),
      { covers: [] },
      { docs: [{}, { cover_i: 456 }] },
    );
    expect(await lookupCover(book, read)).toContain("/456-L.jpg");
    const url = new URL(read.mock.calls[2]?.[0] ?? "");
    expect(url.searchParams.get("title")).toBe(book.title);
    expect(url.searchParams.get("author")).toBe(book.author);
  });
  it("skips ISBN providers and an unknown author when only a title is known", async () => {
    const read = fetcher({ docs: [] });
    expect(await lookupCover({ title: book.title, author: null }, read)).toBeNull();
    expect(read).toHaveBeenCalledTimes(1);
    expect(new URL(read.mock.calls[0]?.[0] ?? "").searchParams.has("author")).toBe(false);
  });
  it("rejects unsafe URLs and handles malformed JSON, HTTP failures and total outage", async () => {
    const read = fetcher(
      { items: [{ volumeInfo: { imageLinks: { large: "javascript:alert(1)" } } }] },
      null,
      new Error("offline"),
    );
    expect(await lookupCover(book, read)).toBeNull();
    expect(
      await lookupCover(book, async () => ({
        ok: false,
        json: async () => {
          throw new Error();
        },
      })),
    ).toBeNull();
    expect(
      await lookupCover(book, async () => ({
        ok: true,
        json: async () => {
          throw new Error();
        },
      })),
    ).toBeNull();
  });
});
