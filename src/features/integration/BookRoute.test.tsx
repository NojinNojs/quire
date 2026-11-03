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
      data: code ? null : { ...book, status: "reading" },
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
  fireEvent.change(screen.getByLabelText("Reading status"), { target: { value: "reading" } });
  await waitFor(() => expect(screen.getByText("Continue reading")).toBeTruthy());
  expect(query.update).toHaveBeenCalledWith(
    expect.objectContaining({ status: "reading", finished_at: null }),
  );
  expect(query.eq).toHaveBeenCalledWith("owner", "reader");
  expect(query.eq).toHaveBeenCalledWith("id", "literature");
});

it("shows an active-book conflict without navigating", async () => {
  const { client } = clientFor("23505");
  render(<BookRoute client={client} owner="reader" id="literature" />);
  fireEvent.change(await screen.findByLabelText("Reading status"), {
    target: { value: "reading" },
  });
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

it("keeps newer status when an earlier review returns a stale book", async () => {
  const book = shelfBook({ status: "want", rating: null });
  let resolveReview: (value: { data: typeof book; error: null }) => void = () => {};
  const review = new Promise<{ data: typeof book; error: null }>((resolve) => {
    resolveReview = resolve;
  });
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data: book, error: null })),
    update: vi.fn((patch: { status?: string }) => {
      query.single = patch.status
        ? vi.fn(async () => ({ data: { ...book, status: "reading" as const }, error: null }))
        : vi.fn(() => review);
      return query;
    }),
    single: vi.fn(() => review),
  };
  const client = { from: vi.fn(() => query) } as unknown as SupabaseClient;
  render(<BookRoute client={client} owner="reader" id="literature" />);
  fireEvent.click(await screen.findByRole("radio", { name: "4 out of 5" }));
  fireEvent.click(screen.getByRole("button", { name: "Save review" }));
  fireEvent.change(screen.getByLabelText("Reading status"), { target: { value: "reading" } });
  await screen.findByText("Continue reading");
  resolveReview({ data: { ...book, rating: 4 }, error: null });
  await screen.findByText("Review saved.");
  expect(screen.getByText("Continue reading")).toBeTruthy();
  expect((screen.getByLabelText("Reading status") as HTMLSelectElement).value).toBe("reading");
});
