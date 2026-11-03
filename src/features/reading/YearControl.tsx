import { useEffect, useState } from "react";

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
    <div className="insights-year">
      <button type="button" disabled={year <= 1} onClick={() => setYear(year - 1)}>
        Previous year
      </button>
      <label>
        Year{" "}
        <input
          type="number"
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
      <button type="button" disabled={year >= currentYear} onClick={() => setYear(year + 1)}>
        Next year
      </button>
    </div>
  );
}
