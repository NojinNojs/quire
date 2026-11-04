import { describe, expect, it } from "vitest";
import { demoHistory } from "./history";
import { createDemoState, loadDemoState } from "./state";

describe("demo history", () => {
  it("combines daily book totals only after pending expires and preserves undo", () => {
    const state = createDemoState();
    state.logs = [
      { id: "one", bookId: "demo-bumi", day: "2024-02-29", pages: 10 },
      { id: "two", bookId: "demo-bumi", day: "2024-02-29", pages: 20 },
    ];
    state.pending = { id: "two", until: Date.now() + 5000 };
    expect(demoHistory(state)).toEqual([
      { id: "one", book_id: "demo-bumi", day: "2024-02-29", pages: 10 },
    ]);
    state.pending = null;
    expect(demoHistory(state)[0]?.pages).toBe(30);
    state.logs = state.logs.filter((log) => log.id !== "two");
    expect(demoHistory(state)[0]?.pages).toBe(10);
  });

  it("loads v1 without a profile without erasing books or activity", () => {
    const state = createDemoState();
    const first = state.books[0];
    if (!first) throw new Error("Sample book missing");
    first.notes = "Keep this";
    const { profile: _profile, ...legacy } = state;
    const restored = loadDemoState({ getItem: () => JSON.stringify(legacy) });
    expect(restored.profile).toEqual({ display_name: null, annual_goal: null });
    expect(restored.books[0]?.notes).toBe("Keep this");
    expect(restored.logs).toEqual(state.logs);
  });

  it("falls back per invalid profile field, not per library", () => {
    const state = createDemoState();
    const restored = loadDemoState({
      getItem: () =>
        JSON.stringify({ ...state, profile: { display_name: "Reader", annual_goal: 501 } }),
    });
    expect(restored.profile).toEqual({ display_name: "Reader", annual_goal: null });
    expect(restored.logs).toEqual(state.logs);
  });
});
