import "../shelf/test-dom";
import { Tooltip } from "@base-ui/react/tooltip";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ShellNav } from "./ShellNav";
import type { NavMode } from "./useNavMode";

afterEach(cleanup);

function renderNav(mode: NavMode = "expanded") {
  render(
    <Tooltip.Provider>
      <ShellNav route="today" mode={mode} />
    </Tooltip.Provider>,
  );
  return screen.getByRole("navigation", { name: "Main navigation" });
}

describe("shell navigation", () => {
  it("keeps three dock destinations, the records and the utilities", () => {
    const nav = renderNav();
    for (const name of ["Today", "Collection", "Add book", "Journal", "Reading year"]) {
      expect(within(nav).getByRole("link", { name })).toBeTruthy();
    }
    expect(within(nav).getByRole("link", { name: "Settings" })).toBeTruthy();
    expect(within(nav).getByRole("button", { name: "Guide" })).toBeTruthy();
  });

  it("leaves the rail width control out of the navigation landmark", () => {
    const nav = renderNav();
    expect(within(nav).queryByRole("button", { name: /navigation$/ })).toBeNull();
  });

  it("starts the rail with the logo cell instead of a toggle", () => {
    const nav = renderNav();
    const head = nav.querySelector(".rail-head");
    expect(head?.querySelector(".brand")?.textContent).toContain("Quire");
    expect(head?.querySelector("button")).toBeNull();
  });
});
