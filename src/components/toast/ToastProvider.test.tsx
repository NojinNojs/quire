// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ToastProvider, useToast } from "./ToastProvider";

afterEach(cleanup);

function Harness({ kind, message }: { kind: "success" | "error"; message: string }) {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast[kind](message)}>
      Notify
    </button>
  );
}

it("shows a success toast and dismisses it with the close button", async () => {
  render(
    <ToastProvider>
      <Harness kind="success" message="Profile saved." />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Notify" }));
  expect(await screen.findByText("Profile saved.")).toBeTruthy();
  fireEvent.mouseEnter(screen.getByRole("region", { name: "Notifications" }));
  fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
  await waitFor(() => expect(screen.queryByText("Profile saved.")).toBeNull());
});

it("shows an error toast with an urgent live region", async () => {
  render(
    <ToastProvider>
      <Harness kind="error" message="Could not save your profile." />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Notify" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Could not save your profile.");
});
