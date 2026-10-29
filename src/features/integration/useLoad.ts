import { useCallback, useEffect, useState } from "react";

export function useLoad<T>(load: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: A retry must reload even when the loader is unchanged.
  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    void load().then(
      (data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      },
      (error: unknown) => {
        if (!cancelled)
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : "Could not load your books. Try again.",
          });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [load, attempt]);
  return { ...state, retry };
}
