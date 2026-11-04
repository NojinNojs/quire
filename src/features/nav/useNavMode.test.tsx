// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { navModeKey, persistNavMode, readNavMode, useNavMode } from "./useNavMode";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("rail mode preference", () => {
  it("opens expanded without a stored preference", () => {
    expect(readNavMode()).toBe("expanded");
  });

  it("restores compact and persists the toggle", () => {
    window.localStorage.setItem(navModeKey, "compact");
    const { result } = renderHook(() => useNavMode());
    expect(result.current.mode).toBe("compact");
    act(() => result.current.toggle());
    expect(result.current.mode).toBe("expanded");
    expect(window.localStorage.getItem(navModeKey)).toBe("expanded");
  });

  it("stays usable when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    const { result } = renderHook(() => useNavMode());
    expect(result.current.mode).toBe("expanded");
    expect(() => persistNavMode("compact")).not.toThrow();
    act(() => result.current.toggle());
    expect(result.current.mode).toBe("compact");
  });
});
