async (page) => {
  const path = "/home/nojin/works/quire/docs/evidence/quality/";
  const checks = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const google = { items: [{ volumeInfo: {
    title: "This Earth of Mankind", authors: ["Pramoedya Ananta Toer"],
    publisher: "Penguin", publishedDate: "1996", pageCount: 368,
    industryIdentifiers: [{ type: "ISBN_13", identifier: "9780140256352" }], language: "en",
  } }] };
  let mode = "empty";
  let release;
  let hold;
  await page.route("https://www.googleapis.com/books/v1/volumes?**", async (route) => {
    if (mode === "loading") await hold;
    if (mode === "error") return route.abort();
    return route.fulfill({ json: mode === "empty" ? {} : google });
  });
  await page.route("https://openlibrary.org/**", async (route) => {
    if (mode === "loading") await hold;
    return mode === "error" || mode === "partial" ? route.abort() : route.fulfill({ json: {} });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const search = async () => {
    await page.getByRole("searchbox").fill("This Earth of Mankind");
    await page.getByRole("button", { name: "Search", exact: true }).click();
  };
  mode = "loading";
  hold = new Promise((resolve) => { release = resolve; });
  await search();
  const skeleton = page.getByRole("status", { name: "Searching Google Books and Open Library" });
  await skeleton.waitFor();
  assert(await skeleton.locator(".catalog-row").count() === 3, "Three skeleton rows");
  await page.screenshot({ path: `${path}loading.png`, fullPage: true });
  mode = "empty";
  release();
  await page.getByText("No catalogue matches for this search.", { exact: true }).waitFor();
  await page.screenshot({ path: `${path}empty.png`, fullPage: true });
  const empty = page.locator(".empty-state");
  assert(await empty.getByRole("button").count() === 1, "Empty state has one action");
  await empty.getByRole("button", { name: "Enter manually" }).click();
  await page.getByLabel("Title (required)").waitFor();
  checks.push("Search: held both providers, saw three row skeletons; released empty responses, saw one sentence/action; Enter manually opened the form.");
  await page.getByRole("tab", { name: "Search catalogue" }).click();
  mode = "error";
  await search();
  await page.getByRole("alert").waitFor();
  await page.screenshot({ path: `${path}error.png`, fullPage: true });
  assert(await page.getByText("Google Books is unavailable.", { exact: false }).count() === 1, "Google error visible");
  assert(await page.getByText("Open Library is unavailable.", { exact: false }).count() === 1, "Open Library error visible");
  assert(await page.locator(".empty-state").count() === 0, "Failures are not empty results");
  mode = "partial";
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByRole("heading", { name: "This Earth of Mankind" }).waitFor();
  assert(await page.getByRole("alert").count() === 1, "Partial error visible beside candidates");
  await page.screenshot({ path: `${path}partial-error.png`, fullPage: true });
  checks.push("Both providers failed: messages, Try again and Enter manually appeared. Try again with Google answering retained the Open Library warning and an enabled Save action.");
  let failSave = true;
  let failCount = false;
  await page.route("**/rest/v1/books?**", async (route) => {
    const method = route.request().method();
    if ((method === "POST" && failSave) || (method === "HEAD" && failCount)) {
      return route.fulfill({ status: 403, json: { code: "42501", message: "row level security policy" } });
    }
    return route.continue();
  });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText("Your account does not have permission", { exact: false }).waitFor();
  failSave = false;
  const savePanel = page.getByRole("alert").filter({ hasText: "Your account" });
  await savePanel.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("button", { name: "Added", exact: true }).waitFor();
  await page.getByText("1 book", { exact: true }).waitFor();
  checks.push("Save with an intercepted RLS rejection showed actionable permission text and recovery controls; retry with real local Supabase saved the row, changed Save to Added and count to 1 book.");
  await page.reload();
  await page.getByText("1 book", { exact: true }).waitFor();
  mode = "results";
  await search();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText("This edition is already in your library.", { exact: true }).waitFor();
  await page.getByText("1 book", { exact: true }).waitFor();
  checks.push("Reload and repeat save hit the real duplicate index, showed the friendly duplicate message and left count at 1.");
  await page.getByRole("tab", { name: "Enter manually" }).click();
  await page.getByLabel("Title (required)").fill("Quality manual edition");
  await page.getByRole("button", { name: "Save book" }).click();
  await page.getByText("2 books", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Save book" }).click();
  await page.getByText("This edition is already in your library.", { exact: true }).waitFor();
  checks.push("Manual title-only save succeeded; a second save detected the edition without ISBN and kept count at 2.");
  failCount = true;
  await page.reload();
  await page.getByText("Book count unavailable", { exact: true }).waitFor();
  await page.getByText("Your account does not have permission", { exact: false }).waitFor();
  failCount = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByText("2 books", { exact: true }).waitFor();
  checks.push("Failed count showed unavailable rather than zero/loading forever; Try again fetched the real count of 2.");
  mode = "results";
  await search();
  await page.getByRole("heading", { name: "This Earth of Mankind" }).waitFor();
  const layout = [];
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ["shelf-light", "shelf-dark", "municipal-light", "municipal-dark", "oxford-light", "oxford-dark"]) {
      await page.evaluate((theme) => { document.documentElement.dataset.theme = theme; }, theme);
      const metrics = await page.evaluate(() => ({
        width: innerWidth, scroll: document.documentElement.scrollWidth,
        targets: [...document.querySelectorAll("button")].filter((el) => el.getBoundingClientRect().height).every((el) => el.getBoundingClientRect().height >= 48),
        cover: [document.querySelector(".catalog-cover").getBoundingClientRect().width, document.querySelector(".catalog-cover").getBoundingClientRect().height],
      }));
      assert(metrics.width >= metrics.scroll && metrics.targets, "No overflow and 48px targets");
      assert(metrics.cover[0] === 48 && metrics.cover[1] === 72, "Row cover dimensions");
      layout.push({ theme, ...metrics });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.dataset.theme = "shelf-light"; });
  await page.getByRole("tab", { name: "Search catalogue" }).focus();
  await page.keyboard.press("ArrowRight");
  assert(await page.getByRole("tab", { name: "Enter manually" }).evaluate((el) => el === document.activeElement), "Arrow key tabs");
  await page.keyboard.press("Tab");
  assert(await page.getByLabel("Title (required)").evaluate((el) => el === document.activeElement), "Keyboard reaches form");
  checks.push("All six themes at 390, 768 and 1280: no horizontal overflow, 48px button targets, 48x72 covers. ArrowRight and Tab reached manual entry.");
  return { checks, layout };
}
