import { useLayoutEffect, useState } from "react";
import {
  contrastRatio,
  persistTheme,
  resolveTheme,
  type ThemePreference,
  themes,
} from "./settings";

const descriptions = {
  shelf: "Neutral paper. Colour from your books.",
  municipal: "Green-grey stock. Archival inks.",
  oxford: "Cool paper. Deep blue ink.",
};

export function SettingsScreen({ signOut }: { signOut: () => void }) {
  const [preference, setPreference] = useState(() =>
    resolveTheme(document.documentElement.dataset.theme),
  );
  const [saved, setSaved] = useState<boolean | null>(null);
  const [pair, setPair] = useState({ ink: "", surface: "", ratio: "" });
  const [theme, mode] = preference.split("-");

  // biome-ignore lint/correctness/useExhaustiveDependencies: the palette changes computed CSS tokens.
  useLayoutEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const ink = style.getPropertyValue("--ink").trim();
    const surface = style.getPropertyValue("--surface").trim();
    setPair({ ink, surface, ratio: contrastRatio(ink, surface).toFixed(2) });
  }, [preference]);

  function select(value: ThemePreference) {
    setSaved(persistTheme(value, document.documentElement));
    setPreference(value);
  }

  return (
    <main className="shell settings" id="settings">
      <h1>Settings</h1>
      <p className="muted">Choose how Quire looks on this device.</p>
      <fieldset className="settings-themes">
        <legend>Theme</legend>
        {themes.map((name) => (
          <label className="settings-choice" key={name}>
            <input
              type="radio"
              name="theme"
              value={name}
              checked={theme === name}
              onChange={() => select(`${name}-${mode === "dark" ? "dark" : "light"}`)}
            />
            <span>
              <span className={`settings-name settings-name-${name}`}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </span>
              <span className="settings-description">{descriptions[name]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="settings-mode">
        <span id="mode-label">Dark mode</span>
        <button
          type="button"
          role="switch"
          aria-labelledby="mode-label"
          aria-checked={mode === "dark"}
          className="settings-toggle"
          onClick={() =>
            select(
              `${themes.find((name) => name === theme) ?? "shelf"}-${mode === "dark" ? "light" : "dark"}`,
            )
          }
        >
          {mode === "dark" ? "On" : "Off"}
        </button>
      </div>
      <section className="settings-contrast" aria-labelledby="contrast-title">
        <h2 id="contrast-title">Current contrast pair</h2>
        <p className="settings-sample">Quire text on page surface.</p>
        <p className="settings-pair">
          Ink {pair.ink} on surface {pair.surface}
        </p>
        <p className="muted">{pair.ratio}:1 text contrast</p>
      </section>
      <p className="settings-status" role="status">
        {saved === false
          ? "Theme applied. Could not save it on this device. Allow browser storage to keep your choice."
          : saved
            ? "Theme saved on this device."
            : "Your choice is saved automatically on this device."}
      </p>
      <footer className="settings-footer">
        <a className="settings-link" href="#catalogue">
          Back to catalogue
        </a>
        <button type="button" className="settings-link" onClick={signOut}>
          Sign out
        </button>
      </footer>
    </main>
  );
}
