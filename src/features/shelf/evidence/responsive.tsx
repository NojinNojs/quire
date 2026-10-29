import { useState } from "react";
import { createRoot } from "react-dom/client";
import "../../../styles/fonts.css";
import "../../../styles/tokens.css";
import "../../../styles/themes.css";
import "../../../styles/app.css";
import "../../../styles/nav.css";
import { AppShell } from "../../nav/AppShell";
import { TodayScreen } from "../../reading/TodayScreen";
import { shelfBook } from "../fixtures";
import { ShelfScreen } from "../ShelfScreen";

// Illustrative editions isolate shelf behavior from the separately owned shell and data layer.
const books = [
  shelfBook({
    title: "Pride and Prejudice",
    author: "Jane Austen",
    cover_url: "https://covers.openlibrary.org/b/id/12645114-L.jpg?default=false",
  }),
  ...["A Room of One's Own", "Orlando", "Mrs Dalloway", "To the Lighthouse", "Night and Day"].map(
    (title, index) => shelfBook({ id: `literature-${index}`, title, status: "want" }),
  ),
  shelfBook({
    id: "single",
    title: "Meditations",
    author: "Marcus Aurelius",
    publisher: "Modern Library",
    year: 2002,
    pages: 256,
    ddc: "188",
    status: "finished",
  }),
];

function Preview() {
  const state = new URLSearchParams(window.location.search).get("state");
  const [notice, setNotice] = useState("");
  return (
    <div style={{ "--shell-width": "100%" } as React.CSSProperties}>
      <AppShell route="shelf">
        {state === "reading-empty" ? (
          <TodayScreen
            book={null}
            streak={{ current: 0, longest: 0, days: [] }}
            pageLog={{
              current: 0,
              pagesToday: 0,
              status: "idle",
              pending: null,
              error: null,
              result: null,
              log: () => {},
              undo: () => {},
              retry: () => {},
            }}
            onCatalogue={() => setNotice("Browse catalogue selected")}
          />
        ) : (
          <ShelfScreen
            books={state === "empty" ? [] : books}
            currentPages={{ literature: 81 }}
            loading={state === "loading"}
            error={
              state === "error" || state === "error-no-retry" ? "Could not load your shelf." : null
            }
            onRetry={state === "error-no-retry" ? undefined : () => setNotice("Retry selected")}
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
