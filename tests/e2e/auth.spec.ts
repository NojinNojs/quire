import { randomUUID } from "node:crypto";
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
const evidence = "docs/evidence/auth-card";

async function checkContrast(page: Page, state: string) {
  for (const theme of themes) {
    const samples = await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
      const column = document.querySelector(".auth-card");
      if (!column) throw new Error("Borrower card missing");
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
          ? over(rgba(getComputedStyle(element).backgroundColor), background(element.parentElement))
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
    expect(samples.some(({ text }) => text === "NO. 0001")).toBe(true);
    expect(samples.some(({ text }) => text === "BORROWER CARD")).toBe(true);
    for (const number of ["100", "500", "800", "900"]) {
      expect(
        samples.some(({ text }) => text === number),
        `Sample class ${number}`,
      ).toBe(true);
    }
    expect(samples.filter(({ text }) => text === "QUIRE")).toHaveLength(2);
    if (await page.locator('[data-mode="signup"]').count()) {
      expect(samples.some(({ text }) => text === "NEW CARD")).toBe(true);
    }
    expect(samples.length).toBeGreaterThan(12);
    for (const { text, ratio } of samples) {
      expect(ratio, `${theme}, ${state}: ${text}`).toBeGreaterThanOrEqual(7);
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
  for (const width of [390, 768, 1280]) {
    test(`sign in and sign up at ${width} in ${theme}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.addInitScript((value) => localStorage.setItem("quire-theme", value), theme);
      await page.goto("/?source=auth#/shelf");
      await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
      await settleCard(page);
      await page.screenshot({ path: `${evidence}/${theme}-signin-${width}.png`, fullPage: true });
      await page.getByRole("button", { name: "No account yet? Create one" }).click();
      await expect(page.getByRole("heading", { name: "Create an account" })).toBeFocused();
      await page.reload();
      await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
      expect(new URL(page.url()).hash).toBe("#/shelf");
      expect(new URL(page.url()).searchParams.get("source")).toBe("auth");
      await settleCard(page);
      await page.screenshot({ path: `${evidence}/${theme}-signup-${width}.png`, fullPage: true });
      expect(errors).toEqual([]);
    });
  }
}

test("the whole surface is a ruled borrower card at every requested width", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  for (const width of [320, 390, 768, 960, 1024, 1440]) {
    await page.setViewportSize({ width, height: width === 320 ? 640 : 844 });
    for (const mode of ["signin", "signup"]) {
      if (mode === "signup")
        await page.getByRole("button", { name: "No account yet? Create one" }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      const submit = await page.locator(".primary").boundingBox();
      if (!submit) throw new Error("Submit missing");
      expect(submit.y + submit.height).toBeLessThanOrEqual(await page.evaluate(() => innerHeight));
      expect(submit.height).toBe(48);
      const card = await page.locator(".auth-card").boundingBox();
      if (!card) throw new Error("Borrower card missing");
      expect(card.x).toBe(width < 600 ? 0 : 32);
      expect(card.width).toBe(width < 600 ? width : width - 64);
      await expect(page.locator(".auth-card")).toHaveCount(1);
      await expect(page.locator(".auth-page img, .auth-cover-wall")).toHaveCount(0);
      await expect(page.locator(".auth-stamp")).toHaveCount(mode === "signup" ? 2 : 1);
      await expect(page.locator('.auth-stamp:not([aria-hidden="true"])')).toHaveCount(0);
      for (const grain of await page.locator(".auth-stamp-grain").all()) {
        await expect(grain).toHaveAttribute("d", "M12 28h56M10 53h60");
      }
      await expect(page.locator(".auth-classes > span")).toHaveText(["100", "500", "800", "900"]);
      const geometry = await page.locator(".auth-card").evaluate((el) => {
        const style = getComputedStyle(el);
        const origin = el.getBoundingClientRect().top + Number.parseFloat(style.borderTopWidth);
        const workspace = el.querySelector(".auth-workspace");
        if (!workspace) throw new Error("Card contents missing");
        return {
          frame: [style.borderTopWidth, style.borderBottomWidth],
          side: style.borderLeftWidth,
          radius: style.borderTopLeftRadius,
          shadow: style.boxShadow,
          background: style.backgroundImage,
          rows: [...el.querySelectorAll(".auth-field")].map((field) => {
            const rule = getComputedStyle(field, "::after");
            const rect = field.getBoundingClientRect();
            return {
              height: rect.height,
              baseline: (rect.bottom - origin) % 32,
              left: rect.left + Number.parseFloat(rule.left),
              right: rect.right - Number.parseFloat(rule.right),
            };
          }),
          numberBaseline:
            (el.querySelector(".auth-card-number")!.getBoundingClientRect().bottom - origin) % 32,
          strengthBaseline: el.querySelector(".auth-strength")
            ? (el.querySelector(".auth-strength")!.getBoundingClientRect().bottom - origin) % 32
            : null,
          signature: el.querySelector(".auth-classes")!.getBoundingClientRect().bottom,
        };
      });
      expect(geometry.frame).toEqual(["1px", "1px"]);
      expect(geometry.side).toBe(width < 600 ? "0px" : "1px");
      expect(geometry.radius).toBe(width < 600 ? "0px" : "2px");
      expect(geometry.shadow).toBe("none");
      expect(geometry.background).toBe("none");
      expect(geometry.numberBaseline).toBe(0);
      expect(geometry.strengthBaseline).toBe(mode === "signup" ? 0 : null);
      expect(geometry.signature).toBe(card.y + card.height - 32);
      expect(geometry.rows).toHaveLength(mode === "signup" ? 3 : 2);
      for (const row of geometry.rows) {
        expect(row.height).toBe(64);
        expect(row.baseline).toBe(0);
        if (width < 600) {
          expect(row.left).toBe(0);
          expect(row.right).toBe(width);
        }
      }
      for (const control of await page
        .locator(".auth-footer button, .auth-demo-link, .auth-reveal")
        .all()) {
        const rect = await control.boundingBox();
        if (!rect) throw new Error("Card control missing");
        expect(rect.height).toBeGreaterThanOrEqual(44);
        expect(rect.width).toBeGreaterThanOrEqual(44);
      }
      if (width === 320 && mode === "signup") {
        await settleCard(page);
        await page.screenshot({ path: `${evidence}/shelf-light-signup-320.png`, fullPage: true });
      }
    }
    await page.getByRole("button", { name: "Already have an account? Sign in" }).click();
  }
});

test("keyboard path, password visibility, focus rules and demo tour", async ({ page }) => {
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
      return { outline: style.outlineWidth, rule: style.borderBottomWidth };
    });
    expect(style.outline === "2px" || style.rule === "2px").toBe(true);
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

test("issuing presses the stamps and prints an animated rule without moving the card", async ({
  page,
}) => {
  await page.goto("/?auth=signup");
  await page.getByLabel("Email").fill("reader@quire.local");
  await page.getByLabel("Password", { exact: true }).fill("Library-card42");
  const card = await page.locator(".auth-card").boundingBox();
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
    for (const stamp of await page.locator(".auth-stamp").all()) {
      await expect
        .poll(() => stamp.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f))
        .toBe(1);
      const style = await stamp.evaluate((el) => {
        const style = getComputedStyle(el);
        const matrix = new DOMMatrix(style.transform);
        return {
          duration: style.transitionDuration,
          rotation: (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
        };
      });
      expect(style.duration).toBe("0.12s");
      expect(style.rotation).toBeCloseTo(-6, 3);
      await expect(stamp.locator("circle")).toHaveCSS("stroke-width", "1px");
      await expect(stamp.locator("circle")).toHaveCSS("vector-effect", "non-scaling-stroke");
    }
    await expect(page.locator(".auth-issuing")).toHaveCSS("animation-name", "auth-working");
    expect(await page.locator(".auth-card").boundingBox()).toEqual(card);
  } finally {
    release?.();
  }
  await expect(page.getByRole("status")).toContainText("Check your email to confirm the account");
  for (const stamp of await page.locator(".auth-stamp").all()) {
    await expect
      .poll(() => stamp.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f))
      .toBe(0);
  }
});

test("every text element exceeds 7:1 in all six themes, including errors and pending states", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  await checkContrast(page, "sign in");
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await expect(page.getByRole("alert")).toContainText("Enter your email address first");
  await expect(page.locator("form")).toHaveAttribute("aria-describedby", "auth-message");
  await checkContrast(page, "reset needs email");
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
  await expect(page.locator(".auth-stamp")).toHaveCSS("transition-duration", "0s");
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
