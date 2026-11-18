import { useId, useState } from "react";
import { ChangingText } from "../../components/changing-text/ChangingText";
import { CheckIcon } from "../../components/icons";
import { plural } from "../../lib/plural";
import { pageAmount, pageLimit, stepPages } from "./stepper";

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
  const max = pageLimit(current, total);
  const locked = disabled || max === 0;
  return (
    <form
      className="reading-stepper"
      onSubmit={(event) => {
        event.preventDefault();
        if (amount > 0 && !locked) onLog(amount);
      }}
    >
      <h2 className="reading-console-title">Log pages</h2>
      <div className="reading-stepper-head">
        <label htmlFor={id}>Pages read</label>
        <p className="reading-stepper-hint">
          {total === null ? "Amount to log, not your page number" : `${plural(max, "page")} left`}
        </p>
      </div>
      <div className="reading-amount">
        <input
          className="control-input"
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={value === "" ? "" : String(amount)}
          disabled={locked}
          aria-describedby={`${id}-preview`}
          onChange={(event) => {
            const raw = event.target.value;
            if (/[^0-9]/.test(raw)) return;
            setValue(raw === "" ? "" : String(Math.min(Number(raw), max)));
          }}
        />
        <span aria-hidden="true">pages</span>
      </div>
      <div className="reading-steps">
        {[-10, -1, 1, 10].map((step) => {
          const next = stepPages(amount, step, current, total);
          return (
            <button
              key={step}
              type="button"
              className="secondary"
              disabled={locked || next < 1 || next === amount}
              aria-label={`${step < 0 ? "Subtract" : "Add"} ${Math.abs(step)} ${Math.abs(step) === 1 ? "page" : "pages"}`}
              onClick={() => setValue(String(next))}
            >
              {step > 0 ? `+${step}` : step}
            </button>
          );
        })}
      </div>
      <fieldset className="reading-presets" aria-label="Quick page amounts">
        {[5, 10, 25].map((pages) => (
          <button
            key={pages}
            type="button"
            className="secondary"
            disabled={locked || pages > max}
            aria-pressed={amount === pages}
            onClick={() => setValue(String(pages))}
          >
            {pages} pages
          </button>
        ))}
      </fieldset>
      <p id={`${id}-preview`} className="reading-preview" aria-live="polite">
        <span>After logging</span>{" "}
        <span className="reading-number">
          <span>{current}</span> <span>→</span>{" "}
          <span className="reading-preview-destination">
            <ChangingText value={current + amount} />
          </span>
        </span>
      </p>
      <button className="primary" type="submit" disabled={locked || amount === 0}>
        <CheckIcon />
        {amount > 0 ? `Log ${plural(amount, "page")}` : "Log pages"}
      </button>
    </form>
  );
}
