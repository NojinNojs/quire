import { useCallback, useEffect, useRef, useState } from "react";

/** Longest tail allowed after the last toggle, so a stalled transition cannot pin the flag. */
const railFallbackMs = 900;

/**
 * Motion window for the rail. The window opens on a toggle and closes when the
 * layout transition that it started actually lands, so a rapid second toggle
 * retargets the same transition instead of being cut off mid-flight. Resizing
 * across the layout breakpoint closes it immediately: a breakpoint swap is not
 * a toggle and must be instant.
 */
export function useRailMotion(toggleMode: () => void) {
  const [animating, setAnimating] = useState(false);
  const fallback = useRef<number | undefined>(undefined);

  const stop = useCallback(() => {
    window.clearTimeout(fallback.current);
    fallback.current = undefined;
    setAnimating(false);
  }, []);

  const toggle = useCallback(() => {
    setAnimating(true);
    toggleMode();
    window.clearTimeout(fallback.current);
    fallback.current = window.setTimeout(() => setAnimating(false), railFallbackMs);
  }, [toggleMode]);

  useEffect(() => {
    const breakpoint = window.matchMedia?.("(min-width: 1024px)");
    breakpoint?.addEventListener("change", stop);
    return () => {
      breakpoint?.removeEventListener("change", stop);
      window.clearTimeout(fallback.current);
    };
  }, [stop]);

  return { animating, toggle, stop };
}
