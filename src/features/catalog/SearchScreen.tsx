import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ScanIcon } from "../../components/icons";
import type { ScanRequest } from "../scan/useScanRequest";
import { ErrorPanel } from "../states/ErrorPanel";
import { SkeletonRows } from "../states/SkeletonRows";
import { CandidateList } from "./CandidateList";
import { EntryTabs } from "./EntryTabs";
import { ManualForm } from "./ManualForm";
import { SearchForm } from "./SearchForm";
import { useCatalogue } from "./useCatalogue";
export function SearchScreen({
  user,
  client,
  signOut,
  onScan,
  scanRequest,
  onScanHandled,
}: {
  user: User;
  client: SupabaseClient;
  signOut: () => void;
  onScan?: () => void;
  scanRequest?: ScanRequest | null;
  onScanHandled?: (nonce: number) => void;
}) {
  const flow = useCatalogue(user, client, scanRequest, onScanHandled);
  const { tab, selectTab, count, message } = flow;
  return (
    <main className="shell catalog">
      <header className="catalog-head">
        <div className="catalog-heading">
          <h1>Add a book</h1>
          <p className="catalog-lead">
            Search both catalogues, or enter the edition you own by hand.
          </p>
        </div>
        <div className="catalog-head-actions">
          <span className="book-count" role="status">
            {count === null
              ? flow.countLoading
                ? "Counting books"
                : "Book count unavailable"
              : `${count} ${count === 1 ? "book" : "books"}`}
          </span>
          {onScan && (
            <button className="secondary" type="button" onClick={onScan}>
              <ScanIcon />
              Scan ISBN
            </button>
          )}
          <button
            type="button"
            className="quiet"
            onClick={() => {
              signOut();
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      {flow.countLoading ? <SkeletonRows label="Counting your books" /> : null}
      {flow.countError ? (
        <ErrorPanel
          messages={[flow.countError]}
          retry={() => {
            void flow.refreshCount();
          }}
          onManual={() => selectTab("manual")}
        />
      ) : null}
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
        <ManualForm key={JSON.stringify(flow.manualDraft)} {...flow} />
      </section>
      {flow.saving ? <SkeletonRows label="Saving your book" /> : null}
      {flow.saveError ? (
        <ErrorPanel
          messages={[flow.saveError.message]}
          retry={flow.retrySave}
          onManual={() => selectTab("manual")}
          announce={flow.saveError.kind === "duplicate"}
        />
      ) : null}
      <p className="catalog-message" role="status">
        {message}
      </p>
    </main>
  );
}
