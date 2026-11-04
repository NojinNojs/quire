import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { stack } from "./stack";

const widths = [320, 390, 767, 768, 1023, 1024, 1280, 1440];
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
  await expect(nav).toBeVisible();
  await expect(nav.locator(".nav-label").first()).toBeVisible();
  await expect(page.locator(".reading-book")).toBeVisible();
  await expect(page.locator(".reading-stepper")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  await expect(nav).toHaveAttribute("data-dock-index", "0");
  const header = page.locator(".shell-header");
  await expect(header).toBeVisible();
  const headerBox = await header.boundingBox();
  expect(headerBox?.height).toBe(width >= 1024 ? 64 : 56);
  expect(headerBox?.x).toBeCloseTo(width >= 1024 ? 216 : 0, 0);

  // Both add paths sit in the header at every width, each on a 44px target.
  const add = header.locator(".shell-capture-add");
  const scan = header.locator(".shell-capture-scan");
  await expect(add).toHaveAttribute("href", "#/search");
  await expect(scan).toBeVisible();
  // The scan half always names itself; the ISBN suffix appears with the
  // Search label once the header budget fits the longer words.
  await expect(header.locator(".shell-capture-scan-label")).toBeVisible();
  await expect(header.locator(".shell-capture-scan-label")).toHaveText("Scan");
  await expect(header.locator(".shell-capture-scan-suffix")).toBeVisible({
    visible: width >= 768,
  });
  await expect(page.getByRole("button", { name: "Search navigation", exact: true })).toBeVisible();
  for (const control of [add, scan]) {
    const target = await control.boundingBox();
    expect(target?.width).toBeGreaterThanOrEqual(44);
    expect(target?.height).toBeGreaterThanOrEqual(44);
    expect((target?.x ?? 0) + (target?.width ?? 0)).toBeLessThanOrEqual(width);
  }
  if (width < 400) {
    await expect(page.locator(".shell-breadcrumb")).toBeHidden();
  } else {
    await expect(page.locator(".shell-breadcrumb-current")).toBeVisible();
    if (width >= 768) await expect(page.locator(".shell-breadcrumb-group")).toBeVisible();
    else await expect(page.locator(".shell-breadcrumb-group")).toBeHidden();
  }
  await expect(page.locator(".shell-rail-toggle")).toBeVisible({ visible: width >= 1024 });

  const box = await nav.boundingBox();
  expect(box).not.toBeNull();
  if (width >= 1024) {
    expect(box?.width).toBe(216);
    expect(box?.x).toBe(0);
    expect(box?.y).toBe(0);
    // The logo cell is one header tall, so the two bottom rules are one line.
    const headBox = await page.locator(".rail-head").boundingBox();
    expect(headBox?.y).toBe(0);
    expect(headBox?.height).toBe(64);
    expect(headBox?.height).toBe(headerBox?.height);
    await expect(page.locator(".shell-rail-toggle")).toHaveAttribute(
      "aria-controls",
      "main-navigation",
    );
    await expect(nav.locator(".shell-rail-toggle")).toHaveCount(0);
    for (const name of ["Today", "Collection", "Add book", "Journal", "Reading year"]) {
      await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(nav.getByRole("link", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "More navigation", exact: true })).toBeHidden();
  } else {
    // The dock is inset from both edges of the phone and capped on wide phones.
    const surface = Math.min(width - 24, 480);
    expect(box?.width).toBeCloseTo(surface, 0);
    expect(box?.x).toBeCloseTo((width - surface) / 2, 0);
    const height = page.viewportSize()?.height ?? 900;
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeCloseTo(height - 8, 0);
    const clearance = await page
      .locator(".app-shell")
      .evaluate((node) => Number.parseFloat(getComputedStyle(node).paddingBottom));
    expect(clearance).toBeGreaterThanOrEqual((box?.height ?? 0) + 8);
    for (const name of ["Today", "Collection", "Add book"]) {
      await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    }
    for (const name of ["Journal", "Reading year", "Settings"]) {
      await expect(nav.getByRole("link", { name, exact: true })).toBeHidden();
    }
    const more = page.getByRole("button", { name: "More navigation", exact: true });
    await expect(more).toBeVisible();
    const moreBox = await more.boundingBox();
    expect(moreBox?.width).toBeGreaterThanOrEqual(44);
    expect(moreBox?.height).toBeGreaterThanOrEqual(44);
  }
}

test("phone, compact rail, wide rail and Today panes in the light theme", async ({
  signedInPage: page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openReading(page);
  {
    const theme = "shelf-light";
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
        expect(ratio, `${theme} at ${width}: ${text}`).toBeGreaterThanOrEqual(4.5);
      if ([390, 768, 1280].includes(width)) {
        await page.screenshot({ path: `${evidence}/${theme}-${width}.png`, fullPage: true });
      }
    }
  }
  expect(errors).toEqual([]);
});

