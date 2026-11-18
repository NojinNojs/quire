import { randomUUID } from "node:crypto";
import { Accounts } from "./accounts";
import { expect, test } from "./fixtures";
import { stack } from "./stack";

test("a failed sign-in during setup removes the created account", async ({ request }) => {
  if (!stack) throw new Error("Local Supabase is required");
  const endpoint = stack;
  const accounts = new Accounts(request);
  const headers = { apikey: endpoint.SERVICE_ROLE_KEY, Authorization: `Bearer ${endpoint.SERVICE_ROLE_KEY}` };
  const email = `cleanup.${randomUUID()}@quire.local`;
  const password = `E2e-${randomUUID()}`;
  let id: string | undefined;
  try {
    await expect(async () => {
      try {
        const created = await request.post(`${endpoint.API_URL}/auth/v1/admin/users`, {
          headers, data: { email, password, email_confirm: true },
        });
        id = accounts.track(await created.json());
        expect(created.ok()).toBeTruthy();
        expect(id).toBeTruthy();
        const login = await request.post(`${endpoint.API_URL}/auth/v1/token?grant_type=password`, {
          headers: { apikey: endpoint.ANON_KEY }, data: { email, password: `${password}-wrong` },
        });
        expect(login.ok()).toBeFalsy();
        throw new Error("intentional setup failure");
      } finally {
        await accounts.cleanup();
      }
    }).rejects.toThrow("intentional setup failure");
    expect(id).toBeTruthy();
    const lookup = await request.get(`${endpoint.API_URL}/auth/v1/admin/users/${id}`, { headers });
    expect(lookup.status()).toBe(404);
  } finally {
    await accounts.cleanup();
  }
});
