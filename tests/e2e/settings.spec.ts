import { expect, test } from "./fixtures";

test("settings keeps the light theme and account navigation", async ({ signedInPage: page }) => {
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Quire uses a light reading theme.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to catalogue" })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Quire uses a light reading theme.")).toBeVisible();
  expect(await page.locator("html").evaluate((root) => getComputedStyle(root).colorScheme)).toBe("light");
});
