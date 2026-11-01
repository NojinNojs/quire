import "../features/shelf/test-dom";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useSession } from "./useSession";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("./supabase", () => ({ supabase: { auth } }));

beforeEach(() => {
  window.history.replaceState(null, "", "/?source=reader#/shelf");
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  auth.signOut.mockResolvedValue({ error: null });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it("clears the route after successful sign-out while keeping query parameters", async () => {
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.ready).toBe(true));
  const onHashChange = vi.fn();
  window.addEventListener("hashchange", onHashChange);
  await act(async () => result.current.signOut());
  expect(window.location.search).toBe("?source=reader");
  expect(window.location.hash).toBe("");
  expect(onHashChange).toHaveBeenCalledOnce();
  window.removeEventListener("hashchange", onHashChange);
});

it("retains the route when sign-out fails", async () => {
  auth.signOut.mockResolvedValue({ error: new Error("failed") });
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.ready).toBe(true));
  await act(async () => result.current.signOut());
  expect(window.location.hash).toBe("#/shelf");
  expect(result.current.error).toContain("Could not sign out");
});
