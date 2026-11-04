// @vitest-environment jsdom
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { renderWithToast } from "../../components/toast/test-utils";
import { RecoveryScreen } from "./RecoveryScreen";

const updateUser = vi.fn();
const resetPasswordForEmail = vi.fn();
const client = { auth: { updateUser, resetPasswordForEmail } } as unknown as SupabaseClient;
const user = { id: "reader", email: "reader@quire.local" } as unknown as User;

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function fill(password: string) {
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: password },
  });
}

it("keeps the recovery view open with the error when the new password fails", async () => {
  updateUser.mockResolvedValueOnce({
    error: { message: "New password should be different from the old password." },
  });
  const completeRecovery = vi.fn();
  renderWithToast(
    <RecoveryScreen client={client} user={user} error={null} completeRecovery={completeRecovery} />,
  );
  fill("library-42");
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  await waitFor(() =>
    expect(screen.getAllByText(/different from the old password/).length).toBeGreaterThan(0),
  );
  expect(completeRecovery).not.toHaveBeenCalled();
});

it("completes recovery only after the password is stored", async () => {
  updateUser.mockResolvedValueOnce({ error: null });
  const completeRecovery = vi.fn();
  renderWithToast(
    <RecoveryScreen client={client} user={user} error={null} completeRecovery={completeRecovery} />,
  );
  fill("library-card-42");
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  await waitFor(() => expect(completeRecovery).toHaveBeenCalledOnce());
  expect(updateUser).toHaveBeenCalledWith({ password: "library-card-42" });
});

it("does not complete recovery for a signed-in reader with an invalid link", () => {
  const completeRecovery = vi.fn();
  renderWithToast(
    <RecoveryScreen
      client={client}
      user={user}
      error="Email link is invalid or has expired"
      completeRecovery={completeRecovery}
    />,
  );
  expect(screen.queryByRole("button", { name: "Back to Today" })).toBeNull();
  expect(screen.getByRole("button", { name: "Request a new reset link" })).toBeTruthy();
  expect(completeRecovery).not.toHaveBeenCalled();
});

it("requests a fresh link when the recovery URL is expired", async () => {
  resetPasswordForEmail.mockResolvedValueOnce({ error: null });
  renderWithToast(
    <RecoveryScreen
      client={client}
      user={null}
      error="Email link is invalid or has expired"
      completeRecovery={vi.fn()}
    />,
  );
  expect(screen.getByRole("alert").textContent).toContain("invalid or has expired");
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "reader@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Request a new reset link" }));
  await screen.findByRole("status");
  expect(resetPasswordForEmail).toHaveBeenCalledWith("reader@example.com", {
    redirectTo: window.location.origin + window.location.pathname,
  });
  expect(screen.queryByLabelText("New password")).toBeNull();
});

it("reports a failed link request without completing recovery", async () => {
  resetPasswordForEmail.mockResolvedValueOnce({ error: new Error("offline") });
  const completeRecovery = vi.fn();
  renderWithToast(
    <RecoveryScreen
      client={client}
      user={user}
      error="Expired"
      completeRecovery={completeRecovery}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Request a new reset link" }));
  await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(2));
  expect(screen.queryByRole("status")).toBeNull();
  expect(completeRecovery).not.toHaveBeenCalled();
});
