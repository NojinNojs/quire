import "../../features/shelf/test-dom";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
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
  const press = (key: string) =>
    fireEvent.keyDown(document.activeElement ?? control, { key, bubbles: true });
  const highlighted = () => document.querySelector("[data-highlighted] > div")?.textContent ?? "";
  return { ...view, control, press, highlighted, onChange };
}

it("opens from the keyboard, moves the highlight and commits exactly once with Enter", async () => {
  const view = setup();
  expect(view.control.getAttribute("aria-expanded")).toBe("false");
  view.press("ArrowDown");
  const listbox = await view.findByRole("listbox");
  expect(listbox).toBeTruthy();
  expect(view.control.getAttribute("aria-expanded")).toBe("true");
  expect(view.highlighted()).toBe("Reading");
  view.press("ArrowDown");
  expect(view.highlighted()).toBe("Finished");
  view.press("ArrowDown");
  expect(view.highlighted()).toBe("Finished");
  view.press("ArrowUp");
  expect(view.highlighted()).toBe("Reading");
  view.press("Home");
  expect(view.highlighted()).toBe("All statuses");
  view.press("End");
  expect(view.highlighted()).toBe("Finished");
  view.press("Enter");
  await waitFor(() => expect(view.onChange).toHaveBeenCalledExactlyOnceWith("finished"));
  await waitFor(() => expect(view.control.textContent).toContain("Finished"));
  expect(view.queryByRole("listbox")).toBeNull();
  expect(document.activeElement).toBe(view.control);
});

it("closes on Escape without committing and keeps the current value", async () => {
  const view = setup();
  fireEvent.click(view.control);
  await view.findByRole("listbox");
  view.press("End");
  view.press("Escape");
  await waitFor(() => expect(view.queryByRole("listbox")).toBeNull());
  expect(view.onChange).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(view.control);
  expect(view.control.textContent).toContain("Reading");
});

it("finds an option by the letters typed on the trigger", async () => {
  const view = setup();
  view.press("ArrowDown");
  await view.findByRole("listbox");
  view.press("f");
  expect(view.highlighted()).toBe("Finished");
  view.press("Enter");
  await waitFor(() => expect(view.onChange).toHaveBeenCalledExactlyOnceWith("finished"));

  view.press("ArrowDown");
  await view.findByRole("listbox");
  view.press("a");
  expect(view.highlighted()).toBe("All statuses");
  view.press("Enter");
  await waitFor(() => expect(view.onChange).toHaveBeenLastCalledWith(""));
});

it("commits a pointer choice and dismisses on an outside press", async () => {
  const view = setup();
  fireEvent.click(view.control);
  const option = await view.findByRole("option", { name: "All statuses" });
  fireEvent.pointerDown(option, { pointerType: "mouse" });
  fireEvent.click(option, { detail: 1 });
  await waitFor(() => expect(view.onChange).toHaveBeenCalledExactlyOnceWith(""));
  expect(document.activeElement).toBe(view.control);
  fireEvent.click(view.control);
  await view.findByRole("listbox");
  fireEvent.pointerDown(document.body);
  await waitFor(() => expect(view.queryByRole("listbox")).toBeNull());
  expect(view.onChange).toHaveBeenCalledTimes(1);
});
