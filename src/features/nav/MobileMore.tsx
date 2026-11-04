import { Menu } from "@base-ui/react/menu";
import { useRef, useState } from "react";
import { MoreIcon, SettingsIcon } from "../../components/icons";
import { openProductTour } from "../guide/ProductTour";
import { recordDestinations } from "./navItems";
import type { Route } from "./routes";

/**
 * Phone-only account and insights disclosure. Base UI owns focus trapping,
 * Escape, and returning focus to the visible trigger; the menu closes itself
 * before a route change or the guide opens so no hidden control receives focus.
 */
export function MobileMore({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const guidePending = useRef(false);
  const recordActive = route === "journal" || route === "stats";

  const startGuide = () => {
    guidePending.current = true;
    setOpen(false);
  };

  const finishOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      guidePending.current = false;
      return;
    }
    if (!guidePending.current) return;
    guidePending.current = false;
    // The disclosure is fully closed now, so focus can land on the visible
    // trigger and the tour returns there instead of a removed menu item.
    trigger.current?.focus({ preventScroll: true });
    openProductTour();
  };

  return (
    <Menu.Root open={open} onOpenChange={setOpen} onOpenChangeComplete={finishOpenChange}>
      <Menu.Trigger
        ref={trigger}
        className="shell-more"
        aria-label="More navigation"
        data-active={recordActive || route === "settings" ? "true" : undefined}
      >
        <MoreIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="shell-more-positioner" side="bottom" align="end" sideOffset={8}>
          <Menu.Popup className="shell-more-popup" aria-label="More navigation">
            <Menu.Group className="shell-more-group">
              <Menu.GroupLabel className="shell-more-label">Insights</Menu.GroupLabel>
              {recordDestinations.map(({ route: destination, label, Icon }) => (
                <Menu.LinkItem
                  key={destination}
                  className="shell-more-item"
                  href={`#/${destination}`}
                  closeOnClick
                  aria-current={route === destination ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <Icon />
                  <span>{label}</span>
                </Menu.LinkItem>
              ))}
            </Menu.Group>
            <Menu.Group className="shell-more-group">
              <Menu.GroupLabel className="shell-more-label">Workspace</Menu.GroupLabel>
              <Menu.LinkItem
                className="shell-more-item"
                href="#/settings"
                closeOnClick
                aria-current={route === "settings" ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <SettingsIcon />
                <span>Settings</span>
              </Menu.LinkItem>
              <Menu.Item className="shell-more-item" onClick={startGuide}>
                <span className="shell-more-glyph" aria-hidden="true">
                  ?
                </span>
                <span>Guide</span>
              </Menu.Item>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
