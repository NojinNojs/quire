import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback } from "react";
import { listBooks } from "../../data/books";
import { ShelfScreen } from "../shelf/ShelfScreen";
import { useLoad } from "./useLoad";

export const openCatalogue = () => {
  window.location.hash = "/search";
};

export function ShelfRoute({ client, owner }: { client: SupabaseClient; owner: string }) {
  const load = useCallback(() => listBooks(client, owner), [client, owner]);
  const { data, loading, error, retry } = useLoad(load);
  return (
    <main className="integration-screen">
      <ShelfScreen
        books={data ?? []}
        loading={loading}
        error={error}
        onRetry={retry}
        onAddBook={openCatalogue}
        onSelectBook={() => {
          window.location.hash = "/today";
        }}
      />
    </main>
  );
}
