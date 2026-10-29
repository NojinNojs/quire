import { useState } from "react";
import type { Candidate } from "../../lib/catalog";
import { isbnTo13 } from "../../lib/isbn";

const fields = [
  "title",
  "author",
  "publisher",
  "year",
  "pages",
  "isbn",
  "language",
  "coverUrl",
] as const;
const labels = {
  title: "Title",
  author: "Author",
  publisher: "Publisher",
  year: "Year",
  pages: "Pages",
  isbn: "ISBN",
  language: "Language",
  coverUrl: "Cover URL",
};

export function ManualForm({
  save,
  saving,
  setMessage,
}: {
  save: (candidate: Candidate) => Promise<boolean>;
  saving: string | null;
  setMessage: (message: string) => void;
}) {
  const [manual, setManual] = useState<Record<(typeof fields)[number], string>>({
    title: "",
    author: "",
    publisher: "",
    year: "",
    pages: "",
    isbn: "",
    language: "",
    coverUrl: "",
  });
  async function saveManual(event: React.FormEvent) {
    event.preventDefault();
    const isbn = manual.isbn.trim() ? isbnTo13(manual.isbn) : null;
    if (manual.isbn.trim() && !isbn) {
      setMessage("Enter a valid ISBN-10 or ISBN-13, or leave ISBN blank.");
      return;
    }
    if (!manual.title.trim()) {
      setMessage("Enter a title.");
      return;
    }
    const optional = (value: string) => value.trim() || null;
    await save({
      title: manual.title.trim(),
      author: optional(manual.author),
      publisher: optional(manual.publisher),
      year: manual.year ? Number(manual.year) : null,
      pages: manual.pages ? Number(manual.pages) : null,
      isbn,
      language: optional(manual.language),
      coverUrl: optional(manual.coverUrl),
      source: "Manual",
    });
  }

  return (
    <>
      <p className="muted manual-note">Only the title is required. Leave unknown details blank.</p>
      <form className="catalog-form" onSubmit={saveManual}>
        {fields.map((field) => (
          <label key={field}>
            <span className="label">
              {labels[field]}
              {field === "title" ? " (required)" : ""}
            </span>
            <input
              name={field}
              required={field === "title"}
              type={
                field === "year" || field === "pages"
                  ? "number"
                  : field === "coverUrl"
                    ? "url"
                    : "text"
              }
              min={field === "year" ? 1000 : field === "pages" ? 1 : undefined}
              max={field === "year" ? 2100 : undefined}
              step={field === "year" || field === "pages" ? 1 : undefined}
              value={manual[field]}
              onChange={(event) => setManual({ ...manual, [field]: event.target.value })}
            />
          </label>
        ))}
        <button className="primary" type="submit" disabled={saving !== null}>
          {saving ? "Saving" : "Save book"}
        </button>
      </form>
    </>
  );
}
