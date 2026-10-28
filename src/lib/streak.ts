export type StreakState = {
  current: number;
  longest: number;
  lastDay: string | null;
  restoreLeft: number;
  restoreMonth: string | null;
};

export const emptyStreak: StreakState = {
  current: 0,
  longest: 0,
  lastDay: null,
  restoreLeft: 1,
  restoreMonth: null,
};

const DAY = 86_400_000;

export function dayNumber(day: string): number {
  const parsed = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(parsed)) throw new Error(`invalid day: ${day}`);
  return Math.round(parsed / DAY);
}

export function monthOf(day: string): string {
  return day.slice(0, 7);
}

/**
 * One page on a day is a reading day. A single missed day can be restored once per calendar month.
 * Returns the next state; the caller persists it.
 */
export function logReadingDay(state: StreakState, day: string): StreakState {
  if (state.lastDay === null) {
    return { ...state, current: 1, longest: Math.max(state.longest, 1), lastDay: day };
  }

  const gap = dayNumber(day) - dayNumber(state.lastDay);
  if (gap <= 0) return state;

  if (gap === 1) {
    const current = state.current + 1;
    return { ...state, current, longest: Math.max(state.longest, current), lastDay: day };
  }

  const canRestore = gap === 2 && state.restoreLeft > 0 && state.restoreMonth !== monthOf(day);
  if (canRestore) {
    const current = state.current + 1;
    return {
      ...state,
      current,
      longest: Math.max(state.longest, current),
      lastDay: day,
      restoreLeft: state.restoreLeft - 1,
      restoreMonth: monthOf(day),
    };
  }

  return { ...state, current: 1, longest: Math.max(state.longest, 1), lastDay: day };
}

/** A streak is broken when the last reading day is older than yesterday. */
export function isBroken(state: StreakState, today: string): boolean {
  if (state.lastDay === null) return false;
  return dayNumber(today) - dayNumber(state.lastDay) > 1;
}
