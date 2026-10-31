import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { AuthReadingRecord } from "./AuthReadingRecord";
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
    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setMessage("Reset link sent. Check your email, then sign in with the new password.");
    } catch {
      setFailed(true);
      setMessage("Could not send a reset link. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
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
    <main className="auth-page" aria-labelledby="auth-title" data-busy={busy}>
      <div className="auth-book">
        <section className="auth-verso" aria-label="Borrower card">
          <header className="auth-running-head">
            <span>QUIRE</span>
            <span>BORROWER CARD</span>
          </header>
          <p className="auth-intro">A home for your reading life.</p>
          <div key={mode} className="auth-face" data-mode={mode}>
            <h1 className="auth-mode-title" id="auth-title" ref={heading} tabIndex={-1}>
              {mode === "signin" ? "Sign in" : "Create an account"}
            </h1>
            <form
              onSubmit={submit}
              className="auth-form"
              aria-busy={busy}
              aria-describedby={message ? "auth-message" : undefined}
            >
              <label className="auth-field">
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
                  disabled={busy}
                  onClick={() => setReveal((value) => !value)}
                >
                  {reveal ? "Hide" : "Show"}
                </button>
              </div>
              {mode === "signup" ? (
                <>
                  <div id="auth-strength" className="auth-strength" data-strength={strength}>
                    <span aria-live="polite">Password strength: {strength}</span>
                    <span className="auth-strength-track" aria-hidden="true">
                      <span />
                    </span>
                  </div>
                  <label className="auth-field">
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
              <div className="auth-account-links">
                {mode === "signin" ? (
                  <button type="button" className="auth-forgot" disabled={busy} onClick={sendReset}>
                    Forgot your password?
                  </button>
                ) : null}
                <button
                  type="button"
                  className="auth-switch"
                  aria-label={
                    mode === "signin"
                      ? "No account yet? Create one"
                      : "Already have an account? Sign in"
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
              </div>
              <p className="auth-demo">
                Or look around first:{" "}
                <a
                  className="auth-demo-link"
                  href="?demo=1#/today"
                  aria-label="Try the interactive demo"
                >
                  try the interactive demo.
                </a>
              </p>
            </footer>
          </div>
          <AuthReadingRecord />
          <footer className="auth-page-foot">
            <p className="auth-footnote">Your shelf is private. One account, one library.</p>
            <p className="auth-folio">16</p>
          </footer>
        </section>
      </div>
    </main>
  );
}
