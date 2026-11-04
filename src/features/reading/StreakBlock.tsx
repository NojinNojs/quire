import { plural } from "../../lib/plural";
import type { ReadingStreak } from "./types";
import { useRestoredDays } from "./useRestoredDays";

function localDay() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function StreakBlock({
  streak,
  today = localDay(),
}: {
  streak: ReadingStreak;
  today?: string;
}) {
  const restoredDates = useRestoredDays(JSON.stringify(streak));
  return (
    <section className="reading-streak" aria-label="Reading streak">
      <div className="reading-stamps">
        <p className="reading-streak-kicker">Current streak</p>
        <h2>{plural(streak.current, "day")} streak</h2>
        <ol aria-label="Last seven days">
          {streak.days.slice(-7).map(({ day, read, restored: recordedRestoration }) => {
            const restored = recordedRestoration || restoredDates.has(day);
            const label = `${day}: ${restored ? "restored" : read ? "read" : "no pages logged"}${day === today ? ", today" : ""}`;
            return (
              <li
                key={day}
                className={`reading-day${read ? " reading-day-filled" : ""}${day === today ? " reading-day-today" : ""}${restored ? " reading-day-restored" : ""}`}
                aria-label={label}
                title={label}
              >
                <span className="reading-day-mark" aria-hidden="true" />
                <span className="reading-day-letter" aria-hidden="true">
                  {new Date(day).toLocaleDateString("en", { weekday: "narrow" })}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="reading-streak-best">
        Longest: <strong>{plural(streak.longest, "day")}</strong>
      </p>
    </section>
  );
}
