import { type ReactNode, useRef } from "react";
import { SearchIcon, SettingsIcon, ShelfIcon, TodayIcon } from "../../components/icons";
import type { Route } from "./routes";

const destinations = [
  { route: "today", label: "Today", Icon: TodayIcon },
  { route: "shelf", label: "Shelf", Icon: ShelfIcon },
  { route: "search", label: "Search", Icon: SearchIcon },
] as const;

export function AppShell({ route, children }: { route: Route; children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);

  return (
    <div className="app-shell">
      {/* biome-ignore lint/a11y/useValidAnchor: native skip-link semantics with focus managed to preserve the hash route. */}
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          // The URL hash belongs to the router; move focus without changing the route.
          event.preventDefault();
          const main = content.current?.querySelector("main") ?? content.current;
          if (main) {
            main.tabIndex = -1;
            main.focus();
          }
        }}
      >
        Skip to main content
      </a>
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
      <div className="shell-screen" id="main-content" ref={content} key={route} tabIndex={-1}>
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
            <span className="nav-label">{label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
