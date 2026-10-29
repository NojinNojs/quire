export type PageLog = { bookId: string; pages: number; day: string };
export type LogResult = { streak_current: number; streak_longest: number; restored: boolean };
export type PageLogClient = {
  rpc: (
    name: "log_pages",
    args: { p_book: string; p_pages: number; p_day: string },
  ) => PromiseLike<{ data: LogResult[] | null; error: { message: string } | null }>;
};

export async function logPages(client: PageLogClient, entry: PageLog): Promise<LogResult> {
  const { data, error } = await client.rpc("log_pages", {
    p_book: entry.bookId,
    p_pages: entry.pages,
    p_day: entry.day,
  });
  if (error) throw new Error(error.message);
  const result = data?.[0];
  if (!result) throw new Error("No page log confirmation received.");
  return result;
}
