import "../shelf/test-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "../../App";
import { loadDemoState } from "./state";

vi.mock("../../lib/supabase", () => ({ supabase: null }));
vi.mock("../../lib/useSession", () => ({
  useSession: () => {
    throw new Error("Demo must not open an account session");
  },
}));

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("quire:tour:v1:demo", "dismissed");
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("retains the manual draft and retries an add when storage is blocked", async () => {
  window.history.replaceState(null, "", "?demo=1#/search");
  render(<App />);
  fireEvent.click(screen.getByRole("tab", { name: "Enter manually" }));
  fireEvent.change(screen.getByLabelText("Title (required)"), { target: { value: "My notebook" } });
  const storage = vi.spyOn(window.Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save book" })));
  expect(screen.getAllByText(/Could not save on this device/).length).toBeGreaterThan(0);
  expect(screen.queryByText("My notebook added to your shelf.")).toBeNull();
  expect((screen.getByLabelText("Title (required)") as HTMLInputElement).value).toBe("My notebook");
  expect(
    loadDemoState(window.localStorage).books.some((book) => book.title === "My notebook"),
  ).toBe(false);
  storage.mockRestore();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save book" })));
  expect(screen.getByText("My notebook added to your shelf.")).toBeTruthy();
  expect(
    loadDemoState(window.localStorage).books.some((book) => book.title === "My notebook"),
  ).toBe(true);
});

it("keeps a book and its logs when deletion fails, then deletes on retry", async () => {
  window.history.replaceState(null, "", "?demo=1#/book/demo-bumi");
  render(<App />);
  const before = loadDemoState(window.localStorage);
  const storage = vi.spyOn(window.Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  fireEvent.click(screen.getByRole("button", { name: "Delete book" }));
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Confirm delete" })));
  expect((await screen.findAllByText(/Could not save on this device/)).length).toBeGreaterThan(0);
  expect(window.location.hash).toBe("#/book/demo-bumi");
  expect(loadDemoState(window.localStorage)).toEqual(before);
  storage.mockRestore();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Confirm delete" })));
  const after = loadDemoState(window.localStorage);
  expect(window.location.hash).toBe("#/shelf");
  expect(after.books.some((book) => book.id === "demo-bumi")).toBe(false);
  expect(after.logs.some((log) => log.bookId === "demo-bumi")).toBe(false);
});
it("keeps review draft and rejects success when device storage fails", async () => {
  window.history.replaceState(null, "", "?demo=1#/book/demo-bumi");
  render(<App />);
  vi.spyOn(window.Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  fireEvent.change(screen.getByLabelText("Private notes and review"), {
    target: { value: "Keep draft" },
  });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save review" })));
  expect((await screen.findAllByText(/Could not save on this device/)).length).toBeGreaterThan(0);
  expect((screen.getByLabelText("Private notes and review") as HTMLTextAreaElement).value).toBe(
    "Keep draft",
  );
  expect(
    loadDemoState(window.localStorage).books.find((book) => book.id === "demo-bumi")?.notes,
  ).toBeNull();
});
