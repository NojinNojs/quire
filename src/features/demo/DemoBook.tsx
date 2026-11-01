import { useState } from "react";
import type { BookEdit } from "../../data/bookDetails";
import type { Book } from "../../data/types";
import { BookDetail } from "./BookDetail";
import { BookRating } from "./BookRating";

export function DemoBook({
  book,
  current,
  update,
  read,
  remove,
}: {
  book: Book;
  current: number;
  update: (patch: Partial<Book>) => void;
  read: () => void;
  remove: () => void;
}) {
  const [notes, setNotes] = useState(book.notes ?? "");
  const [saved, setSaved] = useState(false);
  return (
    <BookDetail
      book={book}
      current={current}
      save={async (patch: BookEdit) => update(patch)}
      remove={async () => remove()}
    >
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
    </BookDetail>
  );
}
