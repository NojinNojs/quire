// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import noAuthor from "./__fixtures__/google-html-no-author.html?raw";
import noResult from "./__fixtures__/google-html-no-result.html?raw";
import normal from "./__fixtures__/google-html-normal.html?raw";
import { lookupCatalogueHtml, parseCatalogueHtml } from "./catalogueHtml";

describe("Google Books HTML", () => {
  it("reads title and author", () => {
    expect(parseCatalogueHtml(normal)).toEqual({
      title: "Dari dalam kubur: sebuah novel",
      author: "Soe Tjen Marching",
    });
  });
  it("keeps a title without an author and decodes entities", () => {
    expect(parseCatalogueHtml(noAuthor)).toEqual({
      title: "Collected letters & essays",
      author: null,
    });
  });
  it("rejects no-result and malformed pages", () => {
    expect(parseCatalogueHtml(noResult)).toBeNull();
    expect(parseCatalogueHtml("<html></html>")).toBeNull();
  });
  it("fetches through the same-origin proxy", async () => {
    const urls: string[] = [];
    expect(
      await lookupCatalogueHtml("9786020788036", async (url) => {
        urls.push(url);
        return normal;
      }),
    ).toHaveProperty("author", "Soe Tjen Marching");
    expect(urls).toEqual(["/gb/books?vid=ISBN9786020788036"]);
  });
});
