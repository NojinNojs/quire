import { defineConfig } from "@playwright/test";
import { browserAvailable, browserPath, stack } from "./tests/e2e/stack";

if (!browserAvailable) {
  console.log(
    `Skipping end to end smoke: system Chromium missing or not executable at ${browserPath}; no browser downloaded`,
  );
} else if (!stack) {
  console.log("Skipping end to end smoke: local Supabase is down");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list", { printSteps: true }]],
  outputDir: "/tmp/quire-e2e-results",
  use: {
    baseURL: "http://[::1]:5174",
    browserName: "chromium",
    launchOptions: { executablePath: browserPath },
  },
  webServer:
    browserAvailable && stack
      ? {
          command: "npm run dev -- --host ::1 --port 5174 --strictPort",
          url: "http://[::1]:5174",
          reuseExistingServer: false,
          env: {
            VITE_SUPABASE_URL: stack.API_URL,
            VITE_SUPABASE_ANON_KEY: stack.ANON_KEY,
          },
        }
      : undefined,
});
