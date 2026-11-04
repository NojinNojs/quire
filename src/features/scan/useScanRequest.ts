import { useCallback, useRef, useState } from "react";

export interface ScanRequest {
  isbn: string;
  nonce: number;
}

/**
 * One shell-level capture controller. `nonce` increments for every capture, so
 * scanning the same ISBN twice still produces a new request for the search flow.
 */
export function useScanRequest() {
  const [scanning, setScanning] = useState(false);
  const [request, setRequest] = useState<ScanRequest | null>(null);
  const nonce = useRef(0);

  const open = useCallback(() => setScanning(true), []);
  const close = useCallback(() => setScanning(false), []);
  const issue = useCallback((isbn: string) => {
    nonce.current += 1;
    setScanning(false);
    setRequest({ isbn, nonce: nonce.current });
  }, []);
  const consume = useCallback((at: number) => {
    setRequest((current) => (current?.nonce === at ? null : current));
  }, []);

  return { scanning, request, open, close, issue, consume };
}
