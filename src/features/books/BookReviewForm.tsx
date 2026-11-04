import { useId, useState } from "react";
import { SaveIcon } from "../../components/icons";
import { useToast } from "../../components/toast";
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
  const id = useId();
  const [rating, setRating] = useState(book.rating);
  const [notes, setNotes] = useState(book.notes ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  return (
    <form
      className="demo-notes book-review"
      aria-labelledby={`${id}-title`}
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        try {
          await save({ rating, notes: notes.trim() || null });
          toast.success("Review saved.");
        } catch (cause) {
          const message =
            cause instanceof Error ? cause.message : "Could not save review. Try again.";
          setError(message);
          toast.error(message);
        } finally {
          setPending(false);
        }
      }}
    >
      <h2 id={`${id}-title`}>Private review</h2>
      <p className="book-review-note">Only you can see your rating and notes.</p>
      <fieldset disabled={pending}>
        <BookRating
          rating={rating}
          onChange={(value) => {
            setRating(value);
          }}
        />
        <div className="book-review-field">
          <label htmlFor={`${id}-notes`}>Private notes and review</label>
          <textarea
            className="control-textarea"
            id={`${id}-notes`}
            name="notes"
            rows={5}
            placeholder="e.g. Pacing, characters, a line worth keeping"
            autoComplete="off"
            aria-describedby={`${id}-notes-help`}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
            }}
          />
          <p id={`${id}-notes-help`} className="control-hint">
            Notes stay private to your account and can be edited at any time.
          </p>
        </div>
        <div className="book-review-actions">
          <button className="primary" type="submit" aria-busy={pending}>
            <SaveIcon />
            {pending ? "Saving…" : "Save review"}
          </button>
        </div>
      </fieldset>
      {error && <p>{error}</p>}
    </form>
  );
}
