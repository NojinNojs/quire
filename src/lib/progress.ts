export type Progress = {
  current: number;
  total: number | null;
};

/** Pages left, or null when the edition has no recorded page count. Never invents a denominator. */
export function pagesLeft({ current, total }: Progress): number | null {
  if (total === null) return null;
  return Math.max(total - current, 0);
}

/** Rounded reading percentage, reserving 100% for the final page. */
export function percent({ current, total }: Progress): number | null {
  if (total === null || total <= 0) return null;
  if (current >= total) return 100;
  return Math.min(99, Math.max(0, Math.round((current / total) * 100)));
}

/** Pages per day needed to finish by a date, or null when the total is unknown. */
export function pacePerDay({ current, total }: Progress, daysLeft: number): number | null {
  const left = pagesLeft({ current, total });
  if (left === null || daysLeft <= 0) return null;
  return Math.ceil(left / daysLeft);
}
