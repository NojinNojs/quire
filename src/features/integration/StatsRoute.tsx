import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useState } from "react";
import { listBooks } from "../../data/books";
import { loadProfile } from "../../data/profile";
import { loadReadingHistory } from "../../data/readingHistory";
import { ErrorPanel } from "../states/ErrorPanel";
import { SkeletonRows } from "../states/SkeletonRows";
import { StatsScreen } from "../stats/StatsScreen";
import { useLoad } from "./useLoad";

export function StatsRoute({ client, owner }: { client: SupabaseClient; owner: string }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const prefix = String(year).padStart(4, "0");
  const load = useCallback(async () => {
    const [books, logs, profile] = await Promise.all([
      listBooks(client, owner),
      loadReadingHistory(client, owner, `${prefix}-01-01`, `${prefix}-12-31`),
      loadProfile(client, owner),
    ]);
    return { books, logs, profile };
  }, [client, owner, prefix]);
  const { data, loading, error, retry } = useLoad(load);
  return (
    <main className="integration-screen">
      {loading ? (
        <SkeletonRows label="Loading reading year" />
      ) : error ? (
        <ErrorPanel messages={[error]} retry={retry} />
      ) : (
        data && <StatsScreen {...data} year={year} setYear={setYear} currentYear={currentYear} />
      )}
    </main>
  );
}
