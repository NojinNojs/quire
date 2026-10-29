import "../../features/shelf/test-dom";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { Select } from "./Select";

afterEach(cleanup);

function Filter({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState("reading");
  return (
    <Select
      label="Status"
      value={value}
      options={[
        { value: "", label: "All statuses" },
        { value: "reading", label: "Reading" },
        { value: "finished", label: "Finished" },
      ]}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

function setup() {
  const onChange = vi.fn();
  const view = render(<Filter onChange={onChange} />);
  const control = view.getByRole("combobox", { name: "Status" });
  control.focus();
  const key = (key: string) => fireEvent.keyDown(control, { key });
  const active = () =>
    document.getElementById(control.getAttribute("aria-activedescendant") ?? "")?.textContent;
  return { ...view, control, key, active, onChange };
}

it("navigates with arrows, Home and End, then commits exactly once with Enter", () => {
  const view = setup();
  view.key("ArrowDown");
  expect(view.control.getAttribute("aria-expanded")).toBe("true");
  expect(view.active()).toBe("Reading");
  view.key("ArrowDown");
  expect(view.active()).toBe("Finished");
  view.key("ArrowDown");
  expect(view.active()).toBe("Finished");
  view.key("ArrowUp");
  expect(view.active()).toBe("Reading");
  view.key("Home");
  expect(view.active()).toBe("All statuses");
  view.key("ArrowUp");
  expect(view.active()).toBe("All statuses");
  view.key("End");
  expect(view.active()).toBe("Finished");
  expect(view.onChange).not.toHaveBeenCalled();
  view.key("Enter");
  expect(view.onChange).toHaveBeenCalledExactlyOnceWith("finished");
  expect(view.control.textContent).toContain("Finished");
  expect(view.queryByRole("listbox")).toBeNull();
  expect(document.activeElement).toBe(view.control);
});

it("cancels a pending choice with Escape and keeps the selected option on reopening", () => {
  const view = setup();
  view.key("Enter");
  view.key("End");
  view.key("Escape");
  expect(view.onChange).not.toHaveBeenCalled();
  expect(view.queryByRole("listbox")).toBeNull();
  expect(document.activeElement).toBe(view.control);
  view.key(" ");
  expect(view.active()).toBe("Reading");
  expect(view.getByRole("option", { name: "Reading" }).getAttribute("aria-selected")).toBe("true");
  view.key("Tab");
  expect(view.queryByRole("listbox")).toBeNull();
  expect(view.onChange).not.toHaveBeenCalled();
});

it("commits pointer choices and dismisses on outside press or blur", () => {
  const view = setup();
  fireEvent.click(view.control);
  fireEvent.click(view.getByRole("option", { name: "All statuses" }));
  expect(view.onChange).toHaveBeenCalledExactlyOnceWith("");
  expect(document.activeElement).toBe(view.control);
  fireEvent.click(view.control);
  fireEvent.pointerDown(document.body);
  expect(view.queryByRole("listbox")).toBeNull();
  fireEvent.click(view.control);
  fireEvent.blur(view.control);
  expect(view.queryByRole("listbox")).toBeNull();
});
