import { RetryIcon } from "../../components/icons";

export function ErrorPanel({
  messages,
  retry,
  onManual,
  announce = true,
}: {
  messages: string[];
  retry: () => void;
  onManual?: () => void;
  announce?: boolean;
}) {
  return (
    <div className="error-panel" role={announce ? "alert" : undefined}>
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
      <div className="state-actions">
        <button className="quiet" type="button" onClick={retry}>
          <RetryIcon />
          Try again
        </button>
        {onManual ? (
          <button className="quiet" type="button" onClick={onManual}>
            Enter manually
          </button>
        ) : null}
      </div>
    </div>
  );
}
