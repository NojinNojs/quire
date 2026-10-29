import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const origin = process.env.SHELF_PREVIEW_ORIGIN ?? "http://127.0.0.1:5197";
const url = `${origin}/src/features/shelf/evidence/polish2.html`;
const out = "docs/evidence/polish2";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/run/current-system/sw/bin/brave",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.clock.install({ time: new Date("2026-10-29T12:00:00+07:00") });
const report = {
  engine: "System Brave (Chromium), emulated viewports",
  fixtures:
    "Illustrative records, injected page log handler, mocked cover metadata and progress requests. No production data or uploads.",
  layouts: [],
  contrasts: [],
  actions: [],
  errors: [],
};
page.on("pageerror", (error) => report.errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") report.errors.push(message.text());
});
await page.route("**/rest/v1/**", (route) =>
  route.fulfill({
    json: route.request().url().includes("/books?")
      ? { owner: "shelf-reader", cover_path: null }
      : [],
  }),
);

async function open(query = "") {
  await page.goto(`${url}${query}`);
  await page
    .getByRole("heading", { name: query.includes("today") ? "Today" : "Shelf", exact: true })
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.clock.runFor(150);
  await page.locator(".reading-cover").evaluateAll(async (nodes) => {
    await Promise.all(
      nodes.flatMap((node) => node.getAnimations().map((animation) => animation.finished)),
    );
  });
}

async function screenshot(name) {
  const viewport = page.viewportSize();
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: viewport.width, height: Math.max(viewport.height, height) });
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  await page.setViewportSize(viewport);
}

async function contrast(surface, theme, width) {
  const result = await page.locator(surface).evaluate((root) => {
    const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    function rgba(color) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].map((n, i) => (i === 3 ? n / 255 : n));
    }
    function blend(fg, bg) {
      return fg.slice(0, 3).map((n, i) => n * fg[3] + bg[i] * (1 - fg[3]));
    }
    function luminance(rgb) {
      const linear = rgb.map((n) => {
        const s = n / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    }
    const pairs = [];
    for (const node of [root, ...root.querySelectorAll("*")]) {
      if (
        !node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) ||
        ![...node.childNodes].some(
          (child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim(),
        )
      )
        continue;
      const chain = [];
      for (let ancestor = node; ancestor; ancestor = ancestor.parentElement)
        chain.unshift(ancestor);
      let background = [255, 255, 255];
      let opacity = 1;
      for (const ancestor of chain) {
        const style = getComputedStyle(ancestor);
        background = blend(rgba(style.backgroundColor), background);
        opacity *= Number(style.opacity);
      }
      const color = rgba(getComputedStyle(node).color);
      color[3] *= opacity;
      const foreground = blend(color, background);
      const a = luminance(foreground);
      const b = luminance(background);
      pairs.push({
        text: node.textContent.trim().slice(0, 70),
        ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      });
    }
    return {
      minimum: Math.min(...pairs.map((pair) => pair.ratio)),
      failures: pairs.filter((pair) => pair.ratio < 7),
      checked: pairs.length,
    };
  });
  report.contrasts.push({ surface, theme, width, ...result });
  assert.deepEqual(
    result.failures,
    [],
    `${surface} ${theme} ${width}: text contrast must be at least 7:1`,
  );
}

