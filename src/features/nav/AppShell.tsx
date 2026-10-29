import type { ReactNode } from "react";
import { SearchIcon, SettingsIcon, ShelfIcon, TodayIcon } from "../../components/icons";
import type { Route } from "./routes";

const destinations = [
  { route: "today", label: "Today", Icon: TodayIcon },
  { route: "shelf", label: "Shelf", Icon: ShelfIcon },
  { route: "search", label: "Search", Icon: SearchIcon },
] as const;

export function AppShell({ route, children }: { route: Route; children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="shell app-header shell-header">
        <span className="brand">Quire</span>
        <a
          className="shell-settings"
          href="#/settings"
          aria-label="Settings"
          title="Settings"
          aria-current={route === "settings" ? "page" : undefined}
        >
          <SettingsIcon />
        </a>
      </header>
      <div className="shell-screen" key={route}>
        {children}
      </div>
      <nav className="bottom-nav" aria-label="Main navigation">
        <span className="nav-indicator" data-route={route} aria-hidden="true" />
        {destinations.map(({ route: destination, label, Icon }) => (
          <a
            key={destination}
            href={`#/${destination}`}
            aria-label={label}
            title={label}
            aria-current={route === destination ? "page" : undefined}
          >
            <Icon />
          </a>
        ))}
      </nav>
    </div>
  );
}
