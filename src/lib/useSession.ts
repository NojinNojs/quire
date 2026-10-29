import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return {
    user,
    ready,
    client: supabase,
    signOut: () => {
      void supabase?.auth.signOut();
    },
  };
}
