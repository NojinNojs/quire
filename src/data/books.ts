import type { SupabaseClient } from "@supabase/supabase-js";
import { editionKey } from "../lib/edition";
import { isbnTo13 } from "../lib/isbn";
import type { Book, EditionInput } from "./types";

export type BooksClient = Pick<SupabaseClient, "from">;
export type SaveResult =
  | { ok: true; book: Book }
  | { ok: false; message: string; kind: "duplicate" | "unknown" };

function message(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  return code === "42501"
    ? "Your account does not have permission to access these books. Sign in again and try again."
    : "Could not access your books. Check your connection and try again.";
}

export async function countBooks(client: BooksClient, ownerId: string): Promise<number> {
  try {
    const { count, error } = await client
      .from("books")
      .select("id", { count: "exact", head: true })
      .eq("owner", ownerId);
    if (error) throw error;
    if (count === null) throw new Error("Book count missing");
    return count;
  } catch (error) {
    throw new Error(message(error));
  }
}

export async function listBooks(client: BooksClient, ownerId: string): Promise<Book[]> {
  try {
    const books: Book[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await client
        .from("books")
        .select("*")
        .eq("owner", ownerId)
        .order("id")
        .range(offset, offset + 999);
      if (error) throw error;
      if (!data) throw new Error("Book list missing");
      books.push(...(data as Book[]));
      if (data.length < 1000) return books;
    }
  } catch (error) {
    throw new Error(message(error));
  }
}

export async function saveBook(client: BooksClient, input: EditionInput): Promise<SaveResult> {
  try {
    const isbn = input.isbn ? isbnTo13(input.isbn) : null;
    if (input.isbn && !isbn) {
      return { ok: false, kind: "unknown", message: "Enter a valid ISBN or leave ISBN blank." };
    }
    const identity = (book: {
      title: string;
      publisher: string | null;
      year: number | null;
      isbn: string | null;
    }) => editionKey({ ...book, isbn: book.isbn ? isbnTo13(book.isbn) : null });
    const existing = await listBooks(client, input.owner);
    const duplicate = existing.find((book) => identity(book) === identity({ ...input, isbn }));
    if (duplicate && !isbn) {
      return { ok: false, kind: "duplicate", message: "This edition is already in your library." };
    }
    const { data, error } = await client
      .from("books")
      .insert({
        owner: input.owner,
        title: input.title,
        author: input.author,
        publisher: input.publisher,
        year: input.year,
        pages: input.pages,
        isbn: duplicate?.isbn ?? isbn,
        language: input.language,
        cover_url: input.coverUrl,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") {
        return {
          ok: false,
          kind: "duplicate",
          message: "This edition is already in your library.",
        };
      }
      throw error;
    }
    if (!data) throw new Error("Saved book missing");
    return { ok: true, book: data as Book };
  } catch (error) {
    return {
      ok: false,
      kind: "unknown",
      message: error instanceof Error ? error.message : message(error),
    };
  }
}
