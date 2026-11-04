import { useCallback, useState } from "react";

export type NavMode = "expanded" | "compact";

export const navModeKey = "quire:nav-mode:v1";

export function readNavMode(): NavMode {
  try {
    return window.localStorage.getItem(navModeKey) === "compact" ? "compact" : "expanded";
  } catch {
    return "expanded";
  }
}

export function persistNavMode(mode: NavMode) {
  try {
    window.localStorage.setItem(navModeKey, mode);
  } catch {
    /* The rail keeps the chosen width for this session. */
  }
}

export function useNavMode() {
  const [mode, setMode] = useState<NavMode>(readNavMode);
  const toggle = useCallback(() => {
    setMode((current) => {
      const next = current === "expanded" ? "compact" : "expanded";
      persistNavMode(next);
      return next;
    });
  }, []);
  return { mode, toggle };
}
