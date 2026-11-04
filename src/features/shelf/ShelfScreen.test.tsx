import "./test-dom";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { shelfBook, shelfBooks } from "./fixtures";
import { ShelfScreen } from "./ShelfScreen";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function setup(overrides: Partial<Parameters<typeof ShelfScreen>[0]> = {}) {
  const onAddBook = vi.fn();
  const onSelectBook = vi.fn();
  return {
    onAddBook,
    onSelectBook,
    ...render(
      <ShelfScreen
        books={shelfBooks}
        onAddBook={onAddBook}
        onSelectBook={onSelectBook}
        {...overrides}
      />,
    ),
  };
}

/** Base UI commits on a real pointer activation, so mirror the browser sequence. */
function choose(view: ReturnType<typeof setup>, name: string) {
  const option = view.getByRole("option", { name });
  fireEvent.pointerDown(option, { pointerType: "mouse" });
  fireEvent.click(option, { detail: 1 });
}

describe("shelf", () => {
  it("groups editions by DDC class, including unclassified books", () => {
    const view = setup();
    expect(view.getAllByRole("heading", { level: 2 }).map((node) => node.textContent)).toEqual([
      "800 Literature",
      "900 History",
      "100 Philosophy",
      "Unclassified",
    ]);
    expect(
      within(view.getByRole("region", { name: "800 Literature" })).getAllByRole("listitem"),
    ).toHaveLength(2);
    expect(view.getByText("5 books")).toBeTruthy();
    expect(view.queryByText("0 active filters")).toBeNull();
  });

  it("combines status, language and case-insensitive text filters and resets them", () => {
    const view = setup({
      books: [
        ...shelfBooks,
        shelfBook({ id: "id-edition", title: "The Waves", language: "id" }),
        shelfBook({ id: "other-title", title: "Orlando" }),
      ],
    });
    fireEvent.click(view.getByRole("combobox", { name: "Status" }));
    choose(view, "Reading");
    fireEvent.click(view.getByRole("combobox", { name: "Language" }));
    choose(view, "en");
    fireEvent.change(view.getByRole("searchbox", { name: "Search books" }), {
      target: { value: "  WAVES  " },
    });
    expect(view.getByText("1 book")).toBeTruthy();
    expect(view.getByText("3 active filters")).toBeTruthy();
    expect(view.getAllByRole("listitem")).toHaveLength(1);
    expect(view.getByRole("button", { name: "The Waves" })).toBeTruthy();
    fireEvent.change(view.getByRole("searchbox"), { target: { value: "no match" } });
    expect(view.getByText("No books match these filters.")).toBeTruthy();
    expect(view.queryByRole("list")).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "Reset filters" }));
    expect(view.getByText("7 books")).toBeTruthy();
    expect(view.queryByText("0 active filters")).toBeNull();
  });

  it("offers an add action for an empty shelf", () => {
    const view = setup({ books: [] });
    expect(view.getByText("Your shelf is waiting for its first book.")).toBeTruthy();
    expect(view.getByText("0 books")).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Add a book" }));
    expect(view.onAddBook).toHaveBeenCalledOnce();
  });

  it("does not invent a page count or denominator for an unknown length", () => {
    const view = setup({ books: [shelfBook({ pages: null })] });
    const row = view.getByRole("listitem");
    expect(within(row).getByText("1931")).toBeTruthy();
    expect(within(row).getByText("Pages unknown")).toBeTruthy();
    expect(row.textContent).not.toMatch(/\/|\b0 pages\b|\b324\b|%/);
  });

  it("fills a desktop shelf with six loading jackets and suppresses stale books and empty copy", () => {
    const view = setup({ loading: true });
    expect(view.getByRole("status", { name: "Loading your shelf" }).getAttribute("aria-busy")).toBe(
      "true",
    );
    expect(view.queryByRole("button", { name: "The Waves" })).toBeNull();
    expect(view.queryByText("Your shelf is waiting for its first book.")).toBeNull();
    expect(view.queryByText("5 books")).toBeNull();
    expect(view.container.querySelectorAll(".skeleton-rows li")).toHaveLength(6);
  });

  it("selects the exact edition and delegates loading errors to the shared recovery panel", () => {
    const view = setup();
    fireEvent.click(view.getByRole("button", { name: "The Waves" }));
    expect(view.onSelectBook).toHaveBeenCalledWith(shelfBooks[0]);
    const onRetry = vi.fn();
    view.rerender(
      <ShelfScreen
        books={[]}
        error="Could not access your books."
        onRetry={onRetry}
        onAddBook={view.onAddBook}
        onSelectBook={view.onSelectBook}
      />,
    );
    expect(view.getByRole("alert").textContent).toContain("Could not access your books.");
    fireEvent.click(view.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(view.queryByText("Your shelf is waiting for its first book.")).toBeNull();
  });

  it("filters books with an unknown language", () => {
    const view = setup();
    fireEvent.click(view.getByRole("combobox", { name: "Language" }));
    choose(view, "Unknown");
    expect(view.getAllByRole("listitem")).toHaveLength(1);
    expect(view.getByRole("button", { name: "Reading notebook" })).toBeTruthy();
  });
});

