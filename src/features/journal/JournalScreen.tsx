import { useState } from "react";
import type { ReadingLog } from "../../data/readingHistory";
import type { Book } from "../../data/types";
import { YearControl } from "../reading/YearControl";
import "../stats/insights.css";

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
  return (
    <section className="insights">
      <a href="#/today">Back to Today</a>
      <h1>Reading journal</h1>
      <YearControl
        year={year}
        currentYear={currentYear}
        setYear={(value) => {
          setYear(value);
          setLimit(30);
        }}
      />
      {entries.length === 0 ? (
        <p>
          No pages logged this year. <a href="#/today">Go to Today</a> to record reading.
        </p>
      ) : (
        entries.slice(0, limit).map(([day, items]) => (
          <section key={day} className="journal-day">
            <h2>{day}</h2>
            <p>{[...items.values()].reduce((sum, pages) => sum + pages, 0)} pages</p>
            <ul>
              {[...items].map(([id, pages]) => {
                const book = byId.get(id);
                if (!book) return null;
                return (
                  <li key={id}>
                    <a href={`#/book/${encodeURIComponent(id)}`}>{book.title}</a>{" "}
                    <span>{pages} pages</span>
                    {book.notes && <p>Current book note: {book.notes}</p>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
      {limit < entries.length && (
        <button type="button" onClick={() => setLimit((value) => value + 30)}>
          Show earlier days
        </button>
      )}
    </section>
  );
}
