import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import google from "./__fixtures__/google-books.json";
import edition from "./__fixtures__/open-library-edition.json";
import search from "./__fixtures__/open-library-search.json";
import {
  createCatalogSearch,
  type Fetcher,
  normaliseGoogleBooks,
  normaliseOpenLibrary,
  rankCandidates,
} from "./catalog";

let searchCatalog = createCatalogSearch();
beforeEach(() => {
  searchCatalog = createCatalogSearch();
});
afterEach(() => {
  vi.useRealTimers();
});

const response = (data: unknown) => Promise.resolve({ ok: true, json: async () => data });
describe("catalogue", () => {
  it("normalises Google Books", () => {
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
  it("normalises an Open Library edition without mixing work-level metadata", () => {
    expect(normaliseOpenLibrary(edition, "Pramoedya Ananta Toer")).toEqual({
      title: "This Earth of Mankind",
      author: "Pramoedya Ananta Toer",
      publisher: "Penguin",
      year: 1996,
      pages: 368,
      isbn: "9780140256352",
      language: "en",
      coverUrl: "https://covers.openlibrary.org/b/id/12345-M.jpg",
      source: "Open Library",
    });
  });
  it("calls both providers, fetches the matching edition, dedupes ISBN-10 against 13 and keeps the fuller record", async () => {
    const sparse = structuredClone(google);
    const item = sparse.items[0];
    if (!item) throw new Error("Missing Google fixture");
    item.volumeInfo.publisher = "";
    const fetcher = vi.fn((url: string) =>
      response(
        url.includes("googleapis") ? sparse : url.includes("search.json") ? search : edition,
      ),
    );
    const result = await searchCatalog("earth & mankind", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls[0]?.[0]).toContain("earth%20%26%20mankind");
    expect(result.errors).toEqual([]);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.source).toBe("Open Library");
  });
  it("uses a concrete edition fallback when nested search editions are empty", async () => {
    const result = await searchCatalog("earth", (url) =>
      response(
        url.includes("googleapis")
          ? {}
          : url.includes("search.json")
            ? {
                docs: [
                  {
                    author_name: ["Pramoedya Ananta Toer"],
                    cover_edition_key: "OL123M",
                    editions: { docs: [] },
                  },
                ],
              }
            : edition,
      ),
    );
    expect(result.candidates[0]?.isbn).toBe("9780140256352");
  });
  it("keeps available editions when one edition fetch fails", async () => {
    const result = await searchCatalog("earth", (url) => {
      if (url.includes("OL999M")) return Promise.reject(new Error("offline"));
      return response(
        url.includes("googleapis")
          ? {}
          : url.includes("search.json")
            ? { docs: [...search.docs, { cover_edition_key: "OL999M" }] }
            : edition,
      );
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
  });
  it("sorts by completeness and retains records without ISBN", () => {
    const full = normaliseGoogleBooks(google)[0];
    if (!full) throw new Error("Missing normalised fixture");
    const sparse = { ...full, isbn: null, pages: null, publisher: null };
    expect(rankCandidates([sparse, full, sparse])).toEqual([full, sparse]);
  });
  it("handles empty results and blank queries", async () => {
    expect(await searchCatalog("missing", () => response({}))).toEqual({
      candidates: [],
      errors: [],
      failures: [],
    });
    const fetcher = vi.fn();
    expect(await searchCatalog("  ", fetcher)).toEqual({
      candidates: [],
      errors: [],
      failures: [],
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("handles network and HTTP failures without throwing and preserves the other source", async () => {
    const result = await searchCatalog("earth", async () => {
      throw new Error("offline");
    });
    expect(result.candidates).toEqual([]);
    expect(result.errors).toHaveLength(2);
    const partial = await searchCatalog("earth", (url) =>
      url.includes("googleapis")
        ? response(google)
        : Promise.resolve({ ok: false, json: async () => ({}) }),
    );
    expect(partial.candidates).toHaveLength(1);
    expect(partial.errors).toHaveLength(1);
  });
  it("ignores malformed records and invalid metadata", () => {
    expect(normaliseGoogleBooks({ items: [null, {}] })).toEqual([]);
    expect(normaliseOpenLibrary({}, null)).toBeNull();
    expect(
      normaliseOpenLibrary(
        { title: "Unknown", isbn_13: ["bad"], publish_date: "9999", number_of_pages: -1 },
        null,
      ),
    ).toMatchObject({ isbn: null, year: null, pages: null });
  });
});

describe("language normalisation", () => {
  it("maps ISO 639-3 catalogue codes to the two letter code the schema stores", () => {
    const google = normaliseGoogleBooks({
      items: [{ volumeInfo: { title: "Bumi Manusia", language: "ind" } }],
    });
    expect(google[0]?.language).toBe("id");

    const openLibrary = normaliseOpenLibrary(
      { title: "This Earth of Mankind", languages: [{ key: "/languages/eng" }] },
      "Pramoedya Ananta Toer",
    );
    expect(openLibrary?.language).toBe("en");
  });
});

describe("catalogue resilience", () => {
  it("times out each provider after 8000 ms and aborts its signal even if fetch ignores it", async () => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    const fetcher = vi.fn<Fetcher>((_url, options) => {
      if (options) signals.push(options.signal);
      return new Promise(() => {});
    });
    const pending = searchCatalog("slow", fetcher);
    await vi.advanceTimersByTimeAsync(7999);
    expect(signals.every((signal) => !signal.aborted)).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    expect((await pending).failures).toEqual([
      { provider: "Google Books", kind: "timeout" },
      { provider: "Open Library", kind: "timeout" },
    ]);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["network", "5xx"])("retries a %s failure once and merges the recovery", async (kind) => {
    let attempts = 0;
    const fetcher = vi.fn((url: string) => {
      if (!url.includes("googleapis")) return response({});
      attempts++;
      if (attempts === 1) {
        return kind === "network"
          ? Promise.reject(new TypeError("Failed to fetch"))
          : Promise.resolve({ ok: false, status: 503, json: async () => ({}) });
      }
      return response(google);
    });
    const result = await searchCatalog("retry", fetcher);
    expect(attempts).toBe(2);
    expect(result.candidates).toHaveLength(1);
    expect(result.failures).toEqual([]);
  });

  it.each(["network", "5xx"])("stops after one retry on a persistent %s failure", async (kind) => {
    const fetcher = vi.fn(() =>
      kind === "network"
        ? Promise.reject(new TypeError("Failed to fetch"))
        : Promise.resolve({ ok: false, status: 500, json: async () => ({}) }),
    );
    const result = await searchCatalog("unavailable", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(result.failures.map((error) => error.kind)).toEqual([
      kind === "network" ? "offline" : "unknown",
      kind === "network" ? "offline" : "unknown",
    ]);
  });

  it("does not retry 429 and reports rate limits with provider names", async () => {
    const fetcher = vi.fn(async () => ({ ok: false, status: 429, json: async () => ({}) }));
    const result = await searchCatalog("limited", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.failures).toEqual([
      { provider: "Google Books", kind: "rate-limited" },
      { provider: "Open Library", kind: "rate-limited" },
    ]);
  });

  it("returns a per-query cache hit with a note after both providers are rate limited", async () => {
    const initial = await searchCatalog("cached", (url) =>
      response(url.includes("googleapis") ? google : {}),
    );
    const expected = structuredClone(initial.candidates);
    const initialCandidate = initial.candidates[0];
    if (!initialCandidate) throw new Error("Missing cached candidate");
    initialCandidate.title = "Changed by caller";
    const limited = async () => ({ ok: false, status: 429, json: async () => ({}) });
    const result = await searchCatalog(" cached ", limited);
    expect(result.candidates).toEqual(expected);
    expect(result.fromCache).toBe(true);
    expect(result.errors).toContain(
      "Showing saved results from the last successful search. Catalogue data may be out of date.",
    );
    expect(result.failures).toHaveLength(2);
    expect((await searchCatalog("another query", limited)).candidates).toEqual([]);
    expect((await createCatalogSearch()("cached", limited)).candidates).toEqual([]);
  });

  it("looks up valid ISBN-10 and ISBN-13 queries through the ISBN path and merges all three sources", async () => {
    for (const query of ["0-14-025635-0", "9780140256352"]) {
      const fetcher = vi.fn((url: string) =>
        response(
          url.includes("/isbn/")
            ? edition
            : url.includes("googleapis")
              ? { items: [{ volumeInfo: { title: "Another book" } }] }
              : search,
        ),
      );
      const result = await searchCatalog(query, fetcher);
      expect(fetcher).toHaveBeenCalledWith("https://openlibrary.org/isbn/9780140256352.json", {
        signal: expect.any(AbortSignal),
      });
      expect(fetcher).toHaveBeenCalledTimes(4);
      expect(result.candidates).toHaveLength(2);
      expect(result.candidates[0]?.isbn).toBe("9780140256352");
      expect(result.failures).toEqual([]);
    }
  });

  it("skips the ISBN path for an invalid checksum", async () => {
    const fetcher = vi.fn(() => response({}));
    await searchCatalog("9780140256353", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("does not retry other HTTP errors or malformed JSON", async () => {
    const fetcher = vi.fn((url: string) =>
      url.includes("googleapis")
        ? Promise.resolve({ ok: false, status: 404, json: async () => ({}) })
        : Promise.resolve({
            ok: true,
            json: async () => {
              throw new SyntaxError("Bad JSON");
            },
          }),
    );
    const result = await searchCatalog("bad data", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.failures.map((error) => error.kind)).toEqual(["unknown", "unknown"]);
  });

  it("keeps successful sources when the ISBN lookup is rate limited", async () => {
    const result = await searchCatalog("9780140256352", (url) =>
      url.includes("/isbn/")
        ? Promise.resolve({ ok: false, status: 429, json: async () => ({}) })
        : response(url.includes("googleapis") ? google : {}),
    );
    expect(result.candidates).toHaveLength(1);
    expect(result.failures).toEqual([{ provider: "Open Library ISBN", kind: "rate-limited" }]);
  });
});

describe("provider deadlines", () => {
  it("includes retries in the original provider deadline and preserves a faster source", async () => {
    vi.useFakeTimers();
    let attempts = 0;
    const fetcher: Fetcher = (url) => {
      if (!url.includes("googleapis"))
        return response(url.includes("search.json") ? search : edition);
      attempts++;
      if (attempts === 1)
        return new Promise((resolve) => {
          setTimeout(() => resolve({ ok: false, status: 503, json: async () => ({}) }), 7000);
        });
      return new Promise(() => {});
    };
    const pending = searchCatalog("slow retry", fetcher);
    await vi.advanceTimersByTimeAsync(8000);
    const result = await pending;
    expect(result.failures).toEqual([{ provider: "Google Books", kind: "timeout" }]);
    expect(result.candidates[0]?.isbn).toBe("9780140256352");
    expect(attempts).toBe(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("includes stalled response bodies and edition requests in the timeout", async () => {
    vi.useFakeTimers();
    const pending = searchCatalog("slow body", (url) => {
      if (url.includes("googleapis"))
        return Promise.resolve({ ok: true, json: () => new Promise(() => {}) });
      if (url.includes("search.json")) return response(search);
      return new Promise(() => {});
    });
    await vi.advanceTimersByTimeAsync(8000);
    expect((await pending).failures).toEqual([
      { provider: "Google Books", kind: "timeout" },
      { provider: "Open Library", kind: "timeout" },
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears provider timers on success", async () => {
    vi.useFakeTimers();
    await searchCatalog("fast", () => response({}));
    expect(vi.getTimerCount()).toBe(0);
  });
});
