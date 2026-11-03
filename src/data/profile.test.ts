import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { loadProfile, saveProfile } from "./profile";

function fixture(data: unknown, error: unknown = null) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data, error })),
    single: vi.fn(async () => ({ data, error })),
  };
  const client = { from: vi.fn(() => query) } as unknown as SupabaseClient;
  return { client, query };
}

describe("reader profile", () => {
  it("distinguishes absent legacy profile from load failure", async () => {
    expect(await loadProfile(fixture(null).client, "reader")).toBeNull();
    await expect(
      loadProfile(fixture(null, { message: "offline" }).client, "reader"),
    ).rejects.toThrow("Could not load");
  });
  it.each([0, 501, 1.5, Number.NaN])(
    "rejects invalid goal %s before writes",
    async (annual_goal) => {
      const { client } = fixture(null);
      await expect(
        saveProfile(client, "reader", { display_name: "Reader", annual_goal }),
      ).rejects.toThrow("whole number");
      expect(client.from).not.toHaveBeenCalled();
    },
  );
  it("creates missing profile, trims name and preserves blank goal", async () => {
    const expected = { id: "reader", display_name: "Reader", annual_goal: null };
    const { client, query } = fixture(expected);
    expect(
      await saveProfile(client, "reader", { display_name: " Reader ", annual_goal: null }),
    ).toEqual(expected);
    expect(query.upsert).toHaveBeenCalledWith(expected, { onConflict: "id" });
  });
  it("rejects missing save row instead of claiming success", async () => {
    await expect(
      saveProfile(fixture(null).client, "reader", { display_name: null, annual_goal: 12 }),
    ).rejects.toThrow("Could not save");
  });
});
