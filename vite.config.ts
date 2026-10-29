import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // preview tunnels (cloudflared quick tunnels) need to be allowed as hosts
  server: {
    allowedHosts: [".trycloudflare.com"],
    proxy: {
      "/gb": {
        target: "https://books.google.com",
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/gb/, ""),
      },
    },
  },
  test: {
    // Playwright specs live in tests/e2e and are run by their own runner
    exclude: ["**/node_modules/**", "**/dist/**", "**/.worktrees/**", "tests/e2e/**"],
  },
});
