import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { stack } from "./stack";

const widths = [320, 390, 767, 768, 1023, 1024, 1280, 1440];
const themes = [
  "shelf-light",
  "shelf-dark",
  "municipal-light",
  "municipal-dark",
  "oxford-light",
  "oxford-dark",
];
const evidence = "test-results/responsive-shell";

async function openReading(page: Page) {
  if (!stack) throw new Error("Local Supabase is required");
  const owner = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((key) => /^sb-.*-auth-token$/.test(key));
    if (!key) throw new Error("Signed-in session missing");
    return JSON.parse(localStorage.getItem(key) ?? "{}").user.id as string;
  });
  const headers = {
    apikey: stack.SERVICE_ROLE_KEY,
    Authorization: `Bearer ${stack.SERVICE_ROLE_KEY}`,
    Prefer: "return=representation",
  };
  const created = await page.request.post(`${stack.API_URL}/rest/v1/books`, {
    headers,
    data: {
      owner,
      title: "A Room of One's Own",
      author: "Virginia Woolf",
      publisher: "Hogarth Press",
      year: 1929,
      pages: 172,
      ddc: "824",
      language: "en",
      status: "reading",
    },
  });
  expect(created.ok()).toBeTruthy();
  const [book] = await created.json();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const day = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  const logged = await page.request.post(`${stack.API_URL}/rest/v1/progress_log`, {
    headers,
    data: { owner, book_id: book.id, day, pages: 48 },
  });
  expect(logged.ok()).toBeTruthy();
  await page.getByRole("link", { name: "Today", exact: true }).click();
  await expect(page.getByRole("article", { name: "Active book" })).toBeVisible();
  await expect(page.locator('.cover-controls input[type="file"]')).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
  return { headers, id: book.id };
}

