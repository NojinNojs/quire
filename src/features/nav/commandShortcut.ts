import { useEffect } from "react";

function isSearchShortcut(event: KeyboardEvent): boolean {
  return (
    !event.altKey &&
    !event.shiftKey &&
    (event.metaKey || event.ctrlKey) &&
    event.key.toLocaleLowerCase() === "k"
  );
}

/** A dialog that is not the palette owns the screen, so the shortcut stays silent. */
function hasOtherModal(own: HTMLElement | null): boolean {
  const modals = document.querySelectorAll<HTMLElement>(
    '[role="dialog"], [role="alertdialog"], dialog[open]',
  );
  return Array.from(modals).some((modal) => modal !== own);
}

/**
 * Ctrl/Meta+K toggles the palette from anywhere, including inside fields, but
 * never while another dialog or the guide is open.
 */
export function useNavigationSearchShortcut(
  open: boolean,
  onOpenChange: (open: boolean) => void,
  popupRef: { readonly current: HTMLElement | null },
) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || !isSearchShortcut(event)) return;
      if (open) {
        event.preventDefault();
        onOpenChange(false);
        return;
      }
      if (hasOtherModal(popupRef.current)) return;
      event.preventDefault();
      onOpenChange(true);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange, popupRef]);
}
