import type { ReaderProfile } from "../../data/profile";
import { SettingsScreen } from "./SettingsScreen";

export type DemoSettingsProps = {
  profile: Pick<ReaderProfile, "display_name" | "annual_goal">;
  saveProfile: (patch: Pick<ReaderProfile, "display_name" | "annual_goal">) => Promise<void>;
  storageFailed: boolean;
  leaveDemo: () => void;
};

export function DemoSettings({
  profile,
  saveProfile,
  storageFailed,
  leaveDemo,
}: DemoSettingsProps) {
  return (
    <SettingsScreen
      email={null}
      accountNote={
        <p className="muted">
          The demo runs without an account, so there is no email here to show or change.
        </p>
      }
      profile={{ id: "demo", ...profile }}
      saveProfile={saveProfile}
      savedMessage="Saved on this device."
      password={
        <p className="muted">
          Passwords belong to a Quire account. Leave the demo to sign in and manage one.
        </p>
      }
      storageWarning={
        storageFailed
          ? "Browser storage is blocked, so changes here cannot be saved on this device."
          : null
      }
      signOut={leaveDemo}
      signOutLabel="Leave demo and sign in"
    />
  );
}
