import { useEffect, useRef, useState } from "react";
import type { ReaderProfile } from "../../data/profile";
import type { Book } from "../../data/types";
import { createDemoState, type DemoState, demoKey, loadDemoState } from "./state";

export function useDemoState() {
  const [state, setState] = useState(() => {
    try {
      return loadDemoState(window.localStorage);
    } catch {
      return createDemoState();
    }
  });
  const latest = useRef(state);
  latest.current = state;
  const [storageFailed, setStorageFailed] = useState(false);
  useEffect(() => {
    try {
      window.localStorage.setItem(demoKey, JSON.stringify(state));
      setStorageFailed(false);
    } catch {
      setStorageFailed(true);
    }
  }, [state]);
  useEffect(() => {
    if (!state.pending) return;
    const timer = window.setTimeout(
      () => setState((value) => ({ ...value, pending: null })),
      Math.max(0, state.pending.until - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [state.pending]);
  async function persist(change: (current: DemoState) => DemoState) {
    const next = change(latest.current);
    try {
      window.localStorage.setItem(demoKey, JSON.stringify(next));
      latest.current = next;
      setStorageFailed(false);
      setState(next);
    } catch {
      setStorageFailed(true);
      throw new Error(
        "Could not save on this device. Your draft is kept; enable browser storage and try again.",
      );
    }
  }
  return {
    state,
    setState,
    persist,
    storageFailed,
    saveProfile: (profile: Pick<ReaderProfile, "display_name" | "annual_goal">) =>
      persist((current) => ({ ...current, profile })),
    updateBook: (id: string, patch: Partial<Book>) =>
      persist((current) => ({
        ...current,
        books: current.books.map((book) => (book.id === id ? { ...book, ...patch } : book)),
      })),
  };
}
