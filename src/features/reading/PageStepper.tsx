import { useId, useState } from "react";
import { CheckIcon } from "../../components/icons";
import { plural } from "../../lib/plural";
import { pageAmount, previewPages, stepPages } from "./stepper";

export function PageStepper({
  current,
  total,
  disabled,
  onLog,
}: {
  current: number;
  total: number | null;
  disabled: boolean;
  onLog: (pages: number) => void;
}) {
  const [value, setValue] = useState("1");
  const id = useId();
  const amount = pageAmount(Number(value), current, total);
  const valid = value.trim() !== "" && Number(value) === amount && amount > 0;
  const preview = previewPages(current, amount);
  return (
    <form
      className="reading-stepper"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid && !disabled) onLog(amount);
      }}
    >
      <h2 className="reading-console-title">Log pages</h2>
      <div className="reading-stepper-head">
        <label htmlFor={id}>Pages read</label>
        <p className="reading-stepper-hint">Amount to log, not your page number</p>
      </div>
      <div className="reading-amount">
        <input
          className="control-input"
          id={id}
          type="number"
          inputMode="numeric"
          autoComplete="off"
          min="0"
          step="1"
          max={total === null ? 2_147_483_647 - current : Math.max(0, total - current)}
          value={value}
          disabled={disabled}
          aria-describedby={`${id}-preview`}
          onChange={(event) => setValue(event.target.value)}
        />
        <span aria-hidden="true">pages</span>
      </div>
      <div className="reading-steps">
        {[-10, -1, 1, 10].map((step) => (
          <button
            key={step}
            type="button"
            className="secondary"
            disabled={disabled || amount + step < 1}
            aria-label={`${step < 0 ? "Subtract" : "Add"} ${Math.abs(step)} ${Math.abs(step) === 1 ? "page" : "pages"}`}
            onClick={() => setValue(String(stepPages(amount, step, current, total)))}
          >
            {step > 0 ? `+${step}` : step}
          </button>
        ))}
      </div>
      <fieldset className="reading-presets" aria-label="Quick page amounts">
        {[5, 10, 25].map((pages) => (
          <button
            key={pages}
            type="button"
            className="secondary"
            disabled={disabled || pageAmount(pages, current, total) !== pages}
            aria-pressed={amount === pages}
            onClick={() => setValue(String(pages))}
          >
            {pages} pages
          </button>
        ))}
      </fieldset>
      <p id={`${id}-preview`} className="reading-preview" aria-live="polite">
        <span>After logging</span>
        <span className="reading-number">{preview}</span>
      </p>
      <button className="primary" type="submit" disabled={disabled || !valid}>
        <CheckIcon />
        Log {plural(amount, "page")}
      </button>
    </form>
  );
}
