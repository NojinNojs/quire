import { type CSSProperties, useEffect, useState } from "react";
import { ChangingText } from "../../components/changing-text/ChangingText";
import { classify } from "../../lib/ddc";
import { plural } from "../../lib/plural";
import { pagesLeft, percent } from "../../lib/progress";
import { supabase } from "../../lib/supabase";
import { TodayCover } from "../covers/TodayCover";
import { ReadingProgress } from "./ReadingProgress";
import type { ReadingBook } from "./types";

export function ActiveBookCard({
  book,
  current,
  pagesToday,
}: {
  book: ReadingBook;
  current: number;
  pagesToday: number;
}) {
  const [classification, setClassification] = useState<{ id: string; ddc: string | null } | null>(
    null,
  );
  useEffect(() => {
    const client = supabase;
    if (!client || book.ddc !== undefined) return;
    let live = true;
    void (async () => {
      const { data, error } = await client.from("books").select("ddc").eq("id", book.id).single();
      if (live && !error && data) setClassification({ id: book.id, ddc: data.ddc });
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, [book.id, book.ddc]);
  const ddc =
    book.ddc !== undefined ? book.ddc : classification?.id === book.id ? classification.ddc : null;
  const token = classify(ddc)?.token ?? "--class-000";
  const value = percent({ current, total: book.total });
  const left = pagesLeft({ current, total: book.total });
  return (
    <article
      className="reading-book"
      aria-label="Active book"
      style={
        { "--book-class": `var(--shelf${token.slice(1)}, var(--shelf-class-000))` } as CSSProperties
      }
    >
      <div className="reading-jacket">
        <TodayCover
          key={book.id}
          bookId={book.id}
          title={book.title}
          author={book.author}
          ddc={ddc}
          coverUrl={book.coverUrl}
        />
      </div>
      <div className="reading-book-copy">
        <h2>
          <ChangingText value={book.title} />
        </h2>
        <p className="reading-author">
          <ChangingText value={book.author ?? "Author unknown"} />
        </p>
        <p className="reading-meta">{book.editionLine}</p>
      </div>
      <div className="reading-progress">
        {book.total === null ? (
          <div className="reading-progress-head reading-progress-head-unknown">
            <span className="reading-position">Page</span>
            <p className="reading-number">
              <ChangingText value={current} />
            </p>
          </div>
        ) : (
          <div className="reading-progress-head">
            <p className="reading-position">
              Page{" "}
              <strong>
                <ChangingText value={current} />
              </strong>{" "}
              of {book.total}
            </p>
            {value === null ? null : (
              <p className="reading-percent">
                <ChangingText value={`${value}%`} />
              </p>
            )}
          </div>
        )}
        {book.total === null ? null : (
          <ReadingProgress
            value={current}
            max={book.total}
            label={`Reading progress: ${current} of ${book.total} pages`}
          />
        )}
        <p className="reading-progress-note">
          {left === null ? "Total pages unknown" : `${plural(left, "page")} left`}
          <span aria-hidden="true"> · </span>
          <ChangingText
            value={pagesToday > 0 ? `${plural(pagesToday, "page")} today` : "No pages today"}
          />
        </p>
      </div>
      <a className="reading-detail-link" href={`#/book/${book.id}`}>
        View book details
      </a>
    </article>
  );
}
