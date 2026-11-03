import { type ReactNode, useRef } from "react";
import { SearchIcon, SettingsIcon, ShelfIcon, TodayIcon } from "../../components/icons";
import { openProductTour, ProductTour } from "../guide/ProductTour";
import type { Route } from "./routes";

const destinations = [
  { route: "shelf", label: "Collection", Icon: ShelfIcon },
  { route: "today", label: "Today", Icon: TodayIcon },
  { route: "search", label: "Add book", Icon: SearchIcon },
] as const;

export function AppShell({
  route,
  children,
  guideScope = "reader",
}: {
  route: Route;
  children: ReactNode;
  guideScope?: string;
}) {
  const content = useRef<HTMLDivElement>(null);
  const selected = route === "journal" || route === "stats" ? "today" : route;

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
        <div className="shell-header-actions">
          <button className="shell-guide" type="button" onClick={openProductTour}>
            Guide
          </button>
          <a
            className="shell-settings"
            href="#/settings"
            aria-label="Settings"
            title="Settings"
            aria-current={route === "settings" ? "page" : undefined}
          >
            <SettingsIcon />
          </a>
        </div>
      </header>
      <ProductTour key={guideScope} scope={guideScope} />
      <div
        className="shell-screen"
        id="main-content"
        ref={content}
        key={typeof route === "object" ? `book-${route.id}` : route}
        tabIndex={-1}
      >
        {children}
      </div>
      <nav className="bottom-nav" aria-label="Main navigation">
        <span className="brand rail-brand">Quire</span>
        <span
          className="nav-indicator"
          data-route={typeof selected === "object" ? "shelf" : selected}
          aria-hidden="true"
        />
        {destinations.map(({ route: destination, label, Icon }) => (
          <a
            key={destination}
            href={`#/${destination}`}
            aria-label={label}
            title={label}
            aria-current={
              selected === destination || (typeof selected === "object" && destination === "shelf")
                ? "page"
                : undefined
            }
          >
            <Icon />
            <span className="nav-label">{label}</span>
          </a>
        ))}
        <a
          className="rail-settings"
          href="#/settings"
          aria-label="Settings"
          aria-current={route === "settings" ? "page" : undefined}
        >
          <SettingsIcon />
          <span className="nav-label">Settings</span>
        </a>
        <button className="shell-guide rail-guide" type="button" onClick={openProductTour}>
          Guide
        </button>
      </nav>
    </div>
  );
}
