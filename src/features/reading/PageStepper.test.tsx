// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PageStepper } from "./PageStepper";

// This file exercises the input contract without depending on animation frames.
vi.mock("../../lib/motion", () => ({ useMotionEffect: () => {}, useReducedMotion: () => true }));

afterEach(cleanup);

it("caps a pasted amount at the remaining pages and logs only that amount", () => {
  const log = vi.fn();
  render(<PageStepper current={547} total={550} disabled={false} onLog={log} />);
  const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Pages read" });
  fireEvent.change(input, { target: { value: "2323123156" } });

  expect(input.value).toBe("3");
  expect(screen.getByRole<HTMLButtonElement>("button", { name: "Add 1 page" }).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Log 3 pages" }));
  expect(log).toHaveBeenCalledExactlyOnceWith(3);
});

it("caps the retained amount when saved progress leaves fewer pages", () => {
  const log = vi.fn();
  const { rerender } = render(
    <PageStepper current={500} total={550} disabled={false} onLog={log} />,
  );
  const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Pages read" });
  fireEvent.change(input, { target: { value: "25" } });
  rerender(<PageStepper current={548} total={550} disabled={false} onLog={log} />);

  expect(input.value).toBe("2");
  fireEvent.change(input, { target: { value: "" } });
  expect(input.value).toBe("");
  expect(screen.queryByRole("button", { name: "Log 0 pages" })).toBeNull();
  expect(screen.getByRole<HTMLButtonElement>("button", { name: "Log pages" }).disabled).toBe(true);
});

it("bounds an unknown edition to the largest storable page number", () => {
  const log = vi.fn();
  render(<PageStepper current={2_147_483_645} total={null} disabled={false} onLog={log} />);
  const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Pages read" });
  fireEvent.change(input, { target: { value: "900" } });

  expect(input.value).toBe("2");
  fireEvent.click(screen.getByRole("button", { name: "Log 2 pages" }));
  expect(log).toHaveBeenCalledExactlyOnceWith(2);
});

it("keeps the amount canonical while editing and rejects ambiguous numeric formats", () => {
  render(<PageStepper current={75} total={550} disabled={false} onLog={() => {}} />);
  const input = screen.getByLabelText<HTMLInputElement>("Pages read");

  fireEvent.change(input, { target: { value: "010" } });
  expect(input.value).toBe("10");

  for (const value of ["010.000", "1,000", "1e2", "-5"]) {
    fireEvent.change(input, { target: { value } });
    expect(input.value).toBe("10");
  }
  expect(screen.getByRole("button", { name: "Log 10 pages" })).toBeTruthy();
});
