import "./features/shelf/test-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const session = vi.hoisted(() => ({
  user: null as { id: string } | null,
  ready: true,
  client: {},
  error: "",
  recovery: false,
  recoveryError: null as string | null,
  completeRecovery: vi.fn(),
  signOut: vi.fn(),
  retry: vi.fn(),
}));

vi.mock("./lib/useSession", () => ({ useSession: () => session }));
vi.mock("./features/auth/AuthForm", () => ({ AuthForm: () => <div>Sign in</div> }));
vi.mock("./features/nav/AppShell", () => ({
  AppShell: ({ route }: { route: string | { name: string; id: string } }) => (
    <div>Route: {typeof route === "string" ? route : `${route.name}/${route.id}`}</div>
  ),
}));
vi.mock("./features/integration/BookRoute", () => ({ BookRoute: () => null }));
vi.mock("./features/integration/CatalogueRoute", () => ({ CatalogueRoute: () => null }));
vi.mock("./features/integration/ShelfRoute", () => ({ ShelfRoute: () => null }));
vi.mock("./features/integration/TodayRoute", () => ({ TodayRoute: () => null }));
vi.mock("./features/settings/AccountSettings", () => ({ AccountSettings: () => null }));

beforeEach(() => {
  session.user = null;
  session.ready = true;
  session.error = "";
  session.recovery = false;
  session.recoveryError = null;
  window.history.replaceState(null, "", "/");
});
afterEach(cleanup);

describe("account routes", () => {
  it.each(["/", "/?auth=signup"])("keeps signed-out URL %s clean and defaults to Today", (url) => {
    window.history.replaceState(null, "", url);
    const view = render(<App />);
    expect(screen.getByText("Sign in")).toBeTruthy();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(url);
    session.user = { id: "reader" };
    view.rerender(<App />);
    expect(screen.getByText("Route: today")).toBeTruthy();
    expect(window.location.hash).toBe("");
    expect(window.location.search).toBe(new URL(url, window.location.origin).search);
  });

  it.each([
    ["#/today", "today"],
    ["#/shelf", "shelf"],
    ["#/search", "search"],
    ["#/settings", "settings"],
    ["#/journal", "journal"],
    ["#/stats", "stats"],
    ["#catalogue", "search"],
    ["#/book/example-id", "book/example-id"],
  ])("preserves explicit %s after sign-in", (hash, route) => {
    window.history.replaceState(null, "", `/?auth=signup${hash}`);
    const view = render(<App />);
    expect(window.location.search).toBe("?auth=signup");
    expect(window.location.hash).toBe(hash);
    session.user = { id: "reader" };
    view.rerender(<App />);
    expect(screen.getByText(`Route: ${route}`)).toBeTruthy();
    expect(window.location.hash).toBe(hash);
    expect(window.location.search).toBe("?auth=signup");
  });

  it("retains an explicit route when the session changes without a sign-out action", () => {
    session.user = { id: "reader" };
    window.history.replaceState(null, "", "/#/shelf");
    const view = render(<App />);
    expect(screen.getByText("Route: shelf")).toBeTruthy();
    session.user = null;
    view.rerender(<App />);
    expect(screen.getByText("Sign in")).toBeTruthy();
    expect(window.location.hash).toBe("#/shelf");
    session.user = { id: "reader" };
    view.rerender(<App />);
    expect(screen.getByText("Route: shelf")).toBeTruthy();
    expect(window.location.hash).toBe("#/shelf");
  });

  it("follows a deep link navigated to while signed out", () => {
    const view = render(<App />);
    act(() => {
      window.history.replaceState(null, "", "/#/shelf");
      window.dispatchEvent(new window.Event("hashchange"));
    });
    expect(window.location.hash).toBe("#/shelf");
    session.user = { id: "reader" };
    view.rerender(<App />);
    expect(screen.getByText("Route: shelf")).toBeTruthy();
    expect(window.location.hash).toBe("#/shelf");
  });
  it("shows recovery before the dashboard when a valid session already exists", () => {
    session.user = { id: "reader" };
    session.recovery = true;
    render(<App />);
    expect(screen.getByLabelText("New password")).toBeTruthy();
    expect(screen.queryByText("Route: today")).toBeNull();
  });

  it("offers a new reset link instead of a password form for callback failure", () => {
    session.recoveryError = "Reset link expired";
    render(<App />);
    expect(screen.getByRole("alert").textContent).toContain("Reset link expired");
    expect(screen.getByRole("button", { name: "Request a new reset link" })).toBeTruthy();
    expect(screen.queryByLabelText("New password")).toBeNull();
  });
});
