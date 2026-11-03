import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useCallback } from "react";
import { loadProfile, type ReaderProfile, saveProfile } from "../../data/profile";
import { useLoad } from "../integration/useLoad";
import { ErrorPanel } from "../states/ErrorPanel";
import { SkeletonRows } from "../states/SkeletonRows";
import { PasswordForm } from "./PasswordForm";
import { SettingsScreen } from "./SettingsScreen";

export function AccountSettings({
  user,
  client,
  signOut,
}: {
  user: User;
  client: SupabaseClient;
  signOut: () => Promise<void>;
}) {
  const load = useCallback(() => loadProfile(client, user.id), [client, user.id]);
  const { data, loading, error, retry } = useLoad(load);
  const save = useCallback(
    async (patch: Pick<ReaderProfile, "display_name" | "annual_goal">) => {
      await saveProfile(client, user.id, patch);
    },
    [client, user.id],
  );

  if (loading)
    return (
      <main className="settings" id="settings">
        <h1>Settings</h1>
        <SkeletonRows label="Loading your settings" />
      </main>
    );

  if (error)
    return (
      <main className="settings" id="settings">
        <h1>Settings</h1>
        <ErrorPanel messages={[error]} retry={retry} />
      </main>
    );

  return (
    <SettingsScreen
      email={user.email ?? null}
      accountNote={
        user.email ? <p className="muted">This email signs you in and is read-only here.</p> : null
      }
      profile={data ?? { id: user.id, display_name: null, annual_goal: null }}
      saveProfile={save}
      password={<PasswordForm client={client} />}
      signOut={() => void signOut()}
      signOutLabel="Sign out"
    />
  );
}
