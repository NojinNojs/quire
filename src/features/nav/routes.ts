export type Route = "today" | "shelf" | "search" | "settings";

export function parseRoute(hash: string): Route {
  switch (hash) {
    case "#/shelf":
      return "shelf";
    case "#/search":
    case "#catalogue":
      return "search";
    case "#/settings":
    case "#settings":
      return "settings";
    default:
      return "today";
  }
}
