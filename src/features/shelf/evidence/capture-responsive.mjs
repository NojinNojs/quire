import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const origin = process.env.SHELF_PREVIEW_ORIGIN ?? "http://127.0.0.1:5197";
const url = `${origin}/src/features/shelf/evidence/responsive.html`;
const out = "docs/evidence/responsive-shelf";
const coverUrl = "https://covers.openlibrary.org/b/id/12645114-L.jpg?default=false";
const artwork = readFileSync(process.env.SHELF_COVER_FILE ?? "/tmp/quire-responsive-cover.jpg");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/run/current-system/sw/bin/brave",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
const report = {
  engine: "System Brave (Chromium), emulated viewports",
  layouts: [],
  states: [],
  actions: [],
  errors,
};
page.on("pageerror", (error) => errors.push(error.message));
await page.route(coverUrl, (route) => route.fulfill({ body: artwork, contentType: "image/jpeg" }));
// The fixture supplies progress directly; it does not need a running database.
await page.route("**/rest/v1/**", (route) => route.fulfill({ json: [] }));
const open = async (state = "") => {
  await page.goto(`${url}${state ? `?state=${state}` : ""}`);
  await page.getByRole("heading", { name: "Shelf", exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
};
const capture = async (name, width) => {
  await page.setViewportSize({ width, height: 844 });
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width, height: Math.max(844, height) });
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  await page.setViewportSize({ width, height: 844 });
};
const columnsAt = (width) =>
  width >= 1280 ? 6 : width >= 1024 ? 5 : width >= 768 ? 4 : width >= 480 ? 3 : 2;
