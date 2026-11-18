import { spawn } from "node:child_process";

export async function startEvidenceServer(port, stack) {
  const server = spawn("bun", ["run", "dev", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    env: {
      ...process.env,
      VITE_SUPABASE_URL: stack.API_URL,
      VITE_SUPABASE_ANON_KEY: stack.ANON_KEY,
      FORCE_COLOR: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  let output = "";
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Evidence server timed out: ${output}`)), 30000);
      const finish = (error) => {
        clearTimeout(timer);
        if (error) reject(error);
        else resolve();
      };
      server.stdout.on("data", (chunk) => {
        output = (output + chunk).slice(-16384);
        if (output.includes(`http://127.0.0.1:${port}/`)) finish();
      });
      server.stderr.on("data", (chunk) => { output = (output + chunk).slice(-16384); });
      server.once("error", finish);
      server.once("exit", (code, signal) => finish(new Error(`Evidence server exited (${code ?? signal}): ${output}`)));
    });
    return server;
  } catch (error) {
    try {
      await stopEvidenceServer(server);
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], "Evidence server startup and cleanup failed");
    }
    throw error;
  }
}

export async function stopEvidenceServer(server) {
  if (!server.pid || server.exitCode !== null || server.signalCode !== null) return;
  const exited = new Promise((resolve) => server.once("exit", resolve));
  process.kill(-server.pid, "SIGTERM");
  await exited;
}
