import "../shelf/test-dom";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { shelfBook } from "../shelf/fixtures";
import { BookRoute } from "./BookRoute";

const state = vi.hoisted(() => ({ error: null as Error | null, retry: vi.fn() }));
vi.mock("../shelf/useShelfProgress", () => ({
  useShelfProgressState: () => ({
    pages: { literature: 12 },
    loading: false,
    error: state.error,
    retry: state.retry,
  }),
}));
vi.mock("../covers/CoverImage", () => ({
  CoverImage: ({ coverPath }: { coverPath: string | null }) => (
    <div data-testid="cover">{coverPath}</div>
  ),
}));

function clientFor(code?: string) {
  const book = shelfBook({ status: "want", cover_path: "reader/upload.jpg" });
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    update: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data: book, error: null })),
    single: vi.fn(async () => ({
      data: code ? null : { id: book.id },
      error: code ? { code } : null,
    })),
  };
  return { client: { from: vi.fn(() => query) } as unknown as SupabaseClient, query };
}

afterEach(() => {
  cleanup();
  state.error = null;
  state.retry.mockReset();
  window.location.hash = "";
});

it("starts account reading and displays the uploaded cover", async () => {
  const { client, query } = clientFor();
  render(<BookRoute client={client} owner="reader" id="literature" />);
  expect((await screen.findByTestId("cover")).textContent).toBe("reader/upload.jpg");
  fireEvent.click(screen.getByRole("button", { name: "Read this book" }));
  await waitFor(() => expect(window.location.hash).toBe("#/today"));
  expect(query.update).toHaveBeenCalledWith({ status: "reading" });
  expect(query.eq).toHaveBeenCalledWith("owner", "reader");
  expect(query.eq).toHaveBeenCalledWith("id", "literature");
});

it("shows an active-book conflict without navigating", async () => {
  const { client } = clientFor("23505");
  render(<BookRoute client={client} owner="reader" id="literature" />);
  fireEvent.click(await screen.findByRole("button", { name: "Read this book" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Another book is already being read",
  );
  expect(window.location.hash).not.toBe("#/today");
});

it("offers retry instead of showing zero when progress fails", async () => {
  state.error = new Error("Progress unavailable");
  const { client } = clientFor();
  render(<BookRoute client={client} owner="reader" id="literature" />);
  expect((await screen.findByRole("alert")).textContent).toContain("Progress unavailable");
  expect(screen.queryByText(/pages read/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(state.retry).toHaveBeenCalledOnce();
});
