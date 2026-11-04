import { expect, test } from "./fixtures";

test("search, save a candidate, and refuse a persisted duplicate", async ({
  signedInPage: page,
}) => {
  const edition = {
    volumeInfo: {
      title: "E2E catalogue edition",
      authors: ["Smoke Test"],
      publisher: "Local fixture",
      publishedDate: "2020",
      pageCount: 200,
      language: "en",
      industryIdentifiers: [{ type: "ISBN_13", identifier: "9780140126938" }],
    },
  };
  await page.route(/https:\/\/(www\.googleapis\.com|openlibrary\.org)\//, (route) => {
    const url = route.request().url();
    if (url.includes("googleapis.com")) return route.fulfill({ json: { items: [edition] } });
    if (url.includes("/search.json")) return route.fulfill({ json: { docs: [] } });
    return route.fulfill({ status: 404, json: { error: "Not found" } });
  });
  await page.route("**/gb/books?**", (route) => route.fulfill({ status: 404, body: "Not found" }));
  const search = async () => {
    await page.getByLabel("Title, author or ISBN").fill("E2E catalogue edition");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByRole("heading", { name: "E2E catalogue edition" })).toBeVisible();
  };
  await search();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByText("E2E catalogue edition added to your library.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Added", exact: true })).toBeDisabled();
  await expect(page.getByText("1 book", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText("1 book", { exact: true })).toBeVisible();
  await search();
  const duplicate = page.waitForResponse(
    (response) =>
      response.url().includes("/rest/v1/books") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const response = await duplicate;
  expect(response.status()).toBe(409);
  expect((await response.json()).code).toBe("23505");
  await expect(
    page.getByText("This edition is already in your library.", { exact: true }),
  ).toHaveCount(1);
  await expect(page.locator(".error-panel[role='alert']")).toContainText(
    "This edition is already in your library.",
  );
  await expect(
    page.locator(".toast", { hasText: "This edition is already in your library." }),
  ).toHaveCount(0);
  await expect(page.getByText("1 book", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("1 book", { exact: true })).toBeVisible();
  await search();

  await page.route(/\/rest\/v1\/books(?:\?|$)/, (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 500,
          json: { code: "XX000", message: "Catalogue write failed" },
        })
      : route.continue(),
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const writeFailure = "Could not access your books. Check your connection and try again.";
  await expect(page.locator(".toast")).toHaveCount(1);
  await expect(page.locator(".toast-title")).toHaveText(writeFailure);
  await expect(page.locator(".error-panel")).toContainText(writeFailure);
  await expect(page.locator(".error-panel")).not.toHaveAttribute("role", "alert");
  await expect(page.getByRole("alert")).toContainText(writeFailure);
});

test("empty query shows guidance and prevents provider searches", async ({
  signedInPage: page,
}) => {
  const providerRequests: string[] = [];
  await page.route(/https:\/\/(www.googleapis.com|openlibrary.org)\//, (route) => {
    providerRequests.push(route.request().url());
    return route.fulfill({ json: {} });
  });
  const query = page.getByLabel("Title, author or ISBN");
  await expect(query).toHaveValue("");
  await expect(
    page.getByText("Search for the edition you own, or enter it manually."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Search", exact: true })).toBeDisabled();
  await query.fill("   ");
  await expect(page.getByRole("button", { name: "Search", exact: true })).toBeDisabled();
  await query.press("Enter");
  await expect(page.getByRole("heading", { name: "Catalogue candidates" })).toHaveCount(0);
  expect(providerRequests).toEqual([]);
  await page.getByRole("button", { name: "Enter manually", exact: true }).click();
  await expect(page.getByLabel("Title (required)", { exact: true })).toBeVisible();
});

test("toast stack measures heights without observer loops", async ({ page }) => {
  await page.addInitScript(() => {
    const scope = window as Window & { __observerErrors?: string[] };
    scope.__observerErrors = [];
    window.addEventListener("error", (event) => {
      if (String(event.message).includes("ResizeObserver loop")) {
        scope.__observerErrors?.push(String(event.message));
      }
    });
  });
  await page.goto("/?demo=1#/search");
  await page.getByRole("tab", { name: "Enter manually", exact: true }).click();
  const title = page.getByLabel("Title (required)");
  const names = [
    "Ulysses",
    "The Long Title of a Very Long Book That Wraps Across Several Lines in the Toast",
    "Walden",
  ];
  for (const name of names) {
    await title.fill(name);
    await title.press("Enter");
    await page.waitForTimeout(80);
  }
  const toasts = page.locator(".toast");
  await expect(toasts).toHaveCount(3);
  await toasts.first().hover();
  await expect(toasts.first()).toHaveAttribute("data-expanded");
  await page.mouse.move(4, 4);
  await expect(toasts.first()).not.toHaveAttribute("data-expanded");
  await toasts.first().hover();
  await expect(toasts.first()).toHaveAttribute("data-expanded");
  await title.fill("Meditations");
  await title.press("Enter");
  await expect(toasts).toHaveCount(4);
  await page.getByRole("button", { name: "Dismiss notification" }).first().click();
  await expect(toasts).toHaveCount(3);
  const errors = await page.evaluate(
    () => (window as Window & { __observerErrors?: string[] }).__observerErrors ?? [],
  );
  expect(errors).toEqual([]);
});
