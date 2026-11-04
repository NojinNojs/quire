import type { Dispatch, SetStateAction } from "react";
import type { Book } from "../../data/types";
import { TodayDashboard } from "../reading/TodayDashboard";
import { TodayScreen } from "../reading/TodayScreen";
import { demoHistory } from "./history";
import { currentPages, type DemoState, demoStreak } from "./state";

export function DemoToday({
  active,
  state,
  setState,
  day,
  pages,
  pagesToday,
}: {
  active: Book | undefined;
  state: DemoState;
  setState: Dispatch<SetStateAction<DemoState>>;
  day: string;
  pages: Record<string, number>;
  pagesToday: number;
}) {
  const pending = state.logs.find((entry) => entry.id === state.pending?.id);
  function log(amount: number) {
    if (!active) return;
    const entry = { id: crypto.randomUUID(), bookId: active.id, day, pages: amount };
    setState((value) => {
      const current = currentPages(value, active.id);
      if (
        value.pending ||
        !Number.isInteger(amount) ||
        amount < 1 ||
        (active.pages !== null && current + amount > active.pages)
      )
        return value;
      return {
        ...value,
        logs: [...value.logs, entry],
        pending: { id: entry.id, until: Date.now() + 5000 },
      };
    });
  }
  return (
    <main className="integration-screen">
      <TodayDashboard
        day={day}
        profile={{ id: "demo", ...state.profile }}
        books={state.books}
        logs={demoHistory(state)}
      >
        <TodayScreen
          book={
            active
              ? {
                  id: active.id,
                  title: active.title,
                  author: active.author,
                  editionLine:
                    [active.publisher, active.year].filter(Boolean).join(" · ") ||
                    "Edition details unknown",
                  coverUrl: active.cover_url,
                  total: active.pages,
                  ddc: active.ddc,
                }
              : null
          }
          streak={demoStreak(state, day)}
          pageLog={{
            current: active ? (pages[active.id] ?? 0) : 0,
            pagesToday,
            status: pending ? "undo" : pagesToday > 0 ? "saved" : "idle",
            pending: pending ?? null,
            result: null,
            error: null,
            log,
            undo: () =>
              setState((value) => ({
                ...value,
                logs: value.logs.filter((entry) => entry.id !== value.pending?.id),
                pending: null,
              })),
            retry: () => undefined,
          }}
          onCatalogue={() => {
            window.location.hash = "/shelf";
          }}
        />
      </TodayDashboard>
    </main>
  );
}
