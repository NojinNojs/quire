import { expect, test } from "./fixtures";
import { stack } from "./stack";

const generatedId = globalThis.crypto.randomUUID.bind(globalThis.crypto);

test("RLS isolates profiles, books and direct progress writes while RPC remains available", async ({ signedInPage: page, request }) => {
  const localStack = stack;
  if (!localStack) throw new Error("Local Supabase is required");
  const email = `isolation.${generatedId()}@quire.local`;
  const password = `E2e-${generatedId()}`;
  const created = await request.post(`${localStack.API_URL}/auth/v1/admin/users`, {
    headers: { apikey: localStack.SERVICE_ROLE_KEY, Authorization: `Bearer ${localStack.SERVICE_ROLE_KEY}` },
    data: { email, password, email_confirm: true },
  });
  expect(created.ok()).toBeTruthy();
  const userValue: unknown = await created.json();
  if (!userValue || typeof userValue !== "object" || !("id" in userValue) || typeof userValue.id !== "string") {
    throw new Error("Admin create-user response missing ID");
  }
  const userId = userValue.id;
  const createdBookIds: string[] = [];
  try {
    const accountA = await page.evaluate(() => {
      const entry = Object.entries(localStorage).find(([key]) => key.includes("auth-token"));
      if (!entry) throw new Error("Signed-in session missing");
      const value: unknown = JSON.parse(entry[1]);
      if (!value || typeof value !== "object" || !("access_token" in value) || typeof value.access_token !== "string" || !("user" in value) || !value.user || typeof value.user !== "object" || !("id" in value.user) || typeof value.user.id !== "string") {
        throw new Error("Stored session missing user or access token");
      }
      return { token: value.access_token, id: value.user.id };
    });
    const login = await request.post(`${localStack.API_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: localStack.ANON_KEY }, data: { email, password },
    });
    expect(login.ok()).toBeTruthy();
    const auth: unknown = await login.json();
    if (!auth || typeof auth !== "object" || !("access_token" in auth) || typeof auth.access_token !== "string") {
      throw new Error("Sign-in response missing access token");
    }
    const restA = { apikey: localStack.ANON_KEY, Authorization: `Bearer ${accountA.token}` };
    const restB = { apikey: localStack.ANON_KEY, Authorization: `Bearer ${auth.access_token}` };
    const createBook = async (headers: Record<string, string>, owner: string) => {
      const response = await request.post(`${localStack.API_URL}/rest/v1/books`, {
        headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
        data: { title: `Isolation ${generatedId()}`, owner },
      });
      expect(response.ok()).toBeTruthy();
      const body: unknown = await response.json();
      if (!Array.isArray(body) || !body[0] || typeof body[0] !== "object" || !("id" in body[0]) || typeof body[0].id !== "string") {
        throw new Error("Book create response missing ID");
      }
      createdBookIds.push(body[0].id);
      return body[0].id;
    };
    const bookA = await createBook(restA, accountA.id);
    const bookB = await createBook(restB, userId);
    const profile = await request.get(`${localStack.API_URL}/rest/v1/profiles?id=eq.${userId}`, { headers: restA });
    expect(await profile.json()).toEqual([]);
    const foreignBook = await request.get(`${localStack.API_URL}/rest/v1/books?id=eq.${bookB}`, { headers: restA });
    expect(await foreignBook.json()).toEqual([]);
    const bookUpdate = await request.patch(`${localStack.API_URL}/rest/v1/books?id=eq.${bookB}`, {
      headers: { ...restA, "Content-Type": "application/json", Prefer: "return=representation" },
      data: { title: "Tampered by account A" },
    });
    expect(await bookUpdate.json()).toEqual([]);
    const intactBook = await request.get(`${localStack.API_URL}/rest/v1/books?id=eq.${bookB}`, { headers: restB });
    expect(await intactBook.json()).toMatchObject([{ title: expect.stringMatching(/^Isolation /) }]);
    const profileUpdate = await request.patch(`${localStack.API_URL}/rest/v1/profiles?id=eq.${userId}`, {
      headers: { ...restA, "Content-Type": "application/json", Prefer: "return=representation" },
      data: { display_name: "Tampered" },
    });
    expect(await profileUpdate.json()).toEqual([]);
    const profileA = await request.get(`${localStack.API_URL}/rest/v1/profiles?id=eq.${accountA.id}`, { headers: restA });
    const profileARows: unknown = await profileA.json();
    expect(Array.isArray(profileARows) && profileARows.length).toBe(1);
    const profileDelete = await request.delete(`${localStack.API_URL}/rest/v1/profiles?id=eq.${accountA.id}`, { headers: { ...restA, Prefer: "return=representation" } });
    expect(profileDelete.ok()).toBeTruthy();
    expect(await profileDelete.json()).toEqual([]);
    const profileAAfterDelete = await request.get(`${localStack.API_URL}/rest/v1/profiles?id=eq.${accountA.id}`, { headers: restA });
    expect(await profileAAfterDelete.json()).toEqual(profileARows);
    const bookAAfterDelete = await request.get(`${localStack.API_URL}/rest/v1/books?id=eq.${bookA}`, { headers: restA });
    expect(await bookAAfterDelete.json()).toMatchObject([{ id: bookA, owner: accountA.id }]);
    const intactProfile = await request.get(`${localStack.API_URL}/rest/v1/profiles?id=eq.${userId}`, {
      headers: { ...restB, Prefer: "count=exact" },
    });
    expect(intactProfile.headers()["content-range"]).toMatch(/\/1$/);

    const bRpc = await request.post(`${localStack.API_URL}/rest/v1/rpc/log_pages`, {
      headers: { ...restB, "Content-Type": "application/json" },
      data: { p_book: bookB, p_pages: 3, p_day: "2026-11-03" },
    });
    expect(bRpc.ok()).toBeTruthy();
    const aCannotLogB = await request.post(`${localStack.API_URL}/rest/v1/rpc/log_pages`, {
      headers: { ...restA, "Content-Type": "application/json" },
      data: { p_book: bookB, p_pages: 2, p_day: "2026-11-03" },
    });
    expect(aCannotLogB.ok()).toBeFalsy();
    for (const method of ["POST", "PATCH", "DELETE"] as const) {
      const query = method === "POST" ? "" : `?owner=eq.${userId}&book_id=eq.${bookB}`;
      const direct = await request.fetch(`${localStack.API_URL}/rest/v1/progress_log${query}`, {
        method,
        headers: { ...restA, "Content-Type": "application/json", Prefer: "return=representation" },
        data: method === "POST" ? { owner: userId, book_id: bookB, day: "2026-11-03", pages: 1 } : { pages: 2 },
      });
      if (method === "POST") {
        expect(direct.status()).toBeGreaterThanOrEqual(400);
      } else {
        expect(direct.ok()).toBeTruthy();
        expect(await direct.json()).toEqual([]);
      }
    }
    const bLog = await request.get(`${localStack.API_URL}/rest/v1/progress_log?book_id=eq.${bookB}`, { headers: restB });
    const bRows: unknown = await bLog.json();
    if (!Array.isArray(bRows) || !bRows[0] || typeof bRows[0] !== "object" || !("pages" in bRows[0])) {
      throw new Error("User B RPC log missing");
    }
    expect(bRows[0].pages).toBe(3);
    const aRpc = await request.post(`${localStack.API_URL}/rest/v1/rpc/log_pages`, {
      headers: { ...restA, "Content-Type": "application/json" },
      data: { p_book: bookA, p_pages: 5, p_day: "2026-11-03" },
    });
    expect(aRpc.ok()).toBeTruthy();
    const aLog = await request.get(`${localStack.API_URL}/rest/v1/progress_log?book_id=eq.${bookA}`, { headers: restA });
    const aRows: unknown = await aLog.json();
    if (!Array.isArray(aRows) || !aRows[0] || typeof aRows[0] !== "object" || !("pages" in aRows[0])) {
      throw new Error("User A RPC log missing");
    }
    expect(aRows[0].pages).toBe(5);
    const streaks = await request.get(`${localStack.API_URL}/rest/v1/streaks?select=owner,current,longest`, { headers: restA });
    const streakRows: unknown = await streaks.json();
    if (!Array.isArray(streakRows)) throw new Error("User A streak read failed");
    const streak: unknown = streakRows[0];
    if (!streak || typeof streak !== "object" || !("current" in streak) || typeof streak.current !== "number") {
      throw new Error("User A streak row missing");
    }
    expect(streak.current).toBeGreaterThanOrEqual(1);
  } finally {
    for (const id of createdBookIds) {
      await request.delete(`${localStack.API_URL}/rest/v1/books?id=eq.${id}`, {
        headers: { apikey: localStack.SERVICE_ROLE_KEY, Authorization: `Bearer ${localStack.SERVICE_ROLE_KEY}` },
      });
    }
    const cleanup = await request.delete(`${localStack.API_URL}/auth/v1/admin/users/${userId}`, {
      headers: { apikey: localStack.SERVICE_ROLE_KEY, Authorization: `Bearer ${localStack.SERVICE_ROLE_KEY}` },
    });
    expect(cleanup.ok()).toBeTruthy();
  }
});
