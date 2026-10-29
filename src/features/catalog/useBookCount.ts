import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { countBooks } from "../../data/books";

export function useBookCount(client: SupabaseClient, owner: string) {
  const [count, setCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(true);
  const [countError, setCountError] = useState("");
  const request = useRef(0);
  const refreshCount = useCallback(async () => {
    const current = ++request.current;
    setCountLoading(true);
    setCountError("");
    try {
      const total = await countBooks(client, owner);
      if (current === request.current) setCount(total);
    } catch (error) {
      if (current === request.current) {
        setCount(null);
        setCountError((error as Error).message);
      }
    } finally {
      if (current === request.current) setCountLoading(false);
    }
  }, [client, owner]);
  useEffect(() => {
    void refreshCount();
    return () => {
      request.current += 1;
    };
  }, [refreshCount]);
  return { count, countLoading, countError, refreshCount };
}
