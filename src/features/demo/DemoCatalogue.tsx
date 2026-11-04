import type { Book } from "../../data/types";
import type { Candidate } from "../../lib/catalog";
import { CoverImage } from "../covers/CoverImage";
import { sampleCatalogue } from "./samples";

export function DemoCatalogue({
  books,
  matches,
  query,
  save,
  onManual,
}: {
  books: Book[];
  matches: Book[];
  query: string;
  save: (candidate: Candidate) => Promise<boolean>;
  onManual: () => void;
}) {
  const term = query.trim();
  return (
    <>
      <p className="demo-help">
        {sampleCatalogue.length} sample editions are built in. The demo never contacts an external
        book service.
      </p>
      <div className="demo-results-head">
        <h2>Sample editions</h2>
        <p role="status">
          {matches.length} {matches.length === 1 ? "match" : "matches"}
        </p>
      </div>
      <ul className="catalog-results">
        {matches.map((book) => {
          const added = books.some(
            (entry) => entry.title === book.title && entry.author === book.author,
          );
          return (
            <li className="catalog-row" key={book.id}>
              <CoverImage
                coverUrl={book.cover_url}
                title={book.title}
                author={book.author}
                ddc={book.ddc}
                className="demo-search-cover"
              />
              <div className="catalog-copy">
                <h2>{book.title}</h2>
                <p>{book.author}</p>
                <p className="catalog-numbers">
                  {book.pages ? `${book.pages} pages` : "Pages unknown"} · {book.language}
                </p>
                <button
                  className="quiet"
                  type="button"
                  disabled={added}
                  onClick={() =>
                    void save({
                      title: book.title,
                      author: book.author,
                      publisher: book.publisher,
                      year: book.year,
                      pages: book.pages,
                      isbn: book.isbn,
                      language: book.language,
                      coverUrl: book.cover_url,
                      source: "Manual",
                    })
                  }
                >
                  {added ? "On your shelf" : "Add to shelf"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {matches.length === 0 && (
        <div className="empty-state">
          <p>{term ? `No sample edition matches “${term}”.` : "No sample editions to show."}</p>
          <p className="muted">
            The demo catalogue has {sampleCatalogue.length} titles. Nothing was fetched from a book
            service.
          </p>
          <button type="button" className="quiet" onClick={onManual}>
            Enter this book manually
          </button>
        </div>
      )}
    </>
  );
}
