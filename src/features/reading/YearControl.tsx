import { useEffect, useState } from "react";
import { ChevronIcon } from "../../components/icons";

export function YearControl({
  year,
  setYear,
  currentYear,
}: {
  year: number;
  setYear: (year: number) => void;
  currentYear: number;
}) {
  const [draft, setDraft] = useState(String(year));
  useEffect(() => setDraft(String(year)), [year]);
  function apply() {
    const value = Number(draft);
    if (draft.trim() && Number.isInteger(value) && value >= 1 && value <= currentYear)
      setYear(value);
    else setDraft(String(year));
  }
  return (
    <fieldset className="insights-year" aria-label="Choose reading year">
      <button
        type="button"
        className="insights-year-step"
        aria-label="Previous year"
        title="Previous year"
        disabled={year <= 1}
        onClick={() => setYear(year - 1)}
      >
        <ChevronIcon className="insights-year-icon insights-year-prev" />
      </button>
      <label className="insights-year-field">
        <span>Year</span>
        <input
          type="number"
          inputMode="numeric"
          autoComplete="off"
          min="1"
          max={currentYear}
          step="1"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={apply}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply();
            }
          }}
        />
      </label>
      <button
        type="button"
        className="insights-year-step"
        aria-label="Next year"
        title="Next year"
        disabled={year >= currentYear}
        onClick={() => setYear(year + 1)}
      >
        <ChevronIcon className="insights-year-icon" />
      </button>
    </fieldset>
  );
}
