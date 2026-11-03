import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useState } from "react";
import { deleteBook, getBook, updateBook } from "../../data/bookDetails";
import { saveBookReview, setBookStatus } from "../../data/bookReading";
import type { Book } from "../../data/types";
import { BookDetail } from "../books/BookDetail";
import { BookReviewForm } from "../books/BookReviewForm";
import { BookStatusForm } from "../books/BookStatusForm";
import { readPendingLog } from "../reading/pendingLog";
import { useShelfProgressState } from "../shelf/useShelfProgress";
import { useLoad } from "./useLoad";
import { readingDay } from "./useReading";

export function BookRoute({
  client,
  owner,
  id,
}: {
  client: SupabaseClient;
  owner: string;
  id: string;
}) {
  const load = useCallback(() => getBook(client, owner, id), [client, owner, id]);
  const { data, loading, error, retry } = useLoad(load);
  const [updated, setUpdated] = useState<Book | null>(null);
  const book = updated?.id === id ? updated : data;
  const progress = useShelfProgressState(book ? [book.id] : []);
  if (loading)
    return (
      <main className="shell">
        <p role="status">Loading book…</p>
      </main>
    );
  if (error)
    return (
      <main className="shell">
        <p role="alert">{error}</p>
        <button type="button" onClick={retry}>
          Try again
        </button>
      </main>
    );
  if (!book)
    return (
      <main className="shell">
        <h1>Book not found</h1>
        <a href="#/shelf">Back to collection</a>
      </main>
    );
  if (progress.loading)
    return (
      <main className="shell">
        <p role="status">Loading reading progress…</p>
      </main>
    );
  if (progress.error)
    return (
      <main className="shell">
        <p role="alert">{progress.error.message}</p>
        <button type="button" onClick={progress.retry}>
          Try again
        </button>
      </main>
    );
  return (
    <BookDetail
      key={book.id}
      book={book}
      current={progress.pages[book.id] ?? 0}
      save={async (patch) => {
        const result = await updateBook(client, owner, id, patch);
        setUpdated((previous) => ({
          ...(previous?.id === id ? previous : book),
          title: result.title,
          author: result.author,
          publisher: result.publisher,
          year: result.year,
          pages: result.pages,
          isbn: result.isbn,
          language: result.language,
          edition: result.edition,
          city: result.city,
        }));
      }}
      remove={async () => {
        await deleteBook(client, owner, id);
        window.location.hash = "/shelf";
      }}
    >
      <BookStatusForm
        book={book}
        pending={hasPendingLog(id)}
        save={async (status) => {
          const result = await setBookStatus(client, owner, book, status, readingDay());
          setUpdated((previous) => ({
            ...(previous?.id === id ? previous : book),
            status: result.status,
            started_at: result.started_at,
            finished_at: result.finished_at,
          }));
          return result;
        }}
      />
      <BookReviewForm
        book={book}
        save={async (patch) => {
          const result = await saveBookReview(client, owner, id, patch);
          setUpdated((previous) => ({
            ...(previous?.id === id ? previous : book),
            rating: result.rating,
            notes: result.notes,
          }));
        }}
      />
    </BookDetail>
  );
}

function hasPendingLog(id: string): boolean {
  try {
    return readPendingLog(window.localStorage, id) !== null;
  } catch {
    return false;
  }
}
