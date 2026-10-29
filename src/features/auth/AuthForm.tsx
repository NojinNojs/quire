import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import "../../styles/auth.css";

type Mode = "signin" | "signup";

export function passwordStrength(password: string): "Weak" | "Fair" | "Strong" {
  if (password.length < 8) return "Weak";
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter((rule) =>
    rule.test(password),
  ).length;
  return password.length >= 12 && variety >= 3 ? "Strong" : "Fair";
}

function initialMode(): Mode {
  return new URLSearchParams(window.location.search).get("auth") === "signup" ? "signup" : "signin";
}

export function AuthForm({ client }: { client: SupabaseClient }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [switched, setSwitched] = useState(false);
  const mismatch = mode === "signup" && repeat.length > 0 && repeat !== password;
  const strength = passwordStrength(password);
  const heading = useRef<HTMLHeadingElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: The keyed face mounts a new heading on each mode change.
  useEffect(() => {
    if (switched) heading.current?.focus({ preventScroll: true });
  }, [mode, switched]);

  useEffect(() => {
    const restore = () => {
      setMode(initialMode());
      setMessage(null);
      setFailed(false);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  function switchMode() {
    if (busy) return;
    const next = mode === "signin" ? "signup" : "signin";
    const url = new URL(window.location.href);
    if (next === "signup") url.searchParams.set("auth", next);
    else url.searchParams.delete("auth");
    window.history.replaceState(null, "", url);
    setSwitched(true);
    setMode(next);
    setRepeat("");
    setFailed(false);
    setMessage(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || mismatch) return;
    setBusy(true);
    setMessage(null);
    setFailed(false);
    try {
      const result =
        mode === "signin"
          ? await client.auth.signInWithPassword({ email, password })
          : await client.auth.signUp({ email, password });
      if (result.error) {
        setBusy(false);
        setFailed(true);
        setMessage(result.error.message);
        return;
      }
      if (mode === "signup" && !result.data.session) {
        setBusy(false);
        setMessage("Check your email to confirm the account, then sign in.");
      }
      if (result.data.session) {
        const url = new URL(window.location.href);
        url.searchParams.delete("auth");
        window.history.replaceState(null, "", url);
      }
      // Keep the issuing state until the session listener mounts the shell.
    } catch {
      setBusy(false);
      setFailed(true);
      setMessage("Could not reach your account. Check your connection and try again.");
    }
  }

  return (
    <main className="auth borrower-card" aria-labelledby="auth-title">
      <div className="auth-imprint">
        <span className="auth-mark">QUIRE</span>
        <span className="auth-punch" aria-hidden="true" />
      </div>
      <div
        key={mode}
        className="auth-face"
        data-mode={mode}
        data-slide={switched ? "true" : undefined}
      >
        <header className="auth-head">
          <h1 id="auth-title" ref={heading} tabIndex={-1}>
            {mode === "signin" ? "Sign in" : "Create an account"}
          </h1>
          <p>Your shelf is private. One account, one library.</p>
        </header>
        <form
          onSubmit={submit}
          className="auth-form"
          aria-busy={busy}
          aria-describedby={message ? "auth-message" : undefined}
        >
          <label>
            <span className="label">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              disabled={busy}
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
              disabled={busy}
              aria-describedby={mode === "signup" ? "auth-strength" : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {mode === "signup" ? (
            <>
              <div id="auth-strength" className="auth-strength" data-strength={strength}>
                <span aria-live="polite">Password strength: {strength}</span>
                <span className="auth-strength-track" aria-hidden="true">
                  <span />
                </span>
              </div>
              <label>
                <span className="label">Repeat</span>
                <input
                  type="password"
                  name="repeat"
                  autoComplete="new-password"
                  disabled={busy}
                  value={repeat}
                  aria-invalid={mismatch}
                  aria-describedby={mismatch ? "auth-mismatch" : "auth-repeat-help"}
                  onChange={(event) => setRepeat(event.target.value)}
                />
              </label>
              {mismatch ? (
                <p id="auth-mismatch" className="auth-field-error" role="alert">
                  Passwords do not match.
                </p>
              ) : (
                <p id="auth-repeat-help" className="auth-help">
                  Optional. Repeat your password to check it.
                </p>
              )}
            </>
          ) : null}
          {message ? (
            <p
              id="auth-message"
              className={failed ? "auth-field-error" : "auth-message"}
              role={failed ? "alert" : "status"}
            >
              {message}
            </p>
          ) : null}
          <button type="submit" className="primary" disabled={busy || mismatch}>
            {busy
              ? "Issuing card"
              : failed
                ? "Try again"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            {busy ? <span className="auth-issuing" aria-hidden="true" /> : null}
          </button>
        </form>
        <footer className="auth-footer">
          <button type="button" className="auth-switch" disabled={busy} onClick={switchMode}>
            {mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"}
          </button>
        </footer>
      </div>
    </main>
  );
}
