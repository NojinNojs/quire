import { useId, useState } from "react";
import { Select } from "../../components/select/Select";
import type { ReaderProfile } from "../../data/profile";
import type { ReadingLog } from "../../data/readingHistory";
import type { Book } from "../../data/types";
import { type LanguageFilter, summarizeReading } from "../../lib/readingStats";
import { YearControl } from "../reading/YearControl";
import { ReadingCalendar } from "./ReadingCalendar";
import "./insights.css";

export function StatsScreen({
  books,
  logs,
  profile,
  year,
  setYear,
  currentYear,
}: {
  books: Book[];
  logs: ReadingLog[];
  profile: ReaderProfile | null;
  year: number;
  setYear: (year: number) => void;
  currentYear: number;
}) {
  const id = useId();
  const [filter, setFilter] = useState<LanguageFilter>({ kind: "all" });
  const all = summarizeReading(books, logs, year, { kind: "all" });
  const options: LanguageFilter[] = [
    { kind: "all" },
    ...all.languages.map(
      ({ language }): LanguageFilter =>
        language === null ? { kind: "unknown" } : { kind: "language", value: language },
    ),
  ];
  const selected = options.find((option) => JSON.stringify(option) === JSON.stringify(filter)) ?? {
    kind: "all" as const,
  };
  const summary = selected.kind === "all" ? all : summarizeReading(books, logs, year, selected);
  const goal = year === currentYear && selected.kind === "all" ? profile?.annual_goal : null;
  const remaining = goal == null ? null : Math.max(goal - summary.finished, 0);
  return (
    <section className="insights" aria-labelledby={`${id}-heading`}>
      <a className="insights-back" href="#/today">
        Back to Today
      </a>
      <header className="insights-head">
        <h1 id={`${id}-heading`}>Reading year</h1>
        <YearControl year={year} setYear={setYear} currentYear={currentYear} />
      </header>
      <div className="insights-toolbar">
        <Select
          label="Language"
          value={JSON.stringify(selected)}
          onChange={(value) => {
            const option = options.find((item) => JSON.stringify(item) === value);
            if (option) setFilter(option);
          }}
          options={options.map((option) => ({
            value: JSON.stringify(option),
            label:
              option.kind === "all"
                ? "All languages"
                : option.kind === "unknown"
                  ? "Unknown"
                  : option.value,
          }))}
        />
        <p className="insights-toolbar-note">Totals and calendar follow this filter.</p>
      </div>
      <dl className="insights-totals">
        <div>
          <dt>Books finished</dt>
          <dd>{summary.finished}</dd>
        </div>
        <div>
          <dt>Pages read</dt>
          <dd>{summary.pages}</dd>
        </div>
        <div>
          <dt>Reading days</dt>
          <dd>{summary.activeDays}</dd>
        </div>
      </dl>
      {goal != null && (
        <section className="insights-goal" aria-labelledby={`${id}-goal`}>
          <div className="insights-goal-head">
            <h2 id={`${id}-goal`}>Annual goal</h2>
            <p>
              {summary.finished} of {goal} books
            </p>
          </div>
          <progress
            value={Math.min(summary.finished, goal)}
            max={goal}
            aria-label="Books finished against annual goal"
          />
          <p className="insights-goal-note">
            {remaining === 0
              ? "Goal reached."
              : `${remaining} ${remaining === 1 ? "book" : "books"} to go.`}
          </p>
        </section>
      )}
      {books.some((book) => book.status === "finished" && book.finished_at === null) && (
        <p className="insights-note">
          Books without a finish date are not counted in yearly totals.
        </p>
      )}
      {summary.pages === 0 && summary.finished === 0 && (
        <p className="insights-empty">No reading recorded for this selection and year.</p>
      )}
      <ReadingCalendar year={year} days={summary.days} />
      <section className="insights-languages" aria-labelledby={`${id}-languages`}>
        <h2 id={`${id}-languages`}>Languages</h2>
        <table>
          <thead>
            <tr>
              <th scope="col">Language</th>
              <th scope="col">Pages</th>
              <th scope="col">Books finished</th>
            </tr>
          </thead>
          <tbody>
            {summary.languages.map((item) => (
              <tr key={JSON.stringify(item.language)}>
                <td>{item.language ?? "Unknown"}</td>
                <td>{item.pages}</td>
                <td>{item.finished}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="insights-note">Languages use current book details.</p>
      </section>
    </section>
  );
}
