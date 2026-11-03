export type Route =
  | "today"
  | "shelf"
  | "search"
  | "settings"
  | "journal"
  | "stats"
  | { name: "book"; id: string };

export function parseRoute(hash: string): Route {
  const book = /^#\/book\/([^/]+)$/.exec(hash);
  if (book?.[1] !== undefined) return { name: "book", id: book[1] };
  switch (hash) {
    case "#/journal":
      return "journal";
    case "#/stats":
      return "stats";
    case "#/shelf":
      return "shelf";
    case "#/search":
    case "#catalogue":
      return "search";
    case "#/settings":
    case "#settings":
      return "settings";
    case "#/today":
      return "today";
    default:
      return "today";
  }
}
