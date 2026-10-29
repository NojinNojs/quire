import { lookupCatalogueHtml } from "./catalogueHtml";
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
  source: "Google Books" | "Google Books (metadata only)" | "Open Library" | "Manual";
};
export type Fetcher = (
  url: string,
  options?: { signal: AbortSignal },
) => Promise<{ ok: boolean; status?: number; json(): Promise<unknown>; text?(): Promise<string> }>;
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
export type CatalogProvider =
  | "Google Books"
  | "Open Library"
  | "Open Library ISBN"
  | "Google Books HTML";
export type CatalogFailure = {
  provider: CatalogProvider;
  kind: "rate-limited" | "timeout" | "offline" | "unknown";
};
export type CatalogResult = {
  candidates: Candidate[];
  errors: string[];
  failures: CatalogFailure[];
  fromCache?: boolean;
};

class RequestFailure extends Error {
  constructor(public readonly kind: CatalogFailure["kind"]) {
    super(kind);
  }
}

function failure(provider: CatalogProvider, reason: unknown): CatalogFailure {
  return { provider, kind: reason instanceof RequestFailure ? reason.kind : "unknown" };
}

function failureMessage({ provider, kind }: CatalogFailure): string {
  const description = {
    "rate-limited": "is rate limiting requests",
    timeout: "did not respond within eight seconds",
    offline: "could not be reached because of a network error",
    unknown: "could not load catalogue data",
  }[kind];
  return `${provider} ${description}. Try again or enter the book manually.`;
}

async function runProvider(
  fetcher: Fetcher,
  load: (read: (url: string, format?: "text") => Promise<unknown>) => Promise<Candidate[]>,
): Promise<Candidate[]> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new RequestFailure("timeout"));
      controller.abort();
    }, 8000);
  });
  async function read(url: string, format?: "text"): Promise<unknown> {
    for (let attempt = 0; ; attempt++) {
      if (controller.signal.aborted) throw new RequestFailure("timeout");
      let response: Awaited<ReturnType<Fetcher>>;
      try {
        response = await fetcher(url, { signal: controller.signal });
        if (response.ok) return format === "text" ? await response.text?.() : await response.json();
      } catch (reason) {
        if (controller.signal.aborted) throw new RequestFailure("timeout");
        if (!(reason instanceof TypeError)) throw reason;
        if (attempt === 0) continue;
        throw new RequestFailure("offline");
      }
      if (response.status === 429) throw new RequestFailure("rate-limited");
      if (attempt === 0 && response.status && response.status >= 500 && response.status < 600)
        continue;
      throw new RequestFailure("unknown");
    }
  }
  try {
    return await Promise.race([load(read), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Each instance owns its last successful results; callers can isolate sessions and tests. */
export function createCatalogSearch() {
  const cache = new Map<string, Candidate[]>();
  return async function searchCatalog(query: string, fetcher: Fetcher): Promise<CatalogResult> {
    const key = query.trim();
    if (!key) return { candidates: [], errors: [], failures: [] };
    const q = encodeURIComponent(key);
    const failures: CatalogFailure[] = [];
    const queryIsbn = isbnTo13(key);
    const attempts: [CatalogProvider, Parameters<typeof runProvider>[1]][] = [
      [
        "Google Books",
        async (read) =>
          normaliseGoogleBooks(
            await read(
              `https://www.googleapis.com/books/v1/volumes?q=${queryIsbn ? `isbn:${queryIsbn}` : q}&maxResults=10`,
            ),
          ),
      ],
    ];
    if (queryIsbn)
      attempts.push([
        "Open Library ISBN",
        async (read) => {
          const candidate = normaliseOpenLibrary(
            await read(`https://openlibrary.org/isbn/${queryIsbn}.json`),
            null,
          );
          return candidate ? [{ ...candidate, isbn: candidate.isbn ?? queryIsbn }] : [];
        },
      ]);
    attempts.push([
      "Open Library",
      async (read) => {
        const data = await read(
          `https://openlibrary.org/search.json?q=${queryIsbn ? `isbn:${queryIsbn}` : q}&limit=5&fields=title,author_name,editions,editions.key,cover_edition_key,edition_key`,
        );
        const editions = await Promise.allSettled(
          array(object(data).docs).map(async (doc) => {
            const work = object(doc);
            const edition = object(array(object(work.editions).docs)[0]);
            const fallback = text(work.cover_edition_key) ?? text(array(work.edition_key)[0]);
            const editionKey = text(edition.key) ?? (fallback ? `/books/${fallback}` : null);
            if (!editionKey || !/^\/books\/OL\d+M$/.test(editionKey)) return null;
            return normaliseOpenLibrary(
              await read(`https://openlibrary.org${editionKey}.json`),
              joined(work.author_name),
            );
          }),
        );
        for (const result of editions) {
          if (result.status === "rejected") failures.push(failure("Open Library", result.reason));
        }
        return editions.flatMap((result) =>
          result.status === "fulfilled" && result.value ? [result.value] : [],
        );
      },
    ]);
    if (queryIsbn)
      attempts.push([
        "Google Books HTML",
        async (read) => {
          const metadata = await lookupCatalogueHtml(queryIsbn, async (url) =>
            String((await read(url, "text")) ?? ""),
          );
          return metadata
            ? [
                {
                  ...metadata,
                  isbn: queryIsbn,
                  publisher: null,
                  year: null,
                  pages: null,
                  language: null,
                  coverUrl: null,
                  source: "Google Books (metadata only)",
                },
              ]
            : [];
        },
      ]);
    for (const [provider, load] of attempts) {
      try {
        const candidates = rankCandidates(await runProvider(fetcher, load));
        if (candidates.length) {
          cache.set(key, structuredClone(candidates));
          return { candidates, errors: [], failures };
        }
      } catch (reason) {
        failures.push(failure(provider, reason));
      }
    }
    const cached = cache.get(key);
    if (cached)
      return {
        candidates: structuredClone(cached),
        errors: [
          "Showing saved results from the last successful search. Catalogue data may be out of date.",
        ],
        failures,
        fromCache: true,
      };
    const limited = failures.find(
      (item) => item.provider === "Google Books" && item.kind === "rate-limited",
    );
    const tried = queryIsbn
      ? "Tried Google Books API, Open Library ISBN, Open Library search, and Google Books HTML."
      : "Tried Google Books API and Open Library search.";
    return {
      candidates: [],
      errors: [
        limited
          ? `${failureMessage(limited)} ${tried}`
          : `No catalogue matches could be loaded. ${tried}`,
      ],
      failures,
    };
  };
}

export const searchCatalog = createCatalogSearch();
