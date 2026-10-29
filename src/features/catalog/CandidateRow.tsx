import type { Candidate } from "../../lib/catalog";
import { identity } from "./identity";
export function CandidateRow({
  candidate,
  saved,
  saving,
  save,
}: {
  candidate: Candidate;
  saved: Set<string>;
  saving: string | null;
  save: (candidate: Candidate) => Promise<boolean>;
}) {
  const key = identity(candidate);
  const added = saved.has(key);
  return (
    <li className="catalog-row">
      <div className="catalog-cover" aria-hidden="true">
        {candidate.coverUrl ? (
          <img
            src={candidate.coverUrl}
            alt=""
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : (
          <span>No cover</span>
        )}
      </div>
      <div className="catalog-copy">
        <h3>{candidate.title}</h3>
        {candidate.author ? <p>{candidate.author}</p> : null}
        <p className="muted">{candidate.publisher ?? "Publisher unknown"}</p>
        <p className="catalog-numbers">
          {candidate.year ?? "Year unknown"} ·{" "}
          {candidate.pages ? `${candidate.pages} pages` : "Pages unknown"}
        </p>
        <p className="catalog-source">
          {candidate.source}
          {candidate.language ? ` · ${candidate.language}` : ""}
        </p>
        <button
          type="button"
          className="quiet save-action"
          disabled={added || saving !== null}
          onClick={() => {
            void save(candidate);
          }}
        >
          {added ? "Added" : saving === key ? "Saving" : "Save"}
        </button>
      </div>
    </li>
  );
}
