import { isbnTo13 } from "./isbn";

export type Candidate = {
  title: string;
  author: string | null;
  publisher: string | null;
  year: number | null;
  pages: number | null;
  isbn: string | null;
  language: string | null;
  coverUrl: string | null;
  source: "Google Books" | "Open Library" | "Manual";
};
export type Fetcher = (
  url: string,
) => Promise<{ ok: boolean; status?: number; json(): Promise<unknown> }>;
type RecordData = Record<string, unknown>;
const object = (value: unknown): RecordData =>
  value && typeof value === "object" ? (value as RecordData) : {};
const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const joined = (value: unknown): string | null =>
  array(value).map(text).filter(Boolean).join(", ") || null;
function positive(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}
function year(value: unknown): number | null {
  const match = text(value)?.match(/\b(\d{4})\b/);
  const n = match ? Number(match[1]) : 0;
  return n >= 1000 && n <= 2100 ? n : null;
}
function isbn(values: unknown): string | null {
  for (const value of array(values)) {
    const normalised = typeof value === "string" ? isbnTo13(value) : null;
    if (normalised) return normalised;
  }
  return null;
}
const LANGUAGES: Record<string, string> = {
  ind: "id",
  indo: "id",
  id: "id",
  indonesian: "id",
  eng: "en",
  en: "en",
  english: "en",
};
/** Catalogue sources use ISO 639-3; the app stores the two letter code used by the schema. */
function languageOf(value: unknown): string | null {
  const code = text(value)?.toLowerCase();
  if (!code) return null;
  return LANGUAGES[code] ?? code.slice(0, 2);
}
function cover(value: unknown): string | null {
  const url = text(value)?.replace(/^http:/, "https:");
  return url?.startsWith("https://") ? url : null;
}
export function normaliseGoogleBooks(data: unknown): Candidate[] {
  return array(object(data).items).flatMap((item) => {
    const v = object(object(item).volumeInfo);
    const title = text(v.title);
    return title
      ? [
          {
            title,
            author: joined(v.authors),
            publisher: text(v.publisher),
            year: year(v.publishedDate),
            pages: positive(v.pageCount),
            isbn: isbn(array(v.industryIdentifiers).map((id) => object(id).identifier)),
            language: languageOf(v.language),
            coverUrl: cover(object(v.imageLinks).thumbnail),
            source: "Google Books" as const,
          },
        ]
      : [];
  });
}
export function normaliseOpenLibrary(data: unknown, author: string | null): Candidate | null {
  const v = object(data);
  const title = text(v.title);
  if (!title) return null;
  const coverId = array(v.covers).find((id) => positive(id));
  return {
    title,
    author,
    publisher: joined(v.publishers),
    year: year(v.publish_date),
    pages: positive(v.number_of_pages),
    isbn: isbn([...array(v.isbn_13), ...array(v.isbn_10)]),
    language: languageOf(
      text(object(array(v.languages)[0]).key)
        ?.split("/")
        .pop(),
    ),
    coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
    source: "Open Library",
  };
}
export function rankCandidates(candidates: Candidate[]): Candidate[] {
  const completeness = (c: Candidate) =>
    Object.entries(c).filter(([key, value]) => key !== "source" && value !== null).length;
  const sorted = [...candidates].sort((a, b) => completeness(b) - completeness(a));
  const seen = new Set<string>();
  return sorted.filter((c) => {
    const key = c.isbn ?? JSON.stringify(c);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export async function searchCatalog(
  query: string,
  fetcher: Fetcher,
): Promise<{ candidates: Candidate[]; errors: string[] }> {
  if (!query.trim()) return { candidates: [], errors: [] };
  const q = encodeURIComponent(query.trim());
  async function read(url: string) {
    const response = await fetcher(url);
    if (!response.ok) {
      const status = response.status;
      throw new Error(status === 429 ? "rate limited" : "request failed");
    }
    return response.json();
  }
  const sources = ["Google Books", "Open Library"];
  const editionErrors: string[] = [];
  const results = await Promise.allSettled([
    read(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=10`).then(
      normaliseGoogleBooks,
    ),
    (async () => {
      const data = await read(
        `https://openlibrary.org/search.json?q=${q}&limit=5&fields=title,author_name,editions,editions.key,cover_edition_key,edition_key`,
      );
      const editions = await Promise.allSettled(
        array(object(data).docs).map(async (doc) => {
          const work = object(doc);
          const edition = object(array(object(work.editions).docs)[0]);
          const fallback = text(work.cover_edition_key) ?? text(array(work.edition_key)[0]);
          const key = text(edition.key) ?? (fallback ? `/books/${fallback}` : null);
          if (!key || !/^\/books\/OL\d+M$/.test(key)) return null;
          return normaliseOpenLibrary(
            await read(`https://openlibrary.org${key}.json`),
            joined(work.author_name),
          );
        }),
      );
      if (editions.some((result) => result.status === "rejected"))
        editionErrors.push(
          "Some Open Library editions could not be loaded. Try again or enter the book manually.",
        );
      return editions.flatMap((result) =>
        result.status === "fulfilled" && result.value ? [result.value] : [],
      );
    })(),
  ]);
  return {
    candidates: rankCandidates(
      results.flatMap((result) => (result.status === "fulfilled" ? result.value : [])),
    ),
    errors: [
      ...editionErrors,
      ...results.flatMap((result, i) =>
        result.status === "rejected"
          ? [
              result.reason instanceof Error && result.reason.message === "rate limited"
                ? `${sources[i]} is rate limiting requests. Try again in a minute, or enter the book manually.`
                : `${sources[i]} is unavailable. Try again or enter the book manually.`,
            ]
          : [],
      ),
    ],
  };
}
