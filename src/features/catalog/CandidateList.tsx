import type { Candidate } from "../../lib/catalog";
import { SkeletonRows } from "../states/SkeletonRows";
import { CandidateRow } from "./CandidateRow";
export function CandidateList({
  cacheNotice,
  searching,
  searched,
  errors,
  candidates,
  saved,
  saving,
  save,
  selectTab,
  editCandidate,
}: {
  cacheNotice?: string;
  searching: boolean;
  searched: boolean;
  errors: string[];
  candidates: Candidate[];
  saved: Set<string>;
  saving: string | null;
  save: (candidate: Candidate) => Promise<boolean>;
  editCandidate?: (candidate: Candidate) => void;
  selectTab: (tab: "search" | "manual") => void;
}) {
  return (
    <div aria-live="polite" aria-busy={searching}>
      {searching ? <SkeletonRows label="Searching Google Books and Open Library" /> : null}
      {!searching && errors.length && !candidates.length ? (
        <div className="error-panel" role="alert">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
          <button className="primary" type="button" onClick={() => selectTab("manual")}>
            Enter it manually
          </button>
        </div>
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
          {cacheNotice ? <p role="status">{cacheNotice}</p> : null}
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
                editCandidate={editCandidate}
              />
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
