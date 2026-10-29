import { expect, test } from "./fixtures";

test("sign up, open the catalogue, and sign out", async ({ signedInPage: page }) => {
  await expect(page.getByRole("tab", { name: "Search catalogue" })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add a book" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
});

for (const theme of ["shelf-light", "municipal-dark"] as const) {
  test(`borrower's card faces at 390 in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((value) => localStorage.setItem("quire-theme", value), theme);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
    await page.screenshot({ path: `docs/evidence/design-auth/${theme}-signin-390.png` });
    const hash = new URL(page.url()).hash;
    await page.getByRole("button", { name: "No account yet? Create one" }).click();
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
    expect(new URL(page.url()).hash).toBe(hash);
    await page.screenshot({ path: `docs/evidence/design-auth/${theme}-signup-390.png` });
    await page.getByLabel("Password", { exact: true }).fill("Library-card42");
    await expect(page.getByText("Password strength: Strong")).toBeVisible();
    await page.getByLabel("Repeat", { exact: true }).fill("Different-card42");
    await expect(page.getByRole("alert")).toHaveText("Passwords do not match.");
    await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeDisabled();
    await page.screenshot({ path: `docs/evidence/design-auth/${theme}-mismatch-390.png` });
    await page.setViewportSize({ width: 420, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("inline auth errors, issuing state, and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "No account yet? Create one" }).click();
  expect(await page.locator(".auth-face").evaluate((face) => getComputedStyle(face).animationName)).toBe("none");
  await page.getByRole("button", { name: "Already have an account? Sign in" }).click();
  await page.route("**/auth/v1/token?grant_type=password", async (route) => {
    await route.fulfill({ status: 400, json: { error: "invalid_grant", error_description: "Invalid login credentials" } });
  });
  await page.getByLabel("Email").fill("reader@quire.local");
  await page.getByLabel("Password", { exact: true }).fill("Library-card42");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
  await page.screenshot({ path: "docs/evidence/design-auth/error-390.png" });
  await page.route("**/auth/v1/token?grant_type=password", () => {});
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("button", { name: "Issuing card" })).toBeDisabled();
  expect(await page.locator(".auth-issuing").evaluate((rule) => getComputedStyle(rule).animationName)).toBe("none");
});

test("card text contrast exceeds 7:1 in all six modes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  for (const theme of ["shelf-light", "shelf-dark", "municipal-light", "municipal-dark", "oxford-light", "oxford-dark"]) {
    const ratios = await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
      const card = document.querySelector(".borrower-card");
      if (!card) throw new Error("Card missing");
      const luminance = (color: string) => {
        const [r, g, b] = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map((channel) => {
          const n = Number(channel) / 255;
          return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const background = getComputedStyle(card).backgroundColor;
      return [...card.querySelectorAll("h1, p, .label, .auth-mark, button, input")].map((element) => {
        const style = getComputedStyle(element);
        const ink = luminance(style.color);
        const paper = luminance(element.matches(".primary") ? style.backgroundColor : background);
        return (Math.max(ink, paper) + 0.05) / (Math.min(ink, paper) + 0.05);
      });
    }, theme);
    for (const ratio of ratios) expect(ratio, theme).toBeGreaterThanOrEqual(7);
  }
});
