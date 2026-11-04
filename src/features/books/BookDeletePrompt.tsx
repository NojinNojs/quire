import { CloseIcon, TrashIcon } from "../../components/icons";
import type { Book } from "../../data/types";

/** The destructive confirmation block. State and handlers stay with BookDetail. */
export function BookDeletePrompt({
  book,
  pending,
  onConfirm,
  onCancel,
}: {
  book: Book;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="book-delete" aria-labelledby="book-delete-title">
      <h2 id="book-delete-title">Delete this book</h2>
      <p>Delete “{book.title}” from your collection? Its reading logs will also be deleted.</p>
      <div className="book-delete-actions">
        <button
          type="button"
          className="danger"
          aria-busy={pending}
          disabled={pending}
          onClick={onConfirm}
        >
          <TrashIcon />
          {pending ? "Deleting" : "Confirm delete"}
        </button>
        <button type="button" className="secondary" disabled={pending} onClick={onCancel}>
          <CloseIcon />
          Cancel delete
        </button>
      </div>
    </section>
  );
}
