import { useState } from "react";
import type { Book } from "../../data/types";
import { CoverImage } from "../covers/CoverImage";
import { BookRating } from "./BookRating";

export function DemoBook({
  book,
  current,
  update,
  read,
}: {
  book: Book;
  current: number;
  update: (patch: Partial<Pick<Book, "notes" | "rating" | "status">>) => void;
  read: () => void;
}) {
  const [notes, setNotes] = useState(book.notes ?? "");
  const [saved, setSaved] = useState(false);
  return (
    <main className="shell demo-book">
      <a className="settings-link" href="#/shelf">
        Back to shelf
      </a>
      <h1>Book details</h1>
      <div className="demo-book-record">
        <CoverImage
          coverUrl={book.cover_url}
          title={book.title}
          author={book.author}
          ddc={book.ddc}
          className="demo-detail-cover"
        />
        <div>
          <h2>{book.title}</h2>
          <p>{book.author ?? "Author unknown"}</p>
          <p className="muted">
            {[book.publisher, book.year].filter(Boolean).join(" · ") || "Edition details unknown"}
          </p>
          <p className="demo-progress">
            {current}
            {book.pages ? ` / ${book.pages}` : ""} pages read
          </p>
          <p className="muted">
            {book.ddc ? `DDC ${book.ddc}` : "Unclassified"} · {book.language ?? "Language unknown"}
          </p>
        </div>
      </div>
      <div className="demo-book-actions">
        <button className="primary" type="button" onClick={read}>
          {book.status === "reading" ? "Continue reading" : "Read this book"}
        </button>
        {book.status !== "finished" && (
          <button
            className="demo-button"
            type="button"
            onClick={() => update({ status: "finished" })}
          >
            Mark as finished
          </button>
        )}
      </div>
      <p role="status">
        Status:{" "}
        {
          { want: "Want to read", reading: "Reading", finished: "Finished", wishlist: "Wishlist" }[
            book.status
          ]
        }
      </p>
      <BookRating rating={book.rating} onChange={(rating) => update({ rating })} />
      <form
        className="demo-notes"
        onSubmit={(event) => {
          event.preventDefault();
          update({ notes: notes.trim() || null });
          setSaved(true);
        }}
      >
        <label className="demo-field">
          <span>Notes</span>
          <textarea
            rows={5}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setSaved(false);
            }}
            placeholder="Keep a thought from your reading."
          />
        </label>
        <button className="demo-button" type="submit">
          Save notes
        </button>
        <p role="status">{saved ? "Notes saved on this device." : ""}</p>
      </form>
    </main>
  );
}
