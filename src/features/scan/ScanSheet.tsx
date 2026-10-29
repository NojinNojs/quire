import { useEffect, useId, useRef } from "react";
import "../../styles/scan.css";
import { ScanFallback } from "./ScanFallback";
import { type BarcodeScannerOptions, useBarcodeScanner } from "./useBarcodeScanner";

export interface ScanSheetProps extends BarcodeScannerOptions {
  onClose: () => void;
}

const messages = {
  "asking-permission": "Asking for camera permission…",
  "permission-denied":
    "Camera permission denied. Allow camera access in your browser settings or enter the ISBN below.",
  "no-camera": "No camera available. Enter the ISBN below.",
  unsupported: "Barcode scanning is not supported in this browser. Enter the ISBN below.",
  scanning: "Scanning. Hold the book’s barcode inside the guide.",
  found: "ISBN found",
  "bad-checksum": "That barcode is not a valid ISBN",
  "camera-error":
    "The camera could not start. Check that another app is not using it, or enter the ISBN below.",
};

export function ScanSheet({ onClose, ...options }: ScanSheetProps) {
  const scanner = useBarcodeScanner(options);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const statusId = useId();
  const showCamera = scanner.cameraActive || scanner.state === "asking-permission";
  const showFallback = !showCamera && scanner.state !== "found";

  useEffect(() => {
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    if (dialog?.showModal) dialog.showModal();
    else dialog?.setAttribute("open", "");
    closeRef.current?.focus();
    return () => {
      dialog?.close?.();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  const close = () => {
    scanner.stop();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="scan-sheet"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="scan-layout">
        <header className="scan-header">
          <h1 id={titleId}>Scan a book</h1>
          <button ref={closeRef} type="button" onClick={close}>
            Close
          </button>
        </header>
        <div className="scan-body">
          <div className="scan-camera" hidden={!showCamera}>
            <video
              ref={scanner.videoRef}
              autoPlay
              playsInline
              muted
              aria-label="Live camera preview"
            />
            <div className="scan-guide" aria-hidden="true" />
          </div>
          <p id={statusId} role="status" aria-live="polite" aria-atomic="true">
            {messages[scanner.state]}
            {scanner.isbn ? `: ${scanner.isbn}` : ""}
          </p>
          {scanner.torchSupported && (
            <div className="scan-torch">
              <button
                type="button"
                aria-pressed={scanner.torchOn}
                disabled={scanner.torchBusy}
                onClick={() => void scanner.toggleTorch()}
              >
                {scanner.torchOn ? "Turn light off" : "Turn light on"}
              </button>
              {scanner.torchError && (
                <p role="alert">The camera light could not be changed. Try again.</p>
              )}
            </div>
          )}
          {showFallback && <ScanFallback onDetected={scanner.submit} />}
        </div>
      </div>
    </dialog>
  );
}
