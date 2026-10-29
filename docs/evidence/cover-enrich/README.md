# Cover enrichment evidence

Run on `feat/cover-enrich` against a disposable owner in local Supabase. No production data was
changed. The capture script deletes its temporary owner and books afterward.

- `backfill-output.txt`: actual CLI dry run, write, and repeat run. Pride and Prejudice was found
  through Open Library and saved once. The long-title fixture had no result and kept its jacket.
- `shelf-grid-390.png`: both the real fetched cover and printed jacket at a 390px viewport.
- `today-real-cover-390.png` and `today-printed-jacket-390.png`: both paths on Today at 390px.
- `checks.json`: live cover URL and byte count, plus five cloths in six themes at 96px and 170px.
  All text contrasts exceed 9:1. Long titles clamp at four lines, unknown authors remain visible,
  and the title, author, and class number do not overlap.
- `gate-output.txt`: complete local gate output.

`capture.mjs` fetches the real image over HTTPS, checks its response, and serves those same bytes
at the returned URL during browser capture. Catalogue responses are live. Run with Node 24:

```sh
node docs/evidence/cover-enrich/capture.mjs
```

For an existing library, export `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the shell, then:

```sh
node scripts/backfill-covers.mjs --dry-run
node scripts/backfill-covers.mjs
```

Optionally set `BACKFILL_OWNER` to restrict the operation to one owner. Keep the service role key
in the shell environment. The CLI reads it directly and never prints it. Both cover fields must
still be null when an update executes; an upload completed during lookup is preserved.
