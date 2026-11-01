import { type BooksClient, bookEditionKey, listBooks } from "./books";
import type { Book, EditionInput } from "./types";

export type BookEdit = Pick<
  EditionInput,
  "title" | "author" | "publisher" | "year" | "pages" | "isbn" | "language"
> &
  Pick<Book, "edition" | "city">;

export async function getBook(
  client: BooksClient,
  owner: string,
  id: string,
): Promise<Book | null> {
  const { data, error } = await client
    .from("books")
    .select("*")
    .eq("owner", owner)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load this book. Check your connection and try again.");
  return data as Book | null;
}

export async function updateBook(
  client: BooksClient,
  owner: string,
  id: string,
  patch: BookEdit,
): Promise<Book> {
  const existing = await listBooks(client, owner);
  const identity = bookEditionKey(patch);
  if (existing.some((book) => book.id !== id && bookEditionKey(book) === identity)) {
    throw new Error("This edition is already in your library.");
  }
  const { data, error } = await client
    .from("books")
    .update(patch)
    .eq("owner", owner)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data)
    throw new Error(
      error?.code === "23505"
        ? "This edition is already in your library."
        : "Could not save this book. Check your connection and try again.",
    );
  return data as Book;
}

export async function deleteBook(client: BooksClient, owner: string, id: string): Promise<void> {
  const { data, error } = await client
    .from("books")
    .delete()
    .eq("owner", owner)
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data)
    throw new Error("Could not delete this book. Check your connection and try again.");
}
