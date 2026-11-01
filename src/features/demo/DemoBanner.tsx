export function DemoBanner({
  storageFailed,
  resetting,
  setResetting,
  reset,
  leave,
  notice,
}: {
  storageFailed: boolean;
  resetting: boolean;
  setResetting: (value: boolean) => void;
  reset: () => void;
  leave: () => void;
  notice: string;
}) {
  return (
    <aside className="demo-banner" aria-label="Demo mode">
      <p>
        <strong>Interactive demo.</strong>{" "}
        {storageFailed ? "Changes last for this visit only." : "Changes stay on this device."}
      </p>
      <div className="demo-banner-actions">
        <button className="demo-link" type="button" onClick={() => setResetting(true)}>
          Reset demo
        </button>
        <button className="demo-link" type="button" onClick={leave}>
          Leave demo
        </button>
      </div>
      {resetting && (
        <fieldset className="demo-reset" aria-label="Confirm reset">
          <p>Replace your demo changes with the sample library?</p>
          <button className="demo-button" type="button" onClick={reset}>
            Reset sample library
          </button>
          <button className="demo-link" type="button" onClick={() => setResetting(false)}>
            Keep changes
          </button>
        </fieldset>
      )}
      <p className="demo-notice" role="status">
        {notice}
      </p>
    </aside>
  );
}
