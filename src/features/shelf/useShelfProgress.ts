import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export function useShelfProgress(ids: string[]) {
  const key = JSON.stringify(ids);
  const [snapshot, setSnapshot] = useState<{ key: string; pages: Record<string, number> } | null>(
    null,
  );
  useEffect(() => {
    const client = supabase;
    const bookIds: string[] = JSON.parse(key);
    if (!client || !bookIds.length) return;
    let live = true;
    void (async () => {
      const pages: Record<string, number> = Object.fromEntries(bookIds.map((id) => [id, 0]));
      for (let offset = 0; ; offset += 1000) {
        const result = await client
          .from("progress_log")
          .select("book_id,pages")
          .in("book_id", bookIds)
          .order("id")
          .range(offset, offset + 999);
        if (result.error || !result.data) return;
        for (const log of result.data) pages[log.book_id] = (pages[log.book_id] ?? 0) + log.pages;
        if (result.data.length < 1000) break;
      }
      if (live) setSnapshot({ key, pages });
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, [key]);
  return snapshot?.key === key ? snapshot.pages : {};
}
