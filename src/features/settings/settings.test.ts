import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  persistTheme,
  resolveTheme,
  restoreTheme,
  themeKey,
  themes,
} from "./settings";

function fixture(initial: string | null = null) {
  const values = new Map<string, string>();
  if (initial !== null) values.set(themeKey, initial);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const root = { dataset: {} } as HTMLElement;
  return { root, storage, values };
}

const blockedStorage = () => {
  throw new Error("Storage blocked");
};

describe("theme preference", () => {
  it("resolves, persists and restores each of the six palettes", () => {
    for (const theme of themes) {
      for (const mode of ["light", "dark"] as const) {
        const value = `${theme}-${mode}` as const;
        const { root, storage, values } = fixture();
        expect(resolveTheme(value)).toBe(value);
        expect(persistTheme(value, root, () => storage)).toBe(true);
        expect(root.dataset.theme).toBe(value);
        expect(values.get(themeKey)).toBe(value);
        const boot = fixture(values.get(themeKey));
        expect(restoreTheme(boot.root, () => boot.storage)).toBe(value);
        expect(boot.root.dataset.theme).toBe(value);
      }
    }
  });

  it("uses shelf-light for missing, corrupt and unsupported stored values", () => {
    for (const value of [
      null,
      undefined,
      "",
      "shelf",
      "shelf-DARK",
      "oxford-dark ",
      "other-dark",
      {},
      '{"theme":"shelf"}',
    ]) {
      expect(resolveTheme(value)).toBe("shelf-light");
    }
    const { root, storage } = fixture("bad-theme");
    expect(restoreTheme(root, () => storage)).toBe("shelf-light");
    expect(root.dataset.theme).toBe("shelf-light");
  });

  it("restores the default if accessing storage or reading it fails", () => {
    const { root, storage } = fixture();
    expect(restoreTheme(root, blockedStorage)).toBe("shelf-light");
    expect(restoreTheme(root, () => ({ ...storage, getItem: blockedStorage }))).toBe("shelf-light");
    expect(root.dataset.theme).toBe("shelf-light");
  });

  it("applies the choice even when storage access or writing fails", () => {
    const { root, storage } = fixture();
    expect(persistTheme("oxford-dark", root, blockedStorage)).toBe(false);
    expect(root.dataset.theme).toBe("oxford-dark");
    expect(
      persistTheme("municipal-light", root, () => ({ ...storage, setItem: blockedStorage })),
    ).toBe(false);
    expect(root.dataset.theme).toBe("municipal-light");
  });
});

describe("contrast pair", () => {
  it("measures WCAG relative luminance in either foreground/background order", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBe(21);
    expect(contrastRatio("#ffffff", "#000000")).toBe(21);
    expect(contrastRatio("#131313", "#f4f4f1")).toBeCloseTo(16.86, 2);
    expect(contrastRatio("#121212", "#121212")).toBe(1);
  });
});
