import "../shelf/test-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { shelfBook } from "../shelf/fixtures";
import { BookDetail } from "./BookDetail";

afterEach(cleanup);

it("gives the shared book detail exactly one main landmark around the book article", () => {
  render(
    <BookDetail book={shelfBook()} current={12} save={async () => {}} remove={async () => {}}>
      <p>Reading controls</p>
    </BookDetail>,
  );
  const main = screen.getByRole("main");
  expect(document.querySelectorAll("main")).toHaveLength(1);
  const articles = main.querySelectorAll("article");
  expect(articles).toHaveLength(1);
  const article = articles[0];
  if (!article) throw new Error("Book detail article missing");
  expect(article.contains(screen.getByRole("heading", { level: 1 }))).toBe(true);
  expect(article.contains(screen.getByText("Reading controls"))).toBe(true);
  expect(article.contains(main)).toBe(false);
});
