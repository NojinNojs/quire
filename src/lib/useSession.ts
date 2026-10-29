import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const signingOut = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: revision explicitly retries session loading.
  useEffect(() => {
    const current = ++generation.current;
    if (!supabase) {
      setReady(true);
      return;
    }
    setReady(false);
    setError("");
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (current !== generation.current) return;
        if (error) throw error;
        setUser(data.session?.user ?? null);
        setReady(true);
      })
      .catch(() => {
        if (current === generation.current) {
          setError("Could not open your account. Check your connection and try again.");
          setReady(true);
        }
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (current === generation.current) setUser(session?.user ?? null);
    });
    return () => {
      generation.current += 1;
      sub.subscription.unsubscribe();
    };
  }, [revision]);
  const signOut = useCallback(async () => {
    signingOut.current = true;
    setReady(false);
    setError("");
    try {
      const result = await supabase?.auth.signOut();
      if (result?.error) throw result.error;
    } catch {
      setError("Could not sign out. Check your connection and try again.");
    } finally {
      setReady(true);
    }
  }, []);
  return {
    user,
    ready,
    error,
    retry: () => {
      if (signingOut.current) void signOut();
      else setRevision((value) => value + 1);
    },
    client: supabase,
    signOut,
  };
}
