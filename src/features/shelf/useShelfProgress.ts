import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Snapshot = {
  key: string;
  attempt: number;
  pages: Record<string, number>;
  error: Error | null;
};

export function useShelfProgressState(ids: string[]) {
  const key = JSON.stringify(ids);
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    const bookIds: string[] = JSON.parse(key);
    if (!bookIds.length) return;
    let live = true;
    void (async () => {
      if (!supabase) throw new Error("Could not load reading progress. Try again.");
      const pages: Record<string, number> = Object.fromEntries(bookIds.map((id) => [id, 0]));
      for (let offset = 0; ; offset += 1000) {
        const result = await supabase
          .from("progress_log")
          .select("book_id,pages")
          .in("book_id", bookIds)
          .order("id")
          .range(offset, offset + 999);
        if (result.error) throw result.error;
        if (!result.data) throw new Error("Reading progress missing");
        for (const log of result.data) pages[log.book_id] = (pages[log.book_id] ?? 0) + log.pages;
        if (result.data.length < 1000) break;
      }
      if (live) setSnapshot({ key, attempt, pages, error: null });
    })().catch((error: unknown) => {
      if (live) {
        setSnapshot({
          key,
          attempt,
          pages: {},
          error:
            error instanceof Error
              ? error
              : new Error(
                  error &&
                    typeof error === "object" &&
                    "message" in error &&
                    typeof error.message === "string"
                    ? error.message
                    : "Could not load reading progress. Try again.",
                ),
        });
      }
    });
    return () => {
      live = false;
    };
  }, [key, attempt]);
  const current = snapshot?.key === key && snapshot.attempt === attempt ? snapshot : null;
  return {
    pages: current?.pages ?? {},
    error: current?.error ?? null,
    loading: ids.length > 0 && !current,
    retry,
  };
}

export function useShelfProgress(ids: string[]) {
  return useShelfProgressState(ids).pages;
}
