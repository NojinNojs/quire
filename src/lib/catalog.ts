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
  options?: { signal: AbortSignal },
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
export type CatalogProvider = "Google Books" | "Open Library" | "Open Library ISBN";
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
  load: (read: (url: string) => Promise<unknown>) => Promise<Candidate[]>,
): Promise<Candidate[]> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new RequestFailure("timeout"));
      controller.abort();
    }, 8000);
  });
  async function read(url: string): Promise<unknown> {
    for (let attempt = 0; ; attempt++) {
      if (controller.signal.aborted) throw new RequestFailure("timeout");
      let response: Awaited<ReturnType<Fetcher>>;
      try {
        response = await fetcher(url, { signal: controller.signal });
        if (response.ok) return await response.json();
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
    const sources: CatalogProvider[] = ["Google Books", "Open Library"];
    const requests = [
      runProvider(fetcher, async (read) =>
        normaliseGoogleBooks(
          await read(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=10`),
        ),
      ),
      runProvider(fetcher, async (read) => {
        const data = await read(
          `https://openlibrary.org/search.json?q=${q}&limit=5&fields=title,author_name,editions,editions.key,cover_edition_key,edition_key`,
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
      }),
    ];
    const queryIsbn = isbnTo13(key);
    if (queryIsbn) {
      sources.push("Open Library ISBN");
      requests.push(
        runProvider(fetcher, async (read) => {
          const candidate = normaliseOpenLibrary(
            await read(`https://openlibrary.org/isbn/${queryIsbn}.json`),
            null,
          );
          return candidate ? [{ ...candidate, isbn: candidate.isbn ?? queryIsbn }] : [];
        }),
      );
    }
    const results = await Promise.allSettled(requests);
    for (const [index, result] of results.entries()) {
      if (result.status === "rejected") {
        const provider = sources[index];
        if (provider) failures.push(failure(provider, result.reason));
      }
    }
    const uniqueFailures = failures.filter(
      (item, index) =>
        failures.findIndex(
          (other) => other.provider === item.provider && other.kind === item.kind,
        ) === index,
    );
    const candidates = rankCandidates(
      results.flatMap((result) => (result.status === "fulfilled" ? result.value : [])),
    );
    const errors = uniqueFailures.map(failureMessage);
    if (candidates.length) cache.set(key, structuredClone(candidates));
    const cached = cache.get(key);
    if (!candidates.length && uniqueFailures.length && cached) {
      errors.push(
        "Showing saved results from the last successful search. Catalogue data may be out of date.",
      );
      return {
        candidates: structuredClone(cached),
        errors,
        failures: uniqueFailures,
        fromCache: true,
      };
    }
    return { candidates, errors, failures: uniqueFailures };
  };
}

export const searchCatalog = createCatalogSearch();
