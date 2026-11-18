import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import { startEvidenceServer } from "../../../../scripts/evidence-server.mjs";
import { cleanupCoverEvidence } from "./cleanup.mjs";

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
mkdirSync("test-results/covers", { recursive: true });
const admin = createClient(stack.API_URL, stack.SERVICE_ROLE_KEY);
const email = `covers.${randomUUID()}@quire.local`;
const password = `Cover-${randomUUID()}`;
const users = [];
let browser;
let path;
let server;
let upload;
let runError;
try {
  server = await startEvidenceServer(5198, stack);
  const { data: account, error: accountError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (account?.user?.id) users.push(account.user.id);
  assert.ifError(accountError);
  const owner = account.user.id;
  const outsider = createClient(stack.API_URL, stack.ANON_KEY, { auth: { persistSession: false } });
  const { data: other, error: otherError } = await admin.auth.admin.createUser({
    email: `covers.${randomUUID()}@quire.local`,
    password,
    email_confirm: true,
  });
  if (other?.user?.id) users.push(other.user.id);
  assert.ifError(otherError);
  const { error: signInError } = await outsider.auth.signInWithPassword({
    email: other.user.email,
    password,
  });
  assert.ifError(signInError);
  browser = await chromium.launch({
    executablePath: "/run/current-system/sw/bin/brave",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const { data: book, error } = await admin
    .from("books")
    .insert({
      owner,
      title: "Pride and Prejudice",
      author: "Jane Austen",
      publisher: "Penguin Classics",
      year: 2003,
      pages: 480,
      status: "reading",
      language: "en",
      ddc: "823",
    })
    .select()
    .single();
  assert.ifError(error);
  path = `${owner}/${book.id}/cover.webp`;
  await page.goto("http://127.0.0.1:5198/#/today");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const input = page.getByLabel("Upload cover");
  await input.waitFor();
  await page.waitForFunction(() => !document.querySelector('input[type="file"]').disabled);
  upload = Promise.allSettled([
    page
      .waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url() === `${stack.API_URL}/storage/v1/object/covers/${path}`,
      )
      .then(async (response) => {
        const error = await response.finished();
        if (error) throw error;
        return response;
      }),
  ]);
  await input.setInputFiles(process.argv[2]);
  const [uploadResult] = await upload;
  if (uploadResult.status === "rejected") throw uploadResult.reason;
  assert.ok(uploadResult.value.ok(), `Cover upload failed: ${uploadResult.value.status()}`);
  await page.getByRole("button", { name: "Remove cover" }).waitFor();
  await page.waitForFunction(() => {
    const img = document.querySelector(".reading-cover img");
    return img?.complete && img.naturalWidth > 0;
  });
  const stored = await admin.from("books").select("cover_path").eq("id", book.id).single();
  assert.equal(stored.data.cover_path, path);
  const size = await page
    .locator(".reading-cover img")
    .evaluate((img) => ({ width: img.naturalWidth, height: img.naturalHeight }));
  assert.ok(size.width <= 600);
  const checkLayout = async () => {
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  };
  await checkLayout();
  await page.screenshot({ path: "test-results/covers/today-390.png", fullPage: true });
  await page.reload();
  await page.waitForFunction(() => document.querySelector(".reading-cover img")?.naturalWidth > 0);
  await page.goto("http://127.0.0.1:5198/#/shelf");
  await page.waitForFunction(() => document.querySelector(".shelf-cover img")?.naturalWidth > 0);
  await checkLayout();
  await page.screenshot({ path: "test-results/covers/shelf-390.png", fullPage: true });

  const forbiddenRead = await outsider.storage.from("covers").createSignedUrl(path, 60);
  assert.ok(forbiddenRead.error, "Another owner must not sign this cover");
  const forbiddenWrite = await outsider.storage
    .from("covers")
    .upload(path, new Blob(["denied"], { type: "image/webp" }), {
      upsert: true,
      contentType: "image/webp",
    });
  assert.ok(forbiddenWrite.error, "Another owner must not replace this cover");
  const forbiddenDelete = await outsider.storage.from("covers").remove([path]);
  assert.equal(forbiddenDelete.data?.length ?? 0, 0, "Another owner must not delete this cover");
  const anonymous = createClient(stack.API_URL, stack.ANON_KEY, {
    auth: { persistSession: false },
  });
  assert.ok((await anonymous.storage.from("covers").createSignedUrl(path, 60)).error);
  assert.ok((await admin.storage.from("covers").getPublicUrl(path)).data.publicUrl);
  const publicRead = await fetch(`${stack.API_URL}/storage/v1/object/public/covers/${path}`);
  assert.equal(publicRead.ok, false, "The cover bucket must remain private");

  await page.goto("http://127.0.0.1:5198/#/today");
  await page.getByRole("button", { name: "Remove cover" }).click();
  await page.getByRole("img", { name: "No cover for Pride and Prejudice" }).waitFor();
  await page.reload();
  await page.getByRole("img", { name: "No cover for Pride and Prejudice" }).waitFor();
  assert.equal(
    (await admin.from("books").select("cover_path").eq("id", book.id).single()).data.cover_path,
    null,
  );
  assert.ok((await admin.storage.from("covers").download(path)).error);
  console.log(
    JSON.stringify(
      {
        uploadedDimensions: size,
        ownerPath: "{owner}/{book_id}/cover.webp",
        todayReload: "passed",
        shelf: "passed",
        mobileOverflow: "none",
        crossOwnerReadWriteDelete: "denied",
        anonymousRead: "denied",
        publicRead: "denied",
        removeAndReload: "passed",
      },
      null,
      2,
    ),
  );
} catch (error) {
  runError = error;
  throw error;
} finally {
  await cleanupCoverEvidence({ upload, browser, path, admin, users, server, runError });
}
