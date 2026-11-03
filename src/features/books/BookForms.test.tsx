import "../shelf/test-dom";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { shelfBook } from "../shelf/fixtures";
import { BookReviewForm } from "./BookReviewForm";
import { BookStatusForm } from "./BookStatusForm";

afterEach(cleanup);

it("keeps review draft after a failed save and clears rating", async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(undefined);
  render(<BookReviewForm book={shelfBook({ rating: 4, notes: "old" })} save={save} />);
  fireEvent.change(screen.getByLabelText("Private notes and review"), {
    target: { value: "new note" },
  });
  fireEvent.click(screen.getByText("Clear rating"));
  fireEvent.click(screen.getByText("Save review"));
  expect((await screen.findByRole("alert")).textContent).toContain("Offline");
  expect((screen.getByLabelText("Private notes and review") as HTMLTextAreaElement).value).toBe(
    "new note",
  );
  fireEvent.click(screen.getByText("Save review"));
  await waitFor(() => expect(save).toHaveBeenLastCalledWith({ rating: null, notes: "new note" }));
});

it("requires confirmation before clearing a finish date and respects pending logs", async () => {
  const book = shelfBook({ status: "finished", finished_at: "2024-01-01" });
  const save = vi.fn(async () => ({ ...book, status: "want" as const, finished_at: null }));
  const view = render(<BookStatusForm book={book} pending={false} save={save} />);
  fireEvent.change(screen.getByLabelText("Reading status"), { target: { value: "want" } });
  expect(save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Cancel"));
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Reading status"), { target: { value: "want" } });
  fireEvent.click(screen.getByText("Change status"));
  await waitFor(() => expect(save).toHaveBeenCalledWith("want"));
  view.rerender(<BookStatusForm book={book} pending save={save} />);
  expect((screen.getByLabelText("Reading status") as HTMLSelectElement).disabled).toBe(true);
  expect(screen.getByRole("link", { name: "Today" })).toBeTruthy();
});
