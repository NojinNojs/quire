// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Book } from "../../data/types";
import { JournalScreen } from "./JournalScreen";

it("groups duplicate book logs and reveals earlier days", () => {
  const books = [{ id: "a", title: "A book", notes: "A current note" }] as Book[];
  const logs = Array.from({ length: 31 }, (_, index) => ({
    id: String(index),
    book_id: "a",
    day: `2024-01-${String(index + 1).padStart(2, "0")}`,
    pages: 1,
  }));
  logs.push({ id: "extra", book_id: "a", day: "2024-01-31", pages: 4 });
  render(
    <JournalScreen books={books} logs={logs} year={2024} currentYear={2024} setYear={vi.fn()} />,
  );
  const day = screen.getByRole("heading", { name: "2024-01-31" }).closest("section");
  expect(day).not.toBeNull();
  const dayView = within(day as HTMLElement);
  expect(dayView.getByText("5 pages", { selector: "p" })).toBeTruthy();
  const bookRow = dayView.getByRole("link", { name: "A book" }).closest("li");
  expect(bookRow).not.toBeNull();
  expect(within(bookRow as HTMLElement).getByText("5 pages")).toBeTruthy();
  expect(screen.queryByText("2024-01-01")).toBeNull();
  expect(screen.getAllByText("Current book note: A current note").length).toBe(30);
  fireEvent.click(screen.getByRole("button", { name: "Show earlier days" }));
  expect(screen.getByText("2024-01-01")).toBeTruthy();
});
