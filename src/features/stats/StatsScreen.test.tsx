// @vitest-environment jsdom
import "../shelf/test-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { Book } from "../../data/types";
import { StatsScreen } from "./StatsScreen";

it("uses all languages after the selected language disappears in another year, without inventing a goal", async () => {
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
  fireEvent.click(screen.getByRole("combobox", { name: "Language" }));
  const option = await screen.findByRole("option", { name: "English" });
  fireEvent.pointerDown(option, { pointerType: "mouse" });
  fireEvent.click(option, { detail: 1 });
  rerender(<StatsScreen {...props} year={2025} />);
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: "Language" }).textContent).toContain(
      "All languages",
    ),
  );
  expect(screen.getByText("Pages read").nextElementSibling?.textContent).toBe("7");
  expect(screen.queryByRole("heading", { name: "Annual goal" })).toBeNull();
});
