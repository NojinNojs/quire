import { type CSSProperties, useId, useState } from "react";
import { Select } from "../../components/select/Select";
import type { Book } from "../../data/types";
import { classify, groupByClass } from "../../lib/ddc";
import { CoverImage } from "../covers/CoverImage";
import { Bookmark } from "../reading/Bookmark";
import { ErrorPanel } from "../states/ErrorPanel";
import { useShelfProgress } from "./useShelfProgress";
import "../../styles/shelf.css";

export type ShelfScreenProps = {
  books: Book[];
  currentPages?: Record<string, number>;
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
  currentPages,
  loading = false,
  error,
  onRetry,
  onAddBook,
  onSelectBook,
}: ShelfScreenProps) {
  const id = useId();
  const loadedPages = useShelfProgress(books.map((book) => book.id));
  const pages = currentPages ?? loadedPages;
  const [view, setView] = useState<"grid" | "list">(() => {
    try {
      return window.localStorage.getItem("quire:shelf-view") === "list" ? "list" : "grid";
    } catch {
      return "grid";
    }
  });
  function changeView(next: "grid" | "list") {
    setView(next);
    try {
      window.localStorage.setItem("quire:shelf-view", next);
    } catch {
      /* Keep the choice for this visit when storage is unavailable. */
    }
  }
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
    <section className={`shelf shelf-${view}`} aria-labelledby={`${id}-heading`}>
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
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "All statuses" },
            ...Object.entries(statuses).map(([value, label]) => ({ value, label })),
          ]}
        />
        <Select
          label="Language"
          value={language}
          onChange={setLanguage}
          options={[
            { value: "", label: "All languages" },
            ...languages.map((value) => ({ value, label: value })),
            ...(books.some((book) => !book.language)
              ? [{ value: "unknown", label: "Unknown" }]
              : []),
          ]}
        />
      </search>
      <div className="shelf-summary">
        <span role="status" aria-live="polite">
          <span>
            {loading
              ? "Loading books"
              : `${filtered.length} ${filtered.length === 1 ? "book" : "books"}`}
          </span>
        </span>
        <fieldset className="shelf-view" aria-label="Shelf view">
          <button
            type="button"
            className="shelf-action"
            aria-pressed={view === "grid"}
            onClick={() => changeView("grid")}
          >
            Grid
          </button>
          <button
            type="button"
            className="shelf-action"
            aria-pressed={view === "list"}
            onClick={() => changeView("list")}
          >
            List
          </button>
        </fieldset>
      </div>
      <p className="shelf-filter-count">
        {activeCount} active {activeCount === 1 ? "filter" : "filters"}
      </p>
      {loading ? (
        <div className="shelf-state shelf-loading">
          <div role="status" aria-label="Loading your shelf" aria-busy="true">
            <ul className="catalog-results skeleton-rows" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <li className="catalog-row" key={row}>
                  <div className="catalog-cover" />
                  <div className="catalog-copy">
                    <div className="skeleton-title" />
                    <div className="skeleton-line" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : error ? (
        <div className="shelf-state shelf-error">
          {onRetry ? (
            <ErrorPanel messages={[error]} retry={onRetry} />
          ) : (
            <p role="alert">{error}</p>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="shelf-state shelf-empty">
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
          const classification = classify(members[0]?.ddc);
          const token = classification?.token ?? "--class-000";
          return (
            <section
              className="shelf-group"
              key={label}
              aria-labelledby={`${id}-group-${index}`}
              style={
                {
                  "--book-class": `var(--shelf${token.slice(1)}, var(--shelf-class-000))`,
                } as CSSProperties
              }
            >
              <h2 className="shelf-band" id={`${id}-group-${index}`}>
                {classification ? (
                  <>
                    <span className="shelf-class-number">{classification.code}</span>{" "}
                    <span className="shelf-class-name">{classification.label}</span>
                  </>
                ) : (
                  <span className="shelf-class-name">{label}</span>
                )}
              </h2>
              <ul className="shelf-books">
                {members.map((book) => (
                  <li className="shelf-row" key={book.id}>
                    <div className="shelf-jacket">
                      <button
                        className="shelf-jacket-button"
                        type="button"
                        aria-label={`Open ${book.title}`}
                        onClick={() => onSelectBook(book)}
                      >
                        <CoverImage
                          coverPath={book.cover_path}
                          coverUrl={book.cover_url}
                          title={book.title}
                          author={book.author}
                          ddc={book.ddc}
                          className="shelf-cover"
                        />
                      </button>
                      {pages[book.id] !== undefined && (
                        <Bookmark current={pages[book.id] ?? 0} total={book.pages} />
                      )}
                    </div>
                    <span className="shelf-line" aria-hidden="true" />
                    <div className="shelf-copy">
                      <h3>
                        <button type="button" onClick={() => onSelectBook(book)}>
                          {book.title}
                        </button>
                      </h3>
                      <p className="shelf-author">{book.author ?? "Author unknown"}</p>
                      <div className="shelf-metadata">
                        <p className="shelf-publisher">{book.publisher ?? "Publisher unknown"}</p>
                        <p className="shelf-year">{book.year ?? "Year unknown"}</p>
                        <p className="shelf-pages">
                          {book.pages === null ? "Pages unknown" : `${book.pages} pages`}
                        </p>
                        <p className="shelf-status">{statuses[book.status]}</p>
                      </div>
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
