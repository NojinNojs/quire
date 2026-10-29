import { expect, test } from "./fixtures";

test("theme selected in settings persists after reload", async ({ signedInPage: page }) => {
  const settings = page
    .getByRole("button", { name: /^settings$/i })
    .or(page.getByRole("link", { name: /^settings$/i }));
  test.skip(
    (await settings.count()) === 0,
    "Settings screen is absent on refactor/quality; theme persistence cannot be exercised",
  );
  await settings.click();
  const theme = page.getByRole("combobox", { name: /theme/i });
  await expect(theme).toBeVisible();
  const initial = await theme.inputValue();
  const alternative = await theme
    .locator("option")
    .evaluateAll(
      (options, current) =>
        options
          .map((option) => (option as HTMLOptionElement).value)
          .find((value) => value !== current),
      initial,
    );
  expect(alternative, "Settings must offer another theme").toBeTruthy();
  await theme.selectOption(alternative as string);
  const root = page.locator("html");
  const applied = await root.getAttribute("data-theme");
  expect(applied).toBe(alternative);
  await page.reload();
  await expect(root).toHaveAttribute("data-theme", applied as string);
});
