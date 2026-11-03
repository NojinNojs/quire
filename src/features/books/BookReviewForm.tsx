import { useState } from "react";
import type { ReviewPatch } from "../../data/bookReading";
import type { Book } from "../../data/types";
import { BookRating } from "./BookRating";

export function BookReviewForm({
  book,
  save,
}: {
  book: Book;
  save: (patch: ReviewPatch) => Promise<void>;
}) {
  const [rating, setRating] = useState(book.rating);
  const [notes, setNotes] = useState(book.notes ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      className="demo-notes"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        setError("");
        try {
          await save({ rating, notes: notes.trim() || null });
          setMessage("Review saved.");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not save review. Try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <fieldset disabled={pending}>
        <BookRating
          rating={rating}
          onChange={(value) => {
            setRating(value);
            setMessage("");
          }}
        />
        <label className="demo-field">
          <span>Private notes and review</span>
          <textarea
            rows={5}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setMessage("");
            }}
          />
        </label>
        <button className="demo-button" type="submit">
          {pending ? "Saving…" : "Save review"}
        </button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <p role="status">{message}</p>
    </form>
  );
}
