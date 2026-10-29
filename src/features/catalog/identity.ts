import { editionKey } from "../../lib/edition";
import { isbnTo13 } from "../../lib/isbn";

type SavedEdition = {
  title: string;
  publisher: string | null;
  year: number | null;
  isbn: string | null;
};
export const identity = (book: SavedEdition) =>
  editionKey({ ...book, isbn: book.isbn ? isbnTo13(book.isbn) : null });
