import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PageLogClient } from "./log";
import { createPageLogStore } from "./pageLogStore";
import { pageAmount, previewPages, stepPages } from "./stepper";
import { ActiveBookCard, PageStepper, TodayScreen } from "./TodayScreen";

const result = { data: [{ streak_current: 3, streak_longest: 8, restored: false }], error: null };
const entry = { bookId: "book-1", current: 214, pagesToday: 4, day: "2026-10-29" };
const book = {
  id: "book-1",
  title: "Bumi Manusia",
  author: "Pramoedya Ananta Toer",
  editionLine: "Penguin · 1996 · English",
  coverUrl: null,
  total: 550,
};
const streak = { current: 3, longest: 8, days: [] };
afterEach(() => {
  vi.useRealTimers();
});

describe("page arithmetic", () => {
  it("applies all four increments and clamps at zero and the edition end", () => {
    expect([-10, -1, 1, 10].map((step) => stepPages(20, step, 214, 550))).toEqual([10, 19, 21, 30]);
    expect(stepPages(1, -10, 214, null)).toBe(0);
    expect(stepPages(2, 10, 548, 550)).toBe(2);
    expect(pageAmount(Number.NaN, 214, null)).toBe(0);
    expect(pageAmount(3.5, 214, null)).toBe(3);
    expect(stepPages(2, 10, 214, null)).toBe(12);
    expect(pageAmount(1, 550, 550)).toBe(0);
  });
  it("previews the exact endpoints", () => {
    expect(previewPages(214, 10)).toBe("214 -> 224");
    expect(previewPages(214, 0)).toBe("214 -> 214");
    expect(
      renderToStaticMarkup(
        <PageStepper current={214} total={550} disabled={false} onLog={() => {}} />,
      ),
    ).toContain("214 -&gt; 215");
  });
});

describe("optimistic page log", () => {
  it("undo restores progress and pages today without sending an RPC", async () => {
    vi.useFakeTimers();
    const rpc = vi.fn().mockResolvedValue(result);
    const store = createPageLogStore({ ...entry, client: { rpc }, online: () => true });
    store.log(10);
    expect(store.getSnapshot()).toMatchObject({ current: 224, pagesToday: 14, status: "undo" });
    store.undo();
    await vi.advanceTimersByTimeAsync(6000);
    expect(store.getSnapshot()).toMatchObject({ current: 214, pagesToday: 4, pending: null });
    expect(rpc).not.toHaveBeenCalled();
  });
  it("pauses the undo timer on unmount and resumes its remaining time", async () => {
    vi.useFakeTimers();
    const rpc = vi.fn().mockResolvedValue(result);
    const store = createPageLogStore({ ...entry, client: { rpc }, online: () => true });
    store.log(10);
    await vi.advanceTimersByTimeAsync(2000);
    store.pause();
    await vi.advanceTimersByTimeAsync(4000);
    expect(rpc).not.toHaveBeenCalled();
    store.resume();
    await vi.advanceTimersByTimeAsync(1);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().status).toBe("saved");
  });
  it("holds an offline log across failures until retry succeeds exactly once", async () => {
    vi.useFakeTimers();
    let online = false;
    const rpc = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValue(result);
    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    };
    const options = { ...entry, client: { rpc }, online: () => online, storage };
    const store = createPageLogStore(options);
    store.log(10);
    store.log(10);
    await vi.advanceTimersByTimeAsync(5000);
    expect(rpc).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toMatchObject({ status: "queued", current: 224 });
    const restored = createPageLogStore(options);
    expect(restored.getSnapshot()).toMatchObject({ status: "queued", current: 224 });
    online = true;
    await restored.retry();
    expect(restored.getSnapshot().pending?.pages).toBe(10);
    expect(memory.size).toBe(1);
    await restored.retry();
    expect(restored.getSnapshot()).toMatchObject({ current: 224, status: "saved", pending: null });
    expect(memory.size).toBe(0);
    expect(rpc).toHaveBeenLastCalledWith("log_pages", {
      p_book: "book-1",
      p_pages: 10,
      p_day: "2026-10-29",
    });
    await restored.retry();
    expect(rpc).toHaveBeenCalledTimes(2);
  });
  it("guards concurrent sends and keeps the optimistic total after confirmation", async () => {
    vi.useFakeTimers();
    let complete: (value: typeof result) => void = () => {};
    const rpc = vi.fn(
      () =>
        new Promise<typeof result>((resolve) => {
          complete = resolve;
        }),
    );
    const client: PageLogClient = { rpc };
    const store = createPageLogStore({ ...entry, client, online: () => true });
    store.log(10);
    await store.retry();
    expect(rpc).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5000);
    await store.retry();
    store.undo();
    expect(rpc).toHaveBeenCalledTimes(1);
    complete(result);
    await Promise.resolve();
    await Promise.resolve();
    expect(store.getSnapshot()).toMatchObject({ status: "saved", current: 224, pagesToday: 14 });
  });
});

it("never invents a total and keeps the empty state to one sentence and one action", () => {
  const html = renderToStaticMarkup(
    <ActiveBookCard book={{ ...book, total: null }} current={214} pagesToday={4} />,
  );
  expect(html).toContain(">214</p>");
  expect(html).not.toContain(" / ");
  const state = createPageLogStore({ ...entry, client: { rpc: vi.fn() }, online: () => false });
  const empty = renderToStaticMarkup(
    <TodayScreen
      book={null}
      streak={streak}
      pageLog={{ ...state.getSnapshot(), ...state }}
      onCatalogue={() => {}}
    />,
  );
  expect(empty.match(/<button/g)).toHaveLength(1);
  expect(empty).toContain("Browse catalogue");
});
