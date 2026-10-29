import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CandidateList } from "./CandidateList";

const props = {
  searching: false,
  searched: true,
  errors: [],
  candidates: [],
  saved: new Set<string>(),
  saving: null,
  save: async () => true,
  selectTab: () => {},
  run: async () => {},
};
describe("catalogue states", () => {
  it("shows three row skeletons and suppresses empty copy while loading", () => {
    const html = renderToStaticMarkup(<CandidateList {...props} searching />);
    expect(html.match(/class="catalog-row"/g)).toHaveLength(3);
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("No catalogue matches");
  });
  it("offers exactly one action for an empty list", () => {
    const html = renderToStaticMarkup(<CandidateList {...props} />);
    expect(html).toContain("No catalogue matches for this search.");
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain("Enter manually");
  });
  it("keeps partial errors and successful candidates actionable together", () => {
    const html = renderToStaticMarkup(
      <CandidateList
        {...props}
        errors={["Open Library is unavailable."]}
        candidates={[
          {
            title: "An edition",
            author: null,
            publisher: null,
            year: null,
            pages: null,
            isbn: null,
            language: null,
            coverUrl: null,
            source: "Google Books",
          },
        ]}
      />,
    );
    expect(html).toContain("Open Library is unavailable.");
    expect(html).toContain("Try again");
    expect(html).toContain("Enter manually");
    expect(html).toContain("An edition");
    expect(html).toContain('class="quiet save-action"');
    expect(html).not.toContain("No catalogue matches");
  });
  it("shows recovery instead of an empty state when all providers fail", () => {
    const html = renderToStaticMarkup(
      <CandidateList {...props} errors={["Both sources unavailable."]} />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("Try again");
    expect(html).toContain("Enter manually");
    expect(html).not.toContain('class="empty-state"');
  });
});
