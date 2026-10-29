import { type LogResult, logPages, type PageLog, type PageLogClient } from "./log";

export type LogStatus = "idle" | "undo" | "queued" | "saving" | "saved" | "error";
export type LogSnapshot = {
  current: number;
  pagesToday: number;
  status: LogStatus;
  pending: PageLog | null;
  result: LogResult | null;
  error: string | null;
};
type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;
export type PageLogOptions = {
  client: PageLogClient;
  bookId: string;
  current: number;
  pagesToday: number;
  day: string;
  online?: () => boolean;
  storage?: Storage;
};

export function createPageLogStore(options: PageLogOptions) {
  const { client, bookId, day, storage } = options;
  const key = `quire:page-log:${bookId}`;
  const online = options.online ?? (() => navigator.onLine);
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let undoUntil = 0;
  let state: LogSnapshot = {
    current: options.current,
    pagesToday: options.pagesToday,
    status: "idle",
    pending: null,
    result: null,
    error: null,
  };
  try {
    const raw = storage?.getItem(key);
    const saved: unknown = raw ? JSON.parse(raw) : null;
    if (
      saved &&
      typeof saved === "object" &&
      "bookId" in saved &&
      saved.bookId === bookId &&
      "pages" in saved &&
      typeof saved.pages === "number" &&
      Number.isInteger(saved.pages) &&
      saved.pages > 0 &&
      saved.pages <= 2_147_483_647 &&
      "day" in saved &&
      typeof saved.day === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(saved.day)
    ) {
      const pending = saved as PageLog;
      state = {
        ...state,
        pending,
        current: state.current + pending.pages,
        pagesToday: state.pagesToday + (pending.day === day ? pending.pages : 0),
        status: "queued",
      };
    }
  } catch {
    // Storage may be unavailable in private browsing; the mounted queue still works.
  }
  function update(next: Partial<LogSnapshot>) {
    state = { ...state, ...next };
    for (const listener of listeners) listener();
  }
  function persist(entry: PageLog | null) {
    try {
      if (entry) storage?.setItem(key, JSON.stringify(entry));
      else storage?.removeItem(key);
    } catch {
      // Network retry remains available when browser storage is full.
    }
  }
  async function retry() {
    const entry = state.pending;
    if (!entry || state.status === "saving" || state.status === "undo") return;
    if (!online()) {
      update({ status: "queued" });
      return;
    }
    update({ status: "saving", error: null });
    try {
      const result = await logPages(client, entry);
      persist(null);
      update({ status: "saved", pending: null, result });
    } catch (error) {
      update({
        status: "queued",
        error: error instanceof Error ? error.message : "Could not save pages.",
      });
    }
  }
  function log(pages: number) {
    if (state.pending || !Number.isInteger(pages) || pages <= 0 || pages > 2_147_483_647) return;
    const pending = { bookId, pages, day };
    persist(pending);
    update({
      pending,
      current: state.current + pages,
      pagesToday: state.pagesToday + pages,
      status: "undo",
      error: null,
    });
    undoUntil = Date.now() + 5000;
    resume();
  }
  function resume() {
    clearTimeout(timer);
    if (state.status === "undo") {
      timer = setTimeout(
        () => {
          update({ status: "queued" });
          void retry();
        },
        Math.max(0, undoUntil - Date.now()),
      );
    } else {
      void retry();
    }
  }
  function undo() {
    if (state.status !== "undo" || !state.pending) return;
    clearTimeout(timer);
    const pages = state.pending.pages;
    persist(null);
    update({
      current: state.current - pages,
      pagesToday: state.pagesToday - pages,
      pending: null,
      status: "idle",
      error: null,
    });
  }
  return {
    resume,
    pause: () => clearTimeout(timer),
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    log,
    undo,
    retry,
  };
}
