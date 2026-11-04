import { Fragment } from "react";
import { Button } from "../../components/button/Button";
import { SettingsIcon } from "../../components/icons";
import { Tooltip } from "../../components/tooltip/Tooltip";
import { openProductTour } from "../guide/ProductTour";
import { activeDestination, destinationIndex, dockSlot, navGroups } from "./navItems";
import type { Route } from "./routes";
import type { NavMode } from "./useNavMode";

export function ShellNav({ route, mode }: { route: Route; mode: NavMode }) {
  const selected = activeDestination(route);
  const index = destinationIndex(route);
  const compact = mode === "compact";

  return (
    <nav
      className="bottom-nav"
      id="main-navigation"
      aria-label="Main navigation"
      data-dock-index={index < 0 ? "none" : index}
    >
      {/* The logo area is exactly one header tall, so the rail's first rule
          continues the header's rule to the viewport edge. The collapse control
          lives in that header, not here. */}
      <div className="rail-head">
        <span className="brand rail-brand">
          <span className="brand-mark" aria-hidden="true">
            Q
          </span>
          <span className="brand-word" aria-hidden="true">
            Quire
          </span>
        </span>
        <span className="rail-note" aria-hidden="true">
          Reading workspace
        </span>
      </div>
      {navGroups.map((group) => (
        <Fragment key={group.id}>
          <p className="rail-group-label" data-group={group.id} aria-hidden="true">
            {group.label}
          </p>
          <ul className={`nav-destinations${group.id === "insights" ? " nav-records" : ""}`}>
            {group.items.map(({ route: destination, label, Icon }) => {
              const slot = dockSlot(destination);
              return (
                <li key={destination} data-dock-slot={slot >= 0 ? slot : undefined}>
                  <Tooltip label={label} side="right" disabled={!compact}>
                    <a
                      href={`#/${destination}`}
                      aria-label={label}
                      aria-current={selected === destination ? "page" : undefined}
                    >
                      <Icon />
                      <span className="nav-label">{label}</span>
                    </a>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </Fragment>
      ))}
      <div className="rail-footer">
        <p className="rail-identity">Private library</p>
        <Tooltip label="Settings" side="right" disabled={!compact}>
          <a
            className="rail-settings"
            href="#/settings"
            aria-label="Settings"
            aria-current={route === "settings" ? "page" : undefined}
          >
            <SettingsIcon />
            <span className="nav-label">Settings</span>
          </a>
        </Tooltip>
        <Tooltip label="Guide" side="right" disabled={!compact}>
          <Button className="shell-guide rail-guide" aria-label="Guide" onClick={openProductTour}>
            <span className="guide-glyph" aria-hidden="true">
              ?
            </span>
            <span className="nav-label">Guide</span>
          </Button>
        </Tooltip>
      </div>
      <span className="dock-glider" aria-hidden="true" />
    </nav>
  );
}
