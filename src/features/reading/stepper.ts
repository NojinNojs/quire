const MAX_PAGES = 2_147_483_647;

export function pageAmount(value: number, current: number, total: number | null): number {
  const limit = total === null ? MAX_PAGES - current : Math.max(0, total - current);
  return Math.min(limit, Math.max(0, Number.isFinite(value) ? Math.trunc(value) : 0));
}

export function stepPages(value: number, step: number, current: number, total: number | null) {
  return pageAmount(value + step, current, total);
}

export function previewPages(current: number, amount: number): string {
  return `${current} -> ${current + amount}`;
}
