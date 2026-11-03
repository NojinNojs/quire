import type { ReactNode } from "react";
import type { ReaderProfile } from "../../data/profile";
import { ProfileForm } from "./ProfileForm";
import "../../styles/settings.css";

export type SettingsScreenProps = {
  email: string | null;
  profile: ReaderProfile;
  saveProfile: (patch: Pick<ReaderProfile, "display_name" | "annual_goal">) => Promise<void>;
  savedMessage?: string;
  password: ReactNode;
  accountNote?: ReactNode;
  storageWarning?: string | null;
  signOut: () => void;
  signOutLabel: string;
};

export function SettingsScreen({
  email,
  profile,
  saveProfile,
  savedMessage,
  password,
  accountNote,
  storageWarning,
  signOut,
  signOutLabel,
}: SettingsScreenProps) {
  return (
    <main className="settings" id="settings">
      <header className="settings-head">
        <h1>Settings</h1>
        <p className="muted">Your reading profile, account and session live here.</p>
      </header>

      <section className="settings-section" aria-labelledby="settings-profile">
        <h2 id="settings-profile">Reading profile</h2>
        <ProfileForm profile={profile} save={saveProfile} savedMessage={savedMessage} />
      </section>

      <section className="settings-section" aria-labelledby="settings-account">
        <h2 id="settings-account">Account</h2>
        {email ? (
          <div className="settings-readonly">
            <span className="label">Email</span>
            <p className="settings-value">{email}</p>
          </div>
        ) : null}
        {accountNote}
      </section>

      <section className="settings-section" aria-labelledby="settings-password">
        <h2 id="settings-password">Password</h2>
        {password}
      </section>

      {storageWarning ? (
        <p className="settings-warning" role="status">
          {storageWarning}
        </p>
      ) : null}

      <footer className="settings-footer">
        <a className="settings-link" href="#/today">
          Back to Today
        </a>
        <button type="button" className="settings-link" onClick={signOut}>
          {signOutLabel}
        </button>
      </footer>
    </main>
  );
}
