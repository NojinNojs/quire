import "../../styles/reading-companion.css";
import "../../styles/reading-cover.css";
import "../../styles/reading-console.css";
import "../../styles/reading-streak.css";
import "../../styles/reading-empty.css";
import "../../styles/reading-bento.css";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { CheckIcon } from "../../components/icons";
import { useReducedMotion } from "../../lib/motion";
import { ActiveBookCard } from "./BookIdentity";
import { PageStepper } from "./PageStepper";
import { ReadingFeedback } from "./ReadingFeedback";
import { StreakBlock } from "./StreakBlock";
import type { TodayScreenProps } from "./types";
import { useCompletionStamp } from "./useCompletionStamp";

function localDay() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ActiveReadingPanel({
  book,
  streak,
  pageLog,
  loadingDay,
  onCatalogue,
}: TodayScreenProps) {
  const scope = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const result = pageLog.result;
  const complete =
    book !== null && book.total !== null && book.total > 0 && pageLog.current >= book.total;
  const settling =
    loadingDay ||
    pageLog.pending !== null ||
    pageLog.status === "saving" ||
    pageLog.status === "error";
  const confirmed = complete && !settling;
  const finishMark = useCompletionStamp(confirmed);

  useEffect(() => {
    const root = scope.current;
    const mark = root?.querySelector<HTMLElement>(".reading-day-today .reading-day-mark");
    if (!result || reduced || !root || !mark) return;
    const context = gsap.context(() => {
      gsap.from(mark, { scale: 0.6, duration: 0.3, ease: "power2.out", clearProps: "transform" });
    }, root);
    return () => context.revert();
  }, [result, reduced]);

  return (
    <section className="reading reading-today" aria-label="Active reading" ref={scope}>
      {book ? (
        <div className="reading-two-pane">
          <ActiveBookCard book={book} current={pageLog.current} pagesToday={pageLog.pagesToday} />
          <div className="reading-console">
            {complete ? (
              <div className="reading-complete" aria-live="polite">
                {confirmed && (
                  <span ref={finishMark} className="completion-stamp" aria-hidden="true">
                    <CheckIcon />
                  </span>
                )}
                <h2 className="reading-console-title">
                  {confirmed ? "All pages read" : "Last page reached"}
                </h2>
                <p>
                  {confirmed
                    ? "Mark this book as finished to add it to your reading year."
                    : "Finish saving the last pages before marking the book as finished."}
                </p>
                {confirmed && (
                  <a className="reading-complete-link" href={`#/book/${book.id}`}>
                    Go to reading status
                  </a>
                )}
              </div>
            ) : (
              <PageStepper
                key={book.id}
                current={pageLog.current}
                total={book.total}
                disabled={loadingDay || pageLog.pending !== null}
                onLog={pageLog.log}
              />
            )}
            <ReadingFeedback pageLog={pageLog} />
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
          <h2>No active book</h2>
          <p>Choose a book from your collection to start reading.</p>
          <button className="primary" type="button" onClick={onCatalogue}>
            Browse catalogue
          </button>
        </div>
      )}
    </section>
  );
}
