// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRailMotion } from "./useRailMotion";

describe("rail motion window", () => {
  it("opens on a toggle and closes when the layout transition lands", () => {
    const toggleMode = vi.fn();
    const { result } = renderHook(() => useRailMotion(toggleMode));
    expect(result.current.animating).toBe(false);
    act(() => result.current.toggle());
    expect(result.current.animating).toBe(true);
    expect(toggleMode).toHaveBeenCalledTimes(1);
    act(() => result.current.stop());
    expect(result.current.animating).toBe(false);
  });

  it("keeps the window open through a rapid second toggle instead of cutting it", () => {
    const toggleMode = vi.fn();
    const { result } = renderHook(() => useRailMotion(toggleMode));
    act(() => {
      result.current.toggle();
      result.current.toggle();
    });
    expect(toggleMode).toHaveBeenCalledTimes(2);
    expect(result.current.animating).toBe(true);
  });
});
