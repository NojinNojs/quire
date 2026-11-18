import { randomUUID } from "node:crypto";
import { test as base, expect, type Page } from "@playwright/test";
import { Accounts } from "./accounts";
import { browserAvailable, browserPath, stack } from "./stack";

export { expect };
export const test = base.extend<{ signedInPage: Page; prerequisites: void; accounts: Accounts }>({
  prerequisites: [
    async ({}, use, testInfo) => {
      testInfo.skip(
        !browserAvailable,
        `System Chromium missing or not executable: ${browserPath}; no browser downloaded`,
      );
      testInfo.skip(!stack, "Local Supabase is down; skipping end to end smoke");
      await use();
    },
    { auto: true },
  ],
  accounts: async ({ request }, use) => {
    const accounts = new Accounts(request);
    try {
      await use(accounts);
    } finally {
      await accounts.cleanup();
    }
  },
  signedInPage: async ({ page, accounts }, use) => {
    if (!stack) throw new Error("Local Supabase is required");
    await page.goto("/");
    await page.getByRole("button", { name: "Open Quire" }).click();
    await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "No account yet? Create one" }).click();
    await page.getByLabel("Email").fill(`e2e.${randomUUID()}@quire.local`);
    await page.getByLabel("Password").fill(`E2e-${randomUUID()}`);
    const signup = page.waitForResponse(
      (response) =>
        response.url().includes("/auth/v1/signup") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    const response = await signup;
    const id = accounts.track(await response.json());
    try {
      expect(response.ok()).toBeTruthy();
      expect(id, "Signup response contains a user ID").toBeTruthy();
      const skip = page.getByRole("button", { name: "Skip tour" });
      const shell = page.getByRole("navigation", { name: "Main navigation" });
      await expect(skip.or(shell).first()).toBeVisible();
      if (await skip.isVisible()) await skip.click();
      await page.goto("/#/search");
      await expect(page.getByRole("heading", { name: "Add a book" })).toBeVisible();
      await expect(page.getByText("0 books", { exact: true })).toBeVisible();
      await use(page);
    } finally {
      await accounts.cleanup();
    }
  },
});
