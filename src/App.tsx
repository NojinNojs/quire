import { useEffect, useState } from "react";
import { AuthForm } from "./features/auth/AuthForm";
import { CatalogueRoute } from "./features/integration/CatalogueRoute";
import { ShelfRoute } from "./features/integration/ShelfRoute";
import { TodayRoute } from "./features/integration/TodayRoute";
import { AppShell } from "./features/nav/AppShell";
import { parseRoute } from "./features/nav/routes";
import { SettingsScreen } from "./features/settings/SettingsScreen";
import { restoreTheme } from "./features/settings/settings";
import { ErrorPanel } from "./features/states/ErrorPanel";
import { SkeletonRows } from "./features/states/SkeletonRows";
import { useSession } from "./lib/useSession";

import "./styles/integration.css";

// Apply the saved palette during module startup, before React mounts any content.
restoreTheme(document.documentElement);

export default function App() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const navigate = () => {
      setRoute(parseRoute(window.location.hash));
    };
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  const { user, ready, client, signOut, error, retry } = useSession();

  useEffect(() => {
    // Keep the first sign-in journey on book entry, while preserving explicit deep links.
    if (ready && !user && !window.location.hash) window.location.hash = "/search";
  }, [ready, user]);

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
    <AppShell route={route}>
      {route === "settings" ? (
        <SettingsScreen key={user.id} signOut={signOut} />
      ) : route === "search" ? (
        <CatalogueRoute key={user.id} user={user} client={client} signOut={signOut} />
      ) : route === "shelf" ? (
        <ShelfRoute key={user.id} owner={user.id} client={client} />
      ) : (
        <TodayRoute key={user.id} owner={user.id} client={client} />
      )}
    </AppShell>
  );
}
