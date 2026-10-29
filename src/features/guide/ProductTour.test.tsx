// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { openProductTour, ProductTour } from "./ProductTour";

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "?demo=1#/today");
  vi.spyOn(window, "scrollBy").mockImplementation(() => {});
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(0), 0),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function fixture() {
  return render(
    <>
      <button className="shell-guide" type="button" onClick={openProductTour}>
        Guide
      </button>
      <main>
        <div className="reading-book" />
        <div className="reading-stepper" />
        <div className="shelf-filters" />
        <div className="entry-tabs" />
        <div className="settings-themes" />
      </main>
      <ProductTour scope="demo" />
    </>,
  );
}

it("visits all five real routes, supports Back, remembers completion, and can replay", async () => {
  window.localStorage.setItem("quire:demo:v1", "keep my library");
  const view = fixture();
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Back" }).hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading").textContent).toBe("Make every page count.");
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("heading").textContent).toBe("One book. A place to begin.");
  for (const route of ["#/today", "#/shelf", "#/search", "#/settings"]) {
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(window.location.hash).toBe(route));
  }
  fireEvent.click(screen.getByRole("button", { name: "Finish tour" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(window.localStorage.getItem("quire:tour:v1:demo")).toBe("completed");
  expect(window.localStorage.getItem("quire:demo:v1")).toBe("keep my library");
  view.unmount();
  fixture();
  expect(screen.queryByRole("button", { name: "Start tour" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Guide" }));
  expect(screen.getByRole("heading").textContent).toBe("One book. A place to begin.");
});

it("opens a tour link even for a returning reader and Escape restores focus to Guide", () => {
  window.localStorage.setItem("quire:tour:v1:demo", "completed");
  window.history.replaceState(null, "", "?demo=1&tour=1#/today");
  fixture();
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(window.location.search).toBe("?demo=1");
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Guide" }));
});

it("can dismiss or skip the tour when browser storage is unavailable", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  fixture();
  fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));
  expect(screen.queryByRole("button", { name: "Start tour" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Guide" }));
  fireEvent.click(screen.getByRole("button", { name: "Skip tour" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
