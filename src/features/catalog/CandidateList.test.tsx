// @vitest-environment jsdom
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithToast } from "../../components/toast/test-utils";
import { normaliseGoogleBooks } from "../../lib/catalog";
import { CandidateList } from "./CandidateList";
import { SearchScreen } from "./SearchScreen";

const props = {
  searching: false,
  searched: true,
  errors: [],
  candidates: [],
  saved: new Set<string>(),
  saving: null,
  save: async () => true,
  selectTab: vi.fn(),
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("catalogue states", () => {
  it("shows loading skeletons without empty guidance", () => {
    const { container } = render(<CandidateList {...props} searching />);
    expect(container.querySelectorAll(".catalog-row")).toHaveLength(3);
    expect(screen.queryByText("No catalogue matches for this search.")).toBeNull();
  });
  it("shows one primary manual action when all sources fail", () => {
    render(<CandidateList {...props} errors={["Tried all catalogue sources."]} />);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Enter it manually" }));
    expect(props.selectTab).toHaveBeenCalledWith("manual");
  });
  it("hides provider errors when a later source supplies a candidate", () => {
    render(
      <CandidateList
        {...props}
        errors={["Google Books is rate limiting requests."]}
        candidates={normaliseGoogleBooks({ items: [{ volumeInfo: { title: "Found later" } }] })}
      />,
    );
    expect(screen.getByText("Found later")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText(/rate limiting/)).toBeNull();
  });
  it("runs a scanned ISBN through the same search flow and repeats the same ISBN", async () => {
    const query = Object.assign(Promise.resolve({ count: 0, error: null }), {
      select: () => query,
      eq: () => query,
    });
    const client = { from: () => query } as unknown as SupabaseClient;
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 429,
      json: async () => ({}),
      text: async () => "",
    }));
    vi.stubGlobal("fetch", fetchMock);
    const onScanHandled = vi.fn();
    const view = renderWithToast(
      <SearchScreen
        user={{ id: "reader" } as User}
        client={client}
        signOut={() => {}}
        scanRequest={{ isbn: "9780140328721", nonce: 1 }}
        onScanHandled={onScanHandled}
      />,
    );
    await waitFor(() => expect(onScanHandled).toHaveBeenCalledWith(1));
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("9780140328721");
    const calls = fetchMock.mock.calls.length;
    expect(calls).toBeGreaterThan(0);
    view.rerender(
      <SearchScreen
        user={{ id: "reader" } as User}
        client={client}
        signOut={() => {}}
        scanRequest={{ isbn: "9780140328721", nonce: 2 }}
        onScanHandled={onScanHandled}
      />,
    );
    await waitFor(() => expect(onScanHandled).toHaveBeenLastCalledWith(2));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(calls));
  });

  it("opens the manual form with the searched ISBN, or with HTML metadata", async () => {
    const query = Object.assign(Promise.resolve({ count: 0, error: null }), {
      select: () => query,
      eq: () => query,
    });
    const client = { from: () => query } as unknown as SupabaseClient;
    let found = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => ({
        ok: url.startsWith("/gb") && found,
        status: 429,
        json: async () => ({}),
        text: async () =>
          "<title>Dari dalam kubur: sebuah novel - Soe Tjen Marching - Google Buku</title>",
      })),
    );
    renderWithToast(
      <SearchScreen user={{ id: "reader" } as User} client={client} signOut={() => {}} />,
    );
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "9786020788036" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(await screen.findByRole("button", { name: "Enter it manually" }));
    expect((screen.getByLabelText("ISBN") as HTMLInputElement).value).toBe("9786020788036");
    fireEvent.click(screen.getByRole("tab", { name: "Search catalogue" }));
    found = true;
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(await screen.findByRole("button", { name: "Add details" }));
    await waitFor(() =>
      expect((screen.getByLabelText("Title (required)") as HTMLInputElement).value).toBe(
        "Dari dalam kubur: sebuah novel",
      ),
    );
    expect((screen.getByLabelText("Author") as HTMLInputElement).value).toBe("Soe Tjen Marching");
    expect((screen.getByLabelText("ISBN") as HTMLInputElement).value).toBe("9786020788036");
    expect((screen.getByLabelText("Pages") as HTMLInputElement).value).toBe("");
    fireEvent.change(screen.getByLabelText("Publisher"), {
      target: { value: "Publisher supplied by reader" },
    });
    fireEvent.change(screen.getByLabelText("Pages"), { target: { value: "240" } });
    expect((screen.getByLabelText("Pages") as HTMLInputElement).value).toBe("240");
  });
});
