import { Dialog } from "@base-ui/react/dialog";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ActionIcon } from "../../components/button/ActionIcon";
import { CloseIcon, SearchIcon } from "../../components/icons";
import { plural } from "../../lib/plural";
import { focusMainContent } from "./commandFocus";
import {
  type CommandItem,
  currentCommandRoute,
  filterCommandItems,
  moveCommandIndex,
} from "./commandItems";
import { CommandOptions } from "./commandOptions";
import { useNavigationSearchShortcut } from "./commandShortcut";
import "./command-palette.css";
import "./command-palette-list.css";
import "./command-palette-mobile.css";

const navigationKeys = ["ArrowDown", "ArrowUp", "Home", "End"];

/** Page palette for the shell: modal shell, one combobox, a listbox of routes. */
export function NavigationSearch({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeOption = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const navigated = useRef(false);
  const pendingHash = useRef<(() => void) | null>(null);
  const titleId = useId();
  const listId = useId();
  const currentRoute = currentCommandRoute(window.location.hash);
  const results = filterCommandItems(query);
  useNavigationSearchShortcut(open, onOpenChange, popupRef);

  useEffect(() => {
    if (!open) return;
    navigated.current = false;
    setQuery("");
    setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    if (activeIndex < 0) return;
    activeOption.current?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    return () => {
      if (pendingHash.current) window.removeEventListener("hashchange", pendingHash.current);
    };
  }, []);

  const select = useCallback(
    (item: CommandItem) => {
      navigated.current = true;
      onOpenChange(false);
      onNavigate?.();
      if (window.location.hash === item.hash) {
        window.setTimeout(focusMainContent, 0);
        return;
      }
      const onHashChange = () => {
        if (pendingHash.current) window.removeEventListener("hashchange", pendingHash.current);
        pendingHash.current = null;
        window.setTimeout(focusMainContent, 0);
      };
      pendingHash.current = onHashChange;
      window.addEventListener("hashchange", onHashChange);
      window.location.hash = item.hash;
    },
    [onNavigate, onOpenChange],
  );

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      const item = results[activeIndex];
      if (!item) return;
      event.preventDefault();
      select(item);
      return;
    }
    if (navigationKeys.includes(event.key)) {
      event.preventDefault();
      setActiveIndex((index) => moveCommandIndex(index, event.key, results.length));
    }
  }

  const activeItem = activeIndex >= 0 ? results[activeIndex] : undefined;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="command-backdrop" />
        <Dialog.Popup
          ref={popupRef}
          className="command-panel"
          initialFocus={inputRef}
          finalFocus={() => !navigated.current}
        >
          <div className="command-head">
            <Dialog.Title className="command-title" id={titleId}>
              Find a page
            </Dialog.Title>
            <kbd className="command-kbd">Ctrl / ⌘ K</kbd>
            <ActionIcon
              className="command-close"
              label="Close"
              side="bottom"
              onClick={() => onOpenChange(false)}
            >
              <CloseIcon />
            </ActionIcon>
          </div>
          <div className="command-field">
            <SearchIcon className="command-search" />
            <input
              ref={inputRef}
              className="command-input"
              type="text"
              role="combobox"
              aria-labelledby={titleId}
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeItem ? `${listId}-${activeItem.route}` : undefined}
              placeholder="Type a page name"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
                if (listRef.current) listRef.current.scrollTop = 0;
              }}
              onKeyDown={onInputKeyDown}
            />
            {query ? (
              <button
                type="button"
                className="command-clear"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setActiveIndex(0);
                  if (listRef.current) listRef.current.scrollTop = 0;
                  inputRef.current?.focus();
                }}
              >
                Clear
              </button>
            ) : null}
          </div>
          <CommandOptions
            results={results}
            activeIndex={activeIndex}
            currentRoute={currentRoute}
            listId={listId}
            listRef={listRef}
            activeRef={activeOption}
            onActivate={setActiveIndex}
            onSelect={select}
          />
          {results.length === 0 ? (
            <p className="command-empty">
              No pages match “{query.trim()}”. Try “today”, “collection” or “settings”.
            </p>
          ) : null}
          <div className="command-foot">
            <span className="command-count" role="status" aria-live="polite">
              {results.length === 0 ? "No pages" : plural(results.length, "page")}
            </span>
            <span className="command-keys" aria-hidden="true">
              <kbd>↑</kbd> <kbd>↓</kbd> move <kbd>Enter</kbd> open <kbd>Esc</kbd> close
            </span>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
