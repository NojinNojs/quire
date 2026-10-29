import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const out = "docs/evidence/cover-enrich";
const stack = JSON.parse(execFileSync("supabase", ["status", "-o", "json"], {
  encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
}));
const admin = createClient(stack.API_URL, stack.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const server = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5197", "--strictPort"], {
  env: { ...process.env, VITE_SUPABASE_URL: stack.API_URL, VITE_SUPABASE_ANON_KEY: stack.ANON_KEY },
  stdio: "ignore", detached: true,
});
let owner;
let browser;
try {
  const email = `cover-enrich-${crypto.randomUUID()}@quire.local`;
  const password = crypto.randomUUID();
  const user = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (user.error) throw user.error;
  owner = user.data.user.id;
  const inserted = await admin.from("books").insert([
    { owner, title: "Pride and Prejudice", author: "Jane Austen", isbn: "9780141439518", ddc: "823.7", status: "reading", pages: 480 },
    { owner, title: "A very long title about the history of Indonesian literature and its many printed editions", author: null, ddc: "899.2213", status: "want", pages: 272 },
  ]).select();
  if (inserted.error) throw inserted.error;
  const real = inserted.data.find((book) => book.isbn);
  const jacket = inserted.data.find((book) => !book.isbn);
  const env = { ...process.env, SUPABASE_URL: stack.API_URL, SUPABASE_SERVICE_ROLE_KEY: stack.SERVICE_ROLE_KEY, BACKFILL_OWNER: owner };
  const dry = execFileSync("node", ["scripts/backfill-covers.mjs", "--dry-run"], { env, encoding: "utf8" });
  const wet = execFileSync("node", ["scripts/backfill-covers.mjs"], { env, encoding: "utf8" });
  const again = execFileSync("node", ["scripts/backfill-covers.mjs"], { env, encoding: "utf8" });
  writeFileSync(`${out}/backfill-output.txt`, `Local disposable evidence library\n\n$ node scripts/backfill-covers.mjs --dry-run\n${dry}\n$ node scripts/backfill-covers.mjs\n${wet}\n$ node scripts/backfill-covers.mjs\n${again}`);
  const stored = await admin.from("books").select("cover_url").eq("id", real.id).single();
  assert.ok(stored.data.cover_url?.startsWith("https://"));
  const response = await fetch(stored.data.cover_url);
  assert.ok(response.ok);
  assert.match(response.headers.get("content-type"), /^image\//);
  // Serve the actual fetched bytes during capture to avoid browser network variability.
  const artwork = Buffer.from(await response.arrayBuffer());
  const reader = createClient(stack.API_URL, stack.ANON_KEY, { auth: { persistSession: false } });
  const session = await reader.auth.signInWithPassword({ email, password });
  if (session.error) throw session.error;
  browser = await chromium.launch({ executablePath: "/run/current-system/sw/bin/brave", headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript((session) => localStorage.setItem("sb-127-auth-token", JSON.stringify(session)), session.data.session);
  const page = await context.newPage();
  await page.route(stored.data.cover_url, (route) => route.fulfill({ body: artwork, contentType: "image/jpeg" }));
  for (let i = 0; ; i++) {
    try { await page.goto("http://127.0.0.1:5197/#/shelf"); break; }
    catch (error) { if (i > 30) throw error; await new Promise((resolve) => setTimeout(resolve, 100)); }
  }
  await page.locator(".shelf-cover img").waitFor();
  await page.locator(".cover-jacket-title").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelector(".shelf-cover img")?.naturalWidth > 0);
  await page.screenshot({ path: `${out}/shelf-grid-390.png`, fullPage: true });
  const checks = [];
  // Exercise every cloth, the two shipping jacket sizes, and all six themes.
  for (const theme of ["shelf-light", "shelf-dark", "municipal-light", "municipal-dark", "oxford-light", "oxford-dark"]) {
    await page.evaluate((theme) => document.documentElement.dataset.theme = theme, theme);
    for (const width of [96, 170]) {
      const results = await page.locator(".cover-jacket").evaluate((el, width) => {
        const cover = el.closest(".cover-image");
        cover.style.width = `${width}px`;
        cover.style.height = `${width * 1.5}px`;
        const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const lum = (color) => {
          ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
          return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map((n) => {
            const s = n / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          }).reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
        };
        const original = cover.className;
        const cloths = ["oxblood", "olive", "indigo", "ochre", "teal"].map((cloth) => {
          cover.className = original.replace(/cover-cloth-\w+/, `cover-cloth-${cloth}`);
          const s = getComputedStyle(el);
          const a = lum(s.color), b = lum(s.backgroundColor);
          return { cloth, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
        });
        cover.className = original;
        const title = el.querySelector(".cover-jacket-title"), author = el.querySelector(".cover-jacket-author"), number = el.querySelector(".cover-jacket-class");
        const ts = getComputedStyle(title), as = getComputedStyle(author);
        const t = title.getBoundingClientRect(), a = author.getBoundingClientRect(), n = number.getBoundingClientRect(), c = cover.getBoundingClientRect();
        return { cloths, titleClamp: ts.webkitLineClamp, authorClamp: as.webkitLineClamp, titleLines: t.height / parseFloat(ts.lineHeight), authorSize: as.fontSize, font: ts.fontFamily, noOverlap: t.bottom <= a.top && a.bottom < n.top && n.bottom <= c.bottom, clamped: title.scrollHeight > title.clientHeight, hasUnknownAuthor: author.textContent === "Author unknown" };
      }, width);
      assert.ok(results.noOverlap, JSON.stringify({ theme, width, results }));
      assert.equal(results.titleClamp, "4");
      assert.equal(results.authorClamp, "2");
      assert.ok(results.titleLines <= 4.1 && results.titleLines >= 2);
      assert.equal(results.authorSize, "9px");
      assert.ok(results.hasUnknownAuthor);
      assert.match(results.font, /Newsreader/);
      for (const cloth of results.cloths) assert.ok(cloth.ratio >= 7, JSON.stringify(cloth));
      checks.push({ theme, width, ...results });
    }
  }
  await page.reload();
  await page.getByRole("button", { name: "Open Pride and Prejudice", exact: true }).click();
  await page.locator(".reading-cover img").waitFor();
  await page.waitForFunction(() => document.querySelector(".reading-cover img")?.naturalWidth > 0);
  await page.screenshot({ path: `${out}/today-real-cover-390.png`, fullPage: true });
  await admin.from("books").update({ status: "want" }).eq("id", real.id);
  await admin.from("books").update({ status: "reading" }).eq("id", jacket.id);
  await page.reload();
  await page.locator(".reading-cover .cover-jacket").waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator(".reading-cover").evaluate((el) => el.offsetWidth), 96);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: `${out}/today-printed-jacket-390.png`, fullPage: true });
  writeFileSync(`${out}/checks.json`, `${JSON.stringify({ fetchedCover: stored.data.cover_url, imageBytes: artwork.length, checks }, null, 2)}\n`);
  console.log("Passed: live lookup and CLI dry-run/backfill, real fetched image, 60 cloth/theme/size contrast checks, long title and unknown author containment, 390px shelf and Today screenshots.");
} finally {
  await browser?.close();
  if (owner) await admin.auth.admin.deleteUser(owner);
  process.kill(-server.pid, "SIGTERM");
}
