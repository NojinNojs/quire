import { describe, expect, it, vi } from "vitest";
import { type BooksClient, countBooks, listBooks, saveBook } from "./books";
import type { Book, EditionInput } from "./types";

vi.mock("../lib/coverLookup", () => ({ lookupCover: vi.fn(async () => null) }));

const input: EditionInput = {
  owner: "owner-a",
  title: "An edition",
  author: null,
  publisher: null,
  year: null,
  pages: null,
  isbn: "9780141439518",
  language: null,
  coverUrl: null,
};
const book: Book = {
  ...input,
  id: "book-a",
  work_id: null,
  city: null,
  edition: null,
  ddc: null,
  cover_url: null,
  cover_path: null,
  status: "want",
  rating: null,
  notes: null,
  started_at: null,
  finished_at: null,
  created_at: "2026-10-29",
  updated_at: "2026-10-29",
};
type Response = {
  data?: unknown;
  error?: { code: string; message: string } | null;
  count?: number | null;
};
function fake(responses: Response[]) {
  const queue = [...responses];
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    single: vi.fn(() => builder),
    // biome-ignore lint/suspicious/noThenProperty: Supabase queries are awaitable builders.
    then(resolve: (value: Response) => unknown, reject: (error: unknown) => unknown) {
      const response = queue.shift();
      return response
        ? Promise.resolve(response).then(resolve, reject)
        : Promise.reject(new Error("Unexpected query")).then(resolve, reject);
    },
  };
  const from = vi.fn(() => builder);
  return { client: { from } as unknown as BooksClient, builder, from };
}

describe("books data layer", () => {
  it("returns the inserted book and preserves unknown metadata as null", async () => {
    const { client, builder } = fake([{ data: [] }, { data: book }]);
    await expect(saveBook(client, { ...input, ...{ source: "Google Books" } })).resolves.toEqual({
      ok: true,
      book,
    });
    expect(builder.insert).toHaveBeenCalledWith({
      owner: input.owner,
      title: input.title,
      author: null,
      publisher: null,
      year: null,
      pages: null,
      isbn: input.isbn,
      language: null,
      cover_url: null,
    });
  });
  it("maps 23505 to a duplicate result", async () => {
    const { client } = fake([{ data: [] }, { error: { code: "23505", message: "index details" } }]);
    await expect(saveBook(client, input)).resolves.toEqual({
      ok: false,
      kind: "duplicate",
      message: "This edition is already in your library.",
    });
  });
  it("maps an RLS rejection to an actionable unknown result", async () => {
    const { client } = fake([
      { data: [] },
      { error: { code: "42501", message: "row level security" } },
    ]);
    await expect(saveBook(client, input)).resolves.toMatchObject({
      ok: false,
      kind: "unknown",
      message: expect.stringContaining("Sign in again"),
    });
  });
  it("does not insert when the duplicate lookup fails", async () => {
    const { client, builder } = fake([{ error: { code: "42501", message: "denied" } }]);
    await expect(saveBook(client, input)).resolves.toMatchObject({ ok: false, kind: "unknown" });
    expect(builder.insert).not.toHaveBeenCalled();
  });
  it("detects editions without an ISBN before writing", async () => {
    const { client, builder } = fake([{ data: [{ ...book, isbn: null }] }]);
    await expect(saveBook(client, { ...input, isbn: null })).resolves.toMatchObject({
      ok: false,
      kind: "duplicate",
    });
    expect(builder.insert).not.toHaveBeenCalled();
  });
  it("normalises ISBN-10 before writing", async () => {
    const { client, builder } = fake([{ data: [] }, { data: book }]);
    await saveBook(client, { ...input, isbn: "0141439513" });
    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({ isbn: "9780141439518" }));
  });
  it("returns an exact owner-scoped count, including zero", async () => {
    const { client, builder } = fake([{ count: 0 }]);
    await expect(countBooks(client, input.owner)).resolves.toBe(0);
    expect(builder.eq).toHaveBeenCalledWith("owner", input.owner);
  });
  it("rejects count failures instead of reporting zero", async () => {
    const { client } = fake([{ error: { code: "42501", message: "denied" } }]);
    await expect(countBooks(client, input.owner)).rejects.toThrow("Sign in again");
  });
  it("paginates beyond the API row limit with owner scoping", async () => {
    const first = Array.from({ length: 1000 }, () => book);
    const { client, builder } = fake([{ data: first }, { data: [book] }]);
    await expect(listBooks(client, input.owner)).resolves.toHaveLength(1001);
    expect(builder.range.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
    expect(builder.eq).toHaveBeenCalledTimes(2);
    expect(builder.order).toHaveBeenCalledWith("id");
  });
  it("rejects a failed list instead of returning an empty library", async () => {
    const { client } = fake([{ error: { code: "500", message: "internal details" } }]);
    await expect(listBooks(client, input.owner)).rejects.toThrow("Check your connection");
  });
});

it("enriches a missing catalogue cover before inserting the book", async () => {
  const { client, builder } = fake([{ data: [] }, { data: book }]);
  const findCover = vi.fn(async () => "https://covers.test/fetched.jpg");
  await saveBook(client, input, findCover);
  expect(findCover).toHaveBeenCalledWith(
    expect.objectContaining({ isbn: input.isbn, title: input.title, author: null }),
  );
  expect(builder.insert).toHaveBeenCalledWith(
    expect.objectContaining({ cover_url: "https://covers.test/fetched.jpg" }),
  );
});
it("keeps an existing catalogue cover without running enrichment", async () => {
  const { client, builder } = fake([{ data: [] }, { data: book }]);
  const findCover = vi.fn();
  await saveBook(client, { ...input, coverUrl: "https://covers.test/catalogue.jpg" }, findCover);
  expect(findCover).not.toHaveBeenCalled();
  expect(builder.insert).toHaveBeenCalledWith(
    expect.objectContaining({ cover_url: "https://covers.test/catalogue.jpg" }),
  );
});
