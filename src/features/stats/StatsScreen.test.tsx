// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Book } from "../../data/types";
import { StatsScreen } from "./StatsScreen";

it("uses all languages after the selected language disappears in another year, without inventing a goal", () => {
  const books = [
    { id: "a", language: "English", status: "reading" },
    { id: "b", language: "French", status: "reading" },
  ] as Book[];
  const logs = [
    { id: "1", book_id: "a", day: "2024-01-01", pages: 10 },
    { id: "2", book_id: "b", day: "2025-01-01", pages: 7 },
  ];
  const props = {
    books,
    logs,
    profile: { id: "reader", display_name: null, annual_goal: null },
    setYear: vi.fn(),
    currentYear: 2025,
  };
  const { rerender } = render(<StatsScreen {...props} year={2024} />);
  fireEvent.change(screen.getByLabelText("Language"), {
    target: { value: JSON.stringify({ kind: "language", value: "English" }) },
  });
  rerender(<StatsScreen {...props} year={2025} />);
  expect((screen.getByLabelText("Language") as HTMLSelectElement).value).toBe(
    JSON.stringify({ kind: "all" }),
  );
  expect(screen.getByText("Pages read").nextElementSibling?.textContent).toBe("7");
  expect(screen.queryByRole("heading", { name: "Annual goal" })).toBeNull();
});
