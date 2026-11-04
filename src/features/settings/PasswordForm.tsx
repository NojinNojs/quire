import type { SupabaseClient } from "@supabase/supabase-js";
import { useId, useState } from "react";
import { ActionIcon } from "../../components/button/ActionIcon";
import { EyeIcon, EyeOffIcon, SaveIcon } from "../../components/icons";
import { useToast } from "../../components/toast";
import "../../styles/settings.css";

export type PasswordFormProps = {
  client: SupabaseClient;
  onSaved?: () => void;
};

export function PasswordForm({ client, onSaved }: PasswordFormProps) {
  const id = useId();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [reveal, setReveal] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ message: string; live: boolean } | null>(null);
  const mismatch = repeat.length > 0 && repeat !== password;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    if (password.length < 8) {
      setError({ message: "Use at least 8 characters for the new password.", live: true });
      return;
    }
    if (repeat !== password) {
      setError({ message: "Passwords do not match.", live: true });
      return;
    }
    setPending(true);
    try {
      const { error: failure } = await client.auth.updateUser({ password });
      if (failure) {
        const message = failure.message || "Could not update your password. Try again.";
        setError({ message, live: false });
        toast.error(message);
        return;
      }
      setPassword("");
      setRepeat("");
      toast.success("Password updated.");
      onSaved?.();
    } catch {
      const message = "Could not update your password. Check your connection and try again.";
      setError({ message, live: false });
      toast.error(message);
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
            className="control-input"
            id={`${id}-password`}
            type={reveal ? "text" : "password"}
            name="new-password"
            autoComplete="new-password"
            minLength={8}
            required
            placeholder="At least 8 characters"
            disabled={pending}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : hintId}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
          <ActionIcon
            className="settings-reveal"
            label={reveal ? "Hide password" : "Show password"}
            aria-pressed={reveal}
            disabled={pending}
            onClick={() => setReveal((value) => !value)}
          >
            {reveal ? <EyeOffIcon /> : <EyeIcon />}
          </ActionIcon>
        </div>
        <p id={hintId} className="control-hint">
          At least 8 characters.
        </p>
      </div>
      <div className="settings-field">
        <label htmlFor={`${id}-repeat`} className="label">
          Confirm new password
        </label>
        <input
          className="control-input"
          id={`${id}-repeat`}
          type={reveal ? "text" : "password"}
          name="repeat-password"
          autoComplete="new-password"
          minLength={8}
          required
          placeholder="Type it again"
          disabled={pending}
          aria-invalid={mismatch}
          aria-describedby={error ? errorId : undefined}
          value={repeat}
          onChange={(event) => {
            setRepeat(event.target.value);
          }}
        />
      </div>
      {error ? (
        <p id={errorId} className="control-error" role={error.live ? "alert" : undefined}>
          {error.message}
        </p>
      ) : null}
      <button
        type="submit"
        className="primary settings-submit"
        aria-busy={pending}
        disabled={pending}
      >
        <SaveIcon />
        {pending ? "Saving password..." : "Update password"}
      </button>
    </form>
  );
}
