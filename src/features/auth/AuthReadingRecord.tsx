import { useState } from "react";
import { CoverImage } from "../covers/CoverImage";
import { createDemoState, demoStreak, loadDemoState, sampleBooks } from "../demo/state";
import { readingDay } from "../integration/useReading";

export function AuthReadingRecord() {
  const [state] = useState(() => {
    try {
      return loadDemoState(window.localStorage);
    } catch {
      return createDemoState();
    }
  });
  const book = state.books.find((entry) => entry.status === "reading") ?? sampleBooks[0];
  if (!book) return <aside className="auth-recto" aria-label="No demo book selected" />;
  const today = readingDay();
  const streak = demoStreak(state, today);
  const pagesToday = state.logs
    .filter((log) => log.bookId === book.id && log.day === today)
    .reduce((sum, log) => sum + log.pages, 0);

  return (
    <aside className="auth-recto" aria-label="Your demo reading record">
      <CoverImage
        className="auth-reading-cover"
        title={book.title}
        coverUrl={book.cover_url}
        client={null}
      />
      <div className="auth-reading-record">
        <p className="auth-book-title">
          <cite>{book.title}</cite>
        </p>
        <p className="auth-book-author">{book.author}</p>
        <div className="auth-reading-streak">
          <p className="auth-record-label">Reading streak</p>
          <ol aria-label="Last seven days in the demo">
            {streak.days.map(({ day, read, restored }) => (
              <li
                key={day}
                className={`auth-reading-day${read ? " auth-reading-day-filled" : ""}${day === today ? " auth-reading-day-today" : ""}${restored ? " auth-reading-day-restored" : ""}`}
                aria-label={`${day}: ${restored ? "restored" : read ? "read" : "no pages logged"}${day === today ? ", today" : ""}`}
              >
                <span className="auth-day-mark" aria-hidden="true" />
                <span aria-hidden="true">
                  {new Date(`${day}T12:00:00`).toLocaleDateString("en", { weekday: "narrow" })}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <dl className="auth-reading-pages">
          <dt>Pages read today</dt>
          <dd>{pagesToday}</dd>
        </dl>
        <p className="auth-record-note">Your demo shelf. Sample reading activity.</p>
      </div>
      <p className="auth-recto-folio">17</p>
    </aside>
  );
}
