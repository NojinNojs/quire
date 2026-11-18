# Quire

Quire is a private reading companion for cataloguing books, tracking reading progress, writing reviews, and viewing a reading journal and yearly summary. It is a Vite, React, and TypeScript app backed by Supabase.

The Today dashboard uses a bento layout for reading progress, streaks, and yearly activity. Subtle transitions guide attention to updates and respect reduced-motion preferences.

## Setup

Install Bun 1.4.4 or newer. From a clean clone:

```bash
bun install --frozen-lockfile
bun run dev
```

Open the displayed local URL. To explore without an account or Supabase configuration, open `http://localhost:5173/?demo=1#/today` or select **Try the interactive demo**. Demo data stays in browser storage; **Reset demo** restores the sample library.

For account features, install the Supabase CLI and a Docker-compatible container runtime, then run `supabase start`. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the local API URL and anon key from `supabase status`, or to those of your Supabase project. Do not commit credentials. For a hosted project, apply the SQL migrations in `supabase/migrations/` in filename order using the Supabase CLI; back up existing data before database changes. Alternatively, use `nix develop` for the project development environment.

## Checks and contributions

```bash
bun run typecheck
bun run test                # Vitest unit tests, not bun:test
bun run test:smoke          # database smoke cleanup regression tests
bun run build
bun run gate                # lint, typecheck, unit tests, build, database smoke, e2e
bun run test:e2e            # Playwright suite
bash scripts/install-hooks.sh
```

The gate skips database smoke when local Supabase is unavailable and skips end-to-end tests when Supabase or a system Chromium browser is unavailable. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if Chromium is not at `/run/current-system/sw/bin/brave`. Review the output for skipped checks. Local captures belong in ignored `test-results/`; attach relevant evidence and gate output to the pull request.

Database smoke tests, browser tests, and evidence captures track and remove only their generated accounts, including after setup failures. If an evidence upload's completion is unknown, cleanup fails explicitly and reports the generated IDs and path for inspection rather than racing the pending upload.

Use conventional commit messages, such as `fix(catalog): handle missing metadata`. `bun run release 0.2.0` forwards the version argument, runs the gate, updates the package version, builds, commits, tags, and pushes; it requires a clean working tree.

## Password recovery

On the sign-in screen, enter your email and select **Forgot your password?**. Open the emailed link to choose a new password. If the link has expired, request a fresh one from the recovery screen. Configure your Supabase Auth redirect URLs to allow the application URL so recovery links can return to it.

## Licence

MIT. See [LICENSE](LICENSE).
