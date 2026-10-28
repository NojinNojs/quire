import { useEffect, useState } from "react";
import { AuthForm } from "./features/auth/AuthForm";
import { isConfigured, supabase } from "./lib/supabase";

export default function App() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
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

  if (!email) return <AuthForm />;

  return (
    <main className="shell">
      <header className="topbar">
        <span className="brand">Quire</span>
        <button
          type="button"
          className="quiet"
          onClick={() => {
            void supabase?.auth.signOut();
          }}
        >
          Sign out
        </button>
      </header>
      <h1>Today</h1>
      <p className="muted">Signed in as {email}. The shelf arrives in the next milestone.</p>
    </main>
  );
}
