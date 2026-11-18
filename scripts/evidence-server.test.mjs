import { expect, test } from "vitest";
import { startEvidenceServer, stopEvidenceServer } from "./evidence-server.mjs";

const stack = { API_URL: "http://127.0.0.1:54321", ANON_KEY: "unused-local-test-key" };

function sentinel() {
  return Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: () => new Response("existing server"),
  });
}

test("an occupied port is rejected without stopping the existing server", async () => {
  const existing = sentinel();
  try {
    await expect(startEvidenceServer(existing.port, stack)).rejects.toThrow(/already in use/i);
    expect(await (await fetch(existing.url)).text()).toBe("existing server");
  } finally {
    await existing.stop(true);
  }
}, 40000);

test("owned server shutdown releases the app listener", async () => {
  const reservation = sentinel();
  const port = reservation.port;
  await reservation.stop(true);
  const server = await startEvidenceServer(port, stack);
  try {
    expect((await fetch(`http://127.0.0.1:${port}/`)).status).toBe(200);
  } finally {
    await stopEvidenceServer(server);
  }
  await expect.poll(async () => {
    try {
      await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(500) });
      return false;
    } catch {
      return true;
    }
  }).toBe(true);
}, 40000);
