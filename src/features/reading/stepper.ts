const MAX_PAGES = 2_147_483_647;

export function pageLimit(current: number, total: number | null): number {
  return Math.max(0, (total ?? MAX_PAGES) - current);
}

export function pageAmount(value: number, current: number, total: number | null): number {
  return Math.min(
    pageLimit(current, total),
    Math.max(0, Number.isFinite(value) ? Math.trunc(value) : 0),
  );
}

export function stepPages(value: number, step: number, current: number, total: number | null) {
  return pageAmount(value + step, current, total);
}
