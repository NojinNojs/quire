import { useEffect, useState } from "react";
import type { Candidate } from "../../lib/catalog";
import { readingDay } from "../integration/useReading";
import { AppShell } from "../nav/AppShell";
import { parseRoute } from "../nav/routes";
import { ScanSheet } from "../scan/ScanSheet";
import { useScanRequest } from "../scan/useScanRequest";
import { DemoSettings } from "../settings/DemoSettings";
import { ShelfScreen } from "../shelf/ShelfScreen";
import { DemoBanner } from "./DemoBanner";
import { DemoBook } from "./DemoBook";
import { DemoInsights } from "./DemoInsights";
import { DemoSearch } from "./DemoSearch";
import { DemoToday } from "./DemoToday";
import { candidateBook } from "./samples";
import { createDemoState, currentPages } from "./state";
import { useDemoState } from "./useDemoState";
import "../../styles/demo.css";

function leaveDemo() {
  const url = new URL(window.location.href);
  url.searchParams.delete("demo");
  url.hash = "";
  window.location.assign(url);
}

export function DemoApp() {
  const [hash, setHash] = useState(window.location.hash);
  const { state, setState, persist, storageFailed, saveProfile, updateBook } = useDemoState();
  const scan = useScanRequest();
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

  const parsedRoute = parseRoute(hash);
  const detailId = typeof parsedRoute === "object" ? parsedRoute.id : null;
  const detail = state.books.find((book) => book.id === detailId);
  const route = detailId ? "shelf" : parsedRoute;
  const active = state.books.find((book) => book.status === "reading");
  const pages = Object.fromEntries(
    state.books.map((book) => [book.id, currentPages(state, book.id)]),
  );
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
    await persist((value) => ({ ...value, books: [...value.books, book] }));
    return true;
  }
  return (
    <>
      <AppShell route={route} guideScope="demo" onScan={scan.open}>
        <DemoBanner
          storageFailed={storageFailed}
          resetting={resetting}
          setResetting={setResetting}
          reset={reset}
          leave={leaveDemo}
          notice={notice}
        />
        <div key={generation}>
          {detailId ? (
            detail ? (
              <DemoBook
                key={detail.id}
                book={detail}
                current={pages[detail.id] ?? 0}
                pending={
                  state.logs.find((log) => log.id === state.pending?.id)?.bookId === detail.id
                }
                activeBookId={active?.id ?? null}
                remove={async () => {
                  await persist((value) => {
                    const logs = value.logs.filter((entry) => entry.bookId !== detail.id);
                    return {
                      ...value,
                      books: value.books.filter((entry) => entry.id !== detail.id),
                      logs,
                      pending: logs.some((entry) => entry.id === value.pending?.id)
                        ? value.pending
                        : null,
                    };
                  });
                  window.location.hash = "/shelf";
                }}
                update={(patch) => updateBook(detail.id, patch)}
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
            <DemoSettings
              profile={state.profile}
              saveProfile={saveProfile}
              storageFailed={storageFailed}
              leaveDemo={leaveDemo}
            />
          ) : route === "search" ? (
            <DemoSearch
              books={state.books}
              addBook={addBook}
              onScan={scan.open}
              scanRequest={scan.request}
              onScanHandled={scan.consume}
            />
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
          ) : route === "journal" || route === "stats" ? (
            <DemoInsights key={route} route={route} state={state} day={day} />
          ) : (
            <DemoToday
              active={active}
              state={state}
              setState={setState}
              day={day}
              pages={pages}
              pagesToday={pagesToday}
            />
          )}
        </div>
      </AppShell>
      {scan.scanning && (
        <ScanSheet
          onClose={scan.close}
          onDetected={(isbn) => {
            scan.issue(isbn);
            window.location.hash = "/search";
          }}
        />
      )}
    </>
  );
}
