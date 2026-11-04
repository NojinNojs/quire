// @vitest-environment jsdom
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithToast } from "../../components/toast/test-utils";
import type { Book } from "../../data/types";
import { SearchScreen } from "./SearchScreen";

const existingBook: Book = {
  id: "book-1",
  owner: "reader",
  work_id: null,
  title: "Ulysses",
  author: null,
  publisher: null,
  city: null,
  year: null,
  edition: null,
  pages: null,
  isbn: null,
  ddc: null,
  language: null,
  cover_url: null,
  cover_path: null,
  status: "want",
  rating: null,
  notes: null,
  started_at: null,
  finished_at: null,
  created_at: "2026-11-04",
  updated_at: "2026-11-04",
};

type Response = {
  data?: unknown;
  error?: { code: string; message: string } | null;
  count?: number | null;
};

function fakeClient(books: Book[], insert: Response): SupabaseClient {
  const from = () => {
    let columns = "";
    let inserting = false;
    const builder = {
      select: (value: string) => {
        columns = value;
        return builder;
      },
      eq: () => builder,
      order: () => builder,
      range: () => builder,
      insert: () => {
        inserting = true;
        return builder;
      },
      single: () => builder,
      // biome-ignore lint/suspicious/noThenProperty: Supabase queries are awaitable builders.
      then(resolve: (value: Response) => unknown, reject: (error: unknown) => unknown) {
        const response =
          columns === "id"
            ? { count: 0, error: null }
            : inserting
              ? insert
              : { data: books, error: null };
        return Promise.resolve(response).then(resolve, reject);
      },
    };
    return builder;
  };
  return { from } as unknown as SupabaseClient;
}

function renderScreen(client: SupabaseClient) {
  renderWithToast(
    <SearchScreen user={{ id: "reader" } as User} client={client} signOut={() => {}} />,
  );
  fireEvent.click(screen.getByRole("tab", { name: "Enter manually" }));
  fireEvent.change(screen.getByLabelText("Title (required)"), { target: { value: "Ulysses" } });
  fireEvent.click(screen.getByRole("button", { name: "Save book" }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("catalogue save feedback", () => {
  it("keeps a duplicate inline and announces it without a toast", async () => {
    renderScreen(fakeClient([existingBook], { data: null, error: null }));
    const panel = await screen.findByRole("alert");
    expect(panel.textContent).toContain("This edition is already in your library.");
    expect(panel.getAttribute("role")).toBe("alert");
    expect(document.querySelector(".toast")).toBeNull();
    expect(
      screen.getAllByText("This edition is already in your library.", { exact: true }),
    ).toHaveLength(1);
  });

  it("keeps a failed write in the inline panel and also raises a toast", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) })),
    );
    renderScreen(
      fakeClient([], { data: null, error: { code: "XX000", message: "Catalogue write failed" } }),
    );
    const inline = await waitFor(() => {
      const element = document.querySelector(".error-panel");
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    expect(inline.getAttribute("role")).toBeNull();
    const message = inline.querySelector("p")?.textContent;
    expect(message).toBeTruthy();
    const toast = await waitFor(() => {
      const element = document.querySelector(".toast");
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });
    expect(toast.querySelector(".toast-title")?.textContent).toBe(message);
  });
});
