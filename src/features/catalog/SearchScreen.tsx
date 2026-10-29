import type { SupabaseClient, User } from "@supabase/supabase-js";
import { CandidateList } from "./CandidateList";
import { EntryTabs } from "./EntryTabs";
import { ManualForm } from "./ManualForm";
import { SearchForm } from "./SearchForm";
import { useCatalogue } from "./useCatalogue";
export function SearchScreen({
  user,
  client,
  signOut,
}: {
  user: User;
  client: SupabaseClient;
  signOut: () => void;
}) {
  const flow = useCatalogue(user, client);
  const { tab, selectTab, count, message } = flow;
  return (
    <main className="shell catalog">
      <header className="topbar">
        <span className="brand">Quire</span>
        <span className="book-count" role="status">
          {count === null ? "Loading books" : `${count} ${count === 1 ? "book" : "books"}`}
        </span>
        <button
          type="button"
          className="quiet"
          onClick={() => {
            signOut();
          }}
        >
          Sign out
        </button>
      </header>
      <h1>Add a book</h1>
      <EntryTabs tab={tab} selectTab={selectTab} />
      <section
        id="search-panel"
        role="tabpanel"
        aria-labelledby="search-tab"
        hidden={tab !== "search"}
      >
        <SearchForm {...flow} />
        <CandidateList {...flow} />
      </section>
      <section
        id="manual-panel"
        role="tabpanel"
        aria-labelledby="manual-tab"
        hidden={tab !== "manual"}
      >
        <ManualForm {...flow} />
      </section>
      <p className="catalog-message" role="status">
        {message}
      </p>
    </main>
  );
}
