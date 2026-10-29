import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback } from "react";
import type { Book } from "../../data/types";
import type { ReadingBook, ReadingStreak } from "../reading/TodayScreen";
import { useLoad } from "./useLoad";

export type ReadingClient = Pick<SupabaseClient, "from">;
export type ReadingData = {
  book: ReadingBook;
  streak: ReadingStreak;
  current: number;
  pagesToday: number;
};

export function readingDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function loadReading(
  client: ReadingClient,
  owner: string,
  day: string,
): Promise<ReadingData | null> {
  const [active, streak] = await Promise.all([
    client.from("books").select("*").eq("owner", owner).eq("status", "reading").maybeSingle(),
    client.from("streaks").select("current,longest").eq("owner", owner).maybeSingle(),
  ]);
  if (active.error || streak.error) throw new Error("Could not load your reading. Try again.");
  if (!active.data || !streak.data) return null;
  const book = active.data as Book;
  const progress: { book_id: string; day: string; pages: number }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await client
      .from("progress_log")
      .select("book_id,day,pages")
      .eq("owner", owner)
      .lte("day", day)
      .order("id")
      .range(offset, offset + 999);
    if (result.error || !result.data)
      throw new Error("Could not load your reading progress. Try again.");
    progress.push(...result.data);
    if (result.data.length < 1000) break;
  }
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${day}T12:00:00`);
    date.setDate(date.getDate() - 6 + index);
    const value = readingDay(date);
    return { day: value, read: progress.some((log) => log.day === value && log.pages > 0) };
  });
  const logs = progress.filter((log) => log.book_id === book.id);
  return {
    book: {
      id: book.id,
      title: book.title,
      author: book.author,
      editionLine: [book.publisher, book.year, book.edition]
        .filter((value) => value !== null)
        .join(" · "),
      coverUrl: book.cover_url,
      ddc: book.ddc,
      total: book.pages,
    },
    streak: { current: streak.data.current, longest: streak.data.longest, days },
    current: logs.reduce((sum, log) => sum + log.pages, 0),
    pagesToday: logs.filter((log) => log.day === day).reduce((sum, log) => sum + log.pages, 0),
  };
}

export function useReading(client: ReadingClient, owner: string, day = readingDay()) {
  const load = useCallback(() => loadReading(client, owner, day), [client, owner, day]);
  return useLoad(load);
}
