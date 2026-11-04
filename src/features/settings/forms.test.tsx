// @vitest-environment jsdom
import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithToast } from "../../components/toast/test-utils";
import type { ReaderProfile } from "../../data/profile";
import { PasswordForm } from "./PasswordForm";
import { ProfileForm } from "./ProfileForm";

const profile: ReaderProfile = { id: "reader-1", display_name: "Alice Reader", annual_goal: 12 };

function inputValue(label: string) {
  return (screen.getByLabelText(label) as HTMLInputElement).value;
}

afterEach(cleanup);

describe("ProfileForm", () => {
  it("saves the trimmed name and whole-number goal together", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    renderWithToast(<ProfileForm profile={profile} save={save} />);
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "  Alice R.  " } });
    fireEvent.change(screen.getByLabelText("Annual goal"), {
      target: { value: "24" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect((await screen.findByText("Profile saved.")).textContent).toBe("Profile saved.");
    expect(save).toHaveBeenCalledWith({ display_name: "Alice R.", annual_goal: 24 });
  });

  it("sends null for a blank name and blank goal", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    renderWithToast(<ProfileForm profile={profile} save={save} />);
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText("Annual goal"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await screen.findByText("Profile saved.");
    expect(save).toHaveBeenCalledWith({ display_name: null, annual_goal: null });
  });

  it.each(["0", "501", "1.5"])("rejects an invalid goal %s without saving", async (goal) => {
    const save = vi.fn();
    renderWithToast(<ProfileForm profile={profile} save={save} />);
    fireEvent.change(screen.getByLabelText("Annual goal"), {
      target: { value: goal },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Annual goal must be a whole number from 1 to 500, or blank.",
    );
    expect(save).not.toHaveBeenCalled();
  });

  it("keeps the draft when saving fails", async () => {
    const save = vi.fn().mockRejectedValue(new Error("Could not save your profile. Try again."));
    renderWithToast(<ProfileForm profile={profile} save={save} />);
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "New Name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect((await screen.findAllByText(/Could not save your profile/)).length).toBeGreaterThan(0);
    expect(document.querySelector(".control-error")?.getAttribute("role")).toBeNull();
    expect(inputValue("Display name")).toBe("New Name");
    expect(screen.queryByText("Profile saved.")).toBeNull();
  });

  it("shows a legacy long name intact and caps the input at 80 characters", () => {
    renderWithToast(
      <ProfileForm profile={{ ...profile, display_name: "L".repeat(100) }} save={vi.fn()} />,
    );
    expect(inputValue("Display name")).toBe("L".repeat(100));
    expect(screen.getByLabelText("Display name").getAttribute("maxlength")).toBe("80");
  });
});

describe("PasswordForm", () => {
  it("refuses a short password without calling the account API", async () => {
    const updateUser = vi.fn(async () => ({ data: {}, error: null }));
    renderWithToast(
      <PasswordForm client={{ auth: { updateUser } } as unknown as SupabaseClient} />,
    );
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Use at least 8 characters");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("refuses a mismatch without calling the account API", async () => {
    const updateUser = vi.fn(async () => ({ data: {}, error: null }));
    renderWithToast(
      <PasswordForm client={{ auth: { updateUser } } as unknown as SupabaseClient} />,
    );
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "longenough" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "different1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Passwords do not match.");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("updates the password, reports success and calls onSaved once", async () => {
    const updateUser = vi.fn(async () => ({ data: {}, error: null }));
    const onSaved = vi.fn();
    renderWithToast(
      <PasswordForm
        client={{ auth: { updateUser } } as unknown as SupabaseClient}
        onSaved={onSaved}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("New password").getAttribute("type")).toBe("text");
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "longenough" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "longenough" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect((await screen.findByText("Password updated.")).textContent).toBe("Password updated.");
    expect(updateUser).toHaveBeenCalledTimes(1);
    expect(updateUser).toHaveBeenCalledWith({ password: "longenough" });
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(inputValue("New password")).toBe("");
  });

  it("shows a reauthentication error and never claims success", async () => {
    const updateUser = vi.fn(async () => ({
      data: {},
      error: { message: "Password update requires reauthentication. Sign in again." },
    }));
    const onSaved = vi.fn();
    renderWithToast(
      <PasswordForm
        client={{ auth: { updateUser } } as unknown as SupabaseClient}
        onSaved={onSaved}
      />,
    );
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "longenough" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "longenough" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect((await screen.findAllByText(/requires reauthentication/)).length).toBeGreaterThan(0);
    expect(screen.queryByText("Password updated.")).toBeNull();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
