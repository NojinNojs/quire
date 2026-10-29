export const themes = ["shelf", "municipal", "oxford"] as const;
export type Theme = (typeof themes)[number];
export type Mode = "light" | "dark";
export type ThemePreference = `${Theme}-${Mode}`;
export const themeKey = "quire-theme";
export const defaultTheme: ThemePreference = "shelf-light";

type ThemeStorage = Pick<Storage, "getItem" | "setItem">;

export function resolveTheme(value: unknown): ThemePreference {
  return typeof value === "string" &&
    themes.some((theme) => value === `${theme}-light` || value === `${theme}-dark`)
    ? (value as ThemePreference)
    : defaultTheme;
}

export function restoreTheme(
  root: HTMLElement,
  getStorage: () => ThemeStorage = () => window.localStorage,
): ThemePreference {
  let preference = defaultTheme;
  try {
    preference = resolveTheme(getStorage().getItem(themeKey));
  } catch {
    // Storage can be blocked even when the browser exposes localStorage.
  }
  root.dataset.theme = preference;
  return preference;
}

export function persistTheme(
  value: ThemePreference,
  root: HTMLElement,
  getStorage: () => ThemeStorage = () => window.localStorage,
): boolean {
  const preference = resolveTheme(value);
  root.dataset.theme = preference;
  try {
    getStorage().setItem(themeKey, preference);
    return true;
  } catch {
    return false;
  }
}

export function contrastRatio(ink: string, surface: string): number {
  const luminance = (hex: string) => {
    const channels = hex.replace("#", "").match(/.{2}/g);
    if (channels?.length !== 3) return 0;
    const [r = 0, g = 0, b = 0] = channels.map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const foreground = luminance(ink);
  const background = luminance(surface);
  return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
}
