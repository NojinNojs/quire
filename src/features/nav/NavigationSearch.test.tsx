import "../shelf/test-dom";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NavigationSearch } from "./NavigationSearch";

afterEach(cleanup);

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

function Consumer({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open search
      </button>
      <div id="main-content">
        <main>Route content</main>
      </div>
      <NavigationSearch open={open} onOpenChange={setOpen} onNavigate={onNavigate} />
    </>
  );
}

function shortcut(target: Element | Document = document.body) {
  fireEvent.keyDown(target, { key: "k", ctrlKey: true });
}

async function openPalette() {
  shortcut();
  return screen.findByRole("dialog", { name: "Find a page" });
}

describe("navigation search", () => {
  it("opens and closes with Ctrl+K, and ignores a plain K", async () => {
    render(<Consumer />);
    fireEvent.keyDown(document.body, { key: "k" });
    expect(screen.queryByRole("dialog")).toBeNull();

    await openPalette();
    const combobox = screen.getByRole("combobox");
    await waitFor(() => expect(document.activeElement).toBe(combobox));

    shortcut(combobox);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("filters pages, keeps the demo query and focuses the route after Enter", async () => {
    window.history.replaceState(null, "", "/?demo=1#/today");
    const onNavigate = vi.fn();
    render(<Consumer onNavigate={onNavigate} />);
    await openPalette();
    const combobox = screen.getByRole("combobox");

    fireEvent.change(combobox, { target: { value: "jour" } });
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option").textContent).toContain("Journal");

    fireEvent.keyDown(combobox, { key: "Enter" });
    await waitFor(() => expect(onNavigate).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(window.location.hash).toBe("#/journal"));
    expect(window.location.search).toBe("?demo=1");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector("#main-content main")),
    );
  });

  it("moves the highlight with Arrow, Home and End before committing", async () => {
    render(<Consumer />);
    await openPalette();
    const combobox = screen.getByRole("combobox");
    const selected = () => {
      const option = screen
        .getAllByRole("option")
        .find((item) => item.getAttribute("aria-selected") === "true");
      return option?.textContent ?? "";
    };

    expect(selected()).toContain("Today");
    fireEvent.keyDown(combobox, { key: "ArrowDown" });
    expect(selected()).toContain("Collection");
    fireEvent.keyDown(combobox, { key: "End" });
    expect(selected()).toContain("Settings");
    fireEvent.keyDown(combobox, { key: "Home" });
    expect(selected()).toContain("Today");
    fireEvent.keyDown(combobox, { key: "ArrowUp" });
    expect(selected()).toContain("Settings");

    fireEvent.keyDown(combobox, { key: "Enter" });
    await waitFor(() => expect(window.location.hash).toBe("#/settings"));
  });

  it("marks the page already on screen and navigates from a pointer choice", async () => {
    window.location.hash = "#/settings";
    render(<Consumer />);
    await openPalette();
    const current = screen.getByRole("option", { name: /Settings/ });
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(current.textContent).toContain("Current");

    fireEvent.click(screen.getByRole("option", { name: /Collection/ }));
    await waitFor(() => expect(window.location.hash).toBe("#/shelf"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("clears the query and explains an empty result", async () => {
    render(<Consumer />);
    await openPalette();
    const combobox = screen.getByRole("combobox");

    fireEvent.change(combobox, { target: { value: "stats" } });
    expect(screen.getAllByRole("option")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect((combobox as HTMLInputElement).value).toBe("");
    expect(screen.getAllByRole("option")).toHaveLength(6);

    fireEvent.change(combobox, { target: { value: "zzz" } });
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toBe("No pages");
    expect(screen.getByText(/No pages match/)).toBeTruthy();

    fireEvent.keyDown(combobox, { key: "Enter" });
    expect(window.location.hash).toBe("");
    expect(screen.getByRole("dialog", { name: "Find a page" })).toBeTruthy();
  });

  it("cancels with Escape and returns focus to the opener", async () => {
    render(<Consumer />);
    const opener = screen.getByRole("button", { name: "Open search" });
    opener.focus();
    fireEvent.click(opener);
    await screen.findByRole("dialog", { name: "Find a page" });
    const combobox = screen.getByRole("combobox");
    await waitFor(() => expect(document.activeElement).toBe(combobox));

    fireEvent.keyDown(combobox, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it("stays shut while another dialog owns the screen", async () => {
    render(
      <>
        <div role="dialog" aria-label="Another task" />
        <Consumer />
      </>,
    );
    shortcut();
    expect(screen.queryByRole("dialog", { name: "Find a page" })).toBeNull();
  });
});
