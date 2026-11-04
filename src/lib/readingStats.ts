import type { ReadingLog } from "../data/readingHistory";
import type { Book } from "../data/types";

export type LanguageFilter =
  | { kind: "all" }
  | { kind: "unknown" }
  | { kind: "language"; value: string };

export function summarizeReading(
  books: Book[],
  logs: ReadingLog[],
  year: number,
  language: LanguageFilter,
) {
  const prefix = `${String(year).padStart(4, "0")}-`;
  const byId = new Map(books.map((book) => [book.id, book]));
  const breakdown = new Map<
    string | null,
    { language: string | null; pages: number; finished: number }
  >();
  const daily = new Map<string, number>();
  const accepts = (value: string | null) =>
    language.kind === "all" ||
    (language.kind === "unknown" ? value === null : value === language.value);
  const row = (value: string | null) => {
    let item = breakdown.get(value);
    if (!item) {
      item = { language: value, pages: 0, finished: 0 };
      breakdown.set(value, item);
    }
    return item;
  };
  let finished = 0;
  for (const book of books) {
    if (book.status !== "finished" || !book.finished_at?.startsWith(prefix)) continue;
    row(book.language).finished++;
    if (accepts(book.language)) finished++;
  }
  for (const log of logs) {
    if (!log.day.startsWith(prefix)) continue;
    const book = byId.get(log.book_id);
    if (!book) continue;
    row(book.language).pages += log.pages;
    if (accepts(book.language)) daily.set(log.day, (daily.get(log.day) ?? 0) + log.pages);
  }
  const date = new Date(0);
  date.setHours(12, 0, 0, 0);
  date.setFullYear(year, 0, 1);
  const days: { day: string; pages: number }[] = [];
  while (date.getFullYear() === year) {
    const day = `${prefix}${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    days.push({ day, pages: daily.get(day) ?? 0 });
    date.setDate(date.getDate() + 1);
  }
  return {
    pages: days.reduce((sum, day) => sum + day.pages, 0),
    finished,
    activeDays: days.filter((day) => day.pages > 0).length,
    days,
    languages: [...breakdown.values()].sort((a, b) =>
      (a.language ?? "").localeCompare(b.language ?? ""),
    ),
  };
}
