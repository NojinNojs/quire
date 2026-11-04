import type { RefObject } from "react";
import type { CommandItem, CommandRoute } from "./commandItems";

export function CommandOptions({
  results,
  activeIndex,
  currentRoute,
  listId,
  listRef,
  activeRef,
  onActivate,
  onSelect,
}: {
  results: readonly CommandItem[];
  activeIndex: number;
  currentRoute: CommandRoute | null;
  listId: string;
  listRef: RefObject<HTMLDivElement | null>;
  activeRef: RefObject<HTMLDivElement | null>;
  onActivate: (index: number) => void;
  onSelect: (item: CommandItem) => void;
}) {
  return (
    <div
      className="command-list"
      id={listId}
      role="listbox"
      aria-label="Pages"
      data-empty={results.length === 0}
      ref={listRef}
    >
      {results.map((item, index) => {
        const current = item.route === currentRoute;
        const active = index === activeIndex;
        return (
          <div
            key={item.route}
            id={`${listId}-${item.route}`}
            role="option"
            tabIndex={-1}
            aria-selected={active}
            aria-current={current ? "page" : undefined}
            data-active={active ? "true" : undefined}
            ref={active ? activeRef : null}
            onPointerMove={() => onActivate(index)}
            onClick={() => onSelect(item)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSelect(item);
            }}
          >
            <span className="command-name">{item.label}</span>
            <span className="command-meta">{current ? "Current" : item.hash}</span>
          </div>
        );
      })}
    </div>
  );
}
