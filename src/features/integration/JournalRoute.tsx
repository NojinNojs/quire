import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useState } from "react";
import { listBooks } from "../../data/books";
import { loadReadingHistory } from "../../data/readingHistory";
import { JournalScreen } from "../journal/JournalScreen";
import { ErrorPanel } from "../states/ErrorPanel";
import { SkeletonRows } from "../states/SkeletonRows";
import { useLoad } from "./useLoad";

export function JournalRoute({ client, owner }: { client: SupabaseClient; owner: string }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const prefix = String(year).padStart(4, "0");
  const load = useCallback(async () => {
    const [books, logs] = await Promise.all([
      listBooks(client, owner),
      loadReadingHistory(client, owner, `${prefix}-01-01`, `${prefix}-12-31`),
    ]);
    return { books, logs };
  }, [client, owner, prefix]);
  const { data, loading, error, retry } = useLoad(load);
  return (
    <main className="integration-screen">
      {loading ? (
        <SkeletonRows label="Loading reading journal" />
      ) : error ? (
        <ErrorPanel messages={[error]} retry={retry} />
      ) : (
        data && <JournalScreen {...data} year={year} setYear={setYear} currentYear={currentYear} />
      )}
    </main>
  );
}
