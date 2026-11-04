import "../../styles/reading-companion.css";
import "../../styles/reading-cover.css";
import "../../styles/reading-console.css";
import "../../styles/reading-feedback.css";
import "../../styles/reading-streak.css";
import "../../styles/reading-empty.css";
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
  return (
    <section className="reading reading-today" aria-label="Active reading">
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
