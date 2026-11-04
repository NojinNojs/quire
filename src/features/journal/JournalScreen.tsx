import { useId, useState } from "react";
import type { ReadingLog } from "../../data/readingHistory";
import type { Book } from "../../data/types";
import { YearControl } from "../reading/YearControl";
import "../stats/insights.css";
import "./journal.css";

const readableDay = new Intl.DateTimeFormat("en", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return readableDay.format(new Date(year ?? 1970, (month ?? 1) - 1, date ?? 1));
}

export function JournalScreen({
  books,
  logs,
  year,
  setYear,
  currentYear,
}: {
  books: Book[];
  logs: ReadingLog[];
  year: number;
  setYear: (year: number) => void;
  currentYear: number;
}) {
  const id = useId();
  const [limit, setLimit] = useState(30);
  const byId = new Map(books.map((book) => [book.id, book]));
  const days = new Map<string, Map<string, number>>();
  for (const log of logs) {
    if (!log.day.startsWith(`${String(year).padStart(4, "0")}-`) || !byId.has(log.book_id))
      continue;
    const day = days.get(log.day) ?? new Map<string, number>();
    day.set(log.book_id, (day.get(log.book_id) ?? 0) + log.pages);
    days.set(log.day, day);
  }
  const entries = [...days.entries()].sort(([a], [b]) => b.localeCompare(a));
  const totalPages = entries.reduce(
    (sum, [, items]) => sum + [...items.values()].reduce((pages, count) => pages + count, 0),
    0,
  );
  return (
    <section className="insights journal" aria-labelledby={`${id}-heading`}>
      <a className="insights-back" href="#/today">
        Back to Today
      </a>
      <header className="insights-head">
        <h1 id={`${id}-heading`}>Reading journal</h1>
        <YearControl
          year={year}
          currentYear={currentYear}
          setYear={(value) => {
            setYear(value);
            setLimit(30);
          }}
        />
      </header>
      <p className="journal-summary">
        {entries.length === 0
          ? "No reading days yet"
          : `${entries.length} ${entries.length === 1 ? "reading day" : "reading days"}`}
        {totalPages > 0 ? (
          <>
            <span aria-hidden="true"> · </span>
            {totalPages} {totalPages === 1 ? "page" : "pages"}
          </>
        ) : null}
      </p>
      {entries.length === 0 ? (
        <p className="insights-empty">
          No pages logged this year. <a href="#/today">Go to Today</a> to record reading.
        </p>
      ) : (
        <ol className="journal-days">
          {entries.slice(0, limit).map(([day, items]) => {
            const total = [...items.values()].reduce((sum, pages) => sum + pages, 0);
            return (
              <li key={day}>
                <section className="journal-day" aria-labelledby={`${id}-${day}`}>
                  <header className="journal-day-head">
                    <h2 id={`${id}-${day}`}>
                      <time dateTime={day}>{formatDay(day)}</time>
                    </h2>
                    <p className="journal-day-total">{total === 1 ? "1 page" : `${total} pages`}</p>
                  </header>
                  <ul className="journal-lines">
                    {[...items].map(([bookId, pages]) => {
                      const book = byId.get(bookId);
                      if (!book) return null;
                      return (
                        <li key={bookId}>
                          <a className="journal-book" href={`#/book/${encodeURIComponent(bookId)}`}>
                            {book.title}
                          </a>
                          {book.author && <span className="journal-author">{book.author}</span>}
                          <span className="journal-pages">
                            {pages === 1 ? "1 page" : `${pages} pages`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </li>
            );
          })}
        </ol>
      )}
      {limit < entries.length && (
        <button
          type="button"
          className="journal-more"
          onClick={() => setLimit((value) => value + 30)}
        >
          Show earlier days
        </button>
      )}
    </section>
  );
}
