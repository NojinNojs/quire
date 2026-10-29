import { readFileSync, writeFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const evidence = "docs/evidence/catalogue-resilience";
const recordedHtml = readFileSync(`${evidence}/google-html.txt`, "utf8");
const html = recordedHtml.slice(recordedHtml.indexOf("<!DOCTYPE"));

async function checkCatalogue(page: Page, state: string) {
  const checks = [];
  for (const theme of [
    "shelf-light",
    "shelf-dark",
    "municipal-light",
    "municipal-dark",
    "oxford-light",
    "oxford-dark",
  ]) {
    const ratios = await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
      const luminance = (color: string) => {
        const [r = 0, g = 0, b = 0] = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map((channel) => {
          const n = Number(channel) / 255;
          return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      return [
        ...document.querySelectorAll(
          ".catalog h1, .catalog h2, .catalog h3, .catalog p, .catalog .label, .catalog .book-count, .catalog button, .catalog input, .catalog-cover span",
        ),
      ]
        .filter((el) => el.getClientRects().length)
        .map((el) => {
          let parent: Element | null = el;
          let background = "rgba(0, 0, 0, 0)";
          while (parent && background === "rgba(0, 0, 0, 0)") {
            background = getComputedStyle(parent).backgroundColor;
            parent = parent.parentElement;
          }
          const ink = luminance(getComputedStyle(el).color);
          const paper = luminance(background);
          return (Math.max(ink, paper) + 0.05) / (Math.min(ink, paper) + 0.05);
        });
    }, theme);
    for (const ratio of ratios) expect(ratio, `${state} ${theme}`).toBeGreaterThanOrEqual(7);
    checks.push({ state, theme, minimumTextContrast: Math.min(...ratios) });
  }
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "shelf-light";
  });
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `${state} at ${width}`,
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  return checks;
}

test("HTML metadata survives earlier failures and manual recovery preserves the ISBN", async ({
  signedInPage: page,
}) => {
  let htmlAvailable = true;
  await page.route("https://www.googleapis.com/books/v1/volumes?**", (route) =>
    route.fulfill({ status: 429, json: { error: { message: "Quota exceeded" } } }),
  );
  await page.route("https://openlibrary.org/isbn/**", (route) =>
    route.fulfill({ status: 404, json: { error: "Not found" } }),
  );
  await page.route("https://openlibrary.org/search.json?**", (route) =>
    route.fulfill({ json: { docs: [] } }),
  );
  await page.route("**/gb/books?**", (route) =>
    htmlAvailable
      ? route.fulfill({ contentType: "text/html; charset=utf-8", body: html })
      : route.fulfill({ status: 404, body: "Not found" }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const search = async () => {
    await page.getByRole("searchbox").fill("9786020788036");
    await page.getByRole("button", { name: "Search", exact: true }).click();
  };
  await search();
  await expect(page.getByRole("heading", { name: "Dari dalam kubur: sebuah novel" })).toBeVisible();
  await expect(page.getByText("Google Books (metadata only)")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  const checks = await checkCatalogue(page, "HTML candidate");
  await page.screenshot({ path: "/tmp/quire-html-candidate.png", fullPage: true });
  await page.getByRole("button", { name: "Add details" }).click();
  await expect(page.getByLabel("ISBN", { exact: true })).toHaveValue("9786020788036");
  await expect(page.getByLabel("Author", { exact: true })).toHaveValue("Soe Tjen Marching");
  await page.getByLabel("Pages", { exact: true }).fill("240");
  await page.getByLabel("Publisher", { exact: true }).fill("Reader supplied publisher");
  checks.push(...(await checkCatalogue(page, "Manual details")));
  // Reload clears the session cache before exercising total failure.
  await page.getByRole("tab", { name: "Search catalogue" }).click();
  htmlAvailable = false;
  await page.reload();
  await search();
  await expect(page.getByRole("alert")).toHaveCount(1);
  await expect(page.getByRole("alert")).toContainText(
    "Tried Google Books API, Open Library ISBN, Open Library search, and Google Books HTML.",
  );
  await expect(page.getByRole("alert").getByRole("button")).toHaveCount(1);
  checks.push(...(await checkCatalogue(page, "Single error")));
  writeFileSync("/tmp/quire-catalogue-browser-checks.json", JSON.stringify(checks, null, 2));
  await page.screenshot({ path: "/tmp/quire-single-error.png", fullPage: true });
  await page.getByRole("button", { name: "Enter it manually" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("ISBN", { exact: true })).toHaveValue("9786020788036");
  await expect(page.getByLabel("Title (required)", { exact: true })).toBeVisible();
});
