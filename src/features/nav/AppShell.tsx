import { Tooltip } from "@base-ui/react/tooltip";
import { type ReactNode, type TransitionEvent, useCallback, useRef, useState } from "react";
import { ProductTour } from "../guide/ProductTour";
import { NavigationSearch } from "./NavigationSearch";
import type { Route } from "./routes";
import { ShellHeader } from "./ShellHeader";
import { ShellNav } from "./ShellNav";
import { useNavMode } from "./useNavMode";
import { useRailMotion } from "./useRailMotion";

export function AppShell({
  route,
  children,
  guideScope = "reader",
  onScan,
}: {
  route: Route;
  children: ReactNode;
  guideScope?: string;
  onScan?: () => void;
}) {
  const content = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const { mode, toggle: toggleMode } = useNavMode();
  const { animating, toggle, stop } = useRailMotion(toggleMode);

  // Rail motion belongs to the toggle alone: crossing the layout breakpoint must
  // swap widths instantly, so the transition only exists while a toggle is fresh.
  const endRailMotion = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && event.propertyName === "padding-left") stop();
    },
    [stop],
  );

  return (
    <div
      className="app-shell"
      data-nav-mode={mode}
      data-nav-animating={animating ? "true" : undefined}
      onTransitionEnd={endRailMotion}
    >
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
      <Tooltip.Provider delay={450} closeDelay={80}>
        <ShellHeader
          route={route}
          mode={mode}
          onToggle={toggle}
          searchOpen={searchOpen}
          onOpenSearch={openSearch}
          onScan={onScan}
        />
        <ProductTour key={guideScope} scope={guideScope} />
        <NavigationSearch open={searchOpen} onOpenChange={setSearchOpen} onNavigate={closeSearch} />
        <div
          className="shell-screen"
          id="main-content"
          ref={content}
          key={typeof route === "object" ? `book-${route.id}` : route}
          tabIndex={-1}
        >
          {children}
        </div>
        <ShellNav route={route} mode={mode} />
      </Tooltip.Provider>
    </div>
  );
}
