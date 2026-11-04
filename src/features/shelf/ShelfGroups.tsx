import type { CSSProperties } from "react";
import type { Book } from "../../data/types";
import { classify, groupByClass } from "../../lib/ddc";
import { CoverImage } from "../covers/CoverImage";
import { Bookmark } from "../reading/Bookmark";

export const statuses: Record<Book["status"], string> = {
  want: "Want to read",
  reading: "Reading",
  finished: "Finished",
  wishlist: "Wishlist",
};

export function ShelfGroups({
  books,
  pages,
  id,
  onSelectBook,
}: {
  books: Book[];
  pages: Record<string, number>;
  id: string;
  onSelectBook: (book: Book) => void;
}) {
  return [...groupByClass(books)].map(([label, members], index) => {
    const classification = classify(members[0]?.ddc);
    const token = classification?.token ?? "--class-000";
    return (
      <section
        className="shelf-group"
        key={label}
        aria-labelledby={`${id}-group-${index}`}
        style={
          {
            "--book-class": `var(--shelf${token.slice(1)}, var(--shelf-class-000))`,
          } as CSSProperties
        }
      >
        <div className="shelf-band-row">
          <h2 className="shelf-band" id={`${id}-group-${index}`}>
            {classification ? (
              <>
                <span className="shelf-class-number">{classification.code}</span>{" "}
                {classification.label}
              </>
            ) : (
              label
            )}
          </h2>
          <span className="shelf-band-count">
            {members.length} {members.length === 1 ? "title" : "titles"}
          </span>
        </div>
        <ul className="shelf-books">
          {members.map((book) => (
            <li className="shelf-row" key={book.id}>
              <div className="shelf-jacket">
                <button
                  className="shelf-jacket-button"
                  type="button"
                  aria-label={`Open ${book.title}`}
                  onClick={() => onSelectBook(book)}
                >
                  <CoverImage
                    coverPath={book.cover_path}
                    coverUrl={book.cover_url}
                    title={book.title}
                    author={book.author}
                    ddc={book.ddc}
                    className="shelf-cover"
                  />
                </button>
                {(pages[book.id] ?? 0) > 0 && (
                  <Bookmark current={pages[book.id] ?? 0} total={book.pages} />
                )}
              </div>
              <div className="shelf-copy">
                <h3>
                  <button type="button" onClick={() => onSelectBook(book)}>
                    {book.title}
                  </button>
                </h3>
                <p className="shelf-author">{book.author ?? "Author unknown"}</p>
                <div className="shelf-metadata">
                  <p className="shelf-status">{statuses[book.status]}</p>
                  <p className="shelf-publisher">{book.publisher ?? "Publisher unknown"}</p>
                  <p className="shelf-year">{book.year ?? "Year unknown"}</p>
                  <p className="shelf-pages">
                    {book.pages === null ? "Pages unknown" : `${book.pages} pages`}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  });
}
