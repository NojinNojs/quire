import type { BooksClient } from "./books";

export type ReadingLog = { id: string; book_id: string; day: string; pages: number };

export async function loadReadingHistory(
  client: BooksClient,
  owner: string,
  from: string,
  through: string,
): Promise<ReadingLog[]> {
  const logs: ReadingLog[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client
      .from("progress_log")
      .select("id,book_id,day,pages")
      .eq("owner", owner)
      .gte("day", from)
      .lte("day", through)
      .order("day")
      .order("id")
      .range(offset, offset + 999);
    if (error || !data) throw new Error("Could not load reading history. Try again.");
    logs.push(...(data as ReadingLog[]));
    if (data.length < 1000) return logs;
  }
}
