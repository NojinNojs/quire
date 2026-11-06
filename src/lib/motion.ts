import { useEffect, useLayoutEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Live preference: flipping it cancels running work through the effect that reads it. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.(QUERY).matches === true,
  );
  useEffect(() => {
    const media = typeof window.matchMedia === "function" ? window.matchMedia(QUERY) : null;
    if (!media) return;
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** Start motion before paint on the client, skip it during server rendering. */
export const useMotionEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;
