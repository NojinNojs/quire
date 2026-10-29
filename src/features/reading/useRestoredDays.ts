import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { restoredDays } from "./restoredDays";

export function useRestoredDays(revision: string) {
  const [restored, setRestored] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    // Refresh after a confirmed log changes the supplied streak.
    void revision;
    const client = supabase;
    if (!client) return;
    let live = true;
    void (async () => {
      const days: string[] = [];
      for (let offset = 0; ; offset += 1000) {
        const result = await client
          .from("progress_log")
          .select("day,pages")
          .order("created_at")
          .order("id")
          .range(offset, offset + 999);
        if (result.error || !result.data) return;
        for (const log of result.data) if (log.pages > 0) days.push(log.day);
        if (result.data.length < 1000) break;
      }
      if (live) setRestored(restoredDays(days));
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, [revision]);
  return restored;
}
