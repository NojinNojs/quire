import { expect, test } from "./fixtures";

test("settings keeps the light theme and account navigation", async ({ signedInPage: page }) => {
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
  await page.reload();
  expect(await page.locator("html").evaluate((root) => getComputedStyle(root).colorScheme)).toBe("light");
});
