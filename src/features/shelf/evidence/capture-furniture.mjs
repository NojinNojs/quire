import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import { startEvidenceServer, stopEvidenceServer } from "../../../../scripts/evidence-server.mjs";
import { checkFurniture } from "./furniture-checks.mjs";

const stack = JSON.parse(
  execFileSync("supabase", ["status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
const env = loadEnv("development", process.cwd(), "VITE_");
assert.ok(
  ["127.0.0.1", "localhost", "[::1]"].includes(new URL(stack.API_URL).hostname),
  "Supabase must be local",
);
assert.equal(env.VITE_SUPABASE_URL, stack.API_URL, "App URL must match local Supabase");
assert.equal(env.VITE_SUPABASE_ANON_KEY, stack.ANON_KEY, "App key must match local Supabase");
const out = "test-results/design-shelf";
mkdirSync(out, { recursive: true });
const admin = createClient(stack.API_URL, stack.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const email = `shelf-evidence-${crypto.randomUUID()}@quire.local`;
const password = crypto.randomUUID();
let owner;
let browser;
let server;
let runError;
let runFailed = false;
let cleanupFailures = [];
const report = [];
try {
  server = await startEvidenceServer(5196, stack);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  owner = data?.user?.id;
  if (error) throw error;
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
  await checkFurniture(page, out, report);
  writeFileSync(`${out}/checks.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    "Passed: persisted local book and 68 logged pages, grid columns at 390/420/421/768 in shelf-light, no overflow, spine containment, 7:1 class inks, list persistence, 120/160ms motion, reduced motion, restored stamp after reload, Today navigation.",
  );
} catch (error) {
  runError = error;
  runFailed = true;
} finally {
  const results = await Promise.allSettled([
    ...(browser ? [Promise.resolve().then(() => browser.close())] : []),
    ...(owner
      ? [
          Promise.resolve().then(async () => {
            const { error } = await admin.auth.admin.deleteUser(owner);
            if (error) throw error;
          }),
        ]
      : []),
    ...(server ? [Promise.resolve().then(() => stopEvidenceServer(server))] : []),
  ]);
  cleanupFailures = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason);
}
if (cleanupFailures.length)
  throw new AggregateError(
    runFailed ? [runError, ...cleanupFailures] : cleanupFailures,
    "Shelf evidence cleanup failed",
  );
if (runFailed) throw runError;
