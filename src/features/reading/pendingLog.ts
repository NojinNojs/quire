import type { PageLog } from "./log";

export function readPendingLog(storage: Pick<Storage, "getItem">, bookId: string): PageLog | null {
  try {
    const raw = storage.getItem(`quire:page-log:${bookId}`);
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (
      !value ||
      typeof value !== "object" ||
      !("bookId" in value) ||
      value.bookId !== bookId ||
      !("pages" in value) ||
      typeof value.pages !== "number" ||
      !Number.isInteger(value.pages) ||
      value.pages <= 0 ||
      value.pages > 2_147_483_647 ||
      !("day" in value) ||
      typeof value.day !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value.day)
    )
      return null;
    const year = Number(value.day.slice(0, 4));
    const month = Number(value.day.slice(5, 7));
    const day = Number(value.day.slice(8, 10));
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    if (
      year < 1 ||
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    )
      return null;
    return { bookId, pages: value.pages, day: value.day };
  } catch {
    return null;
  }
}
