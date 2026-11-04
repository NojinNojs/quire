import type { Book } from "../../data/types";

const statusLabels: Record<Book["status"], string> = {
  want: "Want to read",
  reading: "Reading",
  finished: "Finished",
  wishlist: "Wishlist",
};

export function BookFacts({ book, current }: { book: Book; current: number }) {
  const detailFields: [string, string | null][] = [
    ["Publisher", book.publisher],
    ["Year", book.year === null ? null : String(book.year)],
    ["Edition", book.edition],
    ["City", book.city],
    ["ISBN", book.isbn],
    ["Language", book.language],
  ];
  const details = detailFields.filter((entry): entry is [string, string] => Boolean(entry[1]));
  return (
    <dl className="book-detail-facts">
      <div className="book-detail-status">
        <dt>Status</dt>
        <dd>{statusLabels[book.status]}</dd>
      </div>
      <div>
        <dt>Pages read</dt>
        <dd>
          {current}
          {book.pages ? ` / ${book.pages}` : ""}
        </dd>
      </div>
      {details.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
