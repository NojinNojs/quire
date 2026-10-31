import { randomUUID } from "node:crypto";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { stack } from "./stack";

const themes = [
  "shelf-light",
  "shelf-dark",
  "municipal-light",
  "municipal-dark",
  "oxford-light",
  "oxford-dark",
];
const footnote = "Your shelf is private. One account, one library.";
const evidence = "docs/evidence/auth-cover";

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.tags.includes("@first-visit")) return;
  await page.addInitScript(() => {
    if (localStorage.getItem("quire:cover-seen") === null) {
      localStorage.setItem("quire:cover-seen", "true");
    }
  });
});

async function checkContrast(page: Page, state: string) {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of themes) {
      const samples = await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
        const column = document.querySelector(".auth-book");
        if (!column) throw new Error("Open book missing");
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Color sampler unavailable");
        const rgba = (color: string) => {
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          return Array.from(context.getImageData(0, 0, 1, 1).data, (n) => n / 255);
        };
        const over = (front: number[], back: number[]) =>
          back.map((n, i) => front[i] * front[3] + n * (1 - front[3]));
        const background = (element: Element | null): number[] =>
          element
            ? over(
                rgba(getComputedStyle(element).backgroundColor),
                background(element.parentElement),
              )
            : [1, 1, 1];
        const luminance = (color: number[]) => {
          const [r, g, b] = color.map((n) =>
            n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4,
          );
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const sample = (element: Element, text: string, pseudo?: string) => {
          const style = getComputedStyle(element, pseudo);
          const paper = background(element);
          const foreground = rgba(style.color);
          let opacity = Number(style.opacity);
          for (let parent = element.parentElement; parent; parent = parent.parentElement) {
            opacity *= Number(getComputedStyle(parent).opacity);
          }
          foreground[3] *= opacity;
          const ink = luminance(over(foreground, paper));
          const ground = luminance(paper);
          return {
            text,
            ratio: (Math.max(ink, ground) + 0.05) / (Math.min(ink, ground) + 0.05),
          };
        };
        const samples = [];
        // Walk text nodes so nested links, strength labels and the foot line cannot be missed.
        const walker = document.createTreeWalker(column, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const element = node.parentElement;
          const text = node.textContent?.trim();
          if (!element || !text) continue;
          const range = document.createRange();
          range.selectNode(node);
          if (range.getBoundingClientRect().height === 0) continue;
          samples.push(sample(element, text));
        }
        for (const input of column.querySelectorAll("input")) {
          samples.push(sample(input, `input: ${input.name}`));
          if (input.placeholder) samples.push(sample(input, input.placeholder, "::placeholder"));
        }
        return samples;
      }, theme);
      expect(
        samples.some(({ text }) => text === footnote),
        "Foot line must be sampled",
      ).toBe(true);
      expect(samples.some(({ text }) => text === "try the interactive demo.")).toBe(true);
      expect(samples.some(({ text }) => text === "16")).toBe(true);
      expect(samples.some(({ text }) => text === "A home for your reading life.")).toBe(true);
      expect(samples.some(({ text }) => text === "BORROWER CARD")).toBe(true);
      expect(samples.filter(({ text }) => text === "QUIRE")).toHaveLength(1);
      if (width >= 768) {
        for (const text of [
          "Bumi Manusia",
          "Pramoedya Ananta Toer",
          "Reading streak",
          "Pages read today",
          "0",
          "Your demo shelf. Sample reading activity.",
        ]) {
          expect(
            samples.some((sample) => sample.text === text),
            `Sample recto: ${text}`,
          ).toBe(true);
        }
        expect(samples.filter(({ text }) => /^[MTWFS]$/.test(text))).toHaveLength(7);
      }
      expect(samples.length).toBeGreaterThan(12);
      for (const { text, ratio } of samples) {
        expect(ratio, `${theme}, ${width}, ${state}: ${text}`).toBeGreaterThanOrEqual(7);
      }
      appendFileSync(
        `${evidence}/contrast.txt`,
        `${theme} | ${width}px | ${state} | ${samples.length} samples | minimum ${Math.min(...samples.map(({ ratio }) => ratio)).toFixed(3)}:1\n`,
      );
    }
  }
}

