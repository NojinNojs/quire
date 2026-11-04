import "../shelf/test-dom";
import { Tooltip } from "@base-ui/react/tooltip";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CaptureActions } from "./CaptureActions";

afterEach(cleanup);

describe("capture actions", () => {
  function renderActions(onScan?: () => void) {
    render(
      <Tooltip.Provider>
        <CaptureActions onScan={onScan} />
      </Tooltip.Provider>,
    );
  }

  it("opens the add form as a link, so the query string survives the hash change", () => {
    renderActions();
    const add = screen.getByRole("link", { name: "Add book" });
    expect(add.getAttribute("href")).toBe("#/search");
    expect(add.querySelector("button")).toBeNull();
  });

  it("renders no scan affordance without a scanner behind it", () => {
    renderActions();
    expect(screen.queryByRole("button", { name: "Scan ISBN" })).toBeNull();
  });

  it("hands the scan button the real handler", () => {
    const onScan = vi.fn();
    renderActions(onScan);
    const scan = screen.getByRole("button", { name: "Scan ISBN" });
    expect(scan.getAttribute("type")).toBe("button");
    expect(scan.textContent).toContain("Scan ISBN");
    fireEvent.click(scan);
    expect(onScan).toHaveBeenCalledTimes(1);
  });
});
