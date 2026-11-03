import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function addBook(page: Page, title: string, pages: string) {
  await page.goto("/#/search");
  await page.getByRole("tab", { name: "Enter manually" }).click();
  await page.getByLabel("Title (required)").fill(title);
  await page.getByLabel("Author", { exact: true }).fill("E2E Reader");
  await page.getByLabel("Pages", { exact: true }).fill(pages);
  await page.getByRole("button", { name: "Save book" }).click();
  await expect(page.getByText(`${title} added to your library.`)).toBeVisible();
  await page.goto("/#/shelf");
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

async function openBook(page: Page, title: string) {
  await page.goto("/#/shelf");
  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "All statuses" }).click();
  await page.getByText(title, { exact: true }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

test("profile name and goal persist across reload and greet the dashboard", async ({
  signedInPage: page,
}) => {
  await page.goto("/#/settings");
  await page.getByLabel("Display name").fill("Alice Reader");
  await page.getByLabel("Annual goal").fill("12");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved." })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Display name")).toHaveValue("Alice Reader");
  await expect(page.getByLabel("Annual goal")).toHaveValue("12");

  await page.goto("/#/today");
  await expect(page.getByRole("heading", { name: "Hello, Alice Reader" })).toBeVisible();

  await page.goto("/#/settings");
  await page.getByLabel("Annual goal").fill("0");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("alert")).toContainText("1 to 500");
  await page.goto("/#/today");
  await expect(page.getByText(/of 12 books/)).toBeVisible();

  await page.goto("/#/settings");
  await page.getByLabel("Annual goal").fill("");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved." })).toBeVisible();
  await page.goto("/#/today");
  await expect(page.getByText(/of 12 books/)).toHaveCount(0);
});

test("private review and reading status survive reload, and finishing records a local date", async ({
  signedInPage: page,
}) => {
  const title = `Companion lifecycle ${Date.now()}`;
  const wish = `Companion wishlist ${Date.now()}`;
  await addBook(page, title, "100");
  await addBook(page, wish, "40");

  await openBook(page, title);
  await page.getByLabel("Private notes and review").fill("A private reading note.");
  await page.getByRole("radio", { name: "4 out of 5" }).check();
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Review saved." })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Private notes and review")).toHaveValue("A private reading note.");
  await expect(page.getByRole("radio", { name: "4 out of 5" })).toBeChecked();

  await page.getByRole("combobox", { name: "Reading status" }).selectOption("reading");
  await expect(page.getByRole("button", { name: "Mark as finished" })).toBeVisible();

  await openBook(page, wish);
  await page.getByRole("combobox", { name: "Reading status" }).selectOption("reading");
  await expect(page.getByRole("alert")).toContainText("Another book is already being read");
  await page.getByRole("combobox", { name: "Reading status" }).selectOption("wishlist");
  await expect(page.getByRole("combobox", { name: "Reading status" })).toHaveValue("wishlist");
  await page.goto("/#/shelf");
  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "Wishlist" }).click();
  await expect(page.getByText(wish, { exact: true })).toBeVisible();
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);

  await openBook(page, title);
  await page.getByRole("button", { name: "Mark as finished" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Book marked as finished." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Choose next book" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Private notes and review")).toHaveValue("A private reading note.");
  await expect(page.getByRole("radio", { name: "4 out of 5" })).toBeChecked();
  await expect(page.getByRole("combobox", { name: "Reading status" })).toHaveValue("finished");

  await page.goto("/#/today");
  await expect(page.getByText("1 books finished")).toBeVisible();
  await expect(page.getByText("0 pages read")).toBeVisible();
  await openBook(page, wish);
  await page.getByRole("combobox", { name: "Reading status" }).selectOption("reading");
  await expect(page.getByRole("button", { name: "Mark as finished" })).toBeVisible();
  await openBook(page, title);
  await page.getByRole("button", { name: "Clear rating" }).click();
  await page.getByLabel("Private notes and review").fill("");
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Review saved." })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Private notes and review")).toHaveValue("");
  await expect(page.getByRole("radio", { name: "4 out of 5" })).not.toBeChecked();
});

test("undo discards pages while persisted pages reach the journal and the reading year", async ({
  signedInPage: page,
}) => {
  const title = `Companion log ${Date.now()}`;
  await addBook(page, title, "200");
  await openBook(page, title);
  await page.getByRole("combobox", { name: "Reading status" }).selectOption("reading");

  await page.goto("/#/today");
  await page.getByLabel("Pages read").fill("10");
  await page.getByRole("button", { name: "Log 10 pages" }).click();
  await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await page.goto("/#/journal");
  await expect(page.getByText(/10 pages/)).toHaveCount(0);

  await page.goto("/#/today");
  await page.getByLabel("Pages read").fill("10");
  await page.getByRole("button", { name: "Log 10 pages" }).click();
  await expect(page.getByRole("button", { name: "Undo" })).toBeHidden({ timeout: 10_000 });
  await expect(page.getByRole("status").filter({ hasText: "Pages logged." })).toBeVisible();

  await page.goto("/#/journal");
  await expect(page.getByRole("heading", { name: "Reading journal" })).toBeVisible();
  await expect(page.getByRole("link", { name: title })).toBeVisible();
  await expect(page.getByText("10 pages", { exact: true }).first()).toBeVisible();

  await page.goto("/#/stats");
  await expect(page.getByRole("heading", { name: "Reading year" })).toBeVisible();
  await expect(page.getByRole("definition").nth(1)).toHaveText("10");
  await expect(page.getByText("No reading recorded for this selection and year.")).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("definition").nth(1)).toHaveText("10");
  await page.goto("/#/today");
  await expect(page.getByText(/10 pages read/)).toBeVisible();
});
test("offline queued pages stay out of history and block finishing until retry saves", async ({ signedInPage: page }) => {
  const title = `Companion offline ${Date.now()}`;
  await addBook(page, title, "100");
  await openBook(page, title);
  const bookHash = new URL(page.url()).hash;
  await page.getByRole("combobox", { name: "Reading status" }).selectOption("reading");
  await page.goto("/#/today");
  await expect(page.getByLabel("Pages read")).toBeEnabled();
  await page.context().setOffline(true);
  await page.getByLabel("Pages read").fill("10");
  await page.getByRole("button", { name: "Log 10 pages" }).click();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible({ timeout: 10_000 });
  await page.evaluate(() => { window.location.hash = "/journal"; });
  await expect(page.getByRole("status", { name: "Loading reading journal" })).toBeVisible();
  await page.context().setOffline(false);
  await page.evaluate((hash) => { window.location.hash = hash; }, bookHash);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark as finished" })).toBeDisabled();
  await expect(page.getByRole("combobox", { name: "Reading status" })).toBeDisabled();
  await page.evaluate(() => { window.location.hash = "/journal"; });
  await expect(page.getByRole("heading", { name: "Reading journal" })).toBeVisible();
  await expect(page.getByRole("link", { name: title })).toHaveCount(0);
  await page.evaluate(() => { window.location.hash = "/today"; });
  await expect(page.getByRole("status").filter({ hasText: "Pages logged." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeHidden();
  await page.goto("/#/journal");
  await expect(page.getByRole("link", { name: title })).toBeVisible();
});
