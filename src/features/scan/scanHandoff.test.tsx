// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { ScanSheet } from "./ScanSheet";

afterEach(cleanup);

function Harness() {
  const [open, setOpen] = useState(true);
  return open ? (
    <ScanSheet apis={{}} onClose={() => setOpen(false)} onDetected={() => setOpen(false)} />
  ) : (
    <input aria-label="Search" />
  );
}

it("does not return focus to the opener after the fallback detects an ISBN", () => {
  const opener = document.createElement("button");
  document.body.append(opener);
  opener.focus();

  render(<Harness />);
  const input = screen.getByRole("textbox", { name: "ISBN-13" });
  fireEvent.change(input, { target: { value: "9780140328721" } });
  fireEvent.click(screen.getByRole("button", { name: "Use ISBN" }));

  expect(screen.getByRole("textbox", { name: "Search" })).toBeTruthy();
  expect(document.activeElement).not.toBe(opener);
  opener.remove();
});