async function settleCard(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

test("create an account, take the first-run tour, sign out and sign back in", async ({
  page,
  request,
}) => {
  if (!stack) throw new Error("Local Supabase is required");
  const email = `e2e.${randomUUID()}@quire.local`;
  const password = `Library-${randomUUID()}`;
  await page.goto("/?auth=signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const signup = page.waitForResponse(
    (response) =>
      response.url().includes("/auth/v1/signup") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  const response = await signup;
  expect(response.ok()).toBe(true);
  const { user } = await response.json();
  try {
    await expect(page.getByRole("dialog", { name: "One book. A place to begin." })).toBeVisible();
    await page.getByRole("button", { name: "Skip tour" }).click();
    await page.goto("/#/search");
    await expect(page.getByRole("heading", { name: "Add a book" })).toBeVisible();
    expect(new URL(page.url()).searchParams.has("auth")).toBe(false);
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add a book" })).toHaveCount(0);
    await page.reload();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Add a book" })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "One book. A place to begin." })).toHaveCount(0);
    await page.getByRole("button", { name: "Guide", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "One book. A place to begin." })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "One book. A place to begin." })).toHaveCount(0);
  } finally {
    const cleanup = await request.delete(`${stack.API_URL}/auth/v1/admin/users/${user.id}`, {
      headers: {
        apikey: stack.SERVICE_ROLE_KEY,
        Authorization: `Bearer ${stack.SERVICE_ROLE_KEY}`,
      },
    });
    expect(cleanup.ok()).toBe(true);
  }
});

