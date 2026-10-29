import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as icons from "../../components/icons";
import { AppShell } from "./AppShell";
import { PlaceholderScreen } from "./PlaceholderScreen";
import { parseRoute } from "./routes";

describe("shell routes", () => {
  it.each([
    ["#/today", "today"],
    ["#/shelf", "shelf"],
    ["#/search", "search"],
    ["#/settings", "settings"],
    ["#catalogue", "search"],
    ["#settings", "settings"],
    ["#/unknown", "today"],
    ["", "today"],
    ["#/shelf/unknown", "today"],
  ])("parses %j as %s", (hash, expected) => {
    expect(parseRoute(hash)).toBe(expected);
  });

  it("renders three named navigation links with only Shelf active", () => {
    const html = renderToStaticMarkup(
      <AppShell route="shelf">
        <PlaceholderScreen screen="shelf" />
      </AppShell>,
    );
    const nav = html.slice(html.indexOf('<nav class="bottom-nav"'));
    expect(nav.match(/<a /g)).toHaveLength(3);
    for (const label of ["Today", "Shelf", "Search"]) {
      expect(nav).toContain(`aria-label="${label}"`);
      expect(nav).toContain(`title="${label}"`);
      expect(nav).toContain(`href="#/${label.toLowerCase()}"`);
    }
    expect(nav).toContain('aria-label="Shelf" title="Shelf" aria-current="page"');
    expect(nav.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toContain("milestone 3");
  });

  it("keeps Settings separate from the primary navigation", () => {
    const html = renderToStaticMarkup(<AppShell route="settings">Settings</AppShell>);
    const nav = html.slice(html.indexOf('<nav class="bottom-nav"'));
    expect(html).toContain('aria-label="Settings" title="Settings" aria-current="page"');
    expect(nav).not.toContain('aria-current="page"');
  });

  it("puts the skip link before the header and provides visible rail labels", () => {
    const html = renderToStaticMarkup(<AppShell route="today">Today</AppShell>);
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('id="main-content"');
    expect(html.indexOf("Skip to main content")).toBeLessThan(html.indexOf("<header"));
    for (const label of ["Today", "Shelf", "Search"]) {
      expect(html).toContain(`<span class="nav-label">${label}</span>`);
    }
  });
});

describe("icon accessibility", () => {
  it.each(Object.entries(icons))(
    "%s is named when informative and hidden when decorative",
    (_, Icon) => {
      const named = renderToStaticMarkup(<Icon label="An accessible icon" />);
      expect(named).toContain('role="img"');
      expect(named).toContain('aria-label="An accessible icon"');
      expect(named).toContain("<title>An accessible icon</title>");
      expect(named).not.toContain("aria-hidden");

      const decorative = renderToStaticMarkup(<Icon />);
      expect(decorative).toContain('aria-hidden="true"');
      expect(decorative).toContain('focusable="false"');
      expect(decorative).not.toContain('role="img"');
      expect(decorative).toContain('viewBox="0 0 24 24"');
      expect(decorative).toContain('stroke-width="1.75"');
      expect(decorative).toContain('stroke-linecap="square"');
    },
  );
});
