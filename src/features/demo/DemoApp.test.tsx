import "../shelf/test-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App";
import { createDemoState, currentPages, demoStreak, loadDemoState } from "./state";

vi.mock("../../lib/supabase", () => ({ supabase: null }));
vi.mock("../../lib/useSession", () => ({
  useSession: () => {
    throw new Error("Demo must not open an account session");
  },
}));

function navigate(hash: string) {
  act(() => {
    window.history.replaceState(null, "", `?demo=1${hash}`);
    window.dispatchEvent(new window.HashChangeEvent("hashchange"));
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-29T12:00:00"));
  window.localStorage.clear();
  window.localStorage.setItem("quire:tour:v1:demo", "dismissed");
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState(null, "", "?demo=1#/today");
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("interactive demo", () => {
  it("logs, undoes, survives navigation and reload, and resets only demo data", () => {
    window.localStorage.setItem("account-data", "keep");
    const view = render(<App />);
    fireEvent.change(screen.getByLabelText("Pages read"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Log 10 pages" }));
    expect(currentPages(loadDemoState(window.localStorage), "demo-bumi")).toBe(58);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(currentPages(loadDemoState(window.localStorage), "demo-bumi")).toBe(48);
    fireEvent.click(screen.getByRole("button", { name: "Log 10 pages" }));
    navigate("#/shelf");
    act(() => vi.advanceTimersByTime(5000));
    view.unmount();
    render(<App />);
    navigate("#/today");
    expect(screen.getAllByText("58 / 550").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "4 days streak" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep changes" }));
    expect(currentPages(loadDemoState(window.localStorage), "demo-bumi")).toBe(58);
    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset sample library" }));
    expect(currentPages(loadDemoState(window.localStorage), "demo-bumi")).toBe(48);
    expect(window.localStorage.getItem("account-data")).toBe("keep");
  });

  it("adds a title without metadata, saves notes and rating, and selects a single active book", async () => {
    render(<App />);
    navigate("#/search");
    fireEvent.click(screen.getByRole("tab", { name: "Enter manually" }));
    fireEvent.change(screen.getByLabelText("Title (required)"), {
      target: { value: "My notebook" },
    });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save book" })));
    const added = loadDemoState(window.localStorage).books.find(
      (book) => book.title === "My notebook",
    );
    expect(added?.pages).toBeNull();
    navigate(`#/book/${added?.id}`);
    fireEvent.change(screen.getByLabelText("Private notes and review"), {
      target: { value: "A note worth keeping." },
    });
    fireEvent.click(screen.getByRole("radio", { name: "4 out of 5" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save review" })));
    await act(async () =>
      fireEvent.change(screen.getByLabelText("Reading status"), { target: { value: "reading" } }),
    );
    expect(screen.getByRole("alert").textContent).toContain("Another book is already being read");
    expect(
      loadDemoState(window.localStorage).books.find((book) => book.status === "reading")?.id,
    ).toBe("demo-bumi");
    navigate("#/book/demo-bumi");
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Mark as finished" })),
    );
    navigate(`#/book/${added?.id}`);
    await act(async () =>
      fireEvent.change(screen.getByLabelText("Reading status"), { target: { value: "reading" } }),
    );
    const state = loadDemoState(window.localStorage);
    expect(state.books.filter((book) => book.status === "reading").map((book) => book.id)).toEqual([
      added?.id,
    ]);
    expect(state.books.find((book) => book.id === added?.id)).toMatchObject({
      rating: 4,
      notes: "A note worth keeping.",
    });
    navigate("#/today");
    fireEvent.click(screen.getByRole("button", { name: "Log 1 page" }));
    expect(currentPages(loadDemoState(window.localStorage), added?.id ?? "")).toBe(1);
  });

  it("keeps working and explains when browser storage is blocked", () => {
    vi.spyOn(window.Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(window.Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<App />);
    expect(screen.getByText(/Changes last for this visit only/)).toBeTruthy();
    navigate("#/today");
    fireEvent.click(screen.getByRole("button", { name: "Log 1 page" }));
    expect(screen.getAllByText("49 / 550").length).toBeGreaterThan(0);
  });
  it("keeps review draft and rejects success when device storage fails", async () => {
    render(<App />);
    navigate("#/book/demo-bumi");
    vi.spyOn(window.Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    fireEvent.change(screen.getByLabelText("Private notes and review"), {
      target: { value: "Keep draft" },
    });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save review" })));
    expect(screen.getByRole("alert").textContent).toContain("Could not save on this device");
    expect((screen.getByLabelText("Private notes and review") as HTMLTextAreaElement).value).toBe(
      "Keep draft",
    );
    expect(
      loadDemoState(window.localStorage).books.find((book) => book.id === "demo-bumi")?.notes,
    ).toBeNull();
  });

  it("keeps the pending undo window and blocks finish until persistence", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Log 1 page" }));
    navigate("#/book/demo-bumi");
    expect(screen.getByRole("button", { name: "Mark as finished" }).hasAttribute("disabled")).toBe(
      true,
    );
    expect(loadDemoState(window.localStorage).pending).not.toBeNull();
    act(() => vi.advanceTimersByTime(5000));
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Mark as finished" })),
    );
    const saved = loadDemoState(window.localStorage);
    expect(saved.books.find((book) => book.id === "demo-bumi")).toMatchObject({
      status: "finished",
      finished_at: "2026-10-29",
    });
    expect(currentPages(saved, "demo-bumi")).toBe(49);
  });
});

describe("demo persistence", () => {
  it("recovers malformed data and rejects remote covers in persisted demo books", () => {
    for (const raw of ["{", "null", JSON.stringify({ version: 1, books: [{}], logs: [] })]) {
      expect(loadDemoState({ getItem: () => raw }).books).toHaveLength(6);
    }
    const state = createDemoState();
    const featured = state.books.find((entry) => entry.id === "demo-bumi");
    if (featured) featured.cover_url = "https://example.invalid/remote.jpg";
    const restored = loadDemoState({ getItem: () => JSON.stringify(state) });
    expect(restored.books.find((entry) => entry.id === "demo-bumi")?.cover_url).toBe(
      "/covers/bumi.webp",
    );
  });

  it("upgrades covers in a saved demo without resetting notes or reading progress", () => {
    const state = createDemoState();
    const featured = state.books.find((entry) => entry.id === "demo-bumi");
    if (featured) {
      featured.cover_url = null;
      featured.notes = "Keep my notes";
    }
    state.logs.push({ id: "my-log", bookId: "demo-bumi", pages: 12, day: "2026-10-29" });
    const restored = loadDemoState({ getItem: () => JSON.stringify(state) });
    expect(restored.books.find((entry) => entry.id === "demo-bumi")).toMatchObject({
      cover_url: "/covers/bumi.webp",
      notes: "Keep my notes",
    });
    expect(currentPages(restored, "demo-bumi")).toBe(60);
  });

  it("expires old undo windows and reports an old streak as broken", () => {
    const state = createDemoState(new Date("2026-10-01T12:00:00"));
    state.pending = { id: "sample-1", until: Date.now() - 1 };
    const restored = loadDemoState({ getItem: () => JSON.stringify(state) });
    expect(restored.pending).toBeNull();
    expect(demoStreak(restored, "2026-10-29")).toMatchObject({ current: 0, longest: 3 });
  });
});
