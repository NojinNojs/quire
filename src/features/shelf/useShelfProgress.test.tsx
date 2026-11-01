// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useShelfProgress, useShelfProgressState } from "./useShelfProgress";

const { range } = vi.hoisted(() => ({ range: vi.fn() }));
vi.mock("../../lib/supabase", () => {
  const query = {
    select: () => query,
    in: () => query,
    order: () => query,
    range,
  };
  return { supabase: { from: () => query } };
});

afterEach(() => {
  cleanup();
  range.mockReset();
});

describe("useShelfProgressState", () => {
  it("exposes failure and retries without presenting partial pages as zero", async () => {
    range.mockResolvedValueOnce({ data: null, error: new Error("offline") });
    range.mockResolvedValueOnce({ data: [{ book_id: "book", pages: 12 }], error: null });
    const { result } = renderHook(() => useShelfProgressState(["book"]));
    await waitFor(() => expect(result.current.error?.message).toBe("offline"));
    expect(result.current.pages).toEqual({});
    act(() => result.current.retry());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.pages).toEqual({ book: 12 }));
    expect(result.current.error).toBeNull();
  });

  it("keeps the existing map-only interface", async () => {
    range.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useShelfProgress(["book"]));
    await waitFor(() => expect(result.current).toEqual({ book: 0 }));
  });
});
