import { useEffect, useState, useSyncExternalStore } from "react";
import { createPageLogStore, type PageLogOptions } from "./pageLogStore";

/** Mount once per active book and reader, using a key when that identity changes. */
export function usePageLog(options: PageLogOptions) {
  const [store] = useState(() =>
    createPageLogStore({
      ...options,
      storage: options.storage ?? browserStorage(),
    }),
  );
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => {
    const retry = () => {
      void store.retry();
    };
    window.addEventListener("online", retry);
    store.resume();
    return () => {
      window.removeEventListener("online", retry);
      store.pause();
    };
  }, [store]);
  return { ...snapshot, log: store.log, undo: store.undo, retry: store.retry };
}

function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
