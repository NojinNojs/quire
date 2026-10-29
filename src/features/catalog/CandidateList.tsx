import type { Candidate } from "../../lib/catalog";
import { ErrorPanel } from "../states/ErrorPanel";
import { SkeletonRows } from "../states/SkeletonRows";
import { CandidateRow } from "./CandidateRow";
export function CandidateList({
  run,
  searching,
  searched,
  errors,
  candidates,
  saved,
  saving,
  save,
  selectTab,
}: {
  run: () => Promise<void>;
  searching: boolean;
  searched: boolean;
  errors: string[];
  candidates: Candidate[];
  saved: Set<string>;
  saving: string | null;
  save: (candidate: Candidate) => Promise<boolean>;
  selectTab: (tab: "search" | "manual") => void;
}) {
  return (
    <div aria-live="polite" aria-busy={searching}>
      {searching ? <SkeletonRows label="Searching Google Books and Open Library" /> : null}
      {errors.length ? (
        <ErrorPanel
          messages={errors}
          retry={() => {
            void run();
          }}
          onManual={() => selectTab("manual")}
        />
      ) : null}
      {!searching && errors.length === 0 && candidates.length === 0 ? (
        <div className="empty-state">
          <p>
            {searched
              ? "No catalogue matches for this search."
              : "Search for the edition you own, or enter it manually."}
          </p>
          <button type="button" className="quiet" onClick={() => selectTab("manual")}>
            Enter manually
          </button>
        </div>
      ) : null}
      {candidates.length ? (
        <>
          <h2 className="results-heading">Catalogue candidates</h2>
          <p className="muted">Check the edition before saving.</p>
          <ul className="catalog-results">
            {candidates.map((candidate) => (
              <CandidateRow
                key={JSON.stringify(candidate)}
                candidate={candidate}
                saved={saved}
                saving={saving}
                save={save}
              />
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
