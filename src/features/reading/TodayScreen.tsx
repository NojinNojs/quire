import { useId, useState } from "react";
import "../../styles/reading.css";
import type { LogSnapshot } from "./pageLogStore";
import { pageAmount, previewPages, stepPages } from "./stepper";

export type ReadingBook = {
  id: string;
  title: string;
  author: string | null;
  editionLine: string;
  coverUrl: string | null;
  total: number | null;
};
export type ReadingStreak = {
  current: number;
  longest: number;
  days: readonly { day: string; read: boolean }[];
};
export type TodayScreenProps = {
  book: ReadingBook | null;
  streak: ReadingStreak;
  pageLog: LogSnapshot & { log: (pages: number) => void; undo: () => void; retry: () => unknown };
  onCatalogue: () => void;
};

export function ActiveBookCard({
  book,
  current,
  pagesToday,
}: {
  book: ReadingBook;
  current: number;
  pagesToday: number;
}) {
  const [failedCover, setFailedCover] = useState<string | null>(null);
  return (
    <article className="reading-book" aria-label="Active book">
      <div className="reading-cover">
        {book.coverUrl && failedCover !== book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt=""
            width="92"
            height="138"
            onError={() => setFailedCover(book.coverUrl)}
          />
        ) : (
          <span>Cover unavailable</span>
        )}
      </div>
      <div className="reading-book-copy">
        <h2>{book.title}</h2>
        <p>{book.author ?? "Author unknown"}</p>
        <p className="reading-meta">{book.editionLine}</p>
        <p className="reading-number">
          {book.total === null ? current : `${current} / ${book.total}`}
        </p>
        <p>{pagesToday} pages today</p>
      </div>
    </article>
  );
}

export function PageStepper({
  current,
  total,
  disabled,
  onLog,
}: {
  current: number;
  total: number | null;
  disabled: boolean;
  onLog: (pages: number) => void;
}) {
  const [value, setValue] = useState("1");
  const id = useId();
  const amount = pageAmount(Number(value), current, total);
  const valid = value.trim() !== "" && Number(value) === amount && amount > 0;
  return (
    <form
      className="reading-stepper"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid && !disabled) onLog(amount);
      }}
    >
      <label htmlFor={id}>Pages read</label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        max={total === null ? 2_147_483_647 - current : Math.max(0, total - current)}
        value={value}
        disabled={disabled}
        aria-describedby={`${id}-preview`}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="reading-steps">
        {[-10, -1, 1, 10].map((step) => (
          <button
            key={step}
            type="button"
            disabled={disabled}
            aria-label={`${step < 0 ? "Subtract" : "Add"} ${Math.abs(step)} ${Math.abs(step) === 1 ? "page" : "pages"}`}
            onClick={() => setValue(String(stepPages(amount, step, current, total)))}
          >
            {step > 0 ? `+${step}` : step}
          </button>
        ))}
      </div>
      <p id={`${id}-preview`} className="reading-number" aria-live="polite">
        {previewPages(current, amount)}
      </p>
      <button className="reading-primary" type="submit" disabled={disabled || !valid}>
        Log {amount} pages
      </button>
    </form>
  );
}

export function StreakBlock({ streak }: { streak: ReadingStreak }) {
  return (
    <section className="reading-streak" aria-label="Reading streak">
      <h2>{streak.current} day streak</h2>
      <ol aria-label="Last seven days">
        {streak.days.slice(-7).map(({ day, read }) => (
          <li
            key={day}
            className={read ? "reading-day reading-day-filled" : "reading-day"}
            aria-label={`${day}: ${read ? "read" : "no pages logged"}`}
            title={`${day}: ${read ? "read" : "no pages logged"}`}
          />
        ))}
      </ol>
      <p>Longest: {streak.longest} days</p>
    </section>
  );
}

export function TodayScreen({ book, streak, pageLog, onCatalogue }: TodayScreenProps) {
  return (
    <section className="reading" aria-label="Today">
      <h1>Today</h1>
      {book ? (
        <>
          <ActiveBookCard book={book} current={pageLog.current} pagesToday={pageLog.pagesToday} />
          <PageStepper
            key={book.id}
            current={pageLog.current}
            total={book.total}
            disabled={pageLog.pending !== null}
            onLog={pageLog.log}
          />
          <div className="reading-feedback">
            <p role="status">
              {pageLog.status === "undo" &&
                `${pageLog.pending?.pages} pages added. Saving in 5 seconds.`}
              {pageLog.status === "queued" && "Pages queued. Retry when you are online."}
              {pageLog.status === "saving" && "Saving pages..."}
              {pageLog.status === "saved" && "Pages logged."}
            </p>
            {pageLog.status === "undo" && (
              <button type="button" onClick={pageLog.undo}>
                Undo
              </button>
            )}
            {pageLog.status === "queued" && (
              <button type="button" onClick={() => pageLog.retry()}>
                Retry
              </button>
            )}
            {pageLog.error && <p role="alert">{pageLog.error}</p>}
          </div>
          <StreakBlock
            streak={
              pageLog.result
                ? {
                    ...streak,
                    current: pageLog.result.streak_current,
                    longest: pageLog.result.streak_longest,
                  }
                : streak
            }
          />
        </>
      ) : (
        <div className="reading-empty">
          <p>Choose a book from the catalogue to start reading.</p>
          <button className="reading-primary" type="button" onClick={onCatalogue}>
            Browse catalogue
          </button>
        </div>
      )}
    </section>
  );
}
