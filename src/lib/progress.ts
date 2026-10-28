export type Progress = {
  current: number;
  total: number | null;
};

/** Pages left, or null when the edition has no recorded page count. Never invents a denominator. */
export function pagesLeft({ current, total }: Progress): number | null {
  if (total === null) return null;
  return Math.max(total - current, 0);
}

/** Percentage whole number, or null when the total is unknown. */
export function percent({ current, total }: Progress): number | null {
  if (total === null || total <= 0) return null;
  const value = Math.round((current / total) * 100);
  return Math.min(Math.max(value, 0), 100);
}

/** Pages per day needed to finish by a date, or null when the total is unknown. */
export function pacePerDay({ current, total }: Progress, daysLeft: number): number | null {
  const left = pagesLeft({ current, total });
  if (left === null || daysLeft <= 0) return null;
  return Math.ceil(left / daysLeft);
}
