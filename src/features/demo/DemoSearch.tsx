import { useState } from "react";
import type { Book } from "../../data/types";
import type { Candidate } from "../../lib/catalog";
import { ManualForm } from "../catalog/ManualForm";
import { CoverImage } from "../covers/CoverImage";
import { sampleCatalogue } from "./state";

export function DemoSearch({
  books,
  addBook,
}: {
  books: Book[];
  addBook: (candidate: Candidate) => Promise<boolean>;
}) {
  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const matches = sampleCatalogue.filter((book) =>
    [book.title, book.author, book.isbn]
      .join(" ")
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );

  async function save(candidate: Candidate) {
    const added = await addBook(candidate);
    setMessage(
      added ? `${candidate.title} added to your shelf.` : "This edition is already on your shelf.",
    );
    return added;
  }

  return (
    <main className="shell catalog demo-search">
      <h1>Search</h1>
      <p className="muted">Browse the sample catalogue or add your own book.</p>
      <div className="entry-tabs" role="tablist" aria-label="Book entry">
        {[
          ["search", "Sample catalogue"],
          ["manual", "Enter manually"],
        ].map(([value, label]) => (
          <button
            key={value}
            id={`demo-tab-${value}`}
            type="button"
            role="tab"
            aria-selected={tab === value}
            aria-controls="demo-entry-panel"
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? "search"
                  : event.key === "End"
                    ? "manual"
                    : tab === "search"
                      ? "manual"
                      : "search";
              setTab(next);
              document.getElementById(`demo-tab-${next}`)?.focus();
            }}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => {
              setTab(value ?? "search");
              setMessage("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div id="demo-entry-panel" role="tabpanel" aria-labelledby={`demo-tab-${tab}`}>
        {tab === "manual" ? (
          <ManualForm save={save} saving={null} setMessage={setMessage} includeCoverUrl={false} />
        ) : (
          <>
            <label className="catalog-form">
              <span>Title, author or ISBN</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <p className="demo-help">
              Sample edition details. Search works without a catalogue connection.
            </p>
            <p role="status">
              {matches.length} {matches.length === 1 ? "match" : "matches"}
            </p>
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
                <p>No sample books match your search.</p>
                <button type="button" className="quiet" onClick={() => setTab("manual")}>
                  Enter this book manually
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <p className="demo-message" role="status">
        {message}
      </p>
      {message.includes("added to your shelf") && (
        <a className="settings-link" href="#/shelf">
          View shelf
        </a>
      )}
    </main>
  );
}
