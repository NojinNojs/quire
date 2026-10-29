import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const stack = JSON.parse(
  execFileSync("supabase", ["status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
const out = "docs/evidence/design-shelf";
mkdirSync(out, { recursive: true });
const server = spawn(
  "npm",
  ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5196", "--strictPort"],
  {
    env: {
      ...process.env,
      VITE_SUPABASE_URL: stack.API_URL,
      VITE_SUPABASE_ANON_KEY: stack.ANON_KEY,
    },
    stdio: "ignore",
    detached: true,
  },
);
const admin = createClient(stack.API_URL, stack.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const email = `shelf-evidence-${crypto.randomUUID()}@quire.local`;
const password = crypto.randomUUID();
let owner;
let browser;
const report = [];
try {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  owner = data.user.id;
  const { data: books, error: insertError } = await admin
    .from("books")
    .insert([
      {
        owner,
        title: "The Waves",
        author: "Virginia Woolf",
        publisher: "Penguin Classics",
        year: 2000,
        pages: 272,
        ddc: "823.912",
        status: "reading",
        language: "en",
      },
      {
        owner,
        title: "A Room of One's Own",
        author: "Virginia Woolf",
        publisher: "Hogarth Press",
        year: 1929,
        pages: 172,
        ddc: "823",
        status: "want",
        language: "en",
      },
      {
        owner,
        title: "Meditations",
        author: "Marcus Aurelius",
        publisher: "Modern Library",
        year: 2002,
        pages: 256,
        ddc: "188",
        status: "want",
        language: "en",
      },
    ])
    .select();
  if (insertError) throw insertError;
  const book = books.find((book) => book.status === "reading");
  const reader = createClient(stack.API_URL, stack.ANON_KEY, { auth: { persistSession: false } });
  const { data: session, error: signError } = await reader.auth.signInWithPassword({
    email,
    password,
  });
  if (signError) throw signError;
  for (const [day, pages] of [
    ["2026-10-25", 10],
    ["2026-10-27", 20],
    ["2026-10-29", 38],
  ]) {
    const { error } = await reader.rpc("log_pages", {
      p_book: book.id,
      p_pages: pages,
      p_day: day,
    });
    if (error) throw error;
  }
  browser = await chromium.launch({
    executablePath: "/run/current-system/sw/bin/brave",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(
    ({ session, storageKey }) => localStorage.setItem(storageKey, JSON.stringify(session)),
    { session: session.session, storageKey: "sb-127-auth-token" },
  );
  const page = await context.newPage();
  for (let attempt = 0; ; attempt++) {
    try {
      await page.goto("http://127.0.0.1:5196/#/shelf");
      break;
    } catch (error) {
      if (attempt > 30) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
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
    report.push({ theme, contrasts });
    for (const [token, ratio] of Object.entries(contrasts))
      assert.ok(ratio >= 7, `${theme} ${token}: ${ratio}`);
    if (["shelf-light", "oxford-dark"].includes(theme)) {
      await capture(`grid-${theme}-390.png`);
      await page.getByRole("button", { name: "List", exact: true }).click();
      await capture(`list-${theme}-390.png`);
      await page.reload();
      await page.getByRole("button", { name: "The Waves", exact: true }).waitFor();
      assert.equal(
        await page.getByRole("button", { name: "List", exact: true }).getAttribute("aria-pressed"),
        "true",
      );
      await page.getByRole("button", { name: "Grid", exact: true }).click();
    }
  }
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
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    if (["shelf-light", "oxford-dark"].includes(theme)) await capture(`today-${theme}-390.png`);
  }
  writeFileSync(`${out}/checks.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    "Passed: persisted local book and 68 logged pages, grid columns at 390/420/421/768 across all six modes, no overflow, spine containment, 7:1 class inks, list persistence, 120/160ms motion, reduced motion, restored stamp after reload, Today navigation.",
  );
} finally {
  await browser?.close();
  if (owner) await admin.auth.admin.deleteUser(owner);
  process.kill(-server.pid, "SIGTERM");
}
