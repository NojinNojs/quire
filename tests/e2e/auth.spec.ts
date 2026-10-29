import { expect, test } from "./fixtures";

test("sign up, open the catalogue, and sign out", async ({ signedInPage: page }) => {
  await expect(page.getByRole("tab", { name: "Search catalogue" })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add a book" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
});
