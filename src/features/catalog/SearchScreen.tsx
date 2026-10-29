import type { User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { type Candidate, searchCatalog } from "../../lib/catalog";
import { editionKey } from "../../lib/edition";
import { isbnTo13 } from "../../lib/isbn";
import { supabase } from "../../lib/supabase";

type SavedEdition = {
  title: string;
  publisher: string | null;
  year: number | null;
  isbn: string | null;
};
const identity = (book: SavedEdition) =>
  editionKey({ ...book, isbn: book.isbn ? isbnTo13(book.isbn) : null });
const fields = [
  "title",
  "author",
  "publisher",
  "year",
  "pages",
  "isbn",
  "language",
  "coverUrl",
] as const;
const labels = {
  title: "Title",
  author: "Author",
  publisher: "Publisher",
  year: "Year",
  pages: "Pages",
  isbn: "ISBN",
  language: "Language",
  coverUrl: "Cover URL",
};

export function SearchScreen({ user }: { user: User }) {
  const [tab, setTab] = useState<"search" | "manual">("search");
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [count, setCount] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const saveLock = useRef(false);
  const request = useRef(0);
  const [manual, setManual] = useState<Record<(typeof fields)[number], string>>({
    title: "",
    author: "",
    publisher: "",
    year: "",
    pages: "",
    isbn: "",
    language: "",
    coverUrl: "",
  });

  useEffect(() => {
    let current = true;
    supabase
      ?.from("books")
      .select("id", { count: "exact", head: true })
      .eq("owner", user.id)
      .then(({ count, error }) => {
        if (!current) return;
        if (error) setMessage(error.message);
        else setCount(count ?? 0);
      });
    return () => {
      current = false;
    };
  }, [user.id]);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const current = ++request.current;
    setSearching(true);
    setErrors([]);
    setCandidates([]);
    const result = await searchCatalog(query, (url) =>
      fetch(url, { signal: AbortSignal.timeout(15000) }),
    );
    if (current !== request.current) return;
    setCandidates(result.candidates);
    setErrors(result.errors);
    setSearched(true);
    setSearching(false);
  }

  async function save(candidate: Candidate): Promise<boolean> {
    if (!supabase || saveLock.current) return false;
    saveLock.current = true;
    const key = identity(candidate);
    setSaving(key);
    setMessage("");
    try {
      // Compare canonical edition identities, then let the unique index report ISBN duplicates.
      const existing: SavedEdition[] = [];
      for (let offset = 0; ; offset += 1000) {
        const page = await supabase
          .from("books")
          .select("title,publisher,year,isbn")
          .eq("owner", user.id)
          .order("id")
          .range(offset, offset + 999);
        if (page.error) throw page.error;
        existing.push(...(page.data as SavedEdition[]));
        if (page.data.length < 1000) break;
      }
      const duplicate = existing.find((book) => identity(book) === key);
      if (duplicate && !candidate.isbn) {
        setMessage("This edition is already in your library.");
        return false;
      }
      const { error } = await supabase.from("books").insert({
        owner: user.id,
        title: candidate.title,
        author: candidate.author,
        publisher: candidate.publisher,
        year: candidate.year,
        pages: candidate.pages,
        isbn: duplicate?.isbn ?? candidate.isbn,
        language: candidate.language || "id",
        cover_url: candidate.coverUrl,
      });
      if (error) throw error;
      setSaved((previous) => new Set([...previous, key]));
      setCount((previous) => (previous === null ? null : previous + 1));
      const total = await supabase
        .from("books")
        .select("id", { count: "exact", head: true })
        .eq("owner", user.id);
      if (!total.error) setCount(total.count ?? 0);
      else setMessage(total.error.message);
      setMessage((previous) => previous || `${candidate.title} added to your library.`);
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error ||
          (typeof error === "object" && error !== null && "message" in error)
          ? String(error.message)
          : "Could not save the book. Try again.",
      );
      return false;
    } finally {
      saveLock.current = false;
      setSaving(null);
    }
  }

  async function saveManual(event: React.FormEvent) {
    event.preventDefault();
    const isbn = manual.isbn.trim() ? isbnTo13(manual.isbn) : null;
    if (manual.isbn.trim() && !isbn) {
      setMessage("Enter a valid ISBN-10 or ISBN-13, or leave ISBN blank.");
      return;
    }
    if (!manual.title.trim()) {
      setMessage("Enter a title.");
      return;
    }
    const optional = (value: string) => value.trim() || null;
    await save({
      title: manual.title.trim(),
      author: optional(manual.author),
      publisher: optional(manual.publisher),
      year: manual.year ? Number(manual.year) : null,
      pages: manual.pages ? Number(manual.pages) : null,
      isbn,
      language: optional(manual.language),
      coverUrl: optional(manual.coverUrl),
      source: "Manual",
    });
  }

  function selectTab(next: "search" | "manual") {
    setTab(next);
    setMessage("");
  }

  return (
    <main className="shell catalog">
      <header className="topbar">
        <span className="brand">Quire</span>
        <span className="book-count" role="status">
          {count === null ? "Loading books" : `${count} ${count === 1 ? "book" : "books"}`}
        </span>
        <button
          type="button"
          className="quiet"
          onClick={() => {
            void supabase?.auth.signOut();
          }}
        >
          Sign out
        </button>
      </header>
      <h1>Add a book</h1>
      <div className="entry-tabs" role="tablist" aria-label="Entry method">
        {(["search", "manual"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`${value}-tab`}
            aria-selected={tab === value}
            aria-controls={`${value}-panel`}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => selectTab(value)}
            onKeyDown={(event) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? "search"
                    : event.key === "End"
                      ? "manual"
                      : value === "search"
                        ? "manual"
                        : "search";
                selectTab(next);
                document.getElementById(`${next}-tab`)?.focus();
              }
            }}
          >
            {value === "search" ? "Search catalogue" : "Enter manually"}
          </button>
        ))}
      </div>
      <section
        id="search-panel"
        role="tabpanel"
        aria-labelledby="search-tab"
        hidden={tab !== "search"}
      >
        <form className="catalog-form" onSubmit={search}>
          <label>
            <span className="label">Title, author or ISBN</span>
            <input
              type="search"
              value={query}
              required
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button className="primary" type="submit" disabled={searching || !query.trim()}>
            {searching ? "Searching" : "Search"}
          </button>
        </form>
        <div aria-live="polite" aria-busy={searching}>
          {searching ? (
            <p className="empty-state muted">Searching Google Books and Open Library.</p>
          ) : null}
          {errors.map((error) => (
            <p className="catalog-message" key={error}>
              {error}
            </p>
          ))}
          {!searching && candidates.length === 0 ? (
            <div className="empty-state">
              <p>
                {searched
                  ? errors.length
                    ? "No catalogue results are available right now."
                    : "No catalogue matches for this search."
                  : "Search for the edition you own, or enter it manually."}
              </p>
              <button type="button" className="quiet" onClick={() => selectTab("manual")}>
                Enter manually
              </button>
            </div>
          ) : null}
          {candidates.length ? (
            <>
              <h2 className="results-heading">Catalogue candidates</h2>
              <p className="muted">Check the edition before saving.</p>
              <ul className="catalog-results">
                {candidates.map((candidate) => {
                  const key = identity(candidate);
                  const added = saved.has(key);
                  return (
                    <li className="catalog-row" key={JSON.stringify(candidate)}>
                      <div className="catalog-cover" aria-hidden="true">
                        {candidate.coverUrl ? (
                          <img
                            src={candidate.coverUrl}
                            alt=""
                            onError={(event) => {
                              event.currentTarget.hidden = true;
                            }}
                          />
                        ) : (
                          <span>No cover</span>
                        )}
                      </div>
                      <div className="catalog-copy">
                        <h3>{candidate.title}</h3>
                        {candidate.author ? <p>{candidate.author}</p> : null}
                        <p className="muted">{candidate.publisher ?? "Publisher unknown"}</p>
                        <p className="catalog-numbers">
                          {candidate.year ?? "Year unknown"} ·{" "}
                          {candidate.pages ? `${candidate.pages} pages` : "Pages unknown"}
                        </p>
                        <p className="catalog-source">
                          {candidate.source}
                          {candidate.language ? ` · ${candidate.language}` : ""}
                        </p>
                        <button
                          type="button"
                          className="quiet save-action"
                          disabled={added || saving !== null}
                          onClick={() => {
                            void save(candidate);
                          }}
                        >
                          {added ? "Added" : saving === key ? "Saving" : "Save"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>
      </section>
      <section
        id="manual-panel"
        role="tabpanel"
        aria-labelledby="manual-tab"
        hidden={tab !== "manual"}
      >
        <p className="muted manual-note">
          Only the title is required. Leave unknown details blank.
        </p>
        <form className="catalog-form" onSubmit={saveManual}>
          {fields.map((field) => (
            <label key={field}>
              <span className="label">
                {labels[field]}
                {field === "title" ? " (required)" : ""}
              </span>
              <input
                name={field}
                required={field === "title"}
                type={
                  field === "year" || field === "pages"
                    ? "number"
                    : field === "coverUrl"
                      ? "url"
                      : "text"
                }
                min={field === "year" ? 1000 : field === "pages" ? 1 : undefined}
                max={field === "year" ? 2100 : undefined}
                step={field === "year" || field === "pages" ? 1 : undefined}
                value={manual[field]}
                onChange={(event) => setManual({ ...manual, [field]: event.target.value })}
              />
            </label>
          ))}
          <button className="primary" type="submit" disabled={saving !== null}>
            {saving ? "Saving" : "Save book"}
          </button>
        </form>
      </section>
      <p className="catalog-message" role="status">
        {message}
      </p>
    </main>
  );
}
