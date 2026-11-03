import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useState } from "react";
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
  const [email, setEmail] = useState(user?.email ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; failed: boolean } | null>(null);

  async function requestLink(event: React.FormEvent) {
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
    <main className="shell settings">
      <h1>Reset your password</h1>
      {canReset ? (
        <>
          <p className="muted">Choose a new password for your account.</p>
          <PasswordForm client={client} onSaved={completeRecovery} />
        </>
      ) : (
        <>
          <p role="alert">
            {error ?? "This reset link could not sign you in. Open the newest link in your email."}
          </p>
          <form className="settings-form" onSubmit={requestLink}>
            <label className="settings-field">
              <span className="label">Email address</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                disabled={pending}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            {message ? <p role={message.failed ? "alert" : "status"}>{message.text}</p> : null}
            <button type="submit" className="primary settings-submit" disabled={pending}>
              {pending ? "Sending..." : "Request a new reset link"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
