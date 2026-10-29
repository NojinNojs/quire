import { useState } from "react";
import { createRoot } from "react-dom/client";
import "../../../styles/fonts.css";
import "../../../styles/tokens.css";
import "../../../styles/themes.css";
import "../../../styles/app.css";
import "../../../styles/nav.css";
import { AppShell } from "../../nav/AppShell";
import { TodayScreen } from "../../reading/TodayScreen";
import { usePageLog } from "../../reading/usePageLog";
import { shelfBook } from "../fixtures";
import { ShelfScreen } from "../ShelfScreen";

const books = [
  ...[
    "The Waves",
    "A Room of One's Own",
    "Orlando",
    "Mrs Dalloway",
    "To the Lighthouse",
    "Night and Day",
  ].map((title, index) =>
    shelfBook({ id: `literature-${index}`, title, status: index === 0 ? "reading" : "want" }),
  ),
  shelfBook({
    id: "single",
    title: "Meditations",
    author: "Marcus Aurelius",
    publisher: "Modern Library",
    year: 2002,
    pages: 256,
    ddc: "188",
    language: "id",
    status: "finished",
  }),
];

function Preview() {
  const params = new URLSearchParams(window.location.search);
  const today = params.get("screen") === "today";
  const [notice, setNotice] = useState("");
  const pageLog = usePageLog({
    bookId: "literature-0",
    current: 81,
    pagesToday: 4,
    day: "2026-10-29",
    client: {
      rpc: async () => ({
        data: [{ streak_current: 5, streak_longest: 12, restored: false }],
        error: null,
      }),
    },
  });
  return (
    <div style={{ "--shell-width": "100%" } as React.CSSProperties}>
      <AppShell route={today ? "today" : "shelf"}>
        {today ? (
          <TodayScreen
            book={{
              id: "literature-0",
              title: "The Waves",
              author: "Virginia Woolf",
              editionLine: "Hogarth Press · 1931 · English",
              coverUrl: null,
              total: 324,
              ddc: "823.912",
            }}
            streak={{
              current: 5,
              longest: 12,
              days: Array.from({ length: 7 }, (_, index) => ({
                day: `2026-10-${23 + index}`,
                read: index >= 2,
              })),
            }}
            pageLog={pageLog}
            onCatalogue={() => setNotice("Browse catalogue selected")}
          />
        ) : (
          <ShelfScreen
            books={params.get("state") === "empty" ? [] : books}
            currentPages={{ "literature-0": 81 }}
            loading={params.get("state") === "loading"}
            error={params.get("state") === "error" ? "Could not load your shelf." : null}
            onRetry={() => setNotice("Retry selected")}
            onAddBook={() => setNotice("Add book selected")}
            onSelectBook={(book) => setNotice(`Selected: ${book.id}`)}
          />
        )}
        <output aria-label="Preview action">{notice}</output>
      </AppShell>
    </div>
  );
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<Preview />);
