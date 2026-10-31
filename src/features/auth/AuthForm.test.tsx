// @vitest-environment jsdom
import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm, passwordStrength } from "./AuthForm";

const signUp = vi.fn();
const signInWithPassword = vi.fn();
const resetPasswordForEmail = vi.fn();
const client = {
  auth: { signUp, signInWithPassword, resetPasswordForEmail },
} as unknown as SupabaseClient;

beforeEach(() => {
  window.history.replaceState(null, "", "/#/search");
  window.localStorage.setItem("quire:cover-seen", "true");
  vi.resetAllMocks();
});
afterEach(cleanup);

function registration() {
  render(<AuthForm client={client} />);
  fireEvent.click(screen.getByRole("button", { name: "No account yet? Create one" }));
}

function credentials(password = "Library-card42") {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "reader@quire.local" } });
  fireEvent.change(screen.getByLabelText("Password", { exact: true }), {
    target: { value: password },
  });
}

describe("authentication", () => {
  it("keeps the password hidden until requested and offers the demo", () => {
    render(<AuthForm client={client} />);
    const password = screen.getByLabelText("Password", { exact: true });
    expect(password.getAttribute("type")).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(password.getAttribute("type")).toBe("text");
    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(password.getAttribute("type")).toBe("password");
    expect(screen.queryByRole("link", { name: "Take a quick tour" })).toBeNull();
    expect(screen.getByRole("link", { name: "Try the interactive demo" })).toBeTruthy();
  });

  it("recovers from a reset-link network failure and permits retry", async () => {
    resetPasswordForEmail.mockRejectedValueOnce(new Error("offline"));
    render(<AuthForm client={client} />);
    credentials();
    fireEvent.click(screen.getByRole("button", { name: "Forgot your password?" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("Could not send a reset link"),
    );
    resetPasswordForEmail.mockResolvedValueOnce({ error: null });
    fireEvent.click(screen.getByRole("button", { name: "Forgot your password?" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("Reset link sent"),
    );
  });
  it.each([
    ["", "Weak"],
    ["Ab1!", "Weak"],
    ["eightabc", "Fair"],
    ["Abcd123!", "Fair"],
    ["abcdefghijklmnop", "Fair"],
    ["Library-card42", "Strong"],
  ])("rates %j as %s", (password, expected) => {
    expect(passwordStrength(password)).toBe(expected);
  });

  it("prints strength labels and updates the filling rule state only on registration", () => {
    render(<AuthForm client={client} />);
    expect(screen.queryByText(/Password strength/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "No account yet? Create one" }));
    expect(screen.getByText("Password strength: Weak").parentElement?.dataset.strength).toBe(
      "Weak",
    );
    credentials("eightabc");
    expect(screen.getByText("Password strength: Fair").parentElement?.dataset.strength).toBe(
      "Fair",
    );
    credentials();
    expect(screen.getByText("Password strength: Strong").parentElement?.dataset.strength).toBe(
      "Strong",
    );
  });

  it("links a mismatch to Repeat, blocks signup, and clears it when either field matches", () => {
    registration();
    credentials();
    const repeat = screen.getByLabelText("Repeat");
    fireEvent.change(repeat, { target: { value: "Different-card42" } });
    expect(repeat.getAttribute("aria-invalid")).toBe("true");
    expect(repeat.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Create account" }).disabled).toBe(
      true,
    );
    const form = screen.getByRole("button", { name: "Create account" }).closest("form");
    if (!form) throw new Error("Registration form missing");
    fireEvent.submit(form);
    expect(signUp).not.toHaveBeenCalled();
    credentials("Different-card42");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(repeat.getAttribute("aria-invalid")).toBe("false");
    credentials();
    expect(screen.getByRole("alert").textContent).toBe("Passwords do not match.");
    fireEvent.change(repeat, { target: { value: "Library-card42" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("persists the face across remounts while preserving the hash and other query parameters", () => {
    window.history.replaceState(null, "", "/?source=card#/shelf");
    registration();
    expect(window.location.hash).toBe("#/shelf");
    expect(window.location.search).toBe("?source=card&auth=signup");
    cleanup();
    render(<AuthForm client={client} />);
    expect(screen.getByRole("heading").textContent).toBe("Create an account");
    fireEvent.click(screen.getByRole("button", { name: "Already have an account? Sign in" }));
    expect(window.location.search).toBe("?source=card");
    expect(window.location.hash).toBe("#/shelf");
  });

  it("preserves signup arguments and confirmation copy for the two-field registration flow", async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: null });
    registration();
    credentials();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        "Check your email to confirm the account, then sign in.",
      ),
    );
    expect(signUp).toHaveBeenCalledWith({
      email: "reader@quire.local",
      password: "Library-card42",
    });
  });

  it("clears the signup URL on success so signing out returns to sign in", async () => {
    signUp.mockResolvedValue({ data: { session: {} }, error: null });
    registration();
    credentials();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(window.location.search).toBe(""));
    expect(window.location.hash).toBe("#/search");
    cleanup();
    render(<AuthForm client={client} />);
    expect(screen.getByRole("heading").textContent).toBe("Sign in");
  });

  it("keeps issuing after session success until the shell replaces the card", async () => {
    signInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });
    render(<AuthForm client={client} />);
    credentials();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "reader@quire.local",
        password: "Library-card42",
      }),
    );
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Issuing card" }).disabled).toBe(
      true,
    );
  });

  it.each([
    [false, "Invalid login credentials"],
    [true, "Could not reach your account. Check your connection and try again."],
  ])("preserves inline error copy on failure (network: %s)", async (network, message) => {
    if (network) signInWithPassword.mockRejectedValue(new Error("offline"));
    else signInWithPassword.mockResolvedValue({ error: { message } });
    render(<AuthForm client={client} />);
    credentials();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(message));
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Try again" }).disabled).toBe(
      false,
    );
  });
});
