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
    expect(screen.getByRole("heading", { name: "Today" })).toBeTruthy();
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
    fireEvent.change(screen.getByLabelText("Notes"), {
      target: { value: "A note worth keeping." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save notes" }));
    fireEvent.click(screen.getByRole("radio", { name: "4 out of 5" }));
    fireEvent.click(screen.getByRole("button", { name: "Read this book" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));
    fireEvent.click(screen.getByRole("button", { name: "Log 1 page" }));
    expect(screen.getAllByText("49 / 550").length).toBeGreaterThan(0);
  });

  it("commits the previous book's pending log when choosing another active book", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Log 1 page" }));
    navigate("#/book/demo-meditations");
    fireEvent.click(screen.getByRole("button", { name: "Read this book" }));
    navigate("#/today");
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    expect(currentPages(loadDemoState(window.localStorage), "demo-bumi")).toBe(49);
    expect(screen.getByRole("button", { name: "Log 1 page" }).hasAttribute("disabled")).toBe(false);
    navigate("#/book/demo-meditations");
    fireEvent.click(screen.getByRole("button", { name: "Mark as finished" }));
    navigate("#/today");
    expect(screen.getByRole("button", { name: "Browse catalogue" })).toBeTruthy();
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
