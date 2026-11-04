import "../../features/shelf/test-dom";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Tooltip } from "./Tooltip";

afterEach(cleanup);

it("opens on focus, names the control, and closes on Escape", async () => {
  const view = render(
    <Tooltip label="Collapse navigation">
      <button type="button" aria-label="Collapse navigation">
        Toggle
      </button>
    </Tooltip>,
  );
  const trigger = view.getByRole("button", { name: "Collapse navigation" });
  trigger.focus();
  const tooltip = await view.findByRole("tooltip");
  expect(tooltip.textContent).toBe("Collapse navigation");
  const describedBy = trigger.getAttribute("aria-describedby");
  expect(describedBy?.split(" ")).toContain(tooltip.id);
  fireEvent.keyDown(document.activeElement ?? trigger, { key: "Escape" });
  await waitFor(() => expect(view.queryByRole("tooltip")).toBeNull());
  expect(document.activeElement).toBe(trigger);
});

it("stays silent when disabled and closes when focus leaves", async () => {
  const view = render(
    <>
      <Tooltip label="Settings" disabled>
        <a href="#/settings" aria-label="Settings">
          Settings
        </a>
      </Tooltip>
      <Tooltip label="Guide">
        <a href="#/guide" aria-label="Guide">
          Guide
        </a>
      </Tooltip>
      <button type="button">Elsewhere</button>
    </>,
  );
  const settings = view.getByRole("link", { name: "Settings" });
  fireEvent.focus(settings);
  expect(view.queryByRole("tooltip")).toBeNull();

  const guide = view.getByRole("link", { name: "Guide" });
  guide.focus();
  await view.findByRole("tooltip");
  view.getByRole("button", { name: "Elsewhere" }).focus();
  await waitFor(() => expect(view.queryByRole("tooltip")).toBeNull());
});