try {
  await open();
  await page.locator(".shelf-cover img").evaluate((img) => img.decode());
  for (const theme of [
    "shelf-light",
    "shelf-dark",
    "municipal-light",
    "municipal-dark",
    "oxford-light",
    "oxford-dark",
  ]) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    for (const width of [320, 390, 479, 480, 767, 768, 1023, 1024, 1279, 1280, 1600]) {
      await page.setViewportSize({ width, height: 844 });
      const layout = await page.evaluate(() => {
        const grids = [...document.querySelectorAll(".shelf-books")];
        const jackets = [...document.querySelectorAll(".shelf-jacket")];
        const row = document.querySelector(".shelf-row");
        const copy = row.querySelector(".shelf-copy");
        const jacket = row.querySelector(".shelf-jacket");
        const hidden = document.querySelector(".shelf-row:has(.cover-jacket) .shelf-copy");
        const label = document.querySelector(".shelf-band");
        return {
          columns: grids.map(
            (grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length,
          ),
          widths: jackets.map((jacket) => jacket.getBoundingClientRect().width),
          overflow: document.documentElement.scrollWidth > innerWidth,
          labelMode: getComputedStyle(label).writingMode,
          labelLeft: label.getBoundingClientRect().left,
          caption: getComputedStyle(copy).display,
          captionBelow: copy.getBoundingClientRect().top > jacket.getBoundingClientRect().bottom,
          printedCaption: getComputedStyle(hidden).display,
          groupSizes: grids.map((grid) => grid.children.length),
          publisherFont: getComputedStyle(copy.querySelector(".shelf-publisher")).fontFamily,
          titleFont: getComputedStyle(copy.querySelector("h3 button")).fontFamily,
          progressWidth: getComputedStyle(document.querySelector(".bookmark-track")).width,
        };
      });
      assert.deepEqual(layout.columns, [columnsAt(width), columnsAt(width)]);
      assert.deepEqual(layout.groupSizes, [6, 1]);
      assert.ok(layout.widths.every((value) => value <= 180.01));
      assert.ok(
        Math.abs(layout.widths[0] - layout.widths.at(-1)) < 0.1,
        "single jacket keeps its track width",
      );
      assert.equal(layout.overflow, false);
      assert.equal(layout.labelMode, width >= 768 ? "horizontal-tb" : "vertical-rl");
      assert.ok(layout.labelLeft >= 0);
      assert.notEqual(layout.caption, "none");
      assert.equal(layout.captionBelow, true);
      assert.equal(layout.printedCaption, "none");
      assert.match(layout.titleFont, /Newsreader/);
      assert.match(layout.publisherFont, /mono/);
      assert.equal(layout.progressWidth, "4px");
      report.layouts.push({ theme, width, ...layout });
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const clear = await page.evaluate(() => {
        const last = document.querySelector(".shelf-group:last-of-type").getBoundingClientRect();
        return last.bottom <= document.querySelector(".bottom-nav").getBoundingClientRect().top;
      });
      assert.equal(clear, true, "last row clears navigation at the end of scrolling");
    }
    const contrasts = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const lum = (color) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data]
          .slice(0, 3)
          .map((n) => {
            const s = n / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          })
          .reduce((v, n, i) => v + n * [0.2126, 0.7152, 0.0722][i], 0);
      };
      const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
      const root = getComputedStyle(document.documentElement);
      const surface = root.getPropertyValue("--surface");
      const values = { ink: ratio(root.getPropertyValue("--ink"), surface) };
      // Exercise all ten class inks, including classes absent from this fixture.
      const band = document.querySelector(".shelf-band");
      const group = band.closest(".shelf-group");
      const original = group.style.getPropertyValue("--book-class");
      for (let digit = 0; digit < 10; digit++) {
        group.style.setProperty("--book-class", `var(--shelf-class-${digit}00)`);
        values[`class-${digit}00`] = ratio(getComputedStyle(band).color, surface);
      }
      group.style.setProperty("--book-class", original);
      for (const jacket of document.querySelectorAll(".cover-jacket")) {
        const style = getComputedStyle(jacket);
        values[style.backgroundColor] = ratio(style.color, style.backgroundColor);
      }
      return values;
    });
    for (const [name, value] of Object.entries(contrasts))
      assert.ok(value >= 7, `${theme} ${name}: ${value}`);
    report.layouts.push({ theme, contrasts });
    await page.setViewportSize({ width: 768, height: 844 });
    await page.getByRole("button", { name: "List", exact: true }).click();
    for (const width of [768, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      const records = await page.locator(".shelf-copy").evaluateAll((copies) =>
        copies.map((copy) => {
          const title = copy.querySelector("h3").getBoundingClientRect();
          const author = copy.querySelector(".shelf-author").getBoundingClientRect();
          const fields = [...copy.querySelectorAll(".shelf-metadata p")];
          return {
            firstLine: Math.abs(title.top - author.top) < title.height,
            tops: fields.map((field) => field.getBoundingClientRect().top),
            rights: fields.map((field) => field.getBoundingClientRect().right),
            alignments: fields.map((field) => getComputedStyle(field).textAlign),
            fonts: fields.map((field) => getComputedStyle(field).fontFamily),
            metadataTop: fields[0].getBoundingClientRect().top,
            titleBottom: title.bottom,
          };
        }),
      );
      for (const record of records) {
        assert.equal(record.firstLine, true);
        assert.ok(record.tops.every((value) => Math.abs(value - record.tops[0]) < 0.1));
        assert.ok(record.alignments.every((value) => value === "right"));
        assert.ok(record.fonts.every((value) => /mono/.test(value)));
        assert.ok(record.metadataTop >= record.titleBottom);
        for (let index = 0; index < 4; index++)
          assert.ok(Math.abs(record.rights[index] - records[0].rights[index]) < 0.1);
      }
      report.layouts.push({ theme, width, records });
    }
    if (["shelf-light", "oxford-dark"].includes(theme)) {
      await capture(`list-${theme}-768`, 768);
      await capture(`list-${theme}-1280`, 1280);
    }
    await page.getByRole("button", { name: "Grid", exact: true }).click();
    if (["shelf-light", "oxford-dark"].includes(theme)) {
      for (const width of [390, 768, 1280]) await capture(`grid-${theme}-${width}`, width);
    }
  }
  await page.getByRole("button", { name: "Add book", exact: true }).click();
  assert.equal(await page.getByLabel("Preview action").textContent(), "Add book selected");
  report.actions.push("Add book: delegates to add callback");
  await page.getByRole("button", { name: "Open Orlando", exact: true }).click();
  assert.equal(await page.getByLabel("Preview action").textContent(), "Selected: literature-1");
  report.actions.push("Jacket: selects exact edition");
  await page.getByRole("button", { name: "Pride and Prejudice", exact: true }).click();
  assert.equal(await page.getByLabel("Preview action").textContent(), "Selected: literature");
  report.actions.push("Real-cover caption: selects exact edition");
  await page.getByRole("combobox", { name: "Status" }).selectOption("finished");
  assert.equal(await page.getByRole("listitem").count(), 1);
  await page.getByRole("combobox", { name: "Language" }).selectOption("en");
  await page.getByRole("searchbox").fill("no match");
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  assert.equal(await page.getByRole("listitem").count(), 7);
  report.actions.push("Status, language and search: combine; Clear filters restores seven books");
  await page.getByRole("button", { name: "List", exact: true }).focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(".shelf-list").count(), 1);
  assert.notEqual(
    await page
      .getByRole("button", { name: "List", exact: true })
      .evaluate((el) => getComputedStyle(el).outlineStyle),
    "none",
  );
  await page.reload();
  await page.locator(".shelf-list").waitFor();
  report.actions.push(
    "View toggle: keyboard activation, visible focus and persistence after reload",
  );
  await page.getByRole("button", { name: "Grid", exact: true }).click();
  // Reserve a tablet rail's width at the shell boundary without changing shared navigation.
  await page.setViewportSize({ width: 768, height: 844 });
  await page.locator("#root > div").evaluate((wrapper) => {
    wrapper.style.marginLeft = "64px";
  });
  const railLayout = await page.locator(".shelf").evaluate((shelf) => {
    const jackets = [...shelf.querySelectorAll(".shelf-jacket")];
    return {
      left: shelf.getBoundingClientRect().left,
      widths: jackets.map((jacket) => jacket.getBoundingClientRect().width),
      right: Math.max(...jackets.map((jacket) => jacket.getBoundingClientRect().right)),
      columns: getComputedStyle(shelf.querySelector(".shelf-books")).gridTemplateColumns.split(" ")
        .length,
      bottomPadding: getComputedStyle(shelf).paddingBottom,
    };
  });
  assert.equal(railLayout.left, 64);
  assert.equal(railLayout.columns, 4);
  assert.ok(railLayout.right <= 768);
  assert.ok(railLayout.widths.every((width) => width <= 180));
  assert.ok(Number.parseFloat(railLayout.bottomPadding) >= 96);
  report.layouts.push({ simulatedTabletRail: railLayout });
  await page.locator("#root > div").evaluate((wrapper) => {
    wrapper.style.marginLeft = "";
  });
  await page.unroute(coverUrl);
  await page.route(coverUrl, (route) => route.abort());
  await open();
  await page.getByRole("img", { name: "Pride and Prejudice, no cover image" }).waitFor();
  assert.equal(await page.locator(".shelf-copy").first().isVisible(), false);
  report.actions.push("Failed real image: printed jacket replaces image and hides caption");
  for (const state of ["empty", "loading", "error", "error-no-retry"]) {
    for (const width of [390, 768, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await open(state);
      const bounds = await page.locator(".shelf-state").boundingBox();
      assert.ok(bounds.width >= width - 40.1);
      assert.ok(bounds.height >= 228);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      report.states.push({ state, width, bounds });
      if (width === 1280) {
        for (const theme of ["shelf-light", "oxford-dark"]) {
          await page.evaluate((theme) => {
            document.documentElement.dataset.theme = theme;
          }, theme);
          await capture(`${state}-${theme}-1280`, 1280);
        }
      }
    }
    if (state === "empty") {
      await page.getByRole("button", { name: "Add a book", exact: true }).click();
      assert.equal(await page.getByLabel("Preview action").textContent(), "Add book selected");
      report.actions.push("Empty shelf: Add a book delegates to add callback");
    }
    if (state === "error") {
      await page.getByRole("button", { name: "Try again", exact: true }).click();
      assert.equal(await page.getByLabel("Preview action").textContent(), "Retry selected");
      report.actions.push("Load error: Try again delegates to retry callback");
    }
  }
  await page.goto(`${url}?state=reading-empty`);
  await page.getByRole("heading", { name: "Today", exact: true }).waitFor();
  assert.ok((await page.locator(".reading-empty").boundingBox()).width >= 1239);
  await page.getByRole("button", { name: "Browse catalogue" }).click();
  assert.equal(await page.getByLabel("Preview action").textContent(), "Browse catalogue selected");
  report.actions.push("Empty Today: full-width state and Browse catalogue callback");
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/checks.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Passed ${report.layouts.length} layout/contrast/list checks, ${report.states.length} state checks, ${report.actions.length} interaction checks; no page errors.`,
  );
} finally {
  await browser.close();
}
