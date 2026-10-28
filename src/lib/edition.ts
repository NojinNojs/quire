const CLOTHS = ["oxblood", "olive", "indigo", "ochre", "teal"] as const;
export type Cloth = (typeof CLOTHS)[number];

export type EditionIdentity = {
  isbn: string | null;
  title: string;
  publisher: string | null;
  year: number | null;
};

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * One row per edition. Two editions of one title must never share an identity, so ISBN wins and
 * title plus publisher plus year is the fallback for books printed before ISBN existed.
 */
export function editionKey(edition: EditionIdentity): string {
  const isbn = edition.isbn?.replace(/[^0-9Xx]/g, "");
  if (isbn && isbn.length >= 10) return `isbn:${isbn}`;
  return [
    "print",
    normalise(edition.title),
    normalise(edition.publisher ?? ""),
    edition.year ?? "",
  ].join(":");
}

/** Deterministic jacket colour: the same edition always gets the same cloth. */
export function clothFor(key: string): Cloth {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100_000;
  }
  return CLOTHS[hash % CLOTHS.length] as Cloth;
}
