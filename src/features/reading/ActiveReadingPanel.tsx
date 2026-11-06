import "../../styles/reading-companion.css";
import "../../styles/reading-cover.css";
import "../../styles/reading-console.css";
import "../../styles/reading-feedback.css";
import "../../styles/reading-streak.css";
import "../../styles/reading-empty.css";
import "../../styles/reading-bento.css";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../lib/motion";
import { ActiveBookCard } from "./BookIdentity";
import { PageStepper } from "./PageStepper";
import { ReadingFeedback } from "./ReadingFeedback";
import { StreakBlock } from "./StreakBlock";
import type { TodayScreenProps } from "./types";

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
  const status = pageLog.status;
  const shownStatus = useRef(status);

  useEffect(() => {
    const changed = shownStatus.current !== status;
    shownStatus.current = status;
    const node = scope.current?.querySelector<HTMLElement>(".reading-feedback");
    if (!changed || reduced || !node || !scope.current) return;
    const context = gsap.context(() => {
      gsap.from(node, { y: 5, duration: 0.24, ease: "power2.out", clearProps: "transform" });
    }, scope.current);
    return () => context.revert();
  }, [status, reduced]);

  const result = pageLog.result;
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
            <PageStepper
              key={book.id}
              current={pageLog.current}
              total={book.total}
              disabled={loadingDay || pageLog.pending !== null}
              onLog={pageLog.log}
            />
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
