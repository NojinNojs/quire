import { Button } from "../../components/button/Button";
import { ChevronIcon, SearchIcon } from "../../components/icons";
import { Tooltip } from "../../components/tooltip/Tooltip";
import { CaptureActions } from "./CaptureActions";
import { MobileMore } from "./MobileMore";
import { routeContext } from "./navItems";
import type { Route } from "./routes";
import type { NavMode } from "./useNavMode";

export function ShellHeader({
  route,
  mode,
  onToggle,
  searchOpen,
  onOpenSearch,
  onScan,
}: {
  route: Route;
  mode: NavMode;
  onToggle: () => void;
  searchOpen: boolean;
  onOpenSearch: () => void;
  onScan?: () => void;
}) {
  const context = routeContext(route);
  const shortcut = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K";
  const expanded = mode === "expanded";
  const toggleLabel = expanded ? "Collapse navigation" : "Expand navigation";

  return (
    <header className="shell shell-header">
      <div className="shell-header-id">
        {/* The rail width control lives on the header's left edge on desktop. */}
        <Tooltip label={toggleLabel} side="bottom">
          <Button
            variant="icon"
            className="shell-rail-toggle"
            aria-expanded={expanded}
            aria-controls="main-navigation"
            aria-label={toggleLabel}
            onClick={onToggle}
          >
            <ChevronIcon />
          </Button>
        </Tooltip>
        <span className="brand">Quire</span>
        <nav className="shell-breadcrumb" aria-label="Breadcrumb">
          <span className="shell-breadcrumb-group">{context.group}</span>
          <span className="shell-breadcrumb-sep" aria-hidden="true">
            /
          </span>
          <span className="shell-breadcrumb-current" aria-current="page">
            {context.label}
          </span>
        </nav>
      </div>
      <div className="shell-header-actions">
        <Button
          variant="quiet"
          className="shell-search"
          aria-label="Search navigation"
          aria-haspopup="dialog"
          aria-expanded={searchOpen}
          aria-keyshortcuts="Control+K Meta+K"
          onClick={onOpenSearch}
        >
          <SearchIcon />
          <span className="shell-search-label" aria-hidden="true">
            Search
          </span>
          <span className="shell-search-key" aria-hidden="true">
            <kbd>{shortcut}</kbd>
          </span>
        </Button>
        <CaptureActions onScan={onScan} />
        <MobileMore route={route} />
      </div>
    </header>
  );
}
