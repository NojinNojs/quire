import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { listBooks } from "../../data/books";
import { loadProfile } from "../../data/profile";
import { loadReadingHistory } from "../../data/readingHistory";
import { TodayDashboard } from "../reading/TodayDashboard";
import { TodayScreen } from "../reading/TodayScreen";
import { usePageLog } from "../reading/usePageLog";
import { ErrorPanel } from "../states/ErrorPanel";
import { SkeletonRows } from "../states/SkeletonRows";
import { openCatalogue } from "./ShelfRoute";
import { useLoad } from "./useLoad";
import { type ReadingData, readingDay, useReading } from "./useReading";

function ActiveReading({
  client,
  data,
  day,
  onSaved,
}: {
  client: SupabaseClient;
  data: ReadingData;
  day: string;
  onSaved: () => void;
}) {
  const pageLog = usePageLog({
    client,
    bookId: data.book.id,
    current: data.current,
    pagesToday: data.pagesToday,
    day,
    snapshotDay: data.day,
  });
  const previous = useRef(pageLog.status);
  useEffect(() => {
    if (pageLog.status === "saved" && previous.current !== "saved") onSaved();
    previous.current = pageLog.status;
  }, [pageLog.status, onSaved]);
  return (
    <TodayScreen
      book={data.book}
      streak={data.streak}
      pageLog={pageLog}
      loadingDay={data.day !== day}
      onCatalogue={openCatalogue}
    />
  );
}

export function TodayRoute({ client, owner }: { client: SupabaseClient; owner: string }) {
  const [day, setDay] = useState(readingDay);
  useEffect(() => {
    const update = () => setDay(readingDay());
    window.addEventListener("focus", update);
    const timer = window.setInterval(update, 60_000);
    return () => {
      window.removeEventListener("focus", update);
      window.clearInterval(timer);
    };
  }, []);
  const reading = useReading(client, owner, day);
  const lastReading = useRef<{ owner: string; data: ReadingData } | null>(null);
  if (lastReading.current?.owner !== owner) lastReading.current = null;
  if (reading.data) lastReading.current = { owner, data: reading.data };
  const visibleReading =
    reading.data ?? (reading.loading || reading.error ? lastReading.current?.data : null);
  const load = useCallback(async () => {
    const [profile, books, logs] = await Promise.all([
      loadProfile(client, owner),
      listBooks(client, owner),
      loadReadingHistory(client, owner, `${day.slice(0, 4)}-01-01`, day),
    ]);
    return { profile, books, logs };
  }, [client, owner, day]);
  const summary = useLoad(load);
  const active = visibleReading ? (
    <>
      <ActiveReading
        key={`${owner}:${visibleReading.book.id}`}
        client={client}
        data={visibleReading}
        day={day}
        onSaved={summary.retry}
      />
      {reading.error && <ErrorPanel messages={[reading.error]} retry={reading.retry} />}
    </>
  ) : reading.loading ? (
    <SkeletonRows label="Loading your reading" />
  ) : reading.error ? (
    <ErrorPanel messages={[reading.error]} retry={reading.retry} />
  ) : (
    <section className="reading-empty">
      <p>No active book. Choose one from your collection.</p>
      <a href="#/shelf">Choose a book</a> <a href="#/search">Add a book</a>
    </section>
  );
  const summaryState = summary.loading ? (
    <SkeletonRows label="Loading your reading summary" />
  ) : summary.error ? (
    <ErrorPanel messages={[summary.error]} retry={summary.retry} />
  ) : null;
  return (
    <main className="integration-screen">
      <TodayDashboard
        day={day}
        profile={summary.data?.profile ?? null}
        books={summary.data?.books ?? []}
        logs={summary.data?.logs ?? []}
        summaryState={summaryState}
      >
        {active}
      </TodayDashboard>
    </main>
  );
}
