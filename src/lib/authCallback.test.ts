// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
  vi.resetModules();
});

describe("auth callback snapshot", () => {
  it("imports safely without a browser", async () => {
    vi.stubGlobal("window", undefined);
    // Re-evaluate module with browser globals absent; static imports run before the stub.
    const { authCallback } = await import("./authCallback");
    expect(authCallback).toEqual({ recovery: false, error: null });
    vi.unstubAllGlobals();
  });

  it("preserves the recovery marker without storing tokens", async () => {
    window.history.replaceState(null, "", "/#access_token=secret&type=recovery");
    // Each import evaluates the snapshot against the URL set above.
    const { authCallback, clearAuthCallback } = await import("./authCallback");
    expect(authCallback).toEqual({ recovery: true, error: null });
    expect(window.location.search).toBe("?auth=recovery");
    expect(window.location.hash).toContain("access_token=secret");
    clearAuthCallback();
    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("#/today");
  });

  it("keeps recovery after a reload and captures expired link errors", async () => {
    window.history.replaceState(
      null,
      "",
      "/?auth=recovery#error=access_denied&error_description=Link+expired",
    );
    const { authCallback } = await import("./authCallback");
    expect(authCallback).toEqual({ recovery: true, error: "Link expired" });
  });
});
