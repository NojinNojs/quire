import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useState } from "react";
import { deleteBook, getBook, updateBook } from "../../data/bookDetails";
import type { Book } from "../../data/types";
import { BookDetail } from "../demo/BookDetail";
import { useShelfProgressState } from "../shelf/useShelfProgress";
import { useLoad } from "./useLoad";

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
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
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
      save={async (patch) => setUpdated(await updateBook(client, owner, id, patch))}
      remove={async () => {
        await deleteBook(client, owner, id);
        window.location.hash = "/shelf";
      }}
    >
      <div className="demo-book-actions">
        <button
          className="primary"
          type="button"
          disabled={starting}
          onClick={async () => {
            if (book.status === "reading") {
              window.location.hash = "/today";
              return;
            }
            setStarting(true);
            setStartError("");
            try {
              const { data, error } = await client
                .from("books")
                .update({ status: "reading" })
                .eq("owner", owner)
                .eq("id", id)
                .select("id")
                .single();
              if (error?.code === "23505") {
                setStartError(
                  "Another book is already being read. Only one book can be active at a time.",
                );
              } else if (error || !data) {
                setStartError("Could not start reading. Check your connection and try again.");
              } else {
                window.location.hash = "/today";
              }
            } catch {
              setStartError("Could not start reading. Check your connection and try again.");
            } finally {
              setStarting(false);
            }
          }}
        >
          {starting
            ? "Starting…"
            : book.status === "reading"
              ? "Continue reading"
              : "Read this book"}
        </button>
      </div>
      {startError && <p role="alert">{startError}</p>}
    </BookDetail>
  );
}
