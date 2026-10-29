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
  const [reveal, setReveal] = useState(false);
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

  async function sendReset() {
    if (busy) return;
    if (!email) {
      setFailed(true);
      setMessage("Enter your email address first, then ask for a reset link.");
      return;
    }
    setBusy(true);
    setFailed(false);
    setMessage(null);
    const { error } = await client.auth.resetPasswordForEmail(email);
    setBusy(false);
    if (error) {
      setFailed(true);
      setMessage(error.message);
      return;
    }
    setMessage("Reset link sent. Check your email, then sign in with the new password.");
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
        <span className="auth-mark">
          QUIRE
          <span className="auth-imprint-line">Borrower card</span>
        </span>
        <span className="auth-punch" aria-hidden="true" />
      </div>
      <div
        key={mode}
        className="auth-face"
        data-mode={mode}
        data-slide={switched ? "true" : undefined}
      >
        <header className="auth-head">
          <p className="auth-kicker">The lending desk</p>
          <h1 id="auth-title" ref={heading} tabIndex={-1}>
            {mode === "signin" ? "Sign in" : "Create an account"}
          </h1>
          <p className="auth-lede">Your shelf is private. One account, one library.</p>
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
              placeholder="name@example.com"
              required
              disabled={busy}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <div className="auth-field">
            <span className="label" aria-hidden="true">
              Password
            </span>
            <input
              type={reveal ? "text" : "password"}
              name="password"
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={8}
              disabled={busy}
              aria-describedby={mode === "signup" ? "auth-strength" : undefined}
              aria-label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="auth-reveal"
              aria-pressed={reveal}
              aria-label={reveal ? "Hide" : "Show"}
              onClick={() => setReveal((value) => !value)}
            >
              {reveal ? "Hide" : "Show"}
            </button>
          </div>
          {mode === "signin" ? (
            <button type="button" className="auth-forgot" disabled={busy} onClick={sendReset}>
              Forgot your password?
            </button>
          ) : null}
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
                  placeholder="Type it again"
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
          <p className="auth-issued">Quire keeps a record of what you read, and nothing else.</p>
          <button
            type="button"
            className="auth-switch"
            aria-label={
              mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"
            }
            disabled={busy}
            onClick={switchMode}
          >
            <span className="auth-switch-ask">
              {mode === "signin" ? "No account yet?" : "Already have an account?"}
            </span>{" "}
            <span className="auth-switch-action">
              {mode === "signin" ? "Create one" : "Sign in"}
            </span>
          </button>
        </footer>
      </div>
    </main>
  );
}
