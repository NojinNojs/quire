import type { Book } from "../../data/types";
import type { Candidate } from "../../lib/catalog";
import { emptyStreak, isBroken, logReadingDay } from "../../lib/streak";
import { readingDay } from "../integration/useReading";
import { restoredDays } from "../reading/restoredDays";
import { sampleCover } from "./covers";

export const demoKey = "quire:demo:v1";
export type DemoLog = { id: string; bookId: string; day: string; pages: number };
export type DemoState = {
  version: 1;
  books: Book[];
  logs: DemoLog[];
  pending: { id: string; until: number } | null;
};

function book(
  id: string,
  title: string,
  author: string,
  ddc: string,
  extra: Partial<Book> = {},
): Book {
  return {
    id,
    title,
    author,
    ddc,
    owner: "demo",
    work_id: null,
    publisher: null,
    city: null,
    year: null,
    edition: null,
    pages: null,
    isbn: null,
    language: "en",
    cover_url: sampleCover(title, author),
    cover_path: null,
    status: "want",
    rating: null,
    notes: null,
    started_at: null,
    finished_at: null,
    created_at: "2026-10-29T00:00:00Z",
    updated_at: "2026-10-29T00:00:00Z",
    ...extra,
  };
}

// Edition details and reading activity are illustrative, as labelled throughout the demo.
export const sampleBooks = [
  book("demo-waves", "The Waves", "Virginia Woolf", "823.912", {
    publisher: "Hogarth Press",
    year: 1931,
    pages: 324,
  }),
  book("demo-room", "A Room of One's Own", "Virginia Woolf", "824.912", {
    publisher: "Hogarth Press",
    year: 1929,
    pages: 172,
    status: "finished",
    rating: 5,
  }),
  book("demo-meditations", "Meditations", "Marcus Aurelius", "188", {
    publisher: "Modern Library",
    year: 2002,
    pages: 256,
  }),
  book("demo-histories", "The Histories", "Herodotus", "938", {
    publisher: "Penguin Classics",
    year: 2003,
    pages: 784,
  }),
  book("demo-bumi", "Bumi Manusia", "Pramoedya Ananta Toer", "899.221", {
    publisher: "Hasta Mitra",
    year: 1980,
    language: "id",
    pages: 550,
    status: "reading",
    cover_url: "/covers/bumi.webp",
  }),
  book("demo-laut", "Laut Bercerita", "Leila S. Chudori", "899.221", {
    language: "id",
    status: "wishlist",
  }),
];

export const sampleCatalogue = [
  book("demo-pride", "Pride and Prejudice", "Jane Austen", "823.7", { pages: 432 }),
  book("demo-walden", "Walden", "Henry David Thoreau", "818.3", { pages: 352 }),
  book("demo-origin", "On the Origin of Species", "Charles Darwin", "576.82", { pages: 502 }),
  ...sampleBooks,
];

export function createDemoState(date = new Date()): DemoState {
  return {
    version: 1,
    books: sampleBooks.map((entry) => ({ ...entry })),
    logs: [
      ...[3, 2, 1].map((ago) => {
        const day = new Date(date);
        day.setDate(day.getDate() - ago);
        return { id: `sample-${ago}`, bookId: "demo-bumi", day: readingDay(day), pages: 16 };
      }),
      { id: "sample-finished", bookId: "demo-room", day: "2026-01-01", pages: 172 },
    ],
    pending: null,
  };
}

function validBook(value: unknown): value is Book {
  if (!value || typeof value !== "object") return false;
  const b = value as Book;
  return (
    typeof b.id === "string" &&
    b.id.startsWith("demo-") &&
    b.owner === "demo" &&
    typeof b.title === "string" &&
    b.title.trim().length > 0 &&
    [b.author, b.publisher, b.ddc, b.language, b.notes].every(
      (v) => v === null || typeof v === "string",
    ) &&
    (b.pages === null || (Number.isInteger(b.pages) && b.pages > 0)) &&
    (b.year === null || Number.isInteger(b.year)) &&
    (b.rating === null || (Number.isInteger(b.rating) && b.rating >= 1 && b.rating <= 5)) &&
    ["want", "reading", "finished", "wishlist"].includes(b.status) &&
    (b.cover_url === null || typeof b.cover_url === "string") &&
    b.cover_path === null
  );
}

export function loadDemoState(storage: Pick<Storage, "getItem">): DemoState {
  try {
    const raw = storage.getItem(demoKey);
    if (!raw) return createDemoState();
    const value = JSON.parse(raw) as DemoState;
    if (
      value.version !== 1 ||
      !Array.isArray(value.books) ||
      !value.books.every(validBook) ||
      !Array.isArray(value.logs) ||
      new Set(value.books.map((b) => b.id)).size !== value.books.length ||
      value.books.filter((b) => b.status === "reading").length > 1 ||
      !value.logs.every(
        (log) =>
          log &&
          typeof log.id === "string" &&
          value.books.some((b) => b.id === log.bookId) &&
          typeof log.day === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(log.day) &&
          Number.isInteger(log.pages) &&
          log.pages > 0,
      )
    ) {
      return createDemoState();
    }
    const pending = value.pending;
    return {
      ...value,
      books: value.books.map((entry) => ({
        ...entry,
        cover_url: sampleCover(entry.title, entry.author),
      })),
      pending:
        pending &&
        typeof pending.id === "string" &&
        Number.isFinite(pending.until) &&
        pending.until > Date.now() &&
        value.logs.some((log) => log.id === pending.id)
          ? pending
          : null,
    };
  } catch {
    return createDemoState();
  }
}

export function currentPages(state: DemoState, id: string) {
  return state.logs.filter((log) => log.bookId === id).reduce((sum, log) => sum + log.pages, 0);
}

export function demoStreak(state: DemoState, today: string) {
  const days = [...new Set(state.logs.map((log) => log.day))].sort();
  const streak = days.reduce(logReadingDay, emptyStreak);
  const restored = restoredDays(days);
  return {
    current: isBroken(streak, today) ? 0 : streak.current,
    longest: streak.longest,
    days: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(`${today}T12:00:00`);
      date.setDate(date.getDate() - 6 + i);
      const day = readingDay(date);
      return { day, read: days.includes(day), restored: restored.has(day) };
    }),
  };
}

export function candidateBook(candidate: Candidate): Book {
  const sample = sampleCatalogue.find(
    (entry) => entry.title === candidate.title && entry.author === candidate.author,
  );
  return book(
    `demo-${crypto.randomUUID()}`,
    candidate.title,
    candidate.author ?? "",
    sample?.ddc ?? "",
    {
      author: candidate.author,
      publisher: candidate.publisher,
      year: candidate.year,
      pages: candidate.pages,
      isbn: candidate.isbn,
      language: candidate.language,
      ddc: sample?.ddc ?? null,
    },
  );
}
