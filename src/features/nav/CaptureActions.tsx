import { PlusIcon, ScanIcon } from "../../components/icons";
import { Tooltip } from "../../components/tooltip/Tooltip";

/**
 * One capture pair in the header: the plus opens the add form, the barcode
 * corners open the camera. They share a segmented frame so the two ways to add
 * a book read as one control. The scan half only exists when a handler is
 * supplied, so no camera affordance is ever rendered without a scanner. It
 * always names itself — the short word on phones, the full words once the
 * header budget fits them — while the accessible name stays "Scan ISBN".
 */
export function CaptureActions({ onScan }: { onScan?: () => void }) {
  return (
    <div className="shell-capture">
      <Tooltip label="Add book" side="bottom">
        <a className="shell-capture-add" href="#/search" aria-label="Add book">
          <PlusIcon />
        </a>
      </Tooltip>
      {onScan ? (
        <button
          className="shell-capture-scan"
          type="button"
          aria-label="Scan ISBN"
          onClick={onScan}
        >
          <ScanIcon />
          <span className="shell-capture-scan-label" aria-hidden="true">
            Scan
          </span>
          <span className="shell-capture-scan-suffix" aria-hidden="true">
            {" ISBN"}
          </span>
        </button>
      ) : null}
    </div>
  );
}
