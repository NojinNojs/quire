import type { Candidate } from "../../lib/catalog";
import { CoverImage } from "../covers/CoverImage";
import { identity } from "./identity";
export function CandidateRow({
  candidate,
  saved,
  saving,
  save,
  editCandidate,
}: {
  candidate: Candidate;
  saved: Set<string>;
  saving: string | null;
  editCandidate?: (candidate: Candidate) => void;
  save: (candidate: Candidate) => Promise<boolean>;
}) {
  const key = identity(candidate);
  const added = saved.has(key);
  return (
    <li className="catalog-row">
      <CoverImage coverUrl={candidate.coverUrl} title={candidate.title} className="catalog-cover" />
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
            if (candidate.source === "Google Books (metadata only)" && editCandidate) {
              editCandidate(candidate);
            } else {
              void save(candidate);
            }
          }}
        >
          {added
            ? "Added"
            : saving === key
              ? "Saving"
              : candidate.source === "Google Books (metadata only)"
                ? "Add details"
                : "Save"}
        </button>
      </div>
    </li>
  );
}
