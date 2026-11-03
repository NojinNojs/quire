import { useState } from "react";
import { JournalScreen } from "../journal/JournalScreen";
import { StatsScreen } from "../stats/StatsScreen";
import { demoHistory } from "./history";
import type { DemoState } from "./state";

export function DemoInsights({
  state,
  route,
  day,
}: {
  state: DemoState;
  route: "journal" | "stats";
  day: string;
}) {
  const currentYear = Number(day.slice(0, 4));
  const [year, setYear] = useState(currentYear);
  const logs = demoHistory(state);
  const props = { books: state.books, logs, year, setYear, currentYear };
  return (
    <main className="integration-screen">
      {route === "journal" ? (
        <JournalScreen {...props} />
      ) : (
        <StatsScreen {...props} profile={{ id: "demo", ...state.profile }} />
      )}
    </main>
  );
}
