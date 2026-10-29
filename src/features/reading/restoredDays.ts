import { dayNumber, emptyStreak, logReadingDay } from "../../lib/streak";

/** Replay in log order, matching the database's monthly restoration quota. */
export function restoredDays(days: readonly string[]) {
  let state = emptyStreak;
  const restored = new Set<string>();
  for (const day of days) {
    const next = logReadingDay(state, day);
    if (
      state.lastDay &&
      dayNumber(day) - dayNumber(state.lastDay) === 2 &&
      next.current === state.current + 1
    ) {
      const missed = new Date(`${day}T12:00:00Z`);
      missed.setUTCDate(missed.getUTCDate() - 1);
      restored.add(missed.toISOString().slice(0, 10));
    }
    state = next;
  }
  return restored;
}
