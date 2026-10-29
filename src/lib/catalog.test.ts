import { describe, expect, it, vi } from "vitest";
import google from "./__fixtures__/google-books.json";
import edition from "./__fixtures__/open-library-edition.json";
import search from "./__fixtures__/open-library-search.json";
import {
  normaliseGoogleBooks,
  normaliseOpenLibrary,
  rankCandidates,
  searchCatalog,
} from "./catalog";

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
      language: "eng",
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
    });
    const fetcher = vi.fn();
    expect(await searchCatalog("  ", fetcher)).toEqual({ candidates: [], errors: [] });
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
