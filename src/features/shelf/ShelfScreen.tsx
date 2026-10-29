import { useId, useState } from "react";
import type { Book } from "../../data/types";
import { classify, groupByClass } from "../../lib/ddc";
import { CoverImage } from "../covers/CoverImage";
import { ErrorPanel } from "../states/ErrorPanel";
import { SkeletonRows } from "../states/SkeletonRows";
import "../../styles/shelf.css";

export type ShelfScreenProps = {
  books: Book[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onAddBook: () => void;
  onSelectBook: (book: Book) => void;
};

const statuses: Record<Book["status"], string> = {
  want: "Want to read",
  reading: "Reading",
  finished: "Finished",
  wishlist: "Wishlist",
};

export function ShelfScreen({
  books,
  loading = false,
  error,
  onRetry,
  onAddBook,
  onSelectBook,
}: ShelfScreenProps) {
  const id = useId();
  const [status, setStatus] = useState("");
  const [language, setLanguage] = useState("");
  const [query, setQuery] = useState("");
  const search = query.trim().toLocaleLowerCase();
  const activeCount = Number(Boolean(status)) + Number(Boolean(language)) + Number(Boolean(search));
  const languages = [
    ...new Set(
      books.map((book) => book.language).filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b));
  const filtered = books.filter(
    (book) =>
      (!status || book.status === status) &&
      (!language || (language === "unknown" ? !book.language : book.language === language)) &&
      (!search ||
        [book.title, book.author, book.publisher, book.isbn, book.year]
          .filter((value) => value !== null)
          .join(" ")
          .toLocaleLowerCase()
          .includes(search)),
  );
  const groups = groupByClass(filtered);

  function clearFilters() {
    setStatus("");
    setLanguage("");
    setQuery("");
  }

  return (
    <section className="shelf" aria-labelledby={`${id}-heading`}>
      <header className="shelf-heading">
        <h1 id={`${id}-heading`}>Shelf</h1>
        <button className="shelf-action" type="button" onClick={onAddBook}>
          Add book
        </button>
      </header>
      <search className="shelf-filters" aria-label="Filter shelf">
        <label className="shelf-search">
          <span>Search books</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(statuses).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Language</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="">All languages</option>
            {languages.map((value) => (
              <option value={value} key={value}>
                {value || "Unknown"}
              </option>
            ))}
            {books.some((book) => !book.language) ? <option value="unknown">Unknown</option> : null}
          </select>
        </label>
      </search>
      <p className="shelf-summary" role="status" aria-live="polite">
        <span>
          {loading
            ? "Loading books"
            : `${filtered.length} ${filtered.length === 1 ? "book" : "books"}`}
        </span>
        <span>
          {activeCount} active {activeCount === 1 ? "filter" : "filters"}
        </span>
      </p>
      {loading ? (
        <SkeletonRows label="Loading your shelf" />
      ) : error ? (
        onRetry ? (
          <ErrorPanel messages={[error]} retry={onRetry} />
        ) : (
          <p role="alert">{error}</p>
        )
      ) : filtered.length === 0 ? (
        <div className="shelf-empty">
          <p>
            {books.length
              ? "No books match these filters."
              : "Your shelf is waiting for its first book."}
          </p>
          <button
            className="shelf-action"
            type="button"
            onClick={books.length ? clearFilters : onAddBook}
          >
            {books.length ? "Clear filters" : "Add a book"}
          </button>
        </div>
      ) : (
        [...groups].map(([label, members], index) => {
          const token = classify(members[0]?.ddc)?.token ?? "--class-000";
          return (
            <section className="shelf-group" key={label} aria-labelledby={`${id}-group-${index}`}>
              <h2
                className="shelf-band"
                id={`${id}-group-${index}`}
                style={{ backgroundColor: `var(${token}, var(--class-000))` }}
              >
                {label}
              </h2>
              <ul className="shelf-books">
                {members.map((book) => (
                  <li className="shelf-row" key={book.id}>
                    <CoverImage
                      coverPath={book.cover_path}
                      coverUrl={book.cover_url}
                      title={book.title}
                      className="shelf-cover"
                    />
                    <div className="shelf-copy">
                      <h3>
                        <button type="button" onClick={() => onSelectBook(book)}>
                          {book.title}
                        </button>
                      </h3>
                      <p>{book.publisher ?? "Publisher unknown"}</p>
                      <p className="shelf-metadata">
                        {book.year ?? "Year unknown"} ·{" "}
                        {book.pages === null ? "Pages unknown" : `${book.pages} pages`}
                      </p>
                      <p className="shelf-status">{statuses[book.status]}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </section>
  );
}
