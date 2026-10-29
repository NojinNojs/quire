export type CoverIdentity = { isbn?: string | null; title: string; author?: string | null };
export type CoverFetcher = (
  url: string,
  options?: { signal: AbortSignal },
) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

type Data = Record<string, unknown>;
const object = (value: unknown): Data =>
  value && typeof value === "object" ? (value as Data) : {};
const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function https(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.replace(/^http:/i, "https:"));
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function largest(images: unknown): string | null {
  const links = object(images);
  for (const size of ["extraLarge", "large", "medium", "small", "thumbnail", "smallThumbnail"]) {
    const url = https(links[size]);
    if (url) return url;
  }
  return null;
}

function openLibraryCover(value: unknown): string | null {
  const id = array(object(value).covers).find(
    (id) => typeof id === "number" && Number.isInteger(id) && id > 0,
  );
  return id ? `https://covers.openlibrary.org/b/id/${id}-L.jpg?default=false` : null;
}

/** Missing covers and unavailable providers are optional metadata, never a failed book save. */
export async function lookupCover(
  { isbn, title, author }: CoverIdentity,
  fetcher: CoverFetcher = fetch,
): Promise<string | null> {
  async function read(url: string): Promise<Data> {
    try {
      const response = await fetcher(url, { signal: AbortSignal.timeout(4000) });
      return response.ok ? object(await response.json()) : {};
    } catch {
      return {};
    }
  }
  const number = isbn?.replace(/[^0-9Xx]/g, "");
  if (number) {
    const google = await read(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(number)}`,
    );
    for (const item of array(google.items)) {
      const url = largest(object(object(item).volumeInfo).imageLinks);
      if (url) return url;
    }
    const edition = await read(`https://openlibrary.org/isbn/${encodeURIComponent(number)}.json`);
    const url = openLibraryCover(edition);
    if (url) return url;
  }
  if (!title.trim()) return null;
  const query = new URLSearchParams({ title: title.trim(), limit: "5", fields: "cover_i" });
  if (author?.trim()) query.set("author", author.trim());
  const search = await read(`https://openlibrary.org/search.json?${query}`);
  for (const doc of array(search.docs)) {
    const url = openLibraryCover({ covers: [object(doc).cover_i] });
    if (url) return url;
  }
  return null;
}
