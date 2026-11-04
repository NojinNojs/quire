import type { APIRequestContext, Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { waitForRecoveryLink } from "./mail";
import { stack } from "./stack";

const generatedId = globalThis.crypto.randomUUID.bind(globalThis.crypto);

function api() {
  if (!stack) throw new Error("Local Supabase is required");
  return stack;
}

async function createUser(request: APIRequestContext, email: string, password: string) {
  const endpoint = api();
  const response = await request.post(`${endpoint.API_URL}/auth/v1/admin/users`, {
    headers: {
      apikey: endpoint.SERVICE_ROLE_KEY,
      Authorization: `Bearer ${endpoint.SERVICE_ROLE_KEY}`,
    },
    data: { email, password, email_confirm: true },
  });
  expect(response.ok()).toBeTruthy();
  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !("id" in body) || typeof body.id !== "string") {
    throw new Error("Admin create-user response missing ID");
  }
  return body.id;
}

async function removeUser(request: APIRequestContext, id: string) {
  const endpoint = api();
  const response = await request.delete(`${endpoint.API_URL}/auth/v1/admin/users/${id}`, {
    headers: {
      apikey: endpoint.SERVICE_ROLE_KEY,
      Authorization: `Bearer ${endpoint.SERVICE_ROLE_KEY}`,
    },
  });
  expect(response.ok(), "Remove the generated local account").toBeTruthy();
}

async function fillEmail(page: Page, email: string) {
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  const input = page.getByLabel("Email", { exact: true });
  await expect(input).toBeEnabled();
  await input.fill(email);
  await expect(input).toHaveValue(email);
}

async function signIn(page: Page, email: string, password: string, succeeds = true) {
  await fillEmail(page, email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const response = page.waitForResponse((result) =>
    result.url().includes("/auth/v1/token?grant_type=password") && result.request().method() === "POST",
  );
  await page.getByRole("button", { name: /^(Sign in|Try again)$/ }).click();
  expect((await response).ok()).toBe(succeeds);
  if (succeeds) {
    const skip = page.getByRole("button", { name: "Skip tour" });
    const heading = page.getByRole("heading", { name: /(Hello,|Your reading day|Collection)/ });
    await expect(skip.or(heading).first()).toBeVisible();
    if (await skip.isVisible()) await skip.click();
    await page.goto("/#/today");
    await expect(page.getByRole("heading", { name: /(Hello,|Your reading day)/ })).toBeVisible();
  }
}

async function signOut(page: Page) {
  await page.goto("/#/settings");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByLabel("Email")).toBeVisible();
}

test("profile name and annual goal persist, reject invalid goals and clear when blank", async ({
  signedInPage: page,
}) => {
  await page.goto("/#/settings");
  await page.getByLabel("Display name").fill("Alice Reader");
  await page.getByLabel("Annual goal").fill("12");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("region", { name: "Notifications" }).getByText("Profile saved.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Display name")).toHaveValue("Alice Reader");
  await expect(page.getByLabel("Annual goal")).toHaveValue("12");
  await page.goto("/#/today");
  await expect(page.getByRole("heading", { name: "Hello, Alice Reader" })).toBeVisible();
  await page.goto("/#/settings");
  await page.getByLabel("Annual goal").fill("1.5");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("alert")).toContainText("whole number");
  await page.reload();
  await expect(page.getByLabel("Annual goal")).toHaveValue("12");
  await page.goto("/#/settings");
  await page.getByLabel("Annual goal").fill("501");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("alert")).toContainText("1 to 500");
  await expect(page.getByLabel("Annual goal")).toHaveValue("501");
  await page.reload();
  await expect(page.getByLabel("Annual goal")).toHaveValue("12");

  await page.getByLabel("Annual goal").fill("");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByRole("region", { name: "Notifications" }).getByText("Profile saved.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Annual goal")).toHaveValue("");
  await page.goto("/#/today");
  await expect(page.getByText(/of 12 books/)).toHaveCount(0);
});

test("settings changes the password, then only the new password signs in", async ({ page, request }) => {
  const email = `password.${generatedId()}@quire.local`;
  const oldPassword = `E2e-${generatedId()}`;
  const newPassword = `Changed-${generatedId()}`;
  const id = await createUser(request, email, oldPassword);
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Open Quire" }).click();
    await signIn(page, email, oldPassword);
    await expect(page.getByRole("heading", { name: /(Hello,|Your reading day)/ })).toBeVisible();

    await page.goto("/#/settings");
    await page.getByLabel("Display name").fill("Bob Reader");
    await page.getByLabel("Annual goal").fill("7");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByRole("region", { name: "Notifications" }).getByText("Profile saved.")).toBeVisible();
    await signOut(page);
    await signIn(page, email, oldPassword);
    await page.goto("/#/settings");
    await expect(page.getByLabel("Display name")).toHaveValue("Bob Reader");
    await expect(page.getByLabel("Annual goal")).toHaveValue("7");

    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password").fill(`${newPassword}x`);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await page.getByLabel("Confirm new password").fill(newPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByRole("region", { name: "Notifications" }).getByText("Password updated.")).toBeVisible();

    await signOut(page);
    await signIn(page, email, oldPassword, false);
    await expect(page.getByRole("alert")).toBeVisible();
    await signIn(page, email, newPassword);
  } finally {
    await removeUser(request, id);
  }
});

test("recovery link opens the password form before the dashboard, survives reload and replaces the password", async ({
  page,
  request,
}) => {
  const email = `recovery.${generatedId()}@quire.local`;
  const oldPassword = `E2e-${generatedId()}`;
  const newPassword = `Changed-${generatedId()}`;
  const id = await createUser(request, email, oldPassword);
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Open Quire" }).click();
    await fillEmail(page, email);
    await page.getByRole("button", { name: "Forgot your password?" }).click();

    const link = await waitForRecoveryLink(request, email);
    await page.goto(link);
    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
    await expect(page).not.toHaveURL(/#\/today$/);
    await page.reload();
    await expect(page.getByLabel("New password", { exact: true })).toBeVisible();

    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password").fill(`${newPassword}x`);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await page.getByLabel("Confirm new password").fill(newPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page).toHaveURL(/#\/today$/);
    await expect(page.getByRole("heading", { name: /(Hello,|Your reading day)/ })).toBeVisible();

    await page.goto(link);
    await expect(page.getByRole("alert")).toBeVisible();
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Request a new reset link" }).click();
    await expect(page.getByRole("status")).toBeVisible();

    const endpoint = api();
    const newLogin = await request.post(`${endpoint.API_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: endpoint.ANON_KEY },
      data: { email, password: newPassword },
    });
    expect(newLogin.ok()).toBeTruthy();
    const oldLogin = await request.post(`${endpoint.API_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: endpoint.ANON_KEY },
      data: { email, password: oldPassword },
    });
    expect(oldLogin.ok()).toBeFalsy();
  } finally {
    await removeUser(request, id);
  }
});
