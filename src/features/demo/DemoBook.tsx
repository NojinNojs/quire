import type { BookEdit } from "../../data/bookDetails";
import { bookStatusPatch } from "../../data/bookReading";
import type { Book } from "../../data/types";
import { BookDetail } from "../books/BookDetail";
import { BookReviewForm } from "../books/BookReviewForm";
import { BookStatusForm } from "../books/BookStatusForm";
import { readingDay } from "../integration/useReading";

export function DemoBook({
  book,
  current,
  update,
  remove,
  pending,
  activeBookId,
}: {
  book: Book;
  current: number;
  update: (patch: Partial<Book>) => Promise<void>;
  remove: () => void;
  pending: boolean;
  activeBookId: string | null;
}) {
  return (
    <BookDetail
      book={book}
      current={current}
      save={async (patch: BookEdit) => {
        await update(patch);
      }}
      remove={async () => {
        remove();
      }}
    >
      <BookStatusForm
        book={book}
        pending={pending}
        save={async (status) => {
          if (status === "reading" && activeBookId && activeBookId !== book.id) {
            throw new Error(
              "Another book is already being read. Only one book can be active at a time.",
            );
          }
          const patch = bookStatusPatch(book, status, readingDay());
          await update(patch);
          return { ...book, ...patch };
        }}
      />
      <BookReviewForm
        book={book}
        save={async (patch) => {
          await update(patch);
        }}
      />
    </BookDetail>
  );
}
