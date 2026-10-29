import type { Book } from "../../data/types";

export function shelfBook(overrides: Partial<Book> = {}): Book {
  return {
    id: "literature",
    owner: "shelf-reader",
    work_id: null,
    title: "The Waves",
    author: "Virginia Woolf",
    publisher: "Hogarth Press",
    city: null,
    year: 1931,
    edition: null,
    pages: 324,
    isbn: null,
    ddc: "823.912",
    language: "en",
    cover_url: null,
    cover_path: null,
    status: "reading",
    rating: null,
    notes: null,
    started_at: null,
    finished_at: null,
    created_at: "2026-10-29T00:00:00Z",
    updated_at: "2026-10-29T00:00:00Z",
    ...overrides,
  };
}

// Illustrative editions for component tests and the isolated evidence preview.
export const shelfBooks: Book[] = [
  shelfBook(),
  shelfBook({
    id: "literature-2",
    title: "A Room of One's Own",
    year: 1929,
    pages: 172,
    status: "finished",
  }),
  shelfBook({
    id: "history",
    title: "The Histories",
    author: "Herodotus",
    publisher: "Penguin Classics",
    year: 2003,
    pages: 784,
    ddc: "938",
    status: "want",
  }),
  shelfBook({
    id: "philosophy",
    title: "Meditations",
    author: "Marcus Aurelius",
    publisher: "Modern Library",
    year: 2002,
    pages: 256,
    ddc: "188",
    status: "reading",
  }),
  shelfBook({
    id: "unclassified",
    title: "Reading notebook",
    author: null,
    publisher: null,
    year: null,
    pages: null,
    ddc: null,
    language: null,
    status: "wishlist",
  }),
];
