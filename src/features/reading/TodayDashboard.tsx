import type { ReactNode } from "react";
import type { ReaderProfile } from "../../data/profile";
import type { ReadingLog } from "../../data/readingHistory";
import type { Book } from "../../data/types";
import { summarizeReading } from "../../lib/readingStats";
import "../stats/insights.css";
import "../../styles/reading-dashboard.css";
import "../../styles/reading-activity.css";
import { RecentActivity, YearSummary } from "./DashboardYear";
import { formatDay } from "./formatDay";

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
  const year = Number(day.slice(0, 4)) || new Date().getFullYear();
  const summary = summarizeReading(books, logs, year, { kind: "all" });
  return (
    <div className="insights dashboard-reading">
      <header>
        <h1>{profile?.display_name ? `Hello, ${profile.display_name}` : "Your reading day"}</h1>
        <p className="dashboard-reading-date">
          <time dateTime={day}>{formatDay(day)}</time>
        </p>
      </header>
      <div className="dashboard-reading-grid">
        <div className="dashboard-reading-main">{children}</div>
        <aside className="dashboard-reading-aside">
          {summaryState ?? (
            <>
              <YearSummary year={year} summary={summary} goal={profile?.annual_goal} />
              <RecentActivity day={day} logs={logs} books={books} />
              {books.length === 0 && (
                <p className="dashboard-reading-add">
                  <a href="#/search">Add your first book</a>
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
