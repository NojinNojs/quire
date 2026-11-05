import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  executablePath: "/run/current-system/sw/bin/brave",
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
await page.goto("http://127.0.0.1:5195/src/features/reading/evidence/index.html");
await page.getByRole("heading", { name: "Today", exact: true }).waitFor();
await page.evaluate(() => document.fonts.ready);
await page.getByLabel("Pages read", { exact: true }).fill("10");
await page.screenshot({ path: "test-results/reading/card-streak.png", fullPage: true });
await page.getByRole("button", { name: "Log 10 pages", exact: true }).click();
await page.getByRole("button", { name: "Undo", exact: true }).waitFor();
await page.screenshot({ path: "test-results/reading/undo.png", fullPage: true });
await page.getByRole("button", { name: "Undo", exact: true }).click();
await page.getByText("214 / 550", { exact: true }).waitFor();
await context.addInitScript(() =>
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false }),
);
await page.evaluate(() =>
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false }),
);
await page.getByRole("button", { name: "Log 10 pages", exact: true }).click();
await page.getByRole("button", { name: "Retry", exact: true }).waitFor();
await page.reload();
await page.getByRole("button", { name: "Retry", exact: true }).waitFor();
await page.getByText("224 / 550", { exact: true }).waitFor();
await page.evaluate(() => {
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
  window.dispatchEvent(new Event("online"));
});
await page.getByText("Pages logged.", { exact: true }).waitFor();
await page.getByText("224 / 550", { exact: true }).waitFor();
await page.evaluate(() => {
  document.documentElement.dataset.theme = "shelf-light";
});
for (const width of [320, 390, 768, 1280]) {
  await page.setViewportSize({ width, height: 844 });
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    cover: [
      document.querySelector(".reading-cover").getBoundingClientRect().width,
      document.querySelector(".reading-cover").getBoundingClientRect().height,
    ],
    targets: [...document.querySelectorAll("button,input")].every(
      (el) => el.getBoundingClientRect().height >= 48 && el.getBoundingClientRect().width >= 48,
    ),
  }));
  assert.equal(metrics.overflow, false);
  assert.deepEqual(metrics.cover, [92, 138]);
  assert.equal(metrics.targets, true);
}
await page.setViewportSize({ width: 390, height: 844 });
await page.getByLabel("Pages read", { exact: true }).focus();
assert.equal(
  await page
    .getByLabel("Pages read", { exact: true })
    .evaluate((el) => getComputedStyle(el).outlineWidth),
  "2px",
);
console.log(
  "Passed: undo, persisted offline queue, reconnect retry, shelf-light at 320/390/768/1280, 92x138 cover, 48px targets, 2px focus.",
);
await browser.close();
