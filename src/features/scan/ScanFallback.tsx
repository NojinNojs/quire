import { useId, useRef, useState } from "react";
import { isbnTo13 } from "../../lib/isbn";

export interface ScanFallbackProps {
  onDetected: (isbn13: string) => void;
}

export function ScanFallback({ onDetected }: ScanFallbackProps) {
  const id = useId();
  const reported = useRef(false);
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [found, setFound] = useState(false);

  return (
    <form
      className="scan-fallback"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (reported.current) return;
        const isbn = /^\d{13}$/.test(value) ? isbnTo13(value) : null;
        if (!isbn) {
          setInvalid(true);
          return;
        }
        reported.current = true;
        setInvalid(false);
        setFound(true);
        onDetected(isbn);
      }}
    >
      <div className="field">
        <label className="label" htmlFor={id}>
          ISBN-13
        </label>
        <p className="control-hint" id={`${id}-hint`}>
          Enter the 13 digits printed below the book’s barcode.
        </p>
        <input
          className="control-input"
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]{13}"
          maxLength={13}
          autoComplete="off"
          spellCheck={false}
          placeholder="9780140328721"
          value={value}
          disabled={found}
          aria-invalid={invalid}
          aria-describedby={`${id}-hint${invalid ? ` ${id}-error` : ""}`}
          onChange={(event) => {
            setValue(event.target.value);
            setInvalid(false);
          }}
        />
        {invalid && (
          <p className="control-error" id={`${id}-error`} role="alert">
            That barcode is not a valid ISBN
          </p>
        )}
      </div>
      {found && <p role="status">ISBN found: {value}</p>}
      <button className="primary" type="submit" disabled={found}>
        Use ISBN
      </button>
    </form>
  );
}
