import { useId, useState } from "react";
import { CloseIcon, PlusIcon } from "../../components/icons";
import { Select } from "../../components/select/Select";
import type { Book } from "../../data/types";
import { ErrorPanel } from "../states/ErrorPanel";
import { ShelfGroups, statuses } from "./ShelfGroups";
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

  function clearFilters() {
    setStatus("");
    setLanguage("");
    setQuery("");
  }

  return (
    <section className={`shelf shelf-${view}`} aria-labelledby={`${id}-heading`}>
      <header className="shelf-heading">
        <div>
          <h1 id={`${id}-heading`}>Collection</h1>
          <p>Every edition you own, filed by classification.</p>
        </div>
        <button className="primary" type="button" onClick={onAddBook}>
          <PlusIcon />
          Add book
        </button>
      </header>
      <search className="shelf-filters" aria-label="Filter shelf">
        <label className="shelf-search">
          <span className="label">Search books</span>
          <input
            className="control-input"
            type="search"
            placeholder="Title, author, ISBN"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
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
        <p className="shelf-summary-count" role="status" aria-live="polite">
          {loading
            ? "Loading books"
            : `${filtered.length} ${filtered.length === 1 ? "book" : "books"}`}
        </p>
        <fieldset className="shelf-view" aria-label="Shelf view">
          <button
            type="button"
            className="secondary"
            aria-pressed={view === "grid"}
            onClick={() => changeView("grid")}
          >
            Grid
          </button>
          <button
            type="button"
            className="secondary"
            aria-pressed={view === "list"}
            onClick={() => changeView("list")}
          >
            List
          </button>
        </fieldset>
      </div>
      {activeCount > 0 && (
        <p className="shelf-filter-count">
          <span>
            Showing {filtered.length} of {books.length} {books.length === 1 ? "book" : "books"}
          </span>
          <span>
            {activeCount} active {activeCount === 1 ? "filter" : "filters"}
          </span>
          <button className="quiet" type="button" onClick={clearFilters}>
            <CloseIcon />
            Clear filters
          </button>
        </p>
      )}
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
            className={books.length ? "secondary" : "primary"}
            type="button"
            onClick={books.length ? clearFilters : onAddBook}
          >
            {books.length ? "Reset filters" : "Add a book"}
          </button>
        </div>
      ) : (
        <ShelfGroups books={filtered} pages={pages} id={id} onSelectBook={onSelectBook} />
      )}
    </section>
  );
}