async function expectLayout(page: Page, width: number) {
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const box = await nav.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error("Navigation is missing");
  const label = nav.locator(".nav-label").first();
  if (width < 768) {
    await expect(label).toBeHidden();
    expect(box.width).toBe(Math.min(width, 390));
    expect(box.y + box.height).toBe(await page.evaluate(() => innerHeight));
  } else {
    await expect(label).toBeVisible();
    expect(box.x).toBe(0);
    expect(box.y).toBe(0);
    expect(box.width).toBe(width < 1280 ? 72 : 200);
    const icon = await nav.locator("svg").first().boundingBox();
    const text = await label.boundingBox();
    if (!icon || !text) throw new Error("Rail icon or label missing");
    if (width < 1280) {
      expect(text.y).toBeGreaterThanOrEqual(icon.y + icon.height);
    } else {
      expect(text.x).toBeGreaterThanOrEqual(icon.x + icon.width);
    }
    expect(await label.evaluate((node) => getComputedStyle(node).fontSize)).toBe("10px");
  }
  const book = await page.locator(".reading-book").boundingBox();
  const record = await page.locator(".reading-stepper").boundingBox();
  if (!book || !record) throw new Error("Today panes missing");
  if (width >= 1024) {
    expect(Math.abs(book.y - record.y)).toBeLessThan(1);
    expect(record.x - (book.x + book.width)).toBeCloseTo(32);
    const stamps = await page.locator(".reading-streak").boundingBox();
    expect(stamps?.x).toBe(record.x);
  } else {
    expect(record.y).toBeGreaterThanOrEqual(book.y + book.height);
    expect(record.x).toBe(book.x);
  }
  const column = await page.locator(".shell-screen").boundingBox();
  if (!column) throw new Error("Content missing");
  if (width >= 1280) {
    expect(column.width).toBe(Math.min(1120, width - 200));
    expect(column.x - 200).toBeCloseTo(width - column.x - column.width);
  } else if (width >= 768) {
    expect(column.x).toBe(72);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
}

test("phone, compact rail, wide rail and Today panes in every theme", async ({
  signedInPage: page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openReading(page);
  for (const theme of themes) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await expectLayout(page, width);
      const ratios = await page.evaluate(() => {
        const luminance = (color: string) => {
          const [r, g, b] = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map((channel) => {
            const n = Number(channel) / (color.startsWith("color(") ? 1 : 255);
            return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        return [
          ...document.querySelectorAll(
            ".brand, .bottom-nav a, .nav-label, .reading-book-copy h2, .reading-book-copy p, .reading-stepper label, .reading button, .reading input, .reading-streak h2, .reading-streak p, .reading-day-letter, .cover-controls label",
          ),
        ]
          .filter((node) => node.getClientRects().length > 0)
          .map((node) => {
            const ink = luminance(getComputedStyle(node).color);
            let background: Element | null = node;
            while (
              background &&
              getComputedStyle(background).backgroundColor === "rgba(0, 0, 0, 0)"
            ) {
              background = background.parentElement;
            }
            const paper = luminance(
              background
                ? getComputedStyle(background).backgroundColor
                : getComputedStyle(document.body).backgroundColor,
            );
            return {
              text: node.textContent,
              ratio: (Math.max(ink, paper) + 0.05) / (Math.min(ink, paper) + 0.05),
            };
          });
      });
      for (const { text, ratio } of ratios)
        expect(ratio, `${theme} at ${width}: ${text}`).toBeGreaterThanOrEqual(7);
      if (["shelf-light", "oxford-dark"].includes(theme) && [390, 768, 1280].includes(width)) {
        await page.screenshot({ path: `${evidence}/${theme}-${width}.png`, fullPage: true });
      }
    }
  }
  expect(errors).toEqual([]);
});

test("skip link focuses the main region without changing the route; Tab reaches the rail", async ({
  signedInPage: page,
}) => {
  await page.getByRole("link", { name: "Shelf", exact: true }).click();
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Shelf", exact: true })).toBeVisible();
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    expect(await skip.evaluate((node) => getComputedStyle(node).outlineWidth)).toBe("2px");
    if (width === 1280) await page.screenshot({ path: `${evidence}/skip-link-focus.png` });
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    expect(new URL(page.url()).hash).toBe("#/shelf");
    const today = page.getByRole("navigation").getByRole("link", { name: "Today", exact: true });
    for (
      let step = 0;
      step < 20 && !(await today.evaluate((node) => node === document.activeElement));
      step++
    ) {
      await page.keyboard.press("Tab");
    }
    await expect(today).toBeFocused();
    const ring = await today.evaluate((node) => ({
      width: getComputedStyle(node).outlineWidth,
      color: getComputedStyle(node).outlineColor,
    }));
    expect(ring.width).toBe("2px");
    expect(ring.color).not.toBe("rgb(0, 0, 0)");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Shelf", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Search", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    expect(
      await page.getByRole("navigation").evaluate((node) => node.contains(document.activeElement)),
    ).toBe(false);
  }
});

test("long titles reflow across routes and the header and rail stay docked", async ({
  signedInPage: page,
}) => {
  const { headers, id } = await openReading(page);
  if (!stack) throw new Error("Local Supabase is required");
  const title = `A very long title ${"UnbrokenTitle".repeat(25)}`;
  const changed = await page.request.patch(`${stack.API_URL}/rest/v1/books?id=eq.${id}`, {
    headers,
    data: { title },
  });
  expect(changed.ok()).toBeTruthy();
  await page.reload();
  for (const route of ["today", "shelf", "search", "settings"]) {
    await page.goto(`/#/${route}`);
    await expect(page.getByRole("main")).toBeVisible();
    if (route === "shelf") {
      await expect(page.getByRole("button", { name: `Open ${title}`, exact: true })).toBeVisible();
      for (const width of widths) {
        await page.setViewportSize({ width, height: 500 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      }
      await page.getByRole("button", { name: "List", exact: true }).click();
    }
    if (route === "today" || route === "shelf")
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    for (const width of widths) {
      await page.setViewportSize({ width, height: 500 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      if (width >= 768) {
        await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
        expect((await page.locator(".shell-header").boundingBox())?.y).toBe(0);
        expect((await page.getByRole("navigation").boundingBox())?.y).toBe(0);
      }
      await page.evaluate(() => scrollTo(0, 0));
    }
  }
});

test("rail resizing is immediate and reduced motion removes shell transitions", async ({
  signedInPage: page,
}) => {
  await openReading(page);
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.reload();
  await expect(page.locator('.cover-controls input[type="file"]')).toBeEnabled();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.locator('.cover-controls input[type="file"]')).toBeFocused();
  expect(
    await page
      .locator(".cover-controls label")
      .evaluate((node) => getComputedStyle(node).outlineWidth),
  ).toBe("2px");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("spinbutton", { name: "Pages read" })).toBeFocused();
  expect(
    await page
      .getByRole("spinbutton", { name: "Pages read" })
      .evaluate((node) => getComputedStyle(node).outlineWidth),
  ).toBe("2px");
  for (const width of [767, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const motion = await page
      .locator(".bottom-nav")
      .evaluate((node) => ({
        transition: getComputedStyle(node).transitionDuration,
        animation: getComputedStyle(node).animationName,
      }));
    expect(motion).toEqual({ transition: "0s", animation: "none" });
    const duration = await page
      .locator(".bookmark-fill")
      .evaluate((node) => getComputedStyle(node).transitionDuration);
    expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.12);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("link", { name: "Shelf", exact: true }).click();
  expect(
    await page.locator(".shell-screen").evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("none");
  await page.getByRole("link", { name: "Search", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Add a book" })).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
});
