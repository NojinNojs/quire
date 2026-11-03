import type { ReadingLog } from "../../data/readingHistory";
import type { DemoState } from "./state";

export function demoHistory(state: DemoState): ReadingLog[] {
  const days = new Map<string, ReadingLog>();
  for (const log of state.logs) {
    if (log.id === state.pending?.id) continue;
    const key = `${log.bookId}:${log.day}`;
    const previous = days.get(key);
    if (previous) previous.pages += log.pages;
    else days.set(key, { id: log.id, book_id: log.bookId, day: log.day, pages: log.pages });
  }
  return [...days.values()].sort((a, b) => a.day.localeCompare(b.day) || a.id.localeCompare(b.id));
}
