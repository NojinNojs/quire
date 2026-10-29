import { type CSSProperties, useEffect, useId, useState } from "react";
import { classify } from "../../lib/ddc";
import { plural } from "../../lib/plural";
import { supabase } from "../../lib/supabase";
import { TodayCover } from "../covers/TodayCover";
import { Bookmark } from "./Bookmark";
import { useRestoredDays } from "./useRestoredDays";
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
  ddc?: string | null;
};
export type ReadingStreak = {
  current: number;
  longest: number;
  days: readonly { day: string; read: boolean; restored?: boolean }[];
};
export type TodayScreenProps = {
  book: ReadingBook | null;
  streak: ReadingStreak;
  pageLog: LogSnapshot & { log: (pages: number) => void; undo: () => void; retry: () => unknown };
  onCatalogue: () => void;
};

function BookRecord({
  book,
  current,
  pagesToday,
}: {
  book: ReadingBook;
  current: number;
  pagesToday: number;
}) {
  return (
    <div className="reading-book-copy">
      <h2>{book.title}</h2>
      <p>{book.author ?? "Author unknown"}</p>
      <p className="reading-meta">{book.editionLine}</p>
      <p className="reading-number">
        {book.total === null ? current : `${current} / ${book.total}`}
      </p>
      <p>{plural(pagesToday, "page")} today</p>
    </div>
  );
}

export function ActiveBookCard({
  book,
  current,
  pagesToday,
}: {
  book: ReadingBook;
  current: number;
  pagesToday: number;
}) {
  const [classification, setClassification] = useState<{ id: string; ddc: string | null } | null>(
    null,
  );
  useEffect(() => {
    const client = supabase;
    if (!client || book.ddc !== undefined) return;
    let live = true;
    void (async () => {
      const { data, error } = await client.from("books").select("ddc").eq("id", book.id).single();
      if (live && !error && data) setClassification({ id: book.id, ddc: data.ddc });
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, [book.id, book.ddc]);
  const token =
    classify(
      book.ddc !== undefined
        ? book.ddc
        : classification?.id === book.id
          ? classification.ddc
          : null,
    )?.token ?? "--class-000";
  return (
    <article
      className="reading-book"
      aria-label="Active book"
      style={
        { "--book-class": `var(--shelf${token.slice(1)}, var(--shelf-class-000))` } as CSSProperties
      }
    >
      <div className="reading-jacket">
        <TodayCover
          key={book.id}
          bookId={book.id}
          title={book.title}
          author={book.author}
          ddc={book.ddc ?? (classification?.id === book.id ? classification.ddc : null)}
          coverUrl={book.coverUrl}
        />
        <Bookmark current={current} total={book.total} />
      </div>
      <BookRecord book={book} current={current} pagesToday={pagesToday} />
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
            disabled={disabled || amount + step < 1}
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
        Log {plural(amount, "page")}
      </button>
    </form>
  );
}

function localDay() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function StreakBlock({
  streak,
  today = localDay(),
}: {
  streak: ReadingStreak;
  today?: string;
}) {
  const restoredDates = useRestoredDays(JSON.stringify(streak));
  return (
    <section className="reading-streak" aria-label="Reading streak">
      <div className="reading-stamps">
        <h2>{plural(streak.current, "day")} streak</h2>
        <ol aria-label="Last seven days">
          {streak.days.slice(-7).map(({ day, read, restored: recordedRestoration }) => {
            const restored = recordedRestoration || restoredDates.has(day);
            return (
              <li
                key={day}
                className={`reading-day${read ? " reading-day-filled" : ""}${day === today ? " reading-day-today" : ""}${restored ? " reading-day-restored" : ""}`}
                aria-label={`${day}: ${restored ? "restored" : read ? "read" : "no pages logged"}${day === today ? ", today" : ""}`}
                title={`${day}: ${restored ? "restored" : read ? "read" : "no pages logged"}${day === today ? ", today" : ""}`}
              >
                <span className="reading-day-mark" aria-hidden="true" />
                <span className="reading-day-letter" aria-hidden="true">
                  {new Date(day).toLocaleDateString("en", { weekday: "narrow" })}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <p>Longest: {plural(streak.longest, "day")}</p>
    </section>
  );
}

export function TodayScreen({ book, streak, pageLog, onCatalogue }: TodayScreenProps) {
  return (
    <section className="reading reading-today" aria-label="Today">
      <h1>Today</h1>
      {book ? (
        <div className="reading-two-pane">
          <ActiveBookCard book={book} current={pageLog.current} pagesToday={pageLog.pagesToday} />
          <div className="reading-desktop-record">
            <BookRecord book={book} current={pageLog.current} pagesToday={pageLog.pagesToday} />
          </div>
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
                    days: streak.days.map((day) => {
                      const today = localDay();
                      const previous = new Date(`${today}T12:00:00`);
                      previous.setDate(previous.getDate() - 1);
                      const yesterday = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}-${String(previous.getDate()).padStart(2, "0")}`;
                      return {
                        ...day,
                        read: day.read || day.day === today,
                        restored:
                          day.restored || (pageLog.result?.restored && day.day === yesterday),
                      };
                    }),
                  }
                : streak
            }
          />
        </div>
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
