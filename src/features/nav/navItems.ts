import type { ComponentType } from "react";
import {
  type IconProps,
  JournalIcon,
  ReadingYearIcon,
  SearchIcon,
  ShelfIcon,
  TodayIcon,
} from "../../components/icons";
import type { Route } from "./routes";

export type NavDestination = "today" | "shelf" | "search" | "journal" | "stats";

export type NavGroupId = "library" | "insights";

export type NavItem = {
  route: NavDestination;
  label: string;
  Icon: ComponentType<IconProps>;
};

/** The mobile dock keeps one slot per primary reading destination. */
export const destinations: NavItem[] = [
  { route: "today", label: "Today", Icon: TodayIcon },
  { route: "shelf", label: "Collection", Icon: ShelfIcon },
  { route: "search", label: "Add book", Icon: SearchIcon },
];

/** Records are direct rail links on desktop and live under More on phones. */
export const recordDestinations: NavItem[] = [
  { route: "journal", label: "Journal", Icon: JournalIcon },
  { route: "stats", label: "Reading year", Icon: ReadingYearIcon },
];

export const navGroups: { id: NavGroupId; label: string; items: NavItem[] }[] = [
  { id: "library", label: "Library", items: destinations },
  { id: "insights", label: "Insights", items: recordDestinations },
];

export function activeDestination(route: Route): NavDestination | null {
  if (typeof route === "object") return "shelf";
  if (route === "settings") return null;
  return route;
}

/**
 * Dock column for the current route. Journal, Reading year and account routes
 * have no dock slot, so the mobile glider hides instead of pointing at Today.
 */
export function destinationIndex(route: Route): number {
  const active = activeDestination(route);
  return active ? dockSlot(active) : -1;
}

export function dockSlot(destination: NavDestination): number {
  return destinations.findIndex((item) => item.route === destination);
}

export type RouteContext = {
  group: "Library" | "Insights" | "Account";
  label: string;
};

export function routeContext(route: Route): RouteContext {
  if (typeof route === "object") return { group: "Library", label: "Book" };
  switch (route) {
    case "shelf":
      return { group: "Library", label: "Collection" };
    case "search":
      return { group: "Library", label: "Add book" };
    case "settings":
      return { group: "Account", label: "Settings" };
    case "journal":
      return { group: "Insights", label: "Journal" };
    case "stats":
      return { group: "Insights", label: "Reading year" };
    default:
      return { group: "Library", label: "Today" };
  }
}
