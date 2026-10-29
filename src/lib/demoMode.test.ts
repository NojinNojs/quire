import "../features/shelf/test-dom";
import { afterEach, expect, it, vi } from "vitest";
import { isDemoMode } from "./demoMode";

const createClient = vi.hoisted(() => vi.fn(() => ({ auth: {} })));
vi.mock("@supabase/supabase-js", () => ({ createClient }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  createClient.mockClear();
  window.history.replaceState(null, "", "/");
});

it("does not create a Supabase client in demo mode, even with configured credentials", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://demo-test.invalid");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-key");
  window.history.replaceState(null, "", "?demo=1#/shelf");
  expect(isDemoMode()).toBe(true);
  const { supabase } = await import("./supabase");
  expect(supabase).toBeNull();
  expect(createClient).not.toHaveBeenCalled();
});

it("keeps the account client available outside demo mode", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://demo-test.invalid");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-key");
  window.history.replaceState(null, "", "?demo=0");
  expect(isDemoMode()).toBe(false);
  const { supabase } = await import("./supabase");
  expect(supabase).not.toBeNull();
  expect(createClient).toHaveBeenCalledOnce();
});
