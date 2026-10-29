import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Bookmark } from "./Bookmark";
import type { PageLogClient } from "./log";
import { createPageLogStore } from "./pageLogStore";
import { restoredDays } from "./restoredDays";
import { pageAmount, previewPages, stepPages } from "./stepper";
import { ActiveBookCard, PageStepper, StreakBlock, TodayScreen } from "./TodayScreen";

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

it("keeps Today in one column until the two-pane layout starts at 1024px", () => {
  const state = createPageLogStore({ ...entry, client: { rpc: vi.fn() }, online: () => false });
  const html = renderToStaticMarkup(
    <TodayScreen
      book={book}
      streak={streak}
      pageLog={{ ...state.getSnapshot(), ...state }}
      onCatalogue={() => {}}
    />,
  );
  expect(html).toContain('class="reading-two-pane"');
  const css = readFileSync(new URL("../../styles/reading.css", import.meta.url), "utf8");
  const desktop = css.slice(css.indexOf("@media (min-width: 1024px)"));
  expect(desktop).toMatch(/\.reading-two-pane\s*\{[^}]*display: grid;[^}]*grid-template-columns:/);
  expect(desktop).toContain("column-gap: var(--space-32)");
  expect(css.slice(0, css.indexOf("@media (min-width: 1024px)"))).not.toContain(
    ".reading-two-pane",
  );
});
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

describe("bookmark", () => {
  it.each([
    [0, 400, 0],
    [100, 400, 25],
    [214, 550, 39],
    [500, 400, 100],
    [-10, 400, 0],
  ])("fills from page %s of %s at %s percent", (current, total, expected) => {
    expect(renderToStaticMarkup(<Bookmark current={current} total={total} />)).toContain(
      `height:${expected}%`,
    );
  });
  it.each([null, 0])("does not invent a percentage for total %s", (total) => {
    const html = renderToStaticMarkup(<Bookmark current={214} total={total} />);
    expect(html).not.toContain("bookmark-fill");
    expect(html).toContain("Page 214, total unknown");
  });
});

it("prints past, today, missed and restored stamps beside the streak count", () => {
  const html = renderToStaticMarkup(
    <StreakBlock
      today="2026-10-29"
      streak={{
        current: 3,
        longest: 8,
        days: [
          { day: "2026-10-26", read: true },
          { day: "2026-10-27", read: false },
          { day: "2026-10-28", read: false, restored: true },
          { day: "2026-10-29", read: true },
        ],
      }}
    />,
  );
  expect(html).toContain('class="reading-day reading-day-filled" aria-label="2026-10-26: read"');
  expect(html).toContain('class="reading-day" aria-label="2026-10-27: no pages logged"');
  expect(html).toContain(
    'class="reading-day reading-day-restored" aria-label="2026-10-28: restored"',
  );
  expect(html).toContain(
    'class="reading-day reading-day-filled reading-day-today" aria-label="2026-10-29: read, today"',
  );
  expect(html).toContain("3 days streak");
});

it("reconstructs restored dates with one restoration per month, including after reload", () => {
  const logs = ["2026-09-27", "2026-09-29", "2026-10-01", "2026-10-03", "2026-10-04"];
  expect([...restoredDays(logs)]).toEqual(["2026-09-28", "2026-09-30"]);
  expect([...restoredDays([...logs])]).toEqual(["2026-09-28", "2026-09-30"]);
  expect([...restoredDays(["2026-10-27", "2026-10-27", "2026-10-29"])]).toEqual(["2026-10-28"]);
});

import { readFileSync } from "node:fs";
