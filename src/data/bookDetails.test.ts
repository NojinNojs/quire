import { describe, expect, it, vi } from "vitest";
import { deleteBook, getBook, updateBook } from "./bookDetails";
import type { BooksClient } from "./books";

function fake(
  response: { data?: unknown; error?: { code: string } | null },
  books: unknown[] = [],
) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(async () => ({ data: books, error: null })),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    single: vi.fn(async () => response),
    maybeSingle: vi.fn(async () => response),
  };
  return { client: { from: vi.fn(() => query) } as unknown as BooksClient, query };
}
const patch = {
  title: "Revised",
  author: null,
  publisher: null,
  year: null,
  pages: null,
  isbn: null,
  language: null,
  edition: null,
  city: null,
};

describe("book detail data boundary", () => {
  it("scopes reads and writes to owner and book", async () => {
    const read = fake({ data: { id: "book" } });
    await getBook(read.client, "owner", "book");
    expect(read.query.eq.mock.calls).toEqual([
      ["owner", "owner"],
      ["id", "book"],
    ]);
    const write = fake({ data: { id: "book" } });
    await updateBook(write.client, "owner", "book", patch);
    expect(write.query.eq.mock.calls).toEqual([
      ["owner", "owner"],
      ["owner", "owner"],
      ["id", "book"],
    ]);
    expect(write.query.update).toHaveBeenCalledWith(patch);
    const remove = fake({ data: { id: "book" } });
    await deleteBook(remove.client, "owner", "book");
    expect(remove.query.eq.mock.calls).toEqual([
      ["owner", "owner"],
      ["id", "book"],
    ]);
  });
  it("reports duplicate and missing mutation results instead of claiming success", async () => {
    await expect(
      updateBook(fake({ error: { code: "23505" } }).client, "owner", "book", patch),
    ).rejects.toThrow("already in your library");
    await expect(deleteBook(fake({ data: null }).client, "owner", "book")).rejects.toThrow(
      "Could not delete",
    );
  });
  it("rejects matching edition identities but excludes the edited book", async () => {
    const duplicate = fake({ data: { id: "book" } }, [
      { ...patch, id: "other", title: "REVISED!" },
    ]);
    await expect(updateBook(duplicate.client, "owner", "book", patch)).rejects.toThrow(
      "already in your library",
    );
    expect(duplicate.query.update).not.toHaveBeenCalled();

    const self = fake({ data: { id: "book" } }, [{ ...patch, id: "book" }]);
    await expect(updateBook(self.client, "owner", "book", patch)).resolves.toEqual({ id: "book" });
  });

  it("recognizes equivalent ISBN-10 and ISBN-13 editions", async () => {
    const duplicate = fake({ data: { id: "book" } }, [
      { ...patch, id: "other", isbn: "9780306406157" },
    ]);
    await expect(
      updateBook(duplicate.client, "owner", "book", { ...patch, isbn: "0306406152" }),
    ).rejects.toThrow("already in your library");
  });
});