for (const theme of ["shelf-light", "oxford-dark"]) {
  for (const width of [320, 390, 768, 1280]) {
    test(`sign in and sign up at ${width} in ${theme}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.setViewportSize({ width, height: width === 320 ? 640 : width === 390 ? 844 : 900 });
      await page.addInitScript((value) => localStorage.setItem("quire-theme", value), theme);
      await page.goto("/?source=auth#/shelf");
      await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
      await settleCard(page);
      await page.screenshot({ path: `${evidence}/${theme}-signin-${width}.png`, fullPage: true });
      if (width === 390) {
        const firstScreen = [];
        for (const selector of [
          ".auth-running-head",
          ".auth-intro",
          'input[name="email"]',
          'input[name="password"]',
          ".primary",
        ]) {
          await expect(page.locator(selector)).toBeInViewport({ ratio: 1 });
          firstScreen.push({ selector, box: await page.locator(selector).boundingBox() });
        }
        writeFileSync(`${evidence}/${theme}-first-screen.json`, JSON.stringify(firstScreen, null, 2));
        await page.screenshot({ path: `${evidence}/${theme}-first-screen-390.png` });
      }
      if (width <= 390) {
        const forgot = await page.locator(".auth-forgot").boundingBox();
        const create = await page.locator(".auth-switch").boundingBox();
        const field = await page.getByLabel("Email").boundingBox();
        if (!forgot || !create || !field) throw new Error("Mobile auth controls missing");
        expect(field.x).toBe(width === 320 ? 16 : 24);
        if (width === 390) expect(forgot.y).toBe(create.y);
        else expect(create.y).toBeGreaterThanOrEqual(forgot.y + forgot.height + 8);
        await expect(page.getByText("EX LIBRIS")).toBeVisible();
        await expect(page.getByText("THIS COPY BELONGS TO A READER")).toBeVisible();
      } else {
        await expect(page.getByText("EX LIBRIS")).toBeHidden();
      }
      await page.getByRole("button", { name: "No account yet? Create one" }).click();
      await expect(page.getByRole("heading", { name: "Create an account" })).toBeFocused();
      await page.reload();
      await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
      expect(new URL(page.url()).hash).toBe("#/shelf");
      expect(new URL(page.url()).searchParams.get("source")).toBe("auth");
      await settleCard(page);
      await page.screenshot({ path: `${evidence}/${theme}-signup-${width}.png`, fullPage: true });
      await page.getByRole("button", { name: "Already have an account? Sign in" }).click();
      await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeFocused();
      expect(new URL(page.url()).searchParams.has("auth")).toBe(false);
      expect(new URL(page.url()).searchParams.get("source")).toBe("auth");
      expect(new URL(page.url()).hash).toBe("#/shelf");
      expect(errors).toEqual([]);
    });
  }
}

test("the open book reflows to a verso and paper sliver without overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  for (const width of [320, 390, 768, 960, 1024, 1440]) {
    await page.setViewportSize({ width, height: width === 320 ? 640 : 844 });
    for (const mode of ["signin", "signup"]) {
      if (mode === "signup") {
        await page.getByRole("button", { name: "No account yet? Create one" }).click();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      const submit = await page.locator(".primary").boundingBox();
      if (!submit) throw new Error("Submit missing");
      expect(submit.height).toBe(48);
      const book = page.locator(".auth-book");
      await expect(book).toHaveCount(1);
      await expect(page.getByRole("img", { name: "Cover of Bumi Manusia" })).toBeVisible();
      const cover = await page.locator(".auth-reading-cover").boundingBox();
      const verso = await page.locator(".auth-verso").boundingBox();
      const recto = await page.locator(".auth-recto").boundingBox();
      const box = await book.boundingBox();
      if (!box || !verso || !recto || !cover) throw new Error("Book pages missing");
      expect(submit.x).toBeGreaterThan(verso.x);
      expect(submit.x + submit.width).toBeLessThan(verso.x + verso.width);
      // the recto always sits to the right of the form column, and on a phone it stacks under it
      expect(recto.x).toBeGreaterThan(verso.x);
      if (width < 760) expect(recto.y).toBeGreaterThan(verso.y);
      // on a phone the recto is an inset inside the page, so its height is its own
      if (width >= 760) expect(recto.height).toBe(verso.height);
      if (width < 768) {
        // the page keeps a small desk margin, and the recto is a printed inset inside it
        expect(box.x).toBeLessThanOrEqual(12);
        expect(box.width).toBeGreaterThanOrEqual(width - 24);
        expect(recto.width).toBeLessThan(box.width);
        expect(recto.width).toBeGreaterThan(120);
        expect(cover.width).toBeLessThan(recto.width);
        await expect(page.locator(".auth-reading-record")).toBeVisible();
        await expect(page.locator(".auth-reading-streak li")).toHaveCount(7);
      } else {
        expect(box.x).toBeGreaterThan(0);
        expect(box.width).toBeLessThan(width);
        expect(box.width).toBeLessThanOrEqual(1040);
        expect(verso.width).toBe(recto.width);
        // the cover keeps its 2:3 proportion within a pixel or two of rounding
        expect(cover.width / cover.height).toBeCloseTo(2 / 3, 1);
        await expect(page.locator(".auth-reading-record")).toBeVisible();
        await expect(page.locator(".auth-reading-streak li")).toHaveCount(7);
      }

      const look = await book.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          radius: style.borderTopLeftRadius,
          shadow: style.boxShadow,
          rows: el.querySelectorAll(".auth-field").length,
          fold: getComputedStyle(el, "::after").backgroundImage,
          turn: getComputedStyle(el.querySelector(".auth-recto") as Element, "::after").width,
        };
      });
      expect(look.radius).toBe("0px");
      expect(look.shadow).toBe("none");
      expect(look.rows).toBe(mode === "signup" ? 3 : 2);
      if (width >= 760) expect(look.fold).toContain("linear-gradient");
      // the folded corner was dropped in the polish pass; the fold is the gutter only

      for (const control of await page
        .locator(".auth-footer button, .auth-demo-link, .auth-reveal")
        .all()) {
        const rect = await control.boundingBox();
        if (!rect) throw new Error("Card control missing");
        expect(rect.height).toBeGreaterThanOrEqual(44);
      }
      if (width === 320 && mode === "signup") {
        await settleCard(page);
        await page.screenshot({ path: `${evidence}/shelf-light-signup-320.png`, fullPage: true });
      }
    }
    await page.goto("/");
  }
});

test("the cover appears once, opens on click, and stays open after reload", {
  tag: "@first-visit",
}, async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const cover = page.getByRole("button", { name: "Open Quire" });
  await expect(cover).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(cover).toBeFocused();
  const box = await cover.boundingBox();
  expect(box).toEqual({ x: 0, y: 0, width: 390, height: 844 });
  await settleCard(page);
  await cover.click();
  await expect(page.locator(".auth-cover-stage")).toHaveAttribute("data-opening", "true");
  await expect(cover).toHaveCSS("animation-name", "auth-cover-open");
  await expect(cover).toHaveCSS("animation-duration", "0.48s");
  await expect(cover).toHaveCSS("animation-timing-function", "cubic-bezier(0.65, 0, 0.35, 1)");
  await expect(cover).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("quire:cover-seen"))).toBe("true");
  await page.reload();
  await expect(cover).toHaveCount(0);
  await expect(page.getByLabel("Email")).toBeVisible();
  await page.evaluate(() => localStorage.setItem("quire:cover-seen", ""));
  await page.reload();
  await expect(cover).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("the cover matches the themes and opens with Enter or a reduced-motion fade", {
  tag: "@first-visit",
}, async ({ page }) => {
  await page.goto("/");
  for (const theme of ["shelf-light", "oxford-dark"]) {
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: width === 320 ? 640 : width === 390 ? 844 : 900 });
      await page.evaluate((theme) => {
        localStorage.removeItem("quire:cover-seen");
        localStorage.setItem("quire-theme", theme);
      }, theme);
      await page.reload();
      const cover = page.getByRole("button", { name: "Open Quire" });
      await expect(cover).toBeVisible();
      await settleCard(page);
      const cloth = await cover.evaluate((el) => {
        const style = getComputedStyle(el);
        const luminance = (color: string) => {
          const channels = color.match(/\d+/g)?.slice(0, 3).map(Number);
          if (!channels) throw new Error("Cover color unavailable");
          return channels.map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
        };
        const ink = luminance(style.color);
        const paper = luminance(style.backgroundColor);
        const swatch = document.createElement("span");
        swatch.style.color = "var(--class-800)";
        el.append(swatch);
        const token = getComputedStyle(swatch).color;
        swatch.remove();
        return {
          color: style.backgroundColor,
          token,
          origin: style.transformOrigin,
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
          contrast: (Math.max(ink, paper) + 0.05) / (Math.min(ink, paper) + 0.05),
        };
      });
      expect(cloth.color).toBe(cloth.token);
      expect(cloth.contrast).toBeGreaterThanOrEqual(4.5);
      writeFileSync(`${evidence}/${theme}-cover-${width}.json`, JSON.stringify(cloth, null, 2));
      expect(cloth.origin).toBe(`0px ${cloth.height / 2}px`);
      if (width >= 768) expect(cloth.width / cloth.height).toBeCloseTo(2 / 3, 2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await page.screenshot({ path: `${evidence}/${theme}-cover-${width}.png` });
      await page.keyboard.press("Enter");
      await expect(cover).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByLabel("Email")).toBeFocused();
      await page.getByLabel("Email").blur();
      await page.screenshot({ path: `${evidence}/${theme}-open-${width}.png`, fullPage: true });
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => localStorage.removeItem("quire:cover-seen"));
  await page.reload();
  const cover = page.getByRole("button", { name: "Open Quire" });
  const fade = await cover.evaluate((el) => new Promise((resolve) => {
    el.addEventListener("animationstart", () => {
      const style = getComputedStyle(el);
      resolve({ name: style.animationName, duration: style.animationDuration, transform: style.transform });
    }, { once: true });
    (el as HTMLButtonElement).click();
  }));
  expect(fade).toEqual({ name: "auth-cover-fade", duration: "0.12s", transform: "none" });
  await expect(cover).toHaveCount(0);
  await page.evaluate(() => localStorage.removeItem("quire:cover-seen"));
  await page.goto("/?demo=1#/today");
  await expect(page.getByRole("button", { name: "Skip tour" })).toBeVisible();
  await expect(cover).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("quire:cover-seen"))).toBeNull();
});

test("keyboard path, password visibility, focus rules and demo tour", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.setItem("quire-theme", "shelf-light"));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  const order = [
    page.getByLabel("Email"),
    page.getByLabel("Password", { exact: true }),
    page.getByRole("button", { name: "Show", exact: true }),
    page.getByRole("button", { name: "Sign in", exact: true }),
    page.getByRole("button", { name: "Forgot your password?" }),
    page.getByRole("button", { name: "No account yet? Create one" }),
    page.getByRole("link", { name: "Try the interactive demo" }),
  ];
  for (const control of order) {
    await page.keyboard.press("Tab");
    await expect(control).toBeFocused();
    const style = await control.evaluate((el) => {
      const style = getComputedStyle(el);
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      const swatch = document.createElement("span");
      swatch.style.color = accent;
      document.body.append(swatch);
      const color = getComputedStyle(swatch).color;
      swatch.remove();
      return { outline: style.outlineWidth, color: style.outlineColor, accent: color };
    });
    expect(style.outline).toBe("2px");
    expect(style.color).toBe(style.accent);
    if ((await control.getAttribute("name")) === "email") {
      await settleCard(page);
      await page.screenshot({ path: `${evidence}/shelf-light-focus-1280.png`, fullPage: true });
    }
  }
  await page.getByRole("button", { name: "Show", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "No account yet? Create one" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Create an account" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();
  const demo = page.getByRole("link", { name: "Try the interactive demo" });
  await expect(demo).toHaveAttribute("href", "?demo=1#/today");
  await demo.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "One book. A place to begin." })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Make every page count." })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Make every page count." })).toHaveCount(0);
});

test("issuing prints a working rule without moving the book or its fold", async ({ page }) => {
  await page.goto("/?auth=signup");
  await page.getByLabel("Email").fill("reader@quire.local");
  await page.getByLabel("Password", { exact: true }).fill("Library-card42");
  const book = await page.locator(".auth-book").boundingBox();
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/auth/v1/signup", async (route) => {
    await pending;
    await route.fulfill({ json: { user: { id: "confirmation-required" }, session: null } });
  });
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  try {
    await expect(page.getByRole("button", { name: "Issuing card", exact: true })).toBeDisabled();
    await expect(page.locator("form")).toHaveAttribute("aria-busy", "true");
    await expect(page.getByLabel("Email")).toBeDisabled();
    await expect(page.getByLabel("Password", { exact: true })).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Already have an account? Sign in" }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: "Show", exact: true })).toBeDisabled();
    await expect(page.locator(".auth-issuing")).toHaveCSS("animation-name", "auth-working");
    expect(await page.locator(".auth-book").boundingBox()).toEqual(book);
  } finally {
    release?.();
  }
  await expect(page.getByRole("status")).toContainText("Check your email to confirm the account");
});

test("every text element exceeds 7:1 in all six themes, including errors and pending states", async ({
  page,
}) => {
  mkdirSync(evidence, { recursive: true });
  writeFileSync(
    `${evidence}/contrast.txt`,
    "Rendered text, inputs, and placeholders. Both pages sampled at 1280px; visible verso sampled at 390px.\n",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  await checkContrast(page, "sign in");
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await expect(page.getByRole("alert")).toContainText("Enter your email address first");
  await expect(page.locator("form")).toHaveAttribute("aria-describedby", "auth-message");
  await checkContrast(page, "reset needs email");
  await page.getByLabel("Email").fill("reader@quire.local");
  await page.route("**/auth/v1/recover**", (route) =>
    route.fulfill({ status: 503, json: { message: "Unavailable" } }),
  );
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await expect(page.getByRole("alert")).toContainText("Could not send a reset link");
  await checkContrast(page, "reset failure");
  await page.route("**/auth/v1/recover**", (route) => route.fulfill({ json: {} }));
  await page.getByLabel("Email").fill("reader@quire.local");
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await expect(page.getByRole("status")).toContainText("Reset link sent");
  await checkContrast(page, "reset success");
  await page.route("**/auth/v1/token?grant_type=password", (route) =>
    route.fulfill({
      status: 400,
      json: { error: "invalid_grant", error_description: "Invalid login credentials" },
    }),
  );
  await page.getByLabel("Password", { exact: true }).fill("Library-card42");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
  await checkContrast(page, "sign in error");
  let releaseSignIn: (() => void) | undefined;
  const signInPending = new Promise<void>((resolve) => {
    releaseSignIn = resolve;
  });
  await page.route("**/auth/v1/token?grant_type=password", async (route) => {
    await signInPending;
    await route.fulfill({
      status: 400,
      json: { error: "invalid_grant", error_description: "Invalid login credentials" },
    });
  });
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("button", { name: "Issuing card" })).toBeDisabled();
  await checkContrast(page, "sign in pending");
  expect(
    await page.locator(".auth-issuing").evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await expect(page.locator(".auth-issuing")).toHaveCSS("transition-duration", "0s");
  releaseSignIn?.();
  await expect(page.getByRole("button", { name: "Try again" })).toBeEnabled();
  await page.getByRole("button", { name: "No account yet? Create one" }).click();
  expect(
    await page.locator(".auth-face").evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.getByLabel("Password", { exact: true }).fill("");
  await expect(page.getByText("Password strength: Weak")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "aria-describedby",
    "auth-strength",
  );
  await checkContrast(page, "sign up weak");
  await page.getByLabel("Password", { exact: true }).fill("eightabc");
  await expect(page.getByText("Password strength: Fair")).toBeVisible();
  await checkContrast(page, "sign up fair");
  await page.getByLabel("Password", { exact: true }).fill("Library-card42");
  await expect(page.getByText("Password strength: Strong")).toBeVisible();
  await page.getByLabel("Repeat", { exact: true }).fill("Different-card42");
  await expect(page.getByRole("alert")).toHaveText("Passwords do not match.");
  await expect(page.getByLabel("Repeat")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Repeat")).toHaveAttribute("aria-describedby", "auth-mismatch");
  await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeDisabled();
  await checkContrast(page, "mismatch");
  await page.getByLabel("Repeat").fill("Library-card42");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Create account", exact: true }).hover();
  await checkContrast(page, "sign up and primary hover");
  let releaseSignup: (() => void) | undefined;
  const signupPending = new Promise<void>((resolve) => {
    releaseSignup = resolve;
  });
  await page.route("**/auth/v1/signup", async (route) => {
    await signupPending;
    await route.fulfill({ json: { user: { id: "confirmation-required" }, session: null } });
  });
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("button", { name: "Issuing card" })).toBeDisabled();
  await checkContrast(page, "sign up pending");
  releaseSignup?.();
  await expect(page.getByRole("status")).toContainText("Check your email to confirm the account");
  await checkContrast(page, "confirmation email");
});

test("the recto reads the demo's saved book and today's log", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?demo=1#/today");
  await page.getByRole("button", { name: "Skip tour" }).click();
  await page.getByLabel("Pages read", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Log 12 pages", exact: true }).click();
  await expect(
    page.getByText("12 pages today", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".auth-book-title")).toHaveText("Bumi Manusia");
  await expect(page.locator(".auth-reading-pages dd")).toHaveText("12");
  await expect(page.locator(".auth-reading-day-today")).toHaveClass(/auth-reading-day-filled/);
  await page.getByRole("link", { name: "Try the interactive demo" }).click();
  await expect(
    page.getByText("12 pages today", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
});

test("a missing cover uses the shared placeholder and storage denial leaves auth usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route("**/covers/bumi.webp", (route) => route.fulfill({ status: 404, body: "" }));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage denied", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await expect(page.getByRole("img", { name: "Bumi Manusia, no cover image" })).toHaveAttribute(
    "src",
    "/covers/placeholder.svg",
  );
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByLabel("Email")).toBeFocused();
  expect(
    await page.getByLabel("Email").evaluate((el) => (el as HTMLInputElement).validity.valueMissing),
  ).toBe(true);
  await page.getByRole("button", { name: "No account yet? Create one" }).click();
  await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
});
