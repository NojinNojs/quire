import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";

type Mode = "signin" | "signup";

export function AuthForm({ client }: { client: SupabaseClient }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const result =
      mode === "signin"
        ? await client.auth.signInWithPassword({ email, password })
        : await client.auth.signUp({ email, password });

    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setMessage("Check your email to confirm the account, then sign in.");
      return;
    }
    setMessage(null);
  }

  return (
    <main className="auth">
      <header className="auth-head">
        <span className="label">Quire</span>
        <h1>{mode === "signin" ? "Sign in" : "Create an account"}</h1>
        <p className="muted">Your shelf is private. One account, one library.</p>
      </header>

      <form onSubmit={submit} className="auth-form">
        <label>
          <span className="label">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          <span className="label">Password</span>
          <input
            type="password"
            name="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button type="submit" className="primary" disabled={busy}>
          {busy ? "Working" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      {message ? <p className="auth-message">{message}</p> : null}

      <button
        type="button"
        className="quiet"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setMessage(null);
        }}
      >
        {mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
