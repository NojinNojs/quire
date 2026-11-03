import { ActiveBookCard, PageStepper, StreakBlock } from "./ReadingParts";
import type { TodayScreenProps } from "./TodayScreen";

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
          <PageStepper
            key={book.id}
            current={pageLog.current}
            total={book.total}
            disabled={loadingDay || pageLog.pending !== null}
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
