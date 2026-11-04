import { setTimeout as sleep } from "node:timers/promises";
import type { APIRequestContext } from "@playwright/test";
import { stack } from "./stack";

/** The local Supabase mail catcher runs beside the disposable verification stack. */
export const MAIL = process.env.MAIL_URL ?? stack?.MAILPIT_URL ?? stack?.INBUCKET_URL ?? "http://127.0.0.1:54324";

function candidates(value: unknown, found: string[] = []): string[] {
  if (typeof value === "string") found.push(value);
  else if (Array.isArray(value)) for (const item of value) candidates(item, found);
  else if (value && typeof value === "object") for (const item of Object.values(value)) candidates(item, found);
  return found;
}

function decode(text: string): string[] {
  const plain = text.replace(/=\r?\n/g, "").replace(/=3D/gi, "=");
  const decoded = [text, plain];
  for (const chunk of plain.match(/[A-Za-z0-9+/]{80,}={0,2}/g) ?? []) {
    try {
      const binary = atob(chunk);
      if (/[ -~]{40,}/.test(binary)) decoded.push(binary);
    } catch {
      // Not base64; the readable variants above still apply.
    }
  }
  return decoded;
}

function recoveryLink(value: unknown): string | null {
  for (const text of candidates(value)) {
    for (const variant of decode(text)) {
      for (const match of variant.replaceAll("&amp;", "&").match(/https?:\/\/[^\s"'<>\\]+/g) ?? []) {
        if (/\btype=recovery\b/.test(match) || /\btoken(_hash)?=/.test(match)) return match;
      }
    }
  }
  return null;
}

async function mailboxJson(request: APIRequestContext, path: string) {
  const response = await request.get(`${MAIL}${path}`);
  if (!response.ok()) return null;
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function messageIds(value: unknown, ids: string[] = []): string[] {
  if (Array.isArray(value)) for (const item of value) messageIds(item, ids);
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if ((key === "ID" || key === "id") && typeof item === "string") ids.push(item);
      else messageIds(item, ids);
    }
  }
  return ids;
}

/** Polls the local Mailpit search API and fetches matching messages by ID. */
export async function waitForRecoveryLink(
  request: APIRequestContext,
  email: string,
  timeoutMs = 20_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  const searchPath = `/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`;
  let lastShape = "no response";
  while (Date.now() < deadline) {
    const body = await mailboxJson(request, searchPath);
    if (body) {
      lastShape = "mailpit search";
      const inline = recoveryLink(body);
      if (inline) return inline;
      for (const id of messageIds(body)) {
        const message = await mailboxJson(request, `/api/v1/message/${encodeURIComponent(id)}`);
        const link = message ? recoveryLink(message) : null;
        if (link) return link;
      }
    }
    await sleep(500);
  }
  throw new Error(`No recovery email for ${email} within ${timeoutMs}ms (last catcher response: ${lastShape})`);
}
