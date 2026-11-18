import { Toast } from "@base-ui/react/toast";
import { useEffect, useId, useRef } from "react";
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
  const { add, close } = Toast.useToastManager();
  const id = useId();
  const beganWrite = useRef(false);
  const { status, error } = pageLog;
  const pendingPages = pageLog.pending?.pages;
  const undo = status === "undo" ? pageLog.undo : undefined;
  const retry = status === "queued" ? pageLog.retry : undefined;

  useEffect(() => {
    if (status === "idle" || (status === "saved" && !beganWrite.current)) {
      beganWrite.current = false;
      close(id);
      return;
    }
    beganWrite.current = true;

    const failed = Boolean(error) || status === "error";
    const title =
      undo && pendingPages !== undefined
        ? `${plural(pendingPages, "page")} added. Saving in 5 seconds.`
        : failed
          ? "Pages not saved."
          : status === "queued"
            ? "Pages queued. Retry when you are online."
            : status === "saving"
              ? "Saving pages..."
              : "Pages logged.";

    add({
      id,
      title,
      description: error,
      type: failed ? "error" : "success",
      timeout: ["undo", "queued", "saving"].includes(status) ? 0 : 5000,
      priority: failed ? "high" : "low",
      actionProps: undo
        ? {
            children: "Undo",
            onClick: () => {
              beganWrite.current = false;
              undo();
            },
          }
        : retry
          ? { children: "Retry", onClick: retry }
          : undefined,
    });
  }, [add, close, error, id, pendingPages, retry, status, undo]);

  useEffect(
    () => () => {
      close(id);
    },
    [close, id],
  );
  return null;
}
