import "../shelf/test-dom";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderWithToast } from "../../components/toast/test-utils";
import { DemoSearch } from "./DemoSearch";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("shows an honest empty sample result and prefills manual entry for a scanned ISBN", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const onScanHandled = vi.fn();
  const props = { books: [], addBook: async () => true, onScanHandled };
  const view = renderWithToast(
    <DemoSearch {...props} scanRequest={{ isbn: "9780140328721", nonce: 1 }} />,
  );

  expect((screen.getByLabelText("Title, author or ISBN") as HTMLInputElement).value).toBe(
    "9780140328721",
  );
  expect(screen.getByText(/No sample edition matches/)).toBeTruthy();
  expect(onScanHandled).toHaveBeenCalledWith(1);

  fireEvent.click(screen.getByRole("button", { name: "Enter this book manually" }));
  expect((screen.getByLabelText("ISBN") as HTMLInputElement).value).toBe("9780140328721");
  expect(fetchMock).not.toHaveBeenCalled();

  view.rerender(
    <DemoSearch
      {...props}
      scanRequest={{ isbn: "9780140328721", nonce: 2 }}
      onScanHandled={onScanHandled}
    />,
  );
  expect(onScanHandled).toHaveBeenLastCalledWith(2);
  expect((screen.getByLabelText("Title, author or ISBN") as HTMLInputElement).value).toBe(
    "9780140328721",
  );
});

it("keeps the sample catalogue free of external results", () => {
  renderWithToast(<DemoSearch books={[]} addBook={async () => true} />);
  expect(screen.getByText("9 matches")).toBeTruthy();
  expect(screen.getByText(/never contacts an external book service/)).toBeTruthy();
});
