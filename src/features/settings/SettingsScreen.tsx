export function SettingsScreen({ signOut, demo = false }: { signOut: () => void; demo?: boolean }) {
  return (
    <main className="shell settings" id="settings">
      <h1>Settings</h1>
      <p className="muted">Quire uses a light reading theme.</p>
      <footer className="settings-footer">
        <a className="settings-link" href="#catalogue">
          Back to catalogue
        </a>
        <button type="button" className="settings-link" onClick={signOut}>
          {demo ? "Leave demo" : "Sign out"}
        </button>
      </footer>
    </main>
  );
}
