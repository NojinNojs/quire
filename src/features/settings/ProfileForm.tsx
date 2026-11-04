import { useId, useState } from "react";
import { SaveIcon } from "../../components/icons";
import { useToast } from "../../components/toast";
import type { ReaderProfile } from "../../data/profile";

export type ProfileFormProps = {
  profile: ReaderProfile;
  save: (patch: Pick<ReaderProfile, "display_name" | "annual_goal">) => Promise<void>;
  savedMessage?: string;
};

const GOAL_ERROR = "Annual goal must be a whole number from 1 to 500, or blank.";

function parseGoal(text: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: true, value: null };
  const value = Number(trimmed);
  if (!/^\d+$/.test(trimmed) || !Number.isInteger(value) || value < 1 || value > 500)
    return { ok: false };
  return { ok: true, value };
}

export function ProfileForm({ profile, save, savedMessage = "Profile saved." }: ProfileFormProps) {
  const id = useId();
  const toast = useToast();
  const [name, setName] = useState(profile.display_name ?? "");
  const [goal, setGoal] = useState(profile.annual_goal === null ? "" : String(profile.annual_goal));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ message: string; live: boolean } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    const annualGoal = parseGoal(goal);
    if (!annualGoal.ok) {
      setError({ message: GOAL_ERROR, live: true });
      return;
    }
    setPending(true);
    try {
      await save({ display_name: name.trim() || null, annual_goal: annualGoal.value });
      toast.success(savedMessage);
    } catch (cause) {
      const message =
        cause instanceof Error && cause.message
          ? cause.message
          : "Could not save your profile. Try again.";
      setError({ message, live: false });
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="settings-form profile-form" onSubmit={submit} noValidate>
      <div className="settings-field">
        <label htmlFor={`${id}-name`} className="label">
          Display name
        </label>
        <input
          className="control-input"
          id={`${id}-name`}
          type="text"
          name="display_name"
          autoComplete="nickname"
          maxLength={80}
          placeholder="e.g. Ana"
          aria-describedby={`${id}-name-hint`}
          disabled={pending}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
        />
        <p id={`${id}-name-hint`} className="control-hint">
          Shown on your dashboard. Leave blank for a plain greeting.
        </p>
      </div>
      <div className="settings-field">
        <label htmlFor={`${id}-goal`} className="label">
          Annual goal
        </label>
        <input
          className="control-input"
          id={`${id}-goal`}
          type="number"
          inputMode="numeric"
          autoComplete="off"
          name="annual_goal"
          min={1}
          max={500}
          step={1}
          placeholder="e.g. 24"
          aria-describedby={`${id}-goal-hint${error ? ` ${id}-error` : ""}`}
          aria-invalid={error?.message === GOAL_ERROR}
          disabled={pending}
          value={goal}
          onChange={(event) => {
            setGoal(event.target.value);
            setError(null);
          }}
        />
        <p id={`${id}-goal-hint`} className="control-hint">
          Books to finish this year, from 1 to 500. Leave blank for no target.
        </p>
      </div>
      {error ? (
        <p id={`${id}-error`} className="control-error" role={error.live ? "alert" : undefined}>
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
        {pending ? "Saving profile..." : "Save profile"}
      </button>
    </form>
  );
}
