import { execFileSync } from "node:child_process";
import { accessSync, constants } from "node:fs";

export const browserPath = "/run/current-system/sw/bin/brave";
export const browserAvailable = (() => {
  try {
    accessSync(browserPath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
})();

export const stack = (() => {
  try {
    return JSON.parse(
      execFileSync("supabase", ["status", "-o", "json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 10_000,
      }),
    ) as { API_URL: string; ANON_KEY: string; SERVICE_ROLE_KEY: string };
  } catch {
    return null;
  }
})();