test("skip link focuses the main region without changing the route; Tab reaches the rail", async ({
  signedInPage: page,
}) => {
  await page.getByRole("link", { name: "Collection", exact: true }).click();
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Collection", exact: true })).toBeVisible();
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    expect(await skip.evaluate((node) => getComputedStyle(node).outlineWidth)).toBe("2px");
    if (width === 1280) await page.screenshot({ path: `${evidence}/skip-link-focus.png` });
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    expect(new URL(page.url()).hash).toBe("#/shelf");
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    const today = nav.getByRole("link", { name: "Today", exact: true });
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
    await today.focus();
    await expect(today).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      nav.getByRole("link", { name: "Collection", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(nav.getByRole("link", { name: "Add book", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    if (width >= 1024) {
      for (const name of ["Journal", "Reading year", "Settings"]) {
        await expect(
          nav.getByRole("link", { name, exact: true }),
        ).toBeFocused();
        await page.keyboard.press("Tab");
      }
      await expect(nav.getByRole("button", { name: "Guide", exact: true })).toBeFocused();
      await page.keyboard.press("Tab");
    }
    expect(await nav.evaluate((node) => node.contains(document.activeElement))).toBe(false);
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
      if (width >= 1024) {
        await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
        expect((await page.getByRole("navigation", { name: "Main navigation" }).boundingBox())?.y).toBe(0);
      }
      await page.evaluate(() => scrollTo(0, 0));
    }
  }
});

test("reading controls keep focus rings and reduced motion removes shell transitions", async ({
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
  const pagesRead = page.getByRole("spinbutton", { name: "Pages read" });
  for (let i = 0; i < 10 && !(await pagesRead.evaluate((node) => node === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(pagesRead).toBeFocused();
  expect(
    await page
      .getByRole("spinbutton", { name: "Pages read" })
      .evaluate((node) => getComputedStyle(node).outlineWidth),
  ).toBe("2px");
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.locator(".bottom-nav").evaluate((node) => getComputedStyle(node).transitionDuration),
  ).toBe("0s");
  expect(
    await page.locator(".app-shell").evaluate((node) => getComputedStyle(node).transitionDuration),
  ).toBe("0s");
  await page.getByRole("link", { name: "Collection", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Collection", exact: true })).toBeVisible();
  expect(
    await page.locator(".shell-screen").evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("none");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Add book", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Add a book" })).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
});

test("Journal and Reading year keep their own active state and live in More on phones", async ({
  signedInPage: page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#/journal");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(page.getByRole("heading", { name: "Reading journal", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Journal", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: "Today", exact: true })).not.toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav).toHaveAttribute("data-dock-index", "none");

  await page.goto("/#/stats");
  await expect(page.getByRole("heading", { name: "Reading year", exact: true })).toBeVisible();
  await expect(page.locator(".shell-breadcrumb-current")).toHaveText("Reading year");
  await expect(nav.getByRole("link", { name: "Reading year", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: "Journal", exact: true })).not.toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav).toHaveAttribute("data-dock-index", "none");

  await page.getByRole("button", { name: "Search navigation", exact: true }).click();
  const palette = page.getByRole("dialog", { name: "Find a page" });
  await expect(palette).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(palette).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(nav.getByRole("link", { name: "Reading year", exact: true })).toBeHidden();
  const more = page.getByRole("button", { name: "More navigation", exact: true });
  await expect(more).toHaveAttribute("data-active", "true");
  const menu = page.getByRole("menu");
  await more.click();
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Reading year", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await menu.getByRole("menuitem", { name: "Reading year", exact: true }).click();
  await expect(menu).toBeHidden();

  // Selecting the route already on screen still closes the disclosure.
  await more.click();
  await expect(menu).toBeVisible();
  await menu.getByRole("menuitem", { name: "Reading year", exact: true }).click();
  await expect(menu).toBeHidden();
  await expect(more).toHaveAttribute("aria-expanded", "false");

  await more.click();
  await menu.getByRole("menuitem", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await expect(menu).toBeHidden();
});

test("desktop rail collapses to a compact rail and remembers the choice", async ({
  signedInPage: page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/today");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const collapse = page.getByRole("button", { name: "Collapse navigation", exact: true });
  await expect(collapse).toBeVisible();
  await expect(collapse).toHaveAttribute("aria-expanded", "true");
  await expect.poll(async () => (await nav.boundingBox())?.width).toBe(216);
  await expect(nav.locator(".nav-label").first()).toBeVisible();

  await collapse.click();
  const travel = await nav.evaluate((node) => {
    const shell = document.querySelector<HTMLElement>(".app-shell");
    const screen = document.querySelector<HTMLElement>(".shell-screen");
    const width = node
      .getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSTransition && animation.transitionProperty === "width",
      ) as CSSTransition | undefined;
    const padding = shell
      ?.getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSTransition && animation.transitionProperty === "padding-left",
      ) as CSSTransition | undefined;
    const duration = Number(width?.effect?.getTiming().duration ?? 0);
    if (width) width.currentTime = duration / 2;
    if (padding) padding.currentTime = duration / 2;
    const mid = {
      width: node.getBoundingClientRect().width,
      content: screen?.getBoundingClientRect().left ?? 0,
    };
    width?.finish();
    padding?.finish();
    return {
      duration,
      mid,
      settled: {
        width: node.getBoundingClientRect().width,
        content: screen?.getBoundingClientRect().left ?? 0,
      },
    };
  });
  expect(travel.duration).toBeGreaterThanOrEqual(220);
  expect(travel.duration).toBeLessThanOrEqual(300);
  expect(travel.mid.width).toBeGreaterThan(80);
  expect(travel.mid.width).toBeLessThan(216);
  expect(travel.mid.content).toBeGreaterThan(80);
  expect(travel.mid.content).toBeLessThan(216);
  expect(travel.settled.width).toBe(80);
  expect(travel.settled.content).toBe(80);
  const expand = page.getByRole("button", { name: "Expand navigation", exact: true });
  await expect(expand).toHaveAttribute("aria-expanded", "false");
  await expect.poll(async () => (await nav.boundingBox())?.width).toBe(80);
  const settled = await page.evaluate(() => {
    const rail = document.querySelector(".bottom-nav")?.getBoundingClientRect();
    const main = document.querySelector("main")?.getBoundingClientRect();
    return { railRight: rail?.right ?? 0, mainLeft: main?.left ?? 0 };
  });
  expect(settled.mainLeft).toBeGreaterThanOrEqual(settled.railRight);
  await expect(nav.locator(".nav-label").first()).toBeHidden();
  for (const name of ["Today", "Collection", "Add book", "Journal", "Reading year", "Settings"]) {
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await expect(nav.getByRole("button", { name: "Guide", exact: true })).toBeVisible();
  // The compact rail centres its mark and every glyph on x=40.
  await expect
    .poll(() =>
      page.evaluate(() =>
        [
          ".rail-head .brand-mark",
          '.nav-destinations li[data-dock-slot="0"] a svg',
          ".rail-settings svg",
        ].map((selector) => {
          const box = document.querySelector(selector)?.getBoundingClientRect();
          return box ? Math.round(box.x + box.width / 2) : -1;
        }),
      ),
    )
    .toEqual([40, 40, 40]);
  expect(await page.evaluate(() => localStorage.getItem("quire:nav-mode:v1"))).toBe("compact");

  await page.reload();
  await expect(page.getByRole("button", { name: "Expand navigation", exact: true })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect.poll(async () => (await nav.boundingBox())?.width).toBe(80);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Expand navigation", exact: true })).toBeHidden();
  await expect.poll(async () => (await nav.boundingBox())?.width).toBe(366);
  await expect(nav.locator(".nav-label").first()).toBeVisible();
  await expect(nav).toHaveAttribute("data-dock-index", "0");

  await page.setViewportSize({ width: 1024, height: 900 });
  await page.getByRole("button", { name: "Expand navigation", exact: true }).click();
  await expect.poll(async () => (await nav.boundingBox())?.width).toBe(216);
});

test("the header carries both capture paths at 320 and the add link keeps the query", async ({
  signedInPage: page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/?demo=1#/today");
  const header = page.locator(".shell-header");
  const add = header.locator(".shell-capture-add");
  const scan = header.locator(".shell-capture-scan");
  await expect(add).toBeVisible();
  await expect(scan).toBeVisible();
  await expect(header.locator(".shell-capture-scan-label")).toHaveText("Scan");
  await expect(header.locator(".shell-capture-scan-label")).toBeVisible();
  await expect(header.locator(".shell-capture-scan-suffix")).toBeHidden();
  await expect(header.getByRole("button", { name: "More navigation", exact: true })).toBeVisible();
  await expect(
    header.getByRole("button", { name: "Search navigation", exact: true }),
  ).toBeVisible();
  const addBox = await add.boundingBox();
  const scanBox = await scan.boundingBox();
  expect(addBox?.width).toBe(44);
  expect(addBox?.height).toBe(44);
  // The short word widens the scan half; both halves keep a 44px target.
  expect(scanBox?.width).toBeGreaterThanOrEqual(44);
  expect(scanBox?.height).toBe(44);
  for (const box of [addBox, scanBox]) {
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
  }

  await add.click();
  await expect(page.getByRole("heading", { name: "Add a book" })).toBeVisible();
  expect(new URL(page.url()).search).toBe("?demo=1");
  expect(new URL(page.url()).hash).toBe("#/search");

  await scan.click();
  const sheet = page.getByRole("dialog", { name: "Scan a book" });
  await expect(sheet).toHaveCount(1);
  await expect(sheet).toBeVisible();
  const close = sheet.getByRole("button", { name: "Close", exact: true });
  await expect(close.locator("svg")).toBeVisible();
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(scan).toBeFocused();
});
