import type { SupabaseClient } from "@supabase/supabase-js";
import { TodayScreen } from "../reading/TodayScreen";
import { usePageLog } from "../reading/usePageLog";
import { ErrorPanel } from "../states/ErrorPanel";
import { SkeletonRows } from "../states/SkeletonRows";
import { openCatalogue } from "./ShelfRoute";
import { type ReadingData, readingDay, useReading } from "./useReading";

function ActiveReading({
  client,
  data,
  day,
}: {
  client: SupabaseClient;
  data: ReadingData;
  day: string;
}) {
  const pageLog = usePageLog({
    client,
    bookId: data.book.id,
    current: data.current,
    pagesToday: data.pagesToday,
    day,
  });
  return (
    <TodayScreen
      book={data.book}
      streak={data.streak}
      pageLog={pageLog}
      onCatalogue={openCatalogue}
    />
  );
}

export function TodayRoute({ client, owner }: { client: SupabaseClient; owner: string }) {
  const day = readingDay();
  const { data, loading, error, retry } = useReading(client, owner, day);
  return (
    <main className="integration-screen">
      {loading ? (
        <div className="shell">
          <h1>Today</h1>
          <SkeletonRows label="Loading your reading" />
        </div>
      ) : error ? (
        <div className="shell">
          <h1>Today</h1>
          <ErrorPanel messages={[error]} retry={retry} />
        </div>
      ) : data ? (
        <ActiveReading
          key={`${owner}:${data.book.id}:${day}`}
          client={client}
          data={data}
          day={day}
        />
      ) : (
        <section className="reading" aria-label="Today">
          <h1>Today</h1>
          <div className="reading-empty">
            <p>Choose a book from the catalogue to start reading.</p>
            <button className="reading-primary" type="button" onClick={openCatalogue}>
              Browse catalogue
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
