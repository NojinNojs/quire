# Catalogue resilience (#22)

Branch: `feat/catalog-resilience`. Base: `refactor/quality`.

## Behavior

- Each source gets an AbortController and a total 8000 ms deadline, including response bodies, retries and Open Library edition requests. A promise race also bounds fetchers that ignore cancellation. Timers are cleared on completion.
- Each URL gets at most two attempts. Fetch/body network failures (`TypeError`, as emitted by browser fetch) and HTTP 500–599 retry once. HTTP 429, other HTTP errors, malformed JSON and timeouts do not retry.
- Valid ISBN-10/13 queries additionally request `/isbn/<normalised-isbn-13>.json`. The three sources use the existing completeness ranking and ISBN deduplication. ISBN editions retain null authors when only author references are available; no author names are invented.
- `failures` contains `{ provider, kind }` with `rate-limited`, `timeout`, `offline` or `unknown`. Provider names are `Google Books`, `Open Library` and `Open Library ISBN`. Existing `errors: string[]` remains compatible with the UI and includes honest failure messages.
- `createCatalogSearch()` owns an in-memory cache keyed by trimmed query. Nonempty results update it; failures with no fresh candidates return a copy of the last good candidates, `fromCache: true`, and a stale-data note. Fresh partial results win. Cache data is copied to prevent caller mutations and is not persisted. The exported `searchCatalog` shares one instance for the application; tests create fresh instances.
- All catalogue tests inject fetchers and fixtures. Timeout tests use fake timers; no catalogue test makes a network request.

## Integration limit

The existing `src/features/catalog/useCatalogue.ts` wrapper accepts only the URL and supplies its own 15000 ms signal. It therefore ignores the catalogue's injected signal. The eight-second catalogue deadline still settles the search, but transport cancellation requires a fetcher that forwards the supplied options. The wrapper is outside this task's allowed files and was left untouched.

## Tests

`npx vitest run src/lib/catalog.test.ts --reporter=verbose`: 24 passed.

Existing coverage retained:

- normalises Google Books
- normalises an Open Library edition without mixing work-level metadata
- calls both providers, fetches the matching edition, dedupes ISBN-10 against 13 and keeps the fuller record
- uses a concrete edition fallback when nested search editions are empty
- keeps available editions when one edition fetch fails
- sorts by completeness and retains records without ISBN
- handles empty results and blank queries
- handles network and HTTP failures without throwing and preserves the other source
- ignores malformed records and invalid metadata
- maps ISO 639-3 catalogue codes to the two letter code the schema stores

Resilience coverage:

- times out each provider after 8000 ms and aborts its signal even if fetch ignores it
- retries a network failure once and merges the recovery
- retries a 5xx failure once and merges the recovery
- stops after one retry on a persistent network failure
- stops after one retry on a persistent 5xx failure
- does not retry 429 and reports rate limits with provider names
- returns a per-query cache hit with a note after both providers are rate limited
- looks up valid ISBN-10 and ISBN-13 queries through the ISBN path and merges all three sources
- skips the ISBN path for an invalid checksum
- does not retry other HTTP errors or malformed JSON
- keeps successful sources when the ISBN lookup is rate limited
- includes retries in the original provider deadline and preserves a faster source
- includes stalled response bodies and edition requests in the timeout
- clears provider timers on success

## Gate output

`npm run gate` exited 0 on 2026-10-29. Database smoke ran against the local Supabase stack and passed.

```text

> quire@0.1.0 gate
> bash scripts/gate.sh

== biome
Checked 46 files in 13ms. No fixes applied.
== typecheck
== tests

 RUN  v5.0.5 /home/nojin/works/quire/.worktrees/quality-data-layer


 Test Files  8 passed (8)
      Tests  68 passed (68)
   Start at  10:13:23
   Duration  180ms (transform 44%, import 30%, tests 16%, worker 9%)

== build
== database smoke (skipped when supabase is down)
ok   insert a book
ok   row level security hides another shelf
ok   duplicate ISBN refused
ok   only one active book allowed
ok   streak 2026-10-26
ok   streak 2026-10-26
ok   streak 2026-10-27
ok   streak 2026-10-29
ok   streak 2026-10-31
ok   streak 2026-11-02
ok   two logs on one day add up

all database checks passed
== docs present
gate ok
```
