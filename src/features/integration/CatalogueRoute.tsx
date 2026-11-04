import type { ComponentProps } from "react";
import { SearchScreen } from "../catalog/SearchScreen";

/** Layout wrapper for the catalogue column; the shell owns the scanner. */
export function CatalogueRoute(props: ComponentProps<typeof SearchScreen>) {
  return (
    <div className="app-catalog" id="catalogue">
      <SearchScreen {...props} />
    </div>
  );
}
