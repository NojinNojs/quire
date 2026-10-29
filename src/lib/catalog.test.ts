// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import google from "./__fixtures__/google-books.json";
import html from "./__fixtures__/google-html-normal.html?raw";
import edition from "./__fixtures__/open-library-edition.json";
import search from "./__fixtures__/open-library-search.json";
import {
  createCatalogSearch,
  type Fetcher,
  normaliseGoogleBooks,
  normaliseOpenLibrary,
  rankCandidates,
} from "./catalog";

const response = (data: unknown) => Promise.resolve({ ok: true, json: async () => data });
const rejected = (status: number) => Promise.resolve({ ok: false, status, json: async () => ({}) });
afterEach(() => vi.useRealTimers());

describe("catalogue", () => {
  it("normalises edition metadata and language codes", () => {
    expect(normaliseGoogleBooks(google)[0]).toMatchObject({
      title: "This Earth of Mankind",
      author: "Pramoedya Ananta Toer",
      pages: 368,
      isbn: "9780140256352",
      language: "en",
      coverUrl: "https://books.google.com/cover.jpg",
    });
    expect(normaliseOpenLibrary(edition, "Pramoedya Ananta Toer")).toMatchObject({
      publisher: "Penguin",
      year: 1996,
      pages: 368,
      language: "en",
      isbn: "9780140256352",
    });
    expect(
      normaliseGoogleBooks({
        items: [{ volumeInfo: { title: "Bumi Manusia", language: "ind" } }],
      })[0]?.language,
    ).toBe("id");
    expect(normaliseGoogleBooks({ items: [null, {}] })).toEqual([]);
    expect(normaliseOpenLibrary({}, null)).toBeNull();
    expect(
      normaliseOpenLibrary(
        { title: "Unknown", isbn_13: ["bad"], publish_date: "9999", number_of_pages: -1 },
        null,
      ),
    ).toMatchObject({ isbn: null, year: null, pages: null });
  });
  it("ranks complete editions and deduplicates ISBNs", () => {
    const full = normaliseGoogleBooks(google)[0];
    if (!full) throw new Error("Missing fixture");
    expect(rankCandidates([{ ...full, pages: null }, full])).toEqual([full]);
  });
  it("stops after the first source with candidates", async () => {
    const fetcher = vi.fn(() => response(google));
    expect((await createCatalogSearch()("earth & mankind", fetcher)).errors).toEqual([]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("q=earth%20%26%20mankind&"), {
      signal: expect.any(AbortSignal),
    });
  });
  it.each(["9786020788036", "6020788032"])(
    "attempts all four sources in order for %s and accepts metadata only",
    async (query) => {
      const fetcher = vi.fn<Fetcher>((url) =>
        url.includes("googleapis")
          ? rejected(429)
          : url.includes("/isbn/")
            ? rejected(404)
            : url.includes("search.json")
              ? response({ docs: [] })
              : Promise.resolve({ ok: true, json: async () => ({}), text: async () => html }),
      );
      const result = await createCatalogSearch()(query, fetcher);
      expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
        "https://www.googleapis.com/books/v1/volumes?q=isbn:9786020788036&maxResults=10",
        "https://openlibrary.org/isbn/9786020788036.json",
        expect.stringContaining("https://openlibrary.org/search.json?q=isbn:9786020788036&"),
        "/gb/books?vid=ISBN9786020788036",
      ]);
      expect(result.candidates[0]).toMatchObject({
        title: "Dari dalam kubur: sebuah novel",
        author: "Soe Tjen Marching",
        isbn: "9786020788036",
        source: "Google Books (metadata only)",
        pages: null,
        publisher: null,
      });
      expect(result.errors).toEqual([]);
    },
  );
  it("uses ISBN edition before search", async () => {
    const fetcher = vi.fn((url: string) => response(url.includes("/isbn/") ? edition : {}));
    expect((await createCatalogSearch()("0-14-025635-0", fetcher)).candidates[0]?.isbn).toBe(
      "9780140256352",
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("loads concrete editions from search and silences earlier errors", async () => {
    const result = await createCatalogSearch()("earth", (url) =>
      url.includes("googleapis")
        ? rejected(429)
        : response(url.includes("search.json") ? search : edition),
    );
    expect(result.candidates[0]?.source).toBe("Open Library");
    expect(result.errors).toEqual([]);
  });
  it("retains successful editions when another edition fails", async () => {
    const result = await createCatalogSearch()("earth", (url) =>
      url.includes("OL999M")
        ? rejected(404)
        : response(
            url.includes("googleapis")
              ? {}
              : url.includes("search.json")
                ? { docs: [...search.docs, { cover_edition_key: "OL999M" }] }
                : edition,
          ),
    );
    expect(result.candidates).toHaveLength(1);
    expect(result.errors).toEqual([]);
  });
  it("shows one honest error including rate-limit wording and attempted layers", async () => {
    const result = await createCatalogSearch()("9786020788036", () => rejected(429));
    expect(result.candidates).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Google Books is rate limiting requests.");
    expect(result.errors[0]).toContain(
      "Tried Google Books API, Open Library ISBN, Open Library search, and Google Books HTML.",
    );
  });
  it("skips ISBN-only sources for text and invalid checksums", async () => {
    for (const query of ["missing", "9780140256353"]) {
      const fetcher = vi.fn(() => response({}));
      const result = await createCatalogSearch()(query, fetcher);
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(result.errors).toHaveLength(1);
    }
    const fetcher = vi.fn();
    expect(await createCatalogSearch()("  ", fetcher)).toEqual({
      candidates: [],
      errors: [],
      failures: [],
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(["network", "5xx"])("retries %s once within each source", async (kind) => {
    let attempts = 0;
    const fetcher: Fetcher = () => {
      if (++attempts === 1)
        return kind === "network" ? Promise.reject(new TypeError("offline")) : rejected(503);
      return response(google);
    };
    expect((await createCatalogSearch()("retry", fetcher)).candidates).toHaveLength(1);
    expect(attempts).toBe(2);
  });
  it("bounds each sequential source including stalled bodies by eight seconds", async () => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    const pending = createCatalogSearch()("slow", (_url, options) => {
      if (options) signals.push(options.signal);
      return Promise.resolve({ ok: true, json: () => new Promise(() => {}) });
    });
    await vi.advanceTimersByTimeAsync(8000);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(8000);
    expect((await pending).failures.map((f) => f.kind)).toEqual(["timeout", "timeout"]);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("keeps per-query cached results isolated from caller mutation", async () => {
    const lookup = createCatalogSearch();
    const initial = await lookup("cached", () => response(google));
    const expected = structuredClone(initial.candidates);
    if (initial.candidates[0]) initial.candidates[0].title = "changed";
    const result = await lookup(" cached ", () => rejected(429));
    expect(result.candidates).toEqual(expected);
    expect(result.fromCache).toBe(true);
    expect(result.errors).toHaveLength(1);
    expect((await lookup("other", () => rejected(429))).candidates).toEqual([]);
  });

  it("does not retry 429 and reports rate limits with provider names", async () => {
    const fetcher = vi.fn<Fetcher>(() => rejected(429));
    const result = await createCatalogSearch()("limited", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(new Set(fetcher.mock.calls.map(([url]) => url)).size).toBe(2);
    expect(result.failures).toEqual([
      { provider: "Google Books", kind: "rate-limited" },
      { provider: "Open Library", kind: "rate-limited" },
    ]);
    expect(result.errors).toEqual([
      "Google Books is rate limiting requests. Try again or enter the book manually. Tried Google Books API and Open Library search.",
    ]);
  });

  it.each([400, 401, 403, 404, "malformed JSON"])(
    "does not retry other HTTP errors or malformed JSON: %s",
    async (failure) => {
      const fetcher = vi.fn<Fetcher>(() =>
        typeof failure === "number"
          ? rejected(failure)
          : Promise.resolve({
              ok: true,
              json: async () => {
                throw new SyntaxError("Bad JSON");
              },
            }),
      );
      const result = await createCatalogSearch()("bad data", fetcher);
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(new Set(fetcher.mock.calls.map(([url]) => url)).size).toBe(2);
      expect(result.candidates).toEqual([]);
      expect(result.failures).toEqual([
        { provider: "Google Books", kind: "unknown" },
        { provider: "Open Library", kind: "unknown" },
      ]);
      expect(result.errors).toHaveLength(1);
    },
  );

  it.each(["network", "HTTP"])(
    "handles %s failures without throwing and preserves the other source",
    async (kind) => {
      const fetcher = vi.fn<Fetcher>((url) => {
        if (url.includes("googleapis"))
          return kind === "network" ? Promise.reject(new TypeError("offline")) : rejected(503);
        return response(url.includes("search.json") ? search : edition);
      });
      const result = await createCatalogSearch()("earth", fetcher);
      expect(fetcher.mock.calls.filter(([url]) => url.includes("googleapis"))).toHaveLength(2);
      expect(result.candidates).toEqual([normaliseOpenLibrary(edition, "Pramoedya Ananta Toer")]);
      expect(result.failures).toEqual([
        { provider: "Google Books", kind: kind === "network" ? "offline" : "unknown" },
      ]);
      expect(result.errors).toEqual([]);
    },
  );

  it.each(["Google Books", "Open Library"])(
    "clears provider timers on success: %s",
    async (source) => {
      vi.useFakeTimers();
      const signals: AbortSignal[] = [];
      const result = await createCatalogSearch()("fast", (url, options) => {
        if (options) signals.push(options.signal);
        return response(
          url.includes("googleapis")
            ? source === "Google Books"
              ? google
              : {}
            : url.includes("search.json")
              ? search
              : edition,
        );
      });
      expect(result.candidates[0]?.source).toBe(source);
      expect(result.errors).toEqual([]);
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(8000);
      expect(signals.every((signal) => !signal.aborted)).toBe(true);
    },
  );

  it("keeps successful sources when the ISBN lookup is rate limited", async () => {
    const fetcher = vi.fn<Fetcher>((url) =>
      url.includes("/isbn/")
        ? rejected(429)
        : response(
            url.includes("googleapis") ? {} : url.includes("search.json") ? search : edition,
          ),
    );
    const result = await createCatalogSearch()("9780140256352", fetcher);
    expect(result.candidates).toEqual([normaliseOpenLibrary(edition, "Pramoedya Ananta Toer")]);
    expect(result.failures).toEqual([{ provider: "Open Library ISBN", kind: "rate-limited" }]);
    expect(result.errors).toEqual([]);
    expect(fetcher.mock.calls.filter(([url]) => url.includes("/isbn/"))).toHaveLength(1);
    expect(fetcher.mock.calls.some(([url]) => url.startsWith("/gb/"))).toBe(false);
  });

  it("ignores malformed records and invalid metadata", () => {
    expect(normaliseGoogleBooks({ items: [null, {}, { volumeInfo: { title: " " } }] })).toEqual([]);
    expect(normaliseOpenLibrary({}, null)).toBeNull();
    expect(
      normaliseGoogleBooks({
        items: [
          {
            volumeInfo: {
              title: "Unknown",
              authors: [null, 42, " "],
              publisher: 42,
              industryIdentifiers: [null, { identifier: "bad" }],
              publishedDate: "9999",
              pageCount: -1,
              language: 42,
              imageLinks: { thumbnail: "javascript:alert(1)" },
            },
          },
        ],
      }),
    ).toEqual([
      {
        title: "Unknown",
        author: null,
        publisher: null,
        year: null,
        pages: null,
        isbn: null,
        language: null,
        coverUrl: null,
        source: "Google Books",
      },
    ]);
    expect(
      normaliseOpenLibrary(
        { title: "Unknown", isbn_13: ["bad"], publish_date: "9999", number_of_pages: -1 },
        null,
      ),
    ).toMatchObject({ isbn: null, year: null, pages: null });
  });

  it("sorts by completeness and retains records without an ISBN", () => {
    const full = normaliseGoogleBooks(google)[0];
    if (!full) throw new Error("Missing normalised fixture");
    const sparse = { ...full, isbn: null, pages: null, publisher: null };
    const other = { ...sparse, title: "Another edition" };
    expect(rankCandidates([sparse, full, sparse, other])).toEqual([full, sparse, other]);
  });

  it("times out each provider after 8000 ms and aborts its signal even if fetch ignores it", async () => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    const fetcher = vi.fn<Fetcher>((_url, options) => {
      if (options) signals.push(options.signal);
      return new Promise(() => {});
    });
    const pending = createCatalogSearch()("9786020788036", fetcher);
    for (let index = 0; index < 4; index++) {
      await vi.advanceTimersByTimeAsync(7999);
      expect(fetcher).toHaveBeenCalledTimes(index + 1);
      expect(signals[index]?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(signals[index]?.aborted).toBe(true);
    }
    const result = await pending;
    expect(result.candidates).toEqual([]);
    expect(result.failures).toEqual([
      { provider: "Google Books", kind: "timeout" },
      { provider: "Open Library ISBN", kind: "timeout" },
      { provider: "Open Library", kind: "timeout" },
      { provider: "Google Books HTML", kind: "timeout" },
    ]);
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("normalises a Google Books record", () => {
    expect(normaliseGoogleBooks(google)).toEqual([
      {
        title: "This Earth of Mankind",
        author: "Pramoedya Ananta Toer",
        publisher: "Penguin",
        year: 1996,
        pages: 368,
        isbn: "9780140256352",
        language: "en",
        coverUrl: "https://books.google.com/cover.jpg",
        source: "Google Books",
      },
    ]);
  });

  it("normalises an Open Library edition without mixing work-level metadata", async () => {
    const expected = {
      title: "This Earth of Mankind",
      author: "Pramoedya Ananta Toer",
      publisher: "Penguin",
      year: 1996,
      pages: 368,
      isbn: "9780140256352",
      language: "en",
      coverUrl: "https://covers.openlibrary.org/b/id/12345-M.jpg",
      source: "Open Library",
    };
    expect(normaliseOpenLibrary(edition, "Pramoedya Ananta Toer")).toEqual(expected);
    const result = await createCatalogSearch()("earth", (url) =>
      response(
        url.includes("googleapis")
          ? {}
          : url.includes("search.json")
            ? {
                docs: search.docs.map((doc) => ({
                  ...doc,
                  title: "Work title",
                  publisher: ["Work publisher"],
                  first_publish_year: 1980,
                  number_of_pages_median: 500,
                  isbn: ["9786020788036"],
                  language: ["ind"],
                  cover_i: 999,
                })),
              }
            : edition,
      ),
    );
    expect(result.candidates).toEqual([expected]);
  });

  it.each(["9786020788036", "6020788032", "earth", "9780140256353"])(
    "tries Google Books HTML only for a valid ISBN, never for a text query: %s",
    async (query) => {
      const fetcher = vi.fn<Fetcher>(() => response({}));
      await createCatalogSearch()(query, fetcher);
      const htmlCalls = fetcher.mock.calls.filter(([url]) => url.startsWith("/gb/"));
      expect(htmlCalls.map(([url]) => url)).toEqual(
        query === "9786020788036" || query === "6020788032"
          ? ["/gb/books?vid=ISBN9786020788036"]
          : [],
      );
    },
  );

  it("shows no error and marks the candidate as metadata only when the rate-limited API falls back to HTML", async () => {
    const result = await createCatalogSearch()("9786020788036", (url) =>
      url.includes("googleapis")
        ? rejected(429)
        : url.startsWith("/gb/")
          ? Promise.resolve({ ok: true, json: async () => ({}), text: async () => html })
          : response({}),
    );
    expect(result.failures).toEqual([{ provider: "Google Books", kind: "rate-limited" }]);
    expect(result.errors).toEqual([]);
    expect(result.candidates).toEqual([
      {
        title: "Dari dalam kubur: sebuah novel",
        author: "Soe Tjen Marching",
        isbn: "9786020788036",
        source: "Google Books (metadata only)",
        publisher: null,
        year: null,
        pages: null,
        language: null,
        coverUrl: null,
      },
    ]);
  });
});
