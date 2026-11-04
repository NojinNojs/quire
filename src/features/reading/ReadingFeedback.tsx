import { RetryIcon, UndoIcon } from "../../components/icons";
import { plural } from "../../lib/plural";
import type { LogSnapshot } from "./pageLogStore";

export function ReadingFeedback({
  pageLog,
}: {
  pageLog: Pick<LogSnapshot, "status" | "pending" | "error"> & {
    undo: () => void;
    retry: () => unknown;
  };
}) {
  const { status, pending, error } = pageLog;
  if (status === "idle" && !error) return null;
  const message =
    status === "undo" && pending
      ? `${plural(pending.pages, "page")} added. Saving in 5 seconds.`
      : status === "queued"
        ? "Pages queued. Retry when you are online."
        : status === "saving"
          ? "Saving pages..."
          : status === "error"
            ? "Pages not saved."
            : "Pages logged.";
  return (
    <div className="reading-feedback" data-state={status}>
      <p role="status">{message}</p>
      <div className="reading-feedback-actions">
        {status === "undo" && (
          <button className="secondary" type="button" onClick={pageLog.undo}>
            <UndoIcon />
            Undo
          </button>
        )}
        {status === "queued" && (
          <button className="secondary" type="button" onClick={() => pageLog.retry()}>
            <RetryIcon />
            Retry
          </button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
