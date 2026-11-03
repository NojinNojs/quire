import { useState } from "react";
import type { BookEdit } from "../../data/bookDetails";
import type { Book } from "../../data/types";
import { ManualForm } from "../catalog/ManualForm";
import { CoverImage } from "../covers/CoverImage";
import "../../styles/demo.css";
import "../../styles/book-detail.css";

export function BookDetail({
  book,
  current,
  save,
  remove,
  children,
}: {
  book: Book;
  current: number;
  save: (patch: BookEdit) => Promise<void>;
  remove: () => Promise<void>;
  children?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [edition, setEdition] = useState(book.edition ?? "");
  const [city, setCity] = useState(book.city ?? "");
  return (
    <main className="shell demo-book book-detail">
      <article className="book-detail-entry">
        <a className="settings-link" href="#/shelf">
          Back to collection
        </a>
        <h1>{book.title}</h1>
        <div className="demo-book-record">
          <CoverImage
            coverUrl={book.cover_url}
            coverPath={book.cover_path}
            title={book.title}
            author={book.author}
            ddc={book.ddc}
            className="demo-detail-cover"
          />
          <div>
            <p>{book.author ?? "Author unknown"}</p>
            <p>
              {[book.publisher, book.year, book.edition].filter(Boolean).join(" · ") ||
                "Edition details unknown"}
            </p>
            {book.city && <p>Publication city: {book.city}</p>}
            <p>
              {current}
              {book.pages ? ` / ${book.pages}` : ""} pages read
            </p>
            <p>
              Status:{" "}
              {
                {
                  want: "Want to read",
                  reading: "Reading",
                  finished: "Finished",
                  wishlist: "Wishlist",
                }[book.status]
              }
            </p>
            {book.isbn && <p>ISBN {book.isbn}</p>}
            {book.language && <p>Language: {book.language}</p>}
          </div>
        </div>
        {editing ? (
          <section aria-label="Edit book">
            <h2>Edit book</h2>
            <label className="book-extra-field">
              Edition
              <input value={edition} onChange={(event) => setEdition(event.target.value)} />
            </label>
            <label className="book-extra-field">
              Publication city
              <input value={city} onChange={(event) => setCity(event.target.value)} />
            </label>
            <ManualForm
              manualDraft={{ ...book, coverUrl: book.cover_url }}
              includeCoverUrl={false}
              saving={pending ? "saving" : null}
              setMessage={setError}
              save={async (candidate) => {
                setPending(true);
                setError("");
                try {
                  await save({
                    title: candidate.title,
                    author: candidate.author,
                    publisher: candidate.publisher,
                    year: candidate.year,
                    pages: candidate.pages,
                    isbn: candidate.isbn,
                    language: candidate.language,
                    edition: edition.trim() || null,
                    city: city.trim() || null,
                  });
                  setEditing(false);
                  return true;
                } catch (cause) {
                  setError(cause instanceof Error ? cause.message : "Could not save this book.");
                  return false;
                } finally {
                  setPending(false);
                }
              }}
            />
            <button
              type="button"
              className="demo-button"
              disabled={pending}
              onClick={() => {
                setEditing(false);
                setEdition(book.edition ?? "");
                setCity(book.city ?? "");
                setError("");
              }}
            >
              Cancel edit
            </button>
          </section>
        ) : (
          <div className="demo-book-actions">
            <button
              type="button"
              className="primary"
              onClick={() => {
                setEditing(true);
                setConfirming(false);
                setError("");
              }}
            >
              Edit book
            </button>
            <button
              type="button"
              className="demo-button"
              onClick={() => {
                setConfirming(true);
                setError("");
              }}
            >
              Delete book
            </button>
          </div>
        )}
        {confirming && !editing && (
          <section aria-label="Confirm deletion" className="book-delete">
            <p>
              Delete “{book.title}” from your collection? Its reading logs will also be deleted.
            </p>
            <button
              type="button"
              className="primary"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setError("");
                try {
                  await remove();
                } catch (cause) {
                  setError(cause instanceof Error ? cause.message : "Could not delete this book.");
                  setPending(false);
                }
              }}
            >
              {pending ? "Deleting" : "Confirm delete"}
            </button>
            <button
              type="button"
              className="demo-button"
              disabled={pending}
              onClick={() => {
                setConfirming(false);
                setError("");
              }}
            >
              Cancel delete
            </button>
          </section>
        )}
        {error && <p role="alert">{error}</p>}
        {!editing && !confirming && children}
      </article>
    </main>
  );
}
