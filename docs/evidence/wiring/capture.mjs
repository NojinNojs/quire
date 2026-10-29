import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { chromium, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const stack = JSON.parse(execFileSync('supabase', ['status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
const admin = createClient(stack.API_URL, stack.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const browser = await chromium.launch({ executablePath: '/run/current-system/sw/bin/brave', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Jakarta' });
await page.emulateMedia({ reducedMotion: 'reduce' });
const base = 'http://[::1]:5175';
let owner;
const checked = (result) => { if (result.error) throw result.error; return result.data; };
try {
  await page.goto(base);
  await page.getByRole('button', { name: 'No account yet? Create one' }).click();
  await page.getByLabel('Email').fill(`wiring.${randomUUID()}@quire.local`);
  await page.getByLabel('Password').fill(`Wiring-${randomUUID()}`);
  const signup = page.waitForResponse(response => response.url().includes('/auth/v1/signup'));
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  owner = (await (await signup).json()).user.id;
  await expect(page.getByRole('heading', { name: 'Add a book' })).toBeVisible();
  await page.goto(`${base}/#/today`);
  await expect(page.getByRole('button', { name: 'Browse catalogue' })).toBeVisible();
  const books = checked(await admin.from('books').insert([
    { owner, title: 'The Hobbit', author: 'J. R. R. Tolkien', status: 'reading', language: 'en', ddc: '823' },
    { owner, title: 'Pride and Prejudice', author: 'Jane Austen', status: 'want', language: 'en', ddc: '823' },
    { owner, title: 'On the Origin of Species', author: 'Charles Darwin', status: 'finished', language: 'en', ddc: '576' },
  ]).select());
  const active = books.find(book => book.status === 'reading');
  const today = await page.evaluate(() => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; });
  checked(await admin.from('progress_log').insert({ owner, book_id: active.id, day: today, pages: 20 }));
  checked(await admin.from('streaks').update({ current: 1, longest: 1, last_day: today }).eq('owner', owner));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'The Hobbit' })).toBeVisible();
  await expect(page.getByText('20 pages today', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '1 day streak' })).toBeVisible();
  await page.screenshot({ path: 'docs/evidence/wiring/today-390.png', fullPage: true });
  await page.getByLabel('Pages read', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Log 3 pages', exact: true }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByText('20 pages today', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Log 3 pages', exact: true }).click();
  await expect(page.getByText('Pages logged.', { exact: true })).toBeVisible({ timeout: 10000 });
  await page.reload();
  await expect(page.getByText('23 pages today', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Shelf', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Shelf', exact: true })).toBeVisible();
  await expect(page.getByText('3 books', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'docs/evidence/wiring/shelf-390.png', fullPage: true });
  let fail = true;
  await page.route('**/rest/v1/books?**', route => fail ? route.fulfill({ status: 403, json: { code: '42501', message: 'Denied for retry check' } }) : route.continue());
  await page.reload();
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByText('3 books', { exact: true })).toBeVisible();
  await page.unroute('**/rest/v1/books?**');
  for (const route of ['today', 'shelf', 'search', 'settings']) {
    await page.goto(`${base}/#/${route}`);
    await page.reload();
    await expect(page.getByRole('heading', { name: route === 'search' ? 'Add a book' : route[0].toUpperCase() + route.slice(1), exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: route[0].toUpperCase() + route.slice(1), exact: true })).toHaveAttribute('aria-current', 'page');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto(`${base}/#/search`);
  let searches = 0;
  await page.route(/https:\/\/(www.googleapis.com|openlibrary.org)\//, route => {
    expect(decodeURIComponent(route.request().url())).toContain('9780140328721');
    searches++;
    return route.fulfill({ json: route.request().url().includes('googleapis') ? { items: [] } : { docs: [] } });
  });
  await page.getByRole('tab', { name: 'Enter manually' }).click();
  await page.getByRole('button', { name: 'Scan ISBN', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('ISBN-13', { exact: true }).fill('9780140328721');
  await page.getByRole('button', { name: 'Use ISBN', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Title, author or ISBN')).toHaveValue('9780140328721');
  await expect.poll(() => searches).toBe(2);
  checked(await admin.from('streaks').delete().eq('owner', owner));
  await page.goto(`${base}/#/today`);
  await expect(page.getByRole('button', { name: 'Browse catalogue' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The Hobbit' })).toHaveCount(0);
  console.log('PASS: empty Today, persisted active book and streak, page log undo/save/reload, seeded Shelf, Shelf retry, four route reloads and active links, no overflow at 390, scan fallback fills and runs ISBN search, missing streak empty state.');
  console.log(`Captured real local database rows for temporary account ${owner}; cleaned up after capture. No book, streak or progress API responses mocked. Catalogue providers return empty results only for the scan wiring check.`);
} finally {
  await browser.close();
  if (owner) checked(await admin.auth.admin.deleteUser(owner));
}
