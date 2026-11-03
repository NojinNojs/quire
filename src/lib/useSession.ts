import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { authCallback, clearAuthCallback, dropAuthMarker } from "./authCallback";
import { supabase } from "./supabase";

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState(authCallback.recovery);
  const [recoveryError, setRecoveryError] = useState<string | null>(authCallback.error);
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
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (current !== generation.current) return;
      setUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") {
        setRecovery(true);
        const url = new URL(window.location.href);
        url.searchParams.set("auth", "recovery");
        window.history.replaceState(null, "", url);
      }
      if (event === "SIGNED_OUT") {
        setRecovery(false);
        setRecoveryError(null);
        dropAuthMarker();
      }
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
      setRecovery(false);
      setRecoveryError(null);
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      if (url.hash) {
        url.hash = "";
        window.history.replaceState(null, "", url);
        window.dispatchEvent(new window.Event("hashchange"));
      } else if (url.href !== window.location.href) {
        window.history.replaceState(null, "", url);
      }
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
    recovery,
    recoveryError,
    completeRecovery: () => {
      setRecovery(false);
      setRecoveryError(null);
      clearAuthCallback();
    },
    retry: () => {
      if (signingOut.current) void signOut();
      else setRevision((value) => value + 1);
    },
    client: supabase,
    signOut,
  };
}
