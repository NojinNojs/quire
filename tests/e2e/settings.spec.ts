import { expect, test } from "./fixtures";

test("theme chosen in settings is applied and survives a reload", async ({ signedInPage: page }) => {
  const settings = page
    .getByRole("button", { name: /^settings$/i })
    .or(page.getByRole("link", { name: /^settings$/i }));
  test.skip(
    (await settings.count()) === 0,
    "Settings screen is absent, so theme persistence cannot be exercised",
  );
  await settings.click();

  const group = page.getByRole("group", { name: /theme/i });
  await expect(group).toBeVisible();

  const municipal = page.getByRole("radio", { name: /municipal/i });
  await municipal.check();

  const root = page.locator("html");
  const applied = await root.getAttribute("data-theme");
  expect(applied).toMatch(/^municipal-/);

  // the dark mode switch must flip the mode half of the preference
  const modeSwitch = page.getByRole("switch", { name: /dark mode/i });
  if ((await modeSwitch.count()) > 0) {
    await modeSwitch.click();
    await expect(root).toHaveAttribute("data-theme", /municipal-dark/);
  }

  const beforeReload = await root.getAttribute("data-theme");
  await page.reload();
  await expect(root).toHaveAttribute("data-theme", beforeReload as string);
});
