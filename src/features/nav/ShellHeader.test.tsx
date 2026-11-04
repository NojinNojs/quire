import "../shelf/test-dom";
import { Tooltip } from "@base-ui/react/tooltip";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Route } from "./routes";
import { ShellHeader } from "./ShellHeader";
import type { NavMode } from "./useNavMode";

afterEach(cleanup);

function renderHeader({
  route = "shelf",
  mode = "expanded",
  onScan,
}: {
  route?: Route;
  mode?: NavMode;
  onScan?: () => void;
} = {}) {
  const onToggle = vi.fn();
  const onOpenSearch = vi.fn();
  const view = render(
    <Tooltip.Provider>
      <ShellHeader
        route={route}
        mode={mode}
        onToggle={onToggle}
        searchOpen={false}
        onOpenSearch={onOpenSearch}
        onScan={onScan}
      />
    </Tooltip.Provider>,
  );
  return { ...view, onToggle, onOpenSearch };
}

const routes: [Route, string, string][] = [
  ["shelf", "Library", "Collection"],
  ["stats", "Insights", "Reading year"],
  ["settings", "Account", "Settings"],
  [{ name: "book", id: "example-id" }, "Library", "Book"],
];

describe("shell header", () => {
  it.each(routes)("names the current route for %j", (route, group, label) => {
    renderHeader({ route });
    expect(screen.getByText(group)).toBeTruthy();
    expect(screen.getByText(label).getAttribute("aria-current")).toBe("page");
  });

  it("carries the rail width control with its expand state and handler", () => {
    const { onToggle } = renderHeader();
    const collapse = screen.getByRole("button", { name: "Collapse navigation" });
    expect(collapse.getAttribute("aria-expanded")).toBe("true");
    expect(collapse.getAttribute("aria-controls")).toBe("main-navigation");
    fireEvent.click(collapse);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renames the width control when the rail is compact", () => {
    renderHeader({ mode: "compact" });
    const expand = screen.getByRole("button", { name: "Expand navigation" });
    expect(expand.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps search, the capture pair and More as sibling controls", () => {
    renderHeader({ onScan: () => {} });
    const search = screen.getByRole("button", { name: "Search navigation" });
    const scan = screen.getByRole("button", { name: "Scan ISBN" });
    const more = screen.getByRole("button", { name: "More navigation" });
    expect(search.closest("button")).toBe(search);
    expect(scan.closest("button")).toBe(scan);
    expect(scan.textContent).toContain("Scan ISBN");
    expect(more.closest("button")).toBe(more);
    const add = screen.getByRole("link", { name: "Add book" });
    expect(add.getAttribute("href")).toBe("#/search");
    // The pair shares one frame; neither half wraps the other.
    expect(add.parentElement).toBe(scan.parentElement);
  });

  it("opens navigation search from the header trigger", () => {
    const { onOpenSearch } = renderHeader();
    fireEvent.click(screen.getByRole("button", { name: "Search navigation" }));
    expect(onOpenSearch).toHaveBeenCalledTimes(1);
  });
});
