import { useState } from "react";
import { CheckIcon } from "../../components/icons";
import { useToast } from "../../components/toast";
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
  const toast = useToast();
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
      toast.success(
        updated.status === "finished" ? "Book marked as finished." : "Reading status updated.",
      );
    } catch (cause) {
      setStatus(book.status);
      const message =
        cause instanceof Error ? cause.message : "Could not update reading status. Try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="book-detail-section" aria-labelledby="book-status-title">
      <h2 id="book-status-title">Reading status</h2>
      <div className="book-status-actions">
        {book.status === "reading" && (
          <a className="primary" href="#/today">
            Continue reading
          </a>
        )}
        {book.status === "reading" && (
          <button
            type="button"
            className="secondary"
            aria-busy={saving}
            disabled={pending || saving}
            onClick={() => void change("finished")}
          >
            <CheckIcon />
            Mark as finished
          </button>
        )}
      </div>
      <label className="field book-status-field">
        <span className="label">Reading status</span>
        <select
          className="control-select"
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
      {pending && (
        <p className="book-status-note">
          Sync or undo pending pages on <a href="#/today">Today</a> before changing status.
        </p>
      )}
      {confirming && (
        <fieldset className="book-status-confirm" aria-label="Confirm status change">
          <p>
            Changing status removes the finish date and this book from its previous finished-year
            count. Page logs stay.
          </p>
          <div className="book-status-confirm-actions">
            <button
              type="button"
              className="danger"
              aria-busy={saving}
              disabled={pending || saving}
              onClick={() => void change(confirming, true)}
            >
              Change status
            </button>
            <button
              type="button"
              className="secondary"
              disabled={saving}
              onClick={() => {
                setConfirming(null);
                setStatus(book.status);
              }}
            >
              Cancel
            </button>
          </div>
        </fieldset>
      )}
      {error && <p>{error}</p>}
      {finished && (
        <p role="status" className="book-status-finished">
          Book marked as finished. <a href="#/shelf">Choose next book</a> or{" "}
          <a href="#/today">Back to Today</a>.
        </p>
      )}
    </section>
  );
}
