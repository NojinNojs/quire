import { UndoIcon } from "../../components/icons";

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
        <button className="quiet" type="button" onClick={() => setResetting(true)}>
          Reset demo
        </button>
        <button className="quiet" type="button" onClick={leave}>
          Leave demo
        </button>
      </div>
      {resetting && (
        <fieldset className="demo-reset" aria-label="Confirm reset">
          <p>Replace your demo changes with the sample library?</p>
          <button className="secondary" type="button" onClick={reset}>
            <UndoIcon />
            Reset sample library
          </button>
          <button className="quiet" type="button" onClick={() => setResetting(false)}>
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