it("defaults to grid and remembers the list choice across remounts", () => {
  const first = setup();
  expect(first.getByRole("button", { name: "Grid" }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(first.getByRole("button", { name: "List" }));
  expect(window.localStorage.getItem("quire:shelf-view")).toBe("list");
  first.unmount();
  const second = setup();
  expect(second.container.querySelector(".shelf-list")).toBeTruthy();
  expect(second.getByRole("button", { name: "List" }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(second.getByRole("button", { name: "Grid" }));
  expect(window.localStorage.getItem("quire:shelf-view")).toBe("grid");
});

it("keeps the view toggle usable when storage is blocked", () => {
  const get = vi.spyOn(window.Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Blocked");
  });
  const set = vi.spyOn(window.Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Blocked");
  });
  const view = setup();
  fireEvent.click(view.getByRole("button", { name: "List" }));
  expect(view.container.querySelector(".shelf-list")).toBeTruthy();
  get.mockRestore();
  set.mockRestore();
});

it("uses real progress and leaves unavailable progress absent", () => {
  const view = setup({ currentPages: { literature: 81 } });
  expect(
    view.getByRole("img", { name: "Page 81 of 324" }).querySelector<HTMLElement>(".bookmark-fill")
      ?.style.height,
  ).toBe("25%");
  expect(view.container.querySelectorAll(".bookmark")).toHaveLength(1);
});

describe("responsive shelf contract", () => {
  it("keeps caption data for real covers and uses the shared placeholder on image failure", () => {
    const view = setup({ books: [shelfBook({ cover_url: "https://example.test/cover.jpg" })] });
    expect(view.getByRole("img", { name: "Cover of The Waves" })).toBeTruthy();
    const copy = view.container.querySelector(".shelf-copy");
    expect(copy?.querySelector("h3")?.textContent).toBe("The Waves");
    expect(copy?.querySelector(".shelf-publisher")?.textContent).toBe("Hogarth Press");
    expect(copy?.querySelector(".shelf-year")?.textContent).toBe("1931");
    fireEvent.error(view.getByRole("img", { name: "Cover of The Waves" }));
    expect(view.getByRole("img", { name: "The Waves, no cover image" })).toBeTruthy();
    expect(view.getByRole("img", { name: "The Waves, no cover image" }).getAttribute("src")).toBe(
      "/covers/placeholder.svg",
    );
    expect(copy?.querySelector("h3")?.textContent).toBe("The Waves");
  });

  it("provides author and four metadata fields in list view", () => {
    const view = setup();
    fireEvent.click(view.getByRole("button", { name: "List" }));
    const copy = view.container.querySelector(".shelf-copy");
    expect(copy?.querySelector(".shelf-author")?.textContent).toBe("Virginia Woolf");
    expect(
      [...(copy?.querySelectorAll(".shelf-metadata p") ?? [])].map((field) => field.textContent),
    ).toEqual(["Reading", "Hogarth Press", "1931", "324 pages"]);
  });
});
