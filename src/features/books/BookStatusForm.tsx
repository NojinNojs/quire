import { useState } from "react";
import type { Book } from "../../data/types";

export function BookStatusForm({
  book,
  pending,
  save,
}: {
  book: Book;
  pending: boolean;
  save: (status: Book["status"]) => Promise<Book>;
}) {
  const [status, setStatus] = useState(book.status);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState<Book["status"] | null>(null);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);
  async function change(next: Book["status"], confirmed = false) {
    if (next === book.status) return;
    if (book.finished_at && next !== "finished" && !confirmed) {
      setConfirming(next);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await save(next);
      setStatus(updated.status);
      setFinished(updated.status === "finished");
      setConfirming(null);
    } catch (cause) {
      setStatus(book.status);
      setError(
        cause instanceof Error ? cause.message : "Could not update reading status. Try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section aria-label="Book lifecycle">
      <div className="demo-book-actions">
        {book.status === "reading" && (
          <a className="primary" href="#/today">
            Continue reading
          </a>
        )}
        {book.status === "reading" && (
          <button
            type="button"
            className="demo-button"
            disabled={pending || saving}
            onClick={() => void change("finished")}
          >
            Mark as finished
          </button>
        )}
        <label className="demo-field">
          <span>Reading status</span>
          <select
            value={status}
            disabled={pending || saving || confirming !== null}
            onChange={(event) => {
              const next = event.target.value as Book["status"];
              setStatus(next);
              void change(next);
            }}
          >
            <option value="want">Want to read</option>
            <option value="reading">Reading</option>
            <option value="finished">Finished</option>
            <option value="wishlist">Wishlist</option>
          </select>
        </label>
      </div>
      {pending && (
        <p>
          Sync or undo pending pages on <a href="#/today">Today</a> before changing status.
        </p>
      )}
      {confirming && (
        <fieldset aria-label="Confirm status change">
          <p>
            Changing status removes the finish date and this book from its previous finished-year
            count. Page logs stay.
          </p>
          <button
            type="button"
            disabled={pending || saving}
            onClick={() => void change(confirming, true)}
          >
            Change status
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setConfirming(null);
              setStatus(book.status);
            }}
          >
            Cancel
          </button>
        </fieldset>
      )}
      {error && <p role="alert">{error}</p>}
      {finished && (
        <p role="status">
          Book marked as finished. <a href="#/shelf">Choose next book</a> or{" "}
          <a href="#/today">Back to Today</a>.
        </p>
      )}
    </section>
  );
}
