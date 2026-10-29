import type { ComponentProps } from "react";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { SearchScreen } from "../catalog/SearchScreen";
import type { useCatalogue } from "../catalog/useCatalogue";
import { ScanSheet } from "../scan/ScanSheet";

export function CatalogueRoute(props: ComponentProps<typeof SearchScreen>) {
  const [scanning, setScanning] = useState<ReturnType<typeof useCatalogue> | null>(null);
  const container = useRef<HTMLDivElement>(null);
  return (
    <div className="app-catalog" id="catalogue" ref={container}>
      <SearchScreen {...props} onScan={setScanning} />
      {scanning && (
        <ScanSheet
          onClose={() => setScanning(null)}
          onDetected={(isbn) => {
            flushSync(() => {
              scanning.setQuery(isbn);
              scanning.selectTab("search");
              setScanning(null);
            });
            container.current?.querySelector<HTMLFormElement>(".catalog-form")?.requestSubmit();
          }}
        />
      )}
    </div>
  );
}
