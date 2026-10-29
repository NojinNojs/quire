export function ErrorPanel({
  messages,
  retry,
  onManual,
}: {
  messages: string[];
  retry: () => void;
  onManual?: () => void;
}) {
  return (
    <div className="error-panel" role="alert">
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
      <div className="state-actions">
        <button className="quiet" type="button" onClick={retry}>
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
