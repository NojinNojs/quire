import { ChangingText } from "../../components/changing-text/ChangingText";
import { CheckIcon, JournalIcon, ReadingYearIcon } from "../../components/icons";
import type { ReadingLog } from "../../data/readingHistory";
import type { Book } from "../../data/types";
import { plural } from "../../lib/plural";
import { formatActivityDay } from "./formatDay";
import { ReadingProgress } from "./ReadingProgress";

type ReadingSummary = {
  pages: number;
  finished: number;
  activeDays: number;
};

export function YearSummary({
  year,
  summary,
  goal,
}: {
  year: number;
  summary: ReadingSummary;
  goal: number | null | undefined;
}) {
  const hasGoal = typeof goal === "number" && goal > 0 ? goal : null;
  const reached = hasGoal === null ? null : Math.min(summary.finished, hasGoal);
  const share = hasGoal === null ? null : Math.round(((reached ?? 0) / hasGoal) * 100);
  const remaining = hasGoal === null ? null : Math.max(hasGoal - summary.finished, 0);
  return (
    <div className="reading-year">
      <h2>Your {year}</h2>
      {hasGoal === null ? (
        <div className="reading-goal-empty">
          <p>No annual goal yet.</p>
          <a href="#/settings">Set a reading goal</a>
        </div>
      ) : (
        <div className="reading-goal">
          <div className="reading-goal-head">
            <p>
              <ChangingText value={summary.finished} /> of {hasGoal} books
            </p>
            <p className="reading-goal-share">
              <ChangingText value={`${share}%`} />
            </p>
          </div>
          <ReadingProgress
            value={reached ?? 0}
            max={hasGoal}
            label={`Annual goal: ${summary.finished} of ${hasGoal} books`}
          />
          <p className="reading-goal-note">
            {remaining === 0 ? "Goal reached" : `${plural(remaining ?? 0, "book")} to go`}
          </p>
        </div>
      )}
      <div className="reading-metrics">
        <div className="reading-metric">
          <span className="reading-metric-value">
            <ChangingText value={summary.finished} />
          </span>
          <CheckIcon className="reading-metric-icon" />
          <span className="reading-metric-label">
            {" "}
            {summary.finished === 1 ? "book finished" : "books finished"}
          </span>
        </div>
        <div className="reading-metric">
          <span className="reading-metric-value">
            <ChangingText value={summary.pages} />
          </span>
          <JournalIcon className="reading-metric-icon" />
          <span className="reading-metric-label"> pages read</span>
        </div>
        <div className="reading-metric">
          <span className="reading-metric-value">
            <ChangingText value={summary.activeDays} />
          </span>
          <ReadingYearIcon className="reading-metric-icon" />
          <span className="reading-metric-label">
            {" "}
            {summary.activeDays === 1 ? "reading day" : "reading days"}
          </span>
        </div>
      </div>
      <nav className="reading-links" aria-label="Reading records">
        <a href="#/journal">Reading journal</a>
        <a href="#/stats">Reading year</a>
      </nav>
    </div>
  );
}

export function RecentActivity({
  day,
  logs,
  books,
}: {
  day: string;
  logs: ReadingLog[];
  books: Book[];
}) {
  const titles = new Map(books.map((book) => [book.id, book.title]));
  const recent = logs
    .filter((log) => log.day <= day)
    .slice(-5)
    .reverse();
  return (
    <section className="reading-activity" aria-labelledby="reading-activity-title">
      <h2 id="reading-activity-title">Latest activity</h2>
      {recent.length ? (
        <ol className="reading-activity-list">
          {recent.map((log) => (
            <li key={log.id}>
              <time dateTime={log.day}>{formatActivityDay(log.day)}</time>
              <span className="reading-activity-book">{titles.get(log.book_id) ?? "Book"}</span>
              <span className="reading-activity-pages">{plural(log.pages, "page")}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="reading-activity-empty">No pages logged yet.</p>
      )}
    </section>
  );
}
