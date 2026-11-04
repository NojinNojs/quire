import { parseRoute, type Route } from "./routes";

export type CommandRoute = Exclude<Route, { name: "book" }>;

export interface CommandItem {
  route: CommandRoute;
  label: string;
  hash: string;
  keywords: readonly string[];
}

/**
 * Pages the palette can reach. Guide stays out: the tour is a modal of its own
 * and opening it from inside a dialog would fight for the same focus.
 */
export const commandItems: readonly CommandItem[] = [
  {
    route: "today",
    label: "Today",
    hash: "#/today",
    keywords: ["home", "dashboard", "progress", "log pages"],
  },
  {
    route: "shelf",
    label: "Collection",
    hash: "#/shelf",
    keywords: ["shelf", "library", "books", "saved"],
  },
  {
    route: "search",
    label: "Add book",
    hash: "#/search",
    keywords: ["catalogue", "catalog", "isbn", "scan", "find a book"],
  },
  {
    route: "journal",
    label: "Journal",
    hash: "#/journal",
    keywords: ["log", "notes", "history", "days"],
  },
  {
    route: "stats",
    label: "Reading year",
    hash: "#/stats",
    keywords: ["stats", "statistics", "goal", "calendar", "months"],
  },
  {
    route: "settings",
    label: "Settings",
    hash: "#/settings",
    keywords: ["account", "profile", "password", "preferences"],
  },
];

export function filterCommandItems(query: string): CommandItem[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [...commandItems];
  return commandItems.filter((item) =>
    [item.label.toLocaleLowerCase(), ...item.keywords].some((value) => value.includes(needle)),
  );
}

/** Route of the page on screen; a book detail belongs to its Collection. */
export function currentCommandRoute(hash: string): CommandRoute | null {
  const route = parseRoute(hash);
  return typeof route === "object" ? "shelf" : route;
}

/** Next highlighted row for a navigation key, or -1 when nothing can be highlighted. */
export function moveCommandIndex(index: number, key: string, count: number): number {
  if (count < 1) return -1;
  switch (key) {
    case "ArrowDown":
      return index < 0 ? 0 : (index + 1) % count;
    case "ArrowUp":
      return index < 0 ? count - 1 : (index - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return index;
  }
}
