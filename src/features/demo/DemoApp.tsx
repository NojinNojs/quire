import { useEffect, useState } from "react";
import type { Book } from "../../data/types";
import type { Candidate } from "../../lib/catalog";
import { readingDay } from "../integration/useReading";
import { AppShell } from "../nav/AppShell";
import { parseRoute } from "../nav/routes";
import { TodayScreen } from "../reading/TodayScreen";
import { SettingsScreen } from "../settings/SettingsScreen";
import { ShelfScreen } from "../shelf/ShelfScreen";
import { DemoBook } from "./DemoBook";
import { DemoSearch } from "./DemoSearch";
import {
  candidateBook,
  createDemoState,
  currentPages,
  demoKey,
  demoStreak,
  loadDemoState,
} from "./state";
import "../../styles/demo.css";

function leaveDemo() {
  const url = new URL(window.location.href);
  url.searchParams.delete("demo");
  url.hash = "/search";
  window.location.assign(url);
}

export function DemoApp() {
  const [hash, setHash] = useState(window.location.hash);
  const [state, setState] = useState(() => {
    try {
      return loadDemoState(window.localStorage);
    } catch {
      return createDemoState();
    }
  });
  const [storageFailed, setStorageFailed] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState("");
  const [generation, setGeneration] = useState(0);
  const [day, setDay] = useState(readingDay);

  useEffect(() => {
    void hash;
    window.scrollTo(0, 0);
  }, [hash]);

  useEffect(() => {
    const navigate = () => {
      setHash(window.location.hash);
      setResetting(false);
    };
    const refreshDay = () => setDay(readingDay());
    window.addEventListener("hashchange", navigate);
    window.addEventListener("focus", refreshDay);
    const timer = window.setInterval(refreshDay, 60_000);
    return () => {
      window.removeEventListener("hashchange", navigate);
      window.removeEventListener("focus", refreshDay);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(demoKey, JSON.stringify(state));
      setStorageFailed(false);
    } catch {
      setStorageFailed(true);
    }
  }, [state]);

  useEffect(() => {
    if (!state.pending) return;
    const timer = window.setTimeout(
      () => setState((value) => ({ ...value, pending: null })),
      Math.max(0, state.pending.until - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [state.pending]);

  const detailId = hash.startsWith("#/book/") ? hash.slice("#/book/".length) : null;
  const detail = state.books.find((book) => book.id === detailId);
  const route = detailId ? "shelf" : parseRoute(hash);
  const active = state.books.find((book) => book.status === "reading");
  const pages = Object.fromEntries(
    state.books.map((book) => [book.id, currentPages(state, book.id)]),
  );
  const pending = state.logs.find((log) => log.id === state.pending?.id);
  const pagesToday = state.logs
    .filter((log) => log.bookId === active?.id && log.day === day)
    .reduce((sum, log) => sum + log.pages, 0);

  function reset() {
    setState(createDemoState());
    setGeneration((value) => value + 1);
    setResetting(false);
    setNotice("Demo reset. The sample library is ready.");
    window.location.hash = "/today";
  }

  async function addBook(candidate: Candidate) {
    if (
      state.books.some((book) =>
        candidate.isbn
          ? book.isbn === candidate.isbn
          : book.title.toLocaleLowerCase() === candidate.title.toLocaleLowerCase() &&
            (book.author ?? "").toLocaleLowerCase() ===
              (candidate.author ?? "").toLocaleLowerCase(),
      )
    )
      return false;
    const book = candidateBook(candidate);
    setState((value) => ({ ...value, books: [...value.books, book] }));
    return true;
  }

  function read(book: Book) {
    setState((value) => ({
      ...value,
      pending: null,
      books: value.books.map((entry) => ({
        ...entry,
        status:
          entry.id === book.id ? "reading" : entry.status === "reading" ? "want" : entry.status,
      })),
    }));
    window.location.hash = "/today";
  }

  function log(amount: number) {
    if (!active) return;
    const entry = { id: crypto.randomUUID(), bookId: active.id, day, pages: amount };
    setState((value) => {
      const current = currentPages(value, active.id);
      if (
        value.pending ||
        !Number.isInteger(amount) ||
        amount < 1 ||
        (active.pages !== null && current + amount > active.pages)
      )
        return value;
      return {
        ...value,
        logs: [...value.logs, entry],
        pending: { id: entry.id, until: Date.now() + 5000 },
      };
    });
  }

  return (
    <AppShell route={route} guideScope="demo">
      <aside className="demo-banner" aria-label="Demo mode">
        <div>
          <strong>Interactive demo</strong>
          <p>
            Sample library.{" "}
            {storageFailed ? "Changes last for this visit only." : "Changes stay on this device."}
          </p>
        </div>
        <div className="demo-banner-actions">
          <button className="demo-link" type="button" onClick={() => setResetting(true)}>
            Reset demo
          </button>
          <button className="demo-link" type="button" onClick={leaveDemo}>
            Leave demo
          </button>
        </div>
        {resetting && (
          <fieldset className="demo-reset" aria-label="Confirm reset">
            <p>Replace your demo changes with the sample library?</p>
            <button className="demo-button" type="button" onClick={reset}>
              Reset sample library
            </button>
            <button className="demo-link" type="button" onClick={() => setResetting(false)}>
              Keep changes
            </button>
          </fieldset>
        )}
        <p className="demo-notice" role="status">
          {notice}
        </p>
      </aside>
      <div key={generation}>
        {detailId ? (
          detail ? (
            <DemoBook
              key={detail.id}
              book={detail}
              current={pages[detail.id] ?? 0}
              read={() => read(detail)}
              update={(patch) =>
                setState((value) => ({
                  ...value,
                  pending: patch.status === "finished" ? null : value.pending,
                  books: value.books.map((book) =>
                    book.id === detail.id ? { ...book, ...patch } : book,
                  ),
                }))
              }
            />
          ) : (
            <main className="shell">
              <h1>Book not found</h1>
              <p>This book is no longer in the demo library.</p>
              <a className="settings-link" href="#/shelf">
                Back to shelf
              </a>
            </main>
          )
        ) : route === "settings" ? (
          <SettingsScreen signOut={leaveDemo} demo />
        ) : route === "search" ? (
          <DemoSearch books={state.books} addBook={addBook} />
        ) : route === "shelf" ? (
          <main className="integration-screen">
            <ShelfScreen
              books={state.books}
              currentPages={pages}
              onAddBook={() => {
                window.location.hash = "/search";
              }}
              onSelectBook={(book) => {
                window.location.hash = `/book/${book.id}`;
              }}
            />
          </main>
        ) : (
          <main className="integration-screen">
            <TodayScreen
              book={
                active
                  ? {
                      id: active.id,
                      title: active.title,
                      author: active.author,
                      editionLine:
                        [active.publisher, active.year].filter(Boolean).join(" · ") ||
                        "Edition details unknown",
                      coverUrl: active.cover_url,
                      total: active.pages,
                      ddc: active.ddc,
                    }
                  : null
              }
              streak={demoStreak(state, day)}
              pageLog={{
                current: active ? (pages[active.id] ?? 0) : 0,
                pagesToday,
                status: pending ? "undo" : pagesToday > 0 ? "saved" : "idle",
                pending: pending ?? null,
                result: null,
                error: null,
                log,
                undo: () =>
                  setState((value) => ({
                    ...value,
                    logs: value.logs.filter((entry) => entry.id !== value.pending?.id),
                    pending: null,
                  })),
                retry: () => undefined,
              }}
              onCatalogue={() => {
                window.location.hash = "/shelf";
              }}
            />
            {active && (
              <div className="demo-reading-actions">
                <a className="settings-link" href={`#/book/${active.id}`}>
                  View book details
                </a>
                <a className="settings-link" href="#/shelf">
                  Choose another book
                </a>
              </div>
            )}
          </main>
        )}
      </div>
    </AppShell>
  );
}
