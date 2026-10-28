export type DdcClass = {
  code: "000" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  label: string;
  token: string;
};

const CLASSES: Record<DdcClass["code"], { label: string; token: string }> = {
  "000": { label: "General", token: "--class-000" },
  "100": { label: "Philosophy", token: "--class-100" },
  "200": { label: "Religion", token: "--class-200" },
  "300": { label: "Social sciences", token: "--class-300" },
  "400": { label: "Language", token: "--class-400" },
  "500": { label: "Science", token: "--class-500" },
  "600": { label: "Technology", token: "--class-600" },
  "700": { label: "Arts", token: "--class-700" },
  "800": { label: "Literature", token: "--class-800" },
  "900": { label: "History", token: "--class-900" },
};

/** Accepts "899.2213", "899", "899.2213 T64 1980" and returns the hundred class. */
export function classify(ddc: string | null | undefined): DdcClass | null {
  if (!ddc) return null;
  const match = ddc.match(/^\s*(\d)/);
  if (!match) return null;
  const code = `${match[1]}00` as DdcClass["code"];
  const entry = CLASSES[code];
  return entry ? { code, ...entry } : null;
}

export function groupByClass<T extends { ddc: string | null }>(books: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const book of books) {
    const cls = classify(book.ddc);
    const key = cls ? `${cls.code} ${cls.label}` : "Unclassified";
    const bucket = groups.get(key) ?? [];
    bucket.push(book);
    groups.set(key, bucket);
  }
  return groups;
}
