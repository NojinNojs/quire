import { useEffect, useState } from "react";
import { AuthForm } from "./features/auth/AuthForm";
import { SearchScreen } from "./features/catalog/SearchScreen";
import { SettingsScreen } from "./features/settings/SettingsScreen";
import { restoreTheme } from "./features/settings/settings";
import { ErrorPanel } from "./features/states/ErrorPanel";
import { SkeletonRows } from "./features/states/SkeletonRows";
import { useSession } from "./lib/useSession";

// Apply the saved palette during module startup, before React mounts any content.
restoreTheme(document.documentElement);

export default function App() {
  const [settings, setSettings] = useState(() => window.location.hash === "#settings");
  useEffect(() => {
    const navigate = () => {
      setSettings(window.location.hash === "#settings");
    };
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  const { user, ready, client, signOut, error, retry } = useSession();

  if (!client) {
    return (
      <main className="shell">
        <h1>Quire</h1>
        <p className="muted">
          Supabase is not configured. Copy <code>.env.example</code> to <code>.env</code> and fill
          in the project URL and anon key.
        </p>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="shell">
        <SkeletonRows label="Opening your account" />
      </main>
    );
  }

  if (error)
    return (
      <main className="shell">
        <h1>Quire</h1>
        <ErrorPanel messages={[error]} retry={retry} />
      </main>
    );

  if (!user) return <AuthForm client={client} />;

  return (
    <>
      <header className="shell app-header">
        <span className="brand">Quire</span>
        <nav aria-label="Main navigation">
          <a href="#catalogue" aria-current={!settings ? "page" : undefined}>
            Catalogue
          </a>
          <a href="#settings" aria-current={settings ? "page" : undefined}>
            Settings
          </a>
        </nav>
      </header>
      {settings ? (
        <SettingsScreen key={user.id} signOut={signOut} />
      ) : (
        <div className="app-catalog" id="catalogue">
          <SearchScreen key={user.id} user={user} client={client} signOut={signOut} />
        </div>
      )}
    </>
  );
}
