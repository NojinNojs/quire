import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { AuthForm } from "./features/auth/AuthForm";
import { SearchScreen } from "./features/catalog/SearchScreen";
import { isConfigured, supabase } from "./lib/supabase";

export default function App() {
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

  if (!isConfigured) {
    return (
      <main className="shell">
        <h1>Quire</h1>
        <p className="muted">
          Supabase is not configured. Copy <code>.env.example</code> to <code>.env</code> and fill
          in the project URL and anon key.
        </p>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="shell">
        <p className="muted">Opening your shelf</p>
      </main>
    );
  }

  if (!user) return <AuthForm />;

  return <SearchScreen key={user.id} user={user} />;
}
