import type { SupabaseClient } from "@supabase/supabase-js";
import { useId, useState } from "react";
import "../../styles/settings.css";

export type PasswordFormProps = {
  client: SupabaseClient;
  onSaved?: () => void;
};

export function PasswordForm({ client, onSaved }: PasswordFormProps) {
  const id = useId();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [reveal, setReveal] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const mismatch = repeat.length > 0 && repeat !== password;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setSaved(false);
    if (password.length < 8) {
      setError("Use at least 8 characters for the new password.");
      return;
    }
    if (repeat !== password) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const { error: failure } = await client.auth.updateUser({ password });
      if (failure) {
        setError(failure.message || "Could not update your password. Try again.");
        return;
      }
      setPassword("");
      setRepeat("");
      setSaved(true);
      onSaved?.();
    } catch {
      setError("Could not update your password. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="settings-form" onSubmit={submit} noValidate>
      <div className="settings-field">
        <label htmlFor={`${id}-password`} className="label">
          New password
        </label>
        <div className="settings-secret">
          <input
            id={`${id}-password`}
            type={reveal ? "text" : "password"}
            name="new-password"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={pending}
            aria-describedby={error ? errorId : hintId}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setSaved(false);
            }}
          />
          <button
            type="button"
            className="settings-reveal"
            aria-pressed={reveal}
            aria-label={reveal ? "Hide password" : "Show password"}
            disabled={pending}
            onClick={() => setReveal((value) => !value)}
          >
            {reveal ? "Hide" : "Show"}
          </button>
        </div>
        <p id={hintId} className="settings-hint">
          At least 8 characters.
        </p>
      </div>
      <label className="settings-field">
        <span className="label">Confirm new password</span>
        <input
          type={reveal ? "text" : "password"}
          name="repeat-password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={pending}
          aria-invalid={mismatch}
          aria-describedby={mismatch ? errorId : undefined}
          value={repeat}
          onChange={(event) => {
            setRepeat(event.target.value);
            setSaved(false);
          }}
        />
      </label>
      {error ? (
        <p id={errorId} className="settings-error" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="settings-status" role="status">
          Password updated.
        </p>
      ) : null}
      <button type="submit" className="primary settings-submit" disabled={pending}>
        {pending ? "Saving password..." : "Update password"}
      </button>
    </form>
  );
}
