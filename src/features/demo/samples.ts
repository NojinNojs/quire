import type { Book } from "../../data/types";
import type { Candidate } from "../../lib/catalog";
import { sampleCover } from "./covers";

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
    finished_at: "2026-01-01",
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
