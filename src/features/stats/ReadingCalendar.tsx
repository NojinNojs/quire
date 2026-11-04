import { useId } from "react";
import "./calendar.css";

const monthName = new Intl.DateTimeFormat("en", { month: "long" });
const weekdayName = new Intl.DateTimeFormat("en", { weekday: "short" });
const dayNumber = new Intl.DateTimeFormat("en", { day: "numeric", month: "short" });

function localDate(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, date ?? 1);
}

export function ReadingCalendar({
  year,
  days,
}: {
  year: number;
  days: { day: string; pages: number }[];
}) {
  const id = useId();
  return (
    <section className="reading-calendar" aria-labelledby={`${id}-heading`}>
      <div className="reading-calendar-head">
        <h2 id={`${id}-heading`}>Reading calendar</h2>
        <p>Open a month for its day-by-day log.</p>
      </div>
      <ol className="reading-calendar-months">
        {Array.from({ length: 12 }, (_, month) => {
          const prefix = `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}`;
          const label = monthName.format(new Date(year, month, 1));
          const monthDays = days.filter((item) => item.day.startsWith(`${prefix}-`));
          const logged = monthDays.filter((item) => item.pages > 0).length;
          const pages = monthDays.reduce((sum, item) => sum + item.pages, 0);
          return (
            <li key={prefix}>
              <details className={`reading-calendar-month${logged === 0 ? " is-empty" : ""}`}>
                <summary>
                  <span className="reading-calendar-month-name">{label}</span>
                  <span className="reading-calendar-month-count">
                    {logged === 0
                      ? "No pages"
                      : `${logged} ${logged === 1 ? "day" : "days"} · ${pages} pages`}
                  </span>
                  <span className="reading-calendar-chevron" aria-hidden="true" />
                </summary>
                {logged === 0 ? (
                  <p className="reading-calendar-empty">No pages logged in {label}.</p>
                ) : (
                  <ol className="reading-calendar-days">
                    {monthDays.map((item) => {
                      const date = localDate(item.day);
                      return (
                        <li
                          key={item.day}
                          className={
                            item.pages > 0
                              ? "reading-calendar-day has-pages"
                              : "reading-calendar-day"
                          }
                        >
                          <time dateTime={item.day}>
                            <span className="reading-calendar-weekday">
                              {weekdayName.format(date)}
                            </span>
                            <span className="reading-calendar-date">{dayNumber.format(date)}</span>
                          </time>
                          <span className="reading-calendar-pages">
                            {item.pages === 1 ? "1 page" : `${item.pages} pages`}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
