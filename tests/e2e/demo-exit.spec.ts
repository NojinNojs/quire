import { expect, test } from "./fixtures";

test("leaving the demo returns to the account app without a demo route", async ({ page }) => {
  await page.goto("/?demo=1&source=reader#/today");
  await page.getByRole("button", { name: "Leave demo", exact: true }).first().click();
  await expect.poll(() => new URL(page.url()).searchParams.has("demo")).toBe(false);
  const url = new URL(page.url());
  expect(url.searchParams.get("source")).toBe("reader");
  expect(url.hash).toBe("");
});
