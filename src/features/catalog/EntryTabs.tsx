export function EntryTabs({
  tab,
  selectTab,
}: {
  tab: "search" | "manual";
  selectTab: (tab: "search" | "manual") => void;
}) {
  return (
    <div className="entry-tabs" role="tablist" aria-label="Entry method">
      {(["search", "manual"] as const).map((value) => (
        <button
          key={value}
          type="button"
          role="tab"
          id={`${value}-tab`}
          aria-selected={tab === value}
          aria-controls={`${value}-panel`}
          tabIndex={tab === value ? 0 : -1}
          onClick={() => selectTab(value)}
          onKeyDown={(event) => {
            if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? "search"
                  : event.key === "End"
                    ? "manual"
                    : value === "search"
                      ? "manual"
                      : "search";
              selectTab(next);
              document.getElementById(`${next}-tab`)?.focus();
            }
          }}
        >
          {value === "search" ? "Search catalogue" : "Enter manually"}
        </button>
      ))}
    </div>
  );
}
