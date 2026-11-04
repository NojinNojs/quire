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

it("opens the recovery flow on PASSWORD_RECOVERY without waiting for a remount", async () => {
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.ready).toBe(true));
  const listener = auth.onAuthStateChange.mock.calls[0]?.[0];
  expect(result.current.recovery).toBe(false);
  act(() => listener("PASSWORD_RECOVERY", { user: { id: "reader" } }));
  expect(result.current.recovery).toBe(true);
  expect(window.location.search).toBe("?source=reader&auth=recovery");
  expect(window.location.hash).toBe("#/shelf");
  act(() => result.current.completeRecovery());
  expect(result.current.recovery).toBe(false);
  expect(window.location.search).toBe("?source=reader");
  expect(window.location.hash).toBe("#/today");
});

it("closes the recovery flow and its marker on sign-out", async () => {
  const { result } = renderHook(() => useSession());
  await waitFor(() => expect(result.current.ready).toBe(true));
  const listener = auth.onAuthStateChange.mock.calls[0]?.[0];
  act(() => listener("PASSWORD_RECOVERY", null));
  const onHashChange = vi.fn();
  window.addEventListener("hashchange", onHashChange);
  await act(async () => result.current.signOut());
  expect(result.current.recovery).toBe(false);
  expect(window.location.search).toBe("?source=reader");
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
