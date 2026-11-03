import { useState } from "react";
import type { ReaderProfile } from "../../data/profile";
import type { ReadingLog } from "../../data/readingHistory";
import type { Book } from "../../data/types";
import { type LanguageFilter, summarizeReading } from "../../lib/readingStats";
import { YearControl } from "../reading/YearControl";
import "./insights.css";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthStartOffset(year: number, month: number): number {
  const first = new Date(0);
  first.setFullYear(year, month, 1);
  return (first.getDay() + 6) % 7;
}

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
  return (
    <section className="insights">
      <a href="#/today">Back to Today</a>
      <h1>Reading year</h1>
      <YearControl year={year} setYear={setYear} currentYear={currentYear} />
      <label>
        Language{" "}
        <select
          value={JSON.stringify(selected)}
          onChange={(event) => {
            const option = options.find((item) => JSON.stringify(item) === event.target.value);
            if (option) setFilter(option);
          }}
        >
          {options.map((option) => (
            <option key={JSON.stringify(option)} value={JSON.stringify(option)}>
              {option.kind === "all"
                ? "All languages"
                : option.kind === "unknown"
                  ? "Unknown"
                  : option.value}
            </option>
          ))}
        </select>
      </label>
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
        <section>
          <h2>Annual goal</h2>
          <p>
            {summary.finished} of {goal} books
          </p>
          <progress value={Math.min(summary.finished, goal)} max={goal} />
        </section>
      )}
      {books.some((book) => book.status === "finished" && book.finished_at === null) && (
        <p>Books without a finish date are not counted in yearly totals.</p>
      )}
      {summary.pages === 0 && summary.finished === 0 && (
        <p>No reading recorded for this selection and year.</p>
      )}
      <h2>Reading calendar</h2>
      <fieldset className="insights-legend" aria-label="Pages per day">
        {["0", "1–9", "10–29", "30–59", "60+"].map((label, level) => (
          <span key={label}>
            <i className={`insights-swatch level-${level}`} aria-hidden="true" />
            {label} pages
          </span>
        ))}
      </fieldset>
      <div className="insights-months">
        {Array.from({ length: 12 }, (_, month) => {
          const date = new Date(0);
          date.setFullYear(year, month, 1);
          const monthKey = `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}`;
          const days = summary.days
            .filter((day) => Number(day.day.slice(5, 7)) === month + 1)
            .sort((left, right) => left.day.localeCompare(right.day));
          return (
            <section key={monthKey}>
              <h3>{date.toLocaleDateString("en", { month: "long" })}</h3>
              <div className="insights-weekdays" aria-hidden="true">
                {weekdays.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="insights-days">
                {weekdays.slice(0, monthStartOffset(year, month)).map((weekday) => (
                  <span
                    key={`${monthKey}-${weekday}`}
                    className="insights-day-blank"
                    aria-hidden="true"
                  />
                ))}
                {days.map(({ day, pages }) => (
                  <details
                    key={day}
                    className={`insights-day level-${pages === 0 ? 0 : pages < 10 ? 1 : pages < 30 ? 2 : pages < 60 ? 3 : 4}`}
                  >
                    <summary aria-label={`${day}: ${pages} pages`}>{Number(day.slice(8))}</summary>
                    <p>
                      {day}: {pages} pages
                    </p>
                  </details>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <h2>Languages</h2>
      <table>
        <thead>
          <tr>
            <th>Language</th>
            <th>Pages</th>
            <th>Books finished</th>
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
      <p>Languages use current book details.</p>
    </section>
  );
}
