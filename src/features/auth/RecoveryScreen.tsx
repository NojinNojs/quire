import type { SupabaseClient, User } from "@supabase/supabase-js";
import { type FormEvent, useId, useState } from "react";
import { PasswordForm } from "../settings/PasswordForm";

export function RecoveryScreen({
  client,
  user,
  error,
  completeRecovery,
}: {
  client: SupabaseClient;
  user: User | null;
  error: string | null;
  completeRecovery: () => void;
}) {
  const id = useId();
  const [email, setEmail] = useState(user?.email ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; failed: boolean } | null>(null);

  async function requestLink(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage(null);
    try {
      const { error: failure } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + window.location.pathname,
      });
      if (failure) throw failure;
      setMessage({
        text: "Reset link sent. Open the link in your email to choose a new password.",
        failed: false,
      });
    } catch {
      setMessage({
        text: "Could not send a reset link. Check your connection and try again.",
        failed: true,
      });
    } finally {
      setPending(false);
    }
  }

  const canReset = Boolean(user) && !error;
  return (
    <main className="auth-page auth-recovery">
      <section className="auth-recovery-sheet" aria-labelledby={`${id}-heading`}>
        <header className="auth-running-head">
          <span>QUIRE</span>
          <span>ACCOUNT RECOVERY</span>
        </header>
        <p className="auth-recovery-kicker">Borrower card</p>
        <h1 className="auth-mode-title" id={`${id}-heading`}>
          Reset your password
        </h1>
        {canReset ? (
          <>
            <p className="auth-recovery-lead">Choose a new password for your account.</p>
            <PasswordForm client={client} onSaved={completeRecovery} />
          </>
        ) : (
          <>
            <p className="auth-recovery-lead">
              We will send a fresh link to the email on this account.
            </p>
            <p className="auth-recovery-error" role="alert">
              {error ??
                "This reset link could not sign you in. Open the newest link in your email."}
            </p>
            <form className="settings-form" onSubmit={requestLink}>
              <label className="settings-field" htmlFor={`${id}-email`}>
                <span className="label">Email address</span>
                <input
                  className="control-input"
                  id={`${id}-email`}
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  disabled={pending}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              {message ? (
                <p role={message.failed ? "alert" : "status"} className="auth-recovery-message">
                  {message.text}
                </p>
              ) : null}
              <button type="submit" className="primary settings-submit" disabled={pending}>
                {pending ? "Sending..." : "Request a new reset link"}
              </button>
            </form>
          </>
        )}
        <footer className="auth-recovery-foot">
          <a href="/#/today">Back to sign in</a>
        </footer>
      </section>
    </main>
  );
}
