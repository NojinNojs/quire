# Quire technical requirements

## Current architecture

The application is a Vite, React and TypeScript client. It uses `@supabase/supabase-js` for authentication, Postgres access, RPCs and private cover storage. SQL migrations in [`supabase/migrations/`](../../supabase/migrations/) define the database; there is no Drizzle layer. Base UI supplies accessible interaction primitives, styled with the application's CSS. See [`package.json`](../../package.json) for the installed versions.

Reading writes use the Supabase `log_pages` RPC; account data is protected by row-level security. The app also has an interactive demo with separate browser-local data. See [Schema](SCHEMA.md) for database boundaries and [the root README](../../README.md) for setup and routes.

## Data flows

1. Catalogue search queries Google Books and Open Library; the reader confirms an edition before saving it. The client normalizes ISBNs and checks for duplicates; the database also enforces per-owner ISBN uniqueness.
2. Reading logs call `log_pages` with a book, positive page count and date. The database adds same-day entries and updates the streak. Pending and undo behavior is local until a write is committed.
3. Journal and reading-year views use saved progress and book data. The demo uses its own browser-local sample data and does not write to an account.
4. Private cover uploads use the `covers` bucket and signed URLs. Uploaded storage paths take display priority over external cover URLs.

## Cover enrichment

For an edition without a catalogue cover, `src/lib/coverLookup.ts` tries Google Books by ISBN, Open Library by ISBN, then Open Library by title and author. It returns an HTTPS image URL or null; each request has a four-second timeout and lookup failure does not prevent saving. Google image links prefer the largest available size.

`scripts/backfill-covers.mjs` applies the lookup to existing books with null `cover_url` and `cover_path`. Updates recheck both fields so a concurrent upload wins. It supports `--dry-run`, paginates by ID, and reports each eligible book. See [cover enrichment evidence](../evidence/cover-enrich/README.md) for configuration.

## Runtime and portability

Configuration is supplied through environment variables; do not commit credentials. Supabase provides authentication, RLS, SQL functions and private storage, so moving providers requires replacing those integrations rather than assuming a generic S3 interface. The migrations are the database contract and include PostgreSQL and Supabase-specific features.

## Boundaries

The earlier Cloudflare Workers, Elysia API, Workers AI extraction, PWA and Drizzle proposals are not the implemented architecture. There is no documented production deployment endpoint in this repository. Do not assume an AI photo-extraction service, an Elysia catalogue endpoint, or a service worker exists.

The current light theme and design direction are documented in [DESIGN.md](../../DESIGN.md). Environment configuration is described in [Engineering](ENGINEERING.md) and `.env.example`.
