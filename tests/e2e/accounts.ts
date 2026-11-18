import type { APIRequestContext } from "@playwright/test";
import { stack } from "./stack";

export class Accounts {
  private readonly ids = new Set<string>();

  constructor(private readonly request: APIRequestContext) {}

  track(body: unknown): string | undefined {
    if (!body || typeof body !== "object") return;
    const user = "user" in body ? body.user : body;
    if (user && typeof user === "object" && "id" in user && typeof user.id === "string") {
      this.ids.add(user.id);
      return user.id;
    }
  }

  async cleanup() {
    if (!this.ids.size) return;
    if (!stack) throw new Error("Local Supabase is required");
    const endpoint = stack;
    const results = await Promise.allSettled([...this.ids].map(async (id) => {
      const response = await this.request.delete(`${endpoint.API_URL}/auth/v1/admin/users/${id}`, {
        headers: { apikey: endpoint.SERVICE_ROLE_KEY, Authorization: `Bearer ${endpoint.SERVICE_ROLE_KEY}` },
      });
      if (!response.ok()) throw new Error(`Failed to remove generated account ${id}: ${response.status()}`);
      this.ids.delete(id);
    }));
    const errors = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    if (errors.length) throw new AggregateError(errors.map((result) => result.reason), "Account cleanup failed");
  }
}
