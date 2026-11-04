import type { BooksClient } from "./books";
import type { Book } from "./types";

export type ReviewPatch = { rating: number | null; notes: string | null };

export async function saveBookReview(
  client: BooksClient,
  owner: string,
  id: string,
  patch: ReviewPatch,
): Promise<Book> {
  if (
    patch.rating !== null &&
    (!Number.isInteger(patch.rating) || patch.rating < 1 || patch.rating > 5)
  ) {
    throw new Error("Rating must be a whole number from 1 to 5.");
  }
  const { data, error } = await client
    .from("books")
    .update({ rating: patch.rating, notes: patch.notes?.trim() || null })
    .eq("owner", owner)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw new Error("Could not save review. Try again.");
  return data as Book;
}

export function bookStatusPatch(
  book: Book,
  status: Book["status"],
  day: string,
): Pick<Book, "status" | "started_at" | "finished_at"> {
  return {
    status,
    started_at: status === "reading" ? (book.started_at ?? day) : book.started_at,
    finished_at: status === "finished" ? (book.finished_at ?? day) : null,
  };
}

export async function setBookStatus(
  client: BooksClient,
  owner: string,
  book: Book,
  status: Book["status"],
  day: string,
): Promise<Book> {
  let response: { data: Book | null; error: { code?: string } | null };
  try {
    response = await client
      .from("books")
      .update(bookStatusPatch(book, status, day))
      .eq("owner", owner)
      .eq("id", book.id)
      .select("*")
      .single();
  } catch {
    throw new Error("Could not update reading status. Try again.");
  }
  if (response.error?.code === "23505" && status === "reading")
    throw new Error("Another book is already being read. Only one book can be active at a time.");
  if (response.error || !response.data)
    throw new Error("Could not update reading status. Try again.");
  return response.data as Book;
}
