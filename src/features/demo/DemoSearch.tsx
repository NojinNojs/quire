import { useEffect, useRef, useState } from "react";
import { ScanIcon } from "../../components/icons";
import { useToast } from "../../components/toast";
import type { Book } from "../../data/types";
import type { Candidate } from "../../lib/catalog";
import { isbnTo13 } from "../../lib/isbn";
import { ManualForm } from "../catalog/ManualForm";
import type { ScanRequest } from "../scan/useScanRequest";
import { DemoCatalogue } from "./DemoCatalogue";
import { sampleCatalogue } from "./samples";

export function DemoSearch({
  books,
  addBook,
  onScan,
  scanRequest,
  onScanHandled,
}: {
  books: Book[];
  addBook: (candidate: Candidate) => Promise<boolean>;
  onScan?: () => void;
  scanRequest?: ScanRequest | null;
  onScanHandled?: (nonce: number) => void;
}) {
  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [manualDraft, setManualDraft] = useState<Partial<Candidate>>({});
  const [message, setMessage] = useState("");
  const [addedToShelf, setAddedToShelf] = useState(false);
  const handledNonce = useRef(0);
  const toast = useToast();
  const matches = sampleCatalogue.filter((book) =>
    [book.title, book.author, book.isbn]
      .join(" ")
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    if (!scanRequest || scanRequest.nonce <= handledNonce.current) return;
    handledNonce.current = scanRequest.nonce;
    setTab("search");
    setQuery(scanRequest.isbn);
    const isbn = isbnTo13(scanRequest.isbn);
    setManualDraft(isbn ? { isbn } : {});
    setMessage("");
    setAddedToShelf(false);
    onScanHandled?.(scanRequest.nonce);
  }, [scanRequest, onScanHandled]);

  async function save(candidate: Candidate) {
    try {
      const added = await addBook(candidate);
      if (!added) {
        setMessage("This edition is already on your shelf.");
        return false;
      }
      setMessage("");
      setAddedToShelf(true);
      toast.success(`${candidate.title} added to your shelf.`);
      return true;
    } catch (error) {
      setMessage("");
      toast.error(error instanceof Error ? error.message : "Could not save on this device.");
      return false;
    }
  }

  function openManual() {
    const isbn = isbnTo13(query);
    setManualDraft(isbn ? { isbn } : {});
    setTab("manual");
    setMessage("");
  }

  return (
    <main className="shell catalog demo-search">
      <header className="catalog-head">
        <div className="catalog-heading">
          <h1>Add a book</h1>
          <p className="catalog-lead">
            Browse the sample catalogue or enter your own edition by hand.
          </p>
        </div>
        <div className="catalog-head-actions">
          <span className="book-count">Demo catalogue</span>
          {onScan && (
            <button className="secondary" type="button" onClick={onScan}>
              <ScanIcon />
              Scan ISBN
            </button>
          )}
        </div>
      </header>
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
          <ManualForm
            key={JSON.stringify(manualDraft)}
            manualDraft={manualDraft}
            save={save}
            saving={null}
            setMessage={setMessage}
            includeCoverUrl={false}
          />
        ) : (
          <>
            <div className="catalog-field">
              <label htmlFor="demo-search-query">
                <span className="label">Title, author or ISBN</span>
                <input
                  className="control-input"
                  id="demo-search-query"
                  type="search"
                  placeholder="Title, author or ISBN"
                  autoComplete="off"
                  spellCheck={false}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
            <DemoCatalogue
              books={books}
              matches={matches}
              query={query}
              save={save}
              onManual={openManual}
            />
          </>
        )}
      </div>
      <p className="demo-message" role="status">
        {message}
      </p>
      {addedToShelf && (
        <a className="settings-link" href="#/shelf">
          View shelf
        </a>
      )}
    </main>
  );
}
