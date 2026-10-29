import { expect, test } from "./fixtures";

test("search, save a candidate, and refuse a persisted duplicate", async ({
  signedInPage: page,
}) => {
  await page.route("https://www.googleapis.com/books/v1/volumes?**", (route) =>
    route.fulfill({
      json: {
        items: [
          {
            volumeInfo: {
              title: "E2E catalogue edition",
              authors: ["Smoke Test"],
              publisher: "Local fixture",
              publishedDate: "2020",
              pageCount: 200,
              language: "en",
              industryIdentifiers: [{ type: "ISBN_13", identifier: "9780140126938" }],
            },
          },
        ],
      },
    }),
  );
  await page.route("https://openlibrary.org/search.json?**", (route) =>
    route.fulfill({ json: { docs: [] } }),
  );
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
  ).toBeVisible();
  await expect(page.getByText("1 book", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("1 book", { exact: true })).toBeVisible();
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
