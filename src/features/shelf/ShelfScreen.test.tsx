import "./test-dom";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { shelfBook, shelfBooks } from "./fixtures";
import { ShelfScreen } from "./ShelfScreen";

afterEach(cleanup);

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
    expect(view.getByText("0 active filters")).toBeTruthy();
  });

  it("combines status, language and case-insensitive text filters and resets them", () => {
    const view = setup({
      books: [
        ...shelfBooks,
        shelfBook({ id: "id-edition", title: "The Waves", language: "id" }),
        shelfBook({ id: "other-title", title: "Orlando" }),
      ],
    });
    fireEvent.change(view.getByRole("combobox", { name: "Status" }), {
      target: { value: "reading" },
    });
    fireEvent.change(view.getByRole("combobox", { name: "Language" }), { target: { value: "en" } });
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
    fireEvent.click(view.getByRole("button", { name: "Clear filters" }));
    expect(view.getByText("7 books")).toBeTruthy();
    expect(view.getByText("0 active filters")).toBeTruthy();
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
    expect(within(row).getByText("1931 · Pages unknown")).toBeTruthy();
    expect(row.textContent).not.toMatch(/\/|\b0 pages\b|\b324\b|%/);
  });

  it("uses shared skeleton rows while loading and suppresses stale books and empty copy", () => {
    const view = setup({ loading: true });
    expect(view.getByRole("status", { name: "Loading your shelf" }).getAttribute("aria-busy")).toBe(
      "true",
    );
    expect(view.queryByRole("button", { name: "The Waves" })).toBeNull();
    expect(view.queryByText("Your shelf is waiting for its first book.")).toBeNull();
    expect(view.queryByText("5 books")).toBeNull();
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
    fireEvent.change(view.getByRole("combobox", { name: "Language" }), {
      target: { value: "unknown" },
    });
    expect(view.getAllByRole("listitem")).toHaveLength(1);
    expect(view.getByRole("button", { name: "Reading notebook" })).toBeTruthy();
  });
});
