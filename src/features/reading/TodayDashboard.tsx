import type { ReactNode } from "react";
import type { ReaderProfile } from "../../data/profile";
import type { ReadingLog } from "../../data/readingHistory";
import type { Book } from "../../data/types";
import { summarizeReading } from "../../lib/readingStats";
import "../stats/insights.css";

export function TodayDashboard({
  day,
  profile,
  books,
  logs,
  children,
  summaryState,
}: {
  day: string;
  profile: ReaderProfile | null;
  books: Book[];
  logs: ReadingLog[];
  children: ReactNode;
  summaryState?: ReactNode;
}) {
  const year = Number(day.slice(0, 4));
  const summary = summarizeReading(books, logs, year, { kind: "all" });
  const recent = summary.days
    .filter((item) => item.day <= day && item.pages > 0)
    .slice(-5)
    .reverse();
  const goal = profile?.annual_goal;
  return (
    <div className="insights dashboard-reading">
      <header>
        <p>{day}</p>
        <h1>{profile?.display_name ? `Hello, ${profile.display_name}` : "Your reading day"}</h1>
      </header>
      <div className="dashboard-reading-grid">
        <div>{children}</div>
        <aside>
          {summaryState ?? (
            <>
              <h2>Your year</h2>
              {goal != null && (
                <>
                  <p>
                    {summary.finished} of {goal} books
                  </p>
                  <progress value={Math.min(summary.finished, goal)} max={goal} />
                </>
              )}
              <p>{summary.finished} books finished</p>
              <p>{summary.pages} pages read</p>
              <a href="#/stats">Reading year</a>
            </>
          )}
        </aside>
      </div>
      {!summaryState && books.length === 0 && (
        <p>
          <a href="#/search">Add your first book</a>
        </p>
      )}
      {!summaryState && (
        <section>
          <h2>Recent activity</h2>
          {recent.length ? (
            <ul>
              {recent.map((item) => (
                <li key={item.day}>
                  {item.day}: {item.pages} pages
                </li>
              ))}
            </ul>
          ) : (
            <p>No pages logged yet.</p>
          )}
          <a href="#/journal">Reading journal</a>
        </section>
      )}
    </div>
  );
}
