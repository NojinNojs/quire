import { useEffect, useState } from "react";
import { ToastProvider } from "./components/toast";
import { AuthForm } from "./features/auth/AuthForm";
import { RecoveryScreen } from "./features/auth/RecoveryScreen";
import { DemoApp } from "./features/demo/DemoApp";
import { BookRoute } from "./features/integration/BookRoute";
import { CatalogueRoute } from "./features/integration/CatalogueRoute";
import { JournalRoute } from "./features/integration/JournalRoute";
import { ShelfRoute } from "./features/integration/ShelfRoute";
import { StatsRoute } from "./features/integration/StatsRoute";
import { TodayRoute } from "./features/integration/TodayRoute";
import { AppShell } from "./features/nav/AppShell";
import { parseRoute } from "./features/nav/routes";
import { ScanSheet } from "./features/scan/ScanSheet";
import { useScanRequest } from "./features/scan/useScanRequest";
import { AccountSettings } from "./features/settings/AccountSettings";
import { ErrorPanel } from "./features/states/ErrorPanel";
import { SkeletonRows } from "./features/states/SkeletonRows";
import { isDemoMode } from "./lib/demoMode";
import { useSession } from "./lib/useSession";

import "./styles/integration.css";

export default function App() {
  return <ToastProvider>{isDemoMode() ? <DemoApp /> : <AccountApp />}</ToastProvider>;
}

function AccountApp() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  const scan = useScanRequest();
  const { user, ready, client, signOut, error, retry, recovery, recoveryError, completeRecovery } =
    useSession();

  useEffect(() => {
    const navigate = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);

  if (!client) {
    return (
      <main className="shell">
        <h1>Quire</h1>
        <p className="muted">
          Supabase is not configured. Copy <code>.env.example</code> to <code>.env</code> and fill
          in the project URL and anon key.
        </p>
        <a className="settings-link" href="?demo=1#/shelf">
          Try the interactive demo
        </a>
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
  if (recovery || recoveryError) {
    return (
      <RecoveryScreen
        client={client}
        user={user}
        error={recoveryError}
        completeRecovery={completeRecovery}
      />
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
      <AppShell route={route} guideScope={user.id} onScan={scan.open}>
        {typeof route === "object" ? (
          <BookRoute key={route.id} id={route.id} client={client} owner={user.id} />
        ) : route === "settings" ? (
          <AccountSettings key={user.id} user={user} client={client} signOut={signOut} />
        ) : route === "search" ? (
          <CatalogueRoute
            key={user.id}
            user={user}
            client={client}
            signOut={signOut}
            onScan={scan.open}
            scanRequest={scan.request}
            onScanHandled={scan.consume}
          />
        ) : route === "shelf" ? (
          <ShelfRoute key={user.id} owner={user.id} client={client} />
        ) : route === "journal" ? (
          <JournalRoute key={user.id} owner={user.id} client={client} />
        ) : route === "stats" ? (
          <StatsRoute key={user.id} owner={user.id} client={client} />
        ) : (
          <TodayRoute key={user.id} owner={user.id} client={client} />
        )}
      </AppShell>
      {scan.scanning && (
        <ScanSheet
          onClose={scan.close}
          onDetected={(isbn) => {
            scan.issue(isbn);
            window.location.hash = "/search";
          }}
        />
      )}
    </>
  );
}
