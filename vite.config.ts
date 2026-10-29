import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // preview tunnels (cloudflared quick tunnels) need to be allowed as hosts
  server: { allowedHosts: [".trycloudflare.com"] },
});