try {
  for (const theme of [
    "shelf-light",
    "shelf-dark",
    "municipal-light",
    "municipal-dark",
    "oxford-light",
    "oxford-dark",
  ]) {
    for (const width of [390, 768, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await open();
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      for (const mode of ["Grid", "List"]) {
        await page.getByRole("button", { name: mode, exact: true }).click();
        const layout = await page.locator(".shelf-group").evaluateAll((groups) =>
          groups.map((group) => {
            const books = group.querySelector(".shelf-books").getBoundingClientRect();
            const lines = [...group.querySelectorAll(".shelf-line")].filter(
              (line) => getComputedStyle(line).display !== "none",
            );
            return {
              books: group.querySelectorAll(".shelf-row").length,
              width: books.width,
              lines: lines.map((line) => {
                const rect = line.getBoundingClientRect();
                return { left: rect.left - books.left, width: rect.width };
              }),
              jacketWidths: [...group.querySelectorAll(".shelf-jacket")].map(
                (jacket) => jacket.getBoundingClientRect().width,
              ),
              gaps: lines.map(
                (line) =>
                  line.getBoundingClientRect().top -
                  line.closest(".shelf-row").querySelector(".shelf-jacket").getBoundingClientRect()
                    .bottom,
              ),
            };
          }),
        );
        assert.deepEqual(
          layout.map((group) => group.books),
          [6, 1],
        );
        for (const group of layout) {
          assert.equal(
            group.lines.length,
            mode === "List"
              ? group.books
              : Math.ceil(group.books / (width >= 1280 ? 6 : width >= 768 ? 4 : 2)),
          );
          for (const line of group.lines) {
            assert.ok(Math.abs(line.width - group.width) < 1, "line spans the full group width");
            assert.ok(Math.abs(line.left) < 1, "line starts at the group edge");
          }
          assert.ok(
            group.gaps.every((gap) => Math.abs(gap - 8) < 1),
            "jacket stands 8px above the rule",
          );
        }
        assert.ok(
          Math.abs(layout[0].jacketWidths[0] - layout[1].jacketWidths[0]) < 1,
          "single jacket retains the normal track size",
        );
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false,
        );
        await contrast(".shelf", theme, width);
        report.layouts.push({ screen: "Shelf", theme, width, mode, groups: layout });
        if (theme === "shelf-light" && width !== 768) {
          await screenshot(`shelf-${mode.toLowerCase()}-${width}`);
          if (mode === "Grid") {
            const height = await page.evaluate(() => document.documentElement.scrollHeight);
            await page.setViewportSize({ width, height });
            await page
              .locator(".shelf-group")
              .first()
              .screenshot({ path: `${out}/six-books-${width}.png` });
            await page
              .locator(".shelf-group")
              .last()
              .screenshot({ path: `${out}/one-book-${width}.png` });
            await page.setViewportSize({ width, height: 844 });
          }
        }
      }
      const status = page.getByRole("combobox", { name: "Status" });
      await status.click();
      assert.equal(await status.evaluate((node) => node.getBoundingClientRect().height), 40);
      assert.equal(
        await page
          .locator(".quire-select-chevron")
          .first()
          .evaluate((node) => node.getBoundingClientRect().width),
        10,
      );
      assert.ok(
        (
          await page
            .getByRole("option")
            .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height))
        ).every((height) => height === 44),
      );
      await contrast(".shelf", theme, width);
      if (theme === "shelf-light" && width === 390) await screenshot("dropdown-open-390");
      await status.press("End");
      await status.press("Escape");
      assert.equal(await page.getByRole("listbox").count(), 0);
      assert.match(await status.textContent(), /All statuses/);
      await status.press("Home");
      await status.press("ArrowDown");
      await status.press("ArrowDown");
      await status.press("Enter");
      assert.equal(await page.locator(".shelf-row").count(), 1);
      assert.match(await status.textContent(), /Reading/);
      report.actions.push(
        `${theme} ${width}: open Status, End, Escape cancels, Home/ArrowDown/Enter filters to the reading edition`,
      );

      await open("?screen=today");
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, theme);
      const panes = await page.evaluate(() => {
        const layout = document.querySelector(".reading-two-pane");
        const jacket = document.querySelector(".reading-cover").getBoundingClientRect();
        const left = document.querySelector(".reading-jacket").getBoundingClientRect();
        const stepper = document.querySelector(".reading-stepper").getBoundingClientRect();
        return {
          display: getComputedStyle(layout).display,
          topDifference: stepper.top - jacket.top,
          gutter: stepper.left - left.right,
          bookmark: document.querySelector(".bookmark-track").getBoundingClientRect().width,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.equal(panes.display, width >= 1024 ? "grid" : "block");
      if (width >= 1024) {
        assert.ok(Math.abs(panes.topDifference) < 1);
        assert.equal(panes.gutter, 32);
      }
      assert.equal(panes.bookmark, 10);
      assert.equal(panes.overflow, false);
      await contrast(".reading", theme, width);
      assert.equal(await page.locator(".reading-book-copy:visible").count(), 1);
      report.layouts.push({ screen: "Today", theme, width, ...panes });
      if (theme === "shelf-light") await screenshot(`today-${width}`);
    }
  }
  for (const width of [479, 480, 767, 1023, 1024, 1279, 1600]) {
    await page.setViewportSize({ width, height: 844 });
    await open("?screen=today");
    assert.equal(
      await page.locator(".reading-two-pane").evaluate((node) => getComputedStyle(node).display),
      width >= 1024 ? "grid" : "block",
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await open();
  await page.getByRole("button", { name: "Add book", exact: true }).click();
  assert.equal(await page.getByLabel("Preview action").textContent(), "Add book selected");
  await page.getByRole("button", { name: "Open The Waves", exact: true }).click();
  assert.equal(await page.getByLabel("Preview action").textContent(), "Selected: literature-0");
  await page.getByRole("searchbox").fill("no matching title");
  await page.getByRole("button", { name: "Clear filters" }).click();
  assert.equal(await page.locator(".shelf-row").count(), 7);
  const language = page.getByRole("combobox", { name: "Language" });
  await language.click();
  await page.getByRole("option", { name: "id", exact: true }).click();
  assert.equal(await page.locator(".shelf-row").count(), 1);
  report.actions.push(
    "390: Add book and jacket delegate the exact action/edition; search empty result clears; Language pointer selection filters to one edition",
  );
  for (const state of ["loading", "empty", "error"]) {
    await open(`?state=${state}`);
    assert.equal(await page.locator(".shelf-group").count(), 0);
    if (state === "error") {
      await page.getByRole("button", { name: "Try again" }).click();
      assert.equal(await page.getByLabel("Preview action").textContent(), "Retry selected");
    }
  }
  await open("?screen=today");
  await page.getByRole("button", { name: "Add 10 pages" }).click();
  assert.equal(await page.getByLabel("Pages read").inputValue(), "11");
  await page.getByRole("button", { name: "Log 11 pages" }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).waitFor();
  assert.equal(await page.getByLabel("Pages read").isDisabled(), true);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await page.getByLabel("Pages read").isDisabled(), false);
  report.actions.push(
    "390: loading/empty/error suppress stale groups; retry delegates; Today +10 updates preview, log disables pending controls, Undo restores progress",
  );
  await page.getByLabel("Upload cover").waitFor({ state: "attached" });
  assert.equal(await page.getByLabel("Upload cover").isEnabled(), true);
  report.actions.push(
    "Today: mocked cover metadata enables the native upload input; no file uploaded",
  );
  assert.deepEqual(report.errors, []);
  writeFileSync(`${out}/browser-checks.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Verified ${report.layouts.length} layouts and ${report.contrasts.length} contrast scans; all text >= 7:1. Screenshots: ${out}. No console errors.`,
  );
} finally {
  await browser.close();
}
