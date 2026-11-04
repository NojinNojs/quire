import { type FormEvent, useId, useState } from "react";
import { SaveIcon } from "../../components/icons";
import type { Candidate } from "../../lib/catalog";
import { isbnTo13 } from "../../lib/isbn";

const groups = [
  { legend: "The book", fields: ["title", "author"] },
  { legend: "Edition", fields: ["publisher", "year", "pages", "language"] },
  { legend: "Identifiers", fields: ["isbn", "coverUrl"] },
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
} as const;
const hints: Partial<Record<keyof typeof labels, string>> = {
  year: "Four digits, as printed in the edition.",
  pages: "Whole pages in this copy.",
  isbn: "10 or 13 digits. Spaces and dashes are fine.",
  language: "For example English, Indonesian or French.",
  coverUrl: "Link to the published artwork, if the catalogue missed it.",
};
const placeholders: Record<keyof typeof labels, string> = {
  title: "e.g. A Room of One's Own",
  author: "e.g. Virginia Woolf",
  publisher: "e.g. Penguin Classics",
  year: "e.g. 1929",
  pages: "e.g. 172",
  isbn: "e.g. 9780140126938",
  language: "e.g. English",
  coverUrl: "https://…",
};
type Field = keyof typeof labels;

export function ManualForm({
  manualDraft = {},
  save,
  saving,
  setMessage,
  includeCoverUrl = true,
}: {
  manualDraft?: Partial<Candidate>;
  save: (candidate: Candidate) => Promise<boolean>;
  saving: string | null;
  setMessage: (message: string) => void;
  includeCoverUrl?: boolean;
}) {
  const id = useId();
  const [manual, setManual] = useState<Record<Field, string>>({
    title: manualDraft.title ?? "",
    author: manualDraft.author ?? "",
    publisher: manualDraft.publisher ?? "",
    year: manualDraft.year?.toString() ?? "",
    pages: manualDraft.pages?.toString() ?? "",
    isbn: manualDraft.isbn ?? "",
    language: manualDraft.language ?? "",
    coverUrl: manualDraft.coverUrl ?? "",
  });
  async function saveManual(event: FormEvent) {
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
    <form className="catalog-form catalog-manual" onSubmit={saveManual}>
      <p className="catalog-form-note">Only the title is required. Leave unknown details blank.</p>
      {groups.map((group) => {
        const fields = group.fields.filter((field) => includeCoverUrl || field !== "coverUrl");
        if (fields.length === 0) return null;
        return (
          <fieldset className="catalog-fieldset" key={group.legend}>
            <legend>{group.legend}</legend>
            <div className="catalog-fields">
              {fields.map((field) => {
                const hint = hints[field];
                return (
                  <div className={`catalog-field catalog-field-${field}`} key={field}>
                    <label htmlFor={`${id}-${field}`}>
                      <span className="label">
                        {labels[field]}
                        {field === "title" ? " (required)" : ""}
                      </span>
                      <input
                        className="control-input"
                        id={`${id}-${field}`}
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
                        placeholder={placeholders[field]}
                        autoComplete="off"
                        spellCheck={field === "isbn" ? false : undefined}
                        aria-describedby={hint ? `${id}-${field}-hint` : undefined}
                        value={manual[field]}
                        onChange={(event) => setManual({ ...manual, [field]: event.target.value })}
                      />
                    </label>
                    {hint ? (
                      <span className="control-hint" id={`${id}-${field}-hint`}>
                        {hint}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </fieldset>
        );
      })}
      <button
        className="primary"
        type="submit"
        aria-busy={saving !== null}
        disabled={saving !== null}
      >
        <SaveIcon />
        {saving ? "Saving" : "Save book"}
      </button>
    </form>
  );
}
