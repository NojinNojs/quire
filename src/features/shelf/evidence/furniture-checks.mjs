import assert from "node:assert/strict";

export async function checkFurniture(page, out, report) {
  await page.getByRole("heading", { name: "Shelf", exact: true }).waitFor();
  await page.getByRole("button", { name: "The Waves", exact: true }).waitFor();
  await page.getByRole("img", { name: "Page 68 of 272" }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page
      .locator(".shelf-jacket-button")
      .first()
      .evaluate((el) => getComputedStyle(el).animationDuration),
    "0.12s",
  );
  assert.equal(
    await page
      .locator(".bookmark-fill")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration),
    "0.16s",
  );
  assert.equal(
    await page
      .getByRole("img", { name: "Page 68 of 272" })
      .locator(".bookmark-fill")
      .evaluate((el) => el.style.height),
    "25%",
  );
  const capture = async (name) => {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: 390, height: Math.max(844, height) });
    await page.screenshot({ path: `${out}/${name}`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
  };
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "shelf-light";
  });
  for (const width of [390, 420, 421, 768]) {
    await page.setViewportSize({ width, height: 844 });
    const columns = await page
      .locator(".shelf-books")
      .first()
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    assert.equal(columns, width > 420 ? 3 : 2);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    const spine = page.getByRole("heading", { name: "800 Literature" });
    const box = await spine.boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  // Canvas resolves color-mix to sRGB before WCAG luminance calculations.
  const contrasts = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const rgb = (color) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const lum = (color) =>
      rgb(color)
        .map((n) => {
          const s = n / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        })
        .reduce((v, n, i) => v + n * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    const root = getComputedStyle(document.documentElement);
    const surface = root.getPropertyValue("--surface");
    const colors = [
      "--ink",
      ...["000", "100", "200", "300", "400", "500", "600", "700", "800", "900"].map(
        (c) => `--shelf-class-${c}`,
      ),
    ];
    return Object.fromEntries(
      colors.map((color) => [color, ratio(root.getPropertyValue(color), surface)]),
    );
  });
  report.push({ theme: "shelf-light", contrasts });
  for (const [token, ratio] of Object.entries(contrasts))
    assert.ok(ratio >= 7, `shelf-light ${token}: ${ratio}`);
  await capture("grid-shelf-light-390.png");
  await page.getByRole("button", { name: "List", exact: true }).click();
  await capture("list-shelf-light-390.png");
  await page.reload();
  await page.getByRole("button", { name: "The Waves", exact: true }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "List", exact: true }).getAttribute("aria-pressed"),
    "true",
  );
  await page.getByRole("button", { name: "Grid", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .locator(".shelf-jacket-button")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  assert.equal(
    await page
      .locator(".bookmark-fill")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration),
    "0s",
  );
  await page.getByRole("button", { name: "The Waves", exact: true }).click();
  await page.getByRole("heading", { name: "Today", exact: true }).waitFor();
  await page.getByText("68 / 272", { exact: true }).waitFor();
  await page.getByLabel("2026-10-26: restored", { exact: true }).waitFor();
  await page.reload();
  await page.getByLabel("2026-10-26: restored", { exact: true }).waitFor();
  await page.getByRole("img", { name: "Page 68 of 272" }).waitFor();
  assert.equal(
    await page
      .locator(".reading-jacket .reading-cover")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  assert.equal(
    await page.locator(".bookmark-track").evaluate((el) => getComputedStyle(el).width),
    "10px",
  );
  assert.equal(
    await page
      .locator(".reading-day-filled:not(.reading-day-today)")
      .first()
      .evaluate((el) => getComputedStyle(el).opacity),
    "0.4",
  );
  assert.equal(
    await page.locator(".reading-day-today").evaluate((el) => getComputedStyle(el).opacity),
    "1",
  );
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "shelf-light";
  });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await capture("today-shelf-light-390.png");
}
