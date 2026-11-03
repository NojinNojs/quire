// @vitest-environment jsdom
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadProfile, saveProfile } from "../../data/profile";
import { AccountSettings } from "./AccountSettings";
import { DemoSettings } from "./DemoSettings";

vi.mock("../../data/profile", () => ({
  loadProfile: vi.fn(),
  saveProfile: vi.fn(),
}));

const user = { id: "reader-1", email: "alice@example.com" } as unknown as User;
const client = {} as SupabaseClient;
const profile = { id: "reader-1", display_name: "Alice Reader", annual_goal: 12 };

function inputValue(label: string) {
  return (screen.getByLabelText(label) as HTMLInputElement).value;
}

beforeEach(() => {
  vi.mocked(loadProfile).mockReset();
  vi.mocked(saveProfile).mockReset();
});
afterEach(cleanup);

describe("AccountSettings", () => {
  it("loads the profile, shows the read-only email and saves through the owner", async () => {
    vi.mocked(loadProfile).mockResolvedValue(profile);
    vi.mocked(saveProfile).mockResolvedValue(profile);
    render(<AccountSettings user={user} client={client} signOut={vi.fn()} />);
    await screen.findByLabelText("Display name");
    expect(inputValue("Display name")).toBe("Alice Reader");
    screen.getByText("alice@example.com");
    fireEvent.change(screen.getByLabelText("Annual goal"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await screen.findByRole("status");
    expect(saveProfile).toHaveBeenCalledWith(client, "reader-1", {
      display_name: "Alice Reader",
      annual_goal: 30,
    });
  });

  it("treats a missing profile row as an empty form, not an error", async () => {
    vi.mocked(loadProfile).mockResolvedValue(null);
    render(<AccountSettings user={user} client={client} signOut={vi.fn()} />);
    await screen.findByLabelText("Display name");
    expect(inputValue("Display name")).toBe("");
    expect(inputValue("Annual goal")).toBe("");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("offers a retry when the profile cannot load", async () => {
    vi.mocked(loadProfile)
      .mockRejectedValueOnce(new Error("Could not load your profile. Try again."))
      .mockResolvedValueOnce(profile);
    render(<AccountSettings user={user} client={client} signOut={vi.fn()} />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Could not load your profile.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByLabelText("Display name");
    expect(loadProfile).toHaveBeenCalledTimes(2);
  });

  it("signs out through the account action", async () => {
    vi.mocked(loadProfile).mockResolvedValue(profile);
    const signOut = vi.fn().mockResolvedValue(undefined);
    render(<AccountSettings user={user} client={client} signOut={signOut} />);
    await screen.findByLabelText("Display name");
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});

describe("DemoSettings", () => {
  it("saves the profile locally and never fakes an email or password form", async () => {
    const saveProfile = vi.fn().mockResolvedValue(undefined);
    render(
      <DemoSettings
        profile={{ display_name: null, annual_goal: null }}
        saveProfile={saveProfile}
        storageFailed={false}
        leaveDemo={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText("New password")).toBeNull();
    screen.getByText(/runs without an account/);
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Demo Reader" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect((await screen.findByRole("status")).textContent).toBe("Saved on this device.");
    expect(saveProfile).toHaveBeenCalledWith({ display_name: "Demo Reader", annual_goal: null });
  });

  it("keeps the storage warning visible and leaves the demo on request", () => {
    const leaveDemo = vi.fn();
    render(
      <DemoSettings
        profile={{ display_name: null, annual_goal: null }}
        saveProfile={vi.fn()}
        storageFailed
        leaveDemo={leaveDemo}
      />,
    );
    screen.getByText(/cannot be saved on this device/);
    fireEvent.click(screen.getByRole("button", { name: "Leave demo and sign in" }));
    expect(leaveDemo).toHaveBeenCalledTimes(1);
  });
});
