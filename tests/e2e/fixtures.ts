import { randomUUID } from "node:crypto";
import { test as base, expect, type Page } from "@playwright/test";
import { browserAvailable, browserPath, stack } from "./stack";

export { expect };
export const test = base.extend<{ signedInPage: Page; prerequisites: void }>({
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
  signedInPage: async ({ page, request }, use) => {
    if (!stack) throw new Error("Local Supabase is required");
    await page.goto("/");
    await page.getByRole("button", { name: "No account yet? Create one" }).click();
    await page.getByLabel("Email").fill(`e2e.${randomUUID()}@quire.local`);
    await page.getByLabel("Password").fill(`E2e-${randomUUID()}`);
    const signup = page.waitForResponse(
      (response) =>
        response.url().includes("/auth/v1/signup") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    const response = await signup;
    expect(response.ok()).toBeTruthy();
    const { user } = await response.json();
    try {
      await expect(page.getByRole("heading", { name: "Add a book" })).toBeVisible();
      await expect(page.getByText("0 books", { exact: true })).toBeVisible();
      await use(page);
    } finally {
      const cleanup = await request.delete(`${stack.API_URL}/auth/v1/admin/users/${user.id}`, {
        headers: {
          apikey: stack.SERVICE_ROLE_KEY,
          Authorization: `Bearer ${stack.SERVICE_ROLE_KEY}`,
        },
      });
      expect(cleanup.ok(), "Remove the generated local account and its books").toBeTruthy();
    }
  },
});
