import type { Candidate } from "../../lib/catalog";
import { CandidateRow } from "./CandidateRow";
export function CandidateList({
  searching,
  searched,
  errors,
  candidates,
  saved,
  saving,
  save,
  selectTab,
}: {
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
      {searching ? (
        <p className="empty-state muted">Searching Google Books and Open Library.</p>
      ) : null}
      {errors.map((error) => (
        <p className="catalog-message" key={error}>
          {error}
        </p>
      ))}
      {!searching && candidates.length === 0 ? (
        <div className="empty-state">
          <p>
            {searched
              ? errors.length
                ? "No catalogue results are available right now."
                : "No catalogue matches for this search."
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
