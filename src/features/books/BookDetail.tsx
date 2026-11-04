import { useState } from "react";
import { ArrowLeftIcon, CloseIcon, EditIcon, TrashIcon } from "../../components/icons";
import { useToast } from "../../components/toast";
import type { BookEdit } from "../../data/bookDetails";
import type { Book } from "../../data/types";
import { ManualForm } from "../catalog/ManualForm";
import { CoverImage } from "../covers/CoverImage";
import { BookDeletePrompt } from "./BookDeletePrompt";
import { BookFacts } from "./BookFacts";
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
  const [error, setError] = useState<{ message: string; live: boolean } | null>(null);
  const [edition, setEdition] = useState(book.edition ?? "");
  const [city, setCity] = useState(book.city ?? "");
  const toast = useToast();
  return (
    <main className="shell demo-book book-detail">
      <article className="book-detail-entry">
        <a className="settings-link" href="#/shelf">
          <ArrowLeftIcon />
          Back to collection
        </a>
        <header className="book-detail-head">
          <h1>{book.title}</h1>
          <p className="book-detail-author">{book.author ?? "Author unknown"}</p>
        </header>
        <div className="book-detail-record">
          <div className="book-detail-cover">
            <CoverImage
              coverUrl={book.cover_url}
              coverPath={book.cover_path}
              title={book.title}
              author={book.author}
              ddc={book.ddc}
              className="demo-detail-cover"
            />
          </div>
          <BookFacts book={book} current={current} />
        </div>
        {!editing && !confirming && children ? (
          <div className="book-detail-reading">{children}</div>
        ) : null}
        {editing ? (
          <section className="book-detail-section" aria-labelledby="book-edit-title">
            <h2 id="book-edit-title">Edit book</h2>
            <div className="book-extra-fields">
              <label className="book-extra-field">
                Edition
                <input
                  className="control-input"
                  placeholder="e.g. First edition"
                  autoComplete="off"
                  value={edition}
                  onChange={(event) => setEdition(event.target.value)}
                />
              </label>
              <label className="book-extra-field">
                Publication city
                <input
                  className="control-input"
                  placeholder="e.g. London"
                  autoComplete="off"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                />
              </label>
            </div>
            <ManualForm
              manualDraft={{ ...book, coverUrl: book.cover_url }}
              includeCoverUrl={false}
              saving={pending ? "saving" : null}
              setMessage={(message) => setError(message ? { message, live: true } : null)}
              save={async (candidate) => {
                setPending(true);
                setError(null);
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
                  toast.success("Book details saved.");
                  setEditing(false);
                  return true;
                } catch (cause) {
                  const message =
                    cause instanceof Error ? cause.message : "Could not save this book.";
                  setError({ message, live: false });
                  toast.error(message);
                  return false;
                } finally {
                  setPending(false);
                }
              }}
            />
            <button
              type="button"
              className="secondary book-detail-cancel"
              disabled={pending}
              onClick={() => {
                setEditing(false);
                setEdition(book.edition ?? "");
                setCity(book.city ?? "");
                setError(null);
              }}
            >
              <CloseIcon />
              Cancel edit
            </button>
          </section>
        ) : (
          <div className="demo-book-actions book-detail-actions">
            <button
              type="button"
              className="secondary book-detail-edit"
              onClick={() => {
                setEditing(true);
                setConfirming(false);
                setError(null);
              }}
            >
              <EditIcon />
              Edit book
            </button>
            <button
              type="button"
              className="quiet book-detail-delete"
              onClick={() => {
                setConfirming(true);
                setError(null);
              }}
            >
              <TrashIcon />
              Delete book
            </button>
          </div>
        )}
        {confirming && !editing && (
          <BookDeletePrompt
            book={book}
            pending={pending}
            onCancel={() => {
              setConfirming(false);
              setError(null);
            }}
            onConfirm={async () => {
              setPending(true);
              setError(null);
              try {
                await remove();
                toast.success("Book removed from your collection.");
              } catch (cause) {
                const message =
                  cause instanceof Error ? cause.message : "Could not delete this book.";
                setError({ message, live: false });
                toast.error(message);
                setPending(false);
              }
            }}
          />
        )}
        {error && <p role={error.live ? "alert" : undefined}>{error.message}</p>}
      </article>
    </main>
  );
}
