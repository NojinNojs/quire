antislop active: during (global preference). Do not stop to ask.

# Task: restore the catalogue tests you deleted, and keep the new behaviour

You rewrote `src/lib/catalog.test.ts` from 20 focused tests to 10 broad ones. That trade is not
acceptable: a test that covers five behaviours at once fails to tell us which one broke.

Restore these behaviours as separate `it` cases, on top of your new tests (do not delete yours):
- does not retry 429 and reports the rate limit with provider names
- does not retry other HTTP errors or malformed JSON
- handles network and HTTP failures without throwing and preserves the other source
- clears provider timers on success
- keeps successful sources when the ISBN lookup is rate limited
- ignores malformed records and invalid metadata
- sorts by completeness and retains records without an ISBN
- times out each provider after 8000 ms and aborts its signal even if fetch ignores it
- normalises a Google Books record
- normalises an Open Library edition without mixing work-level metadata

Also add two cases for the new layer:
- the Google Books HTML source is tried only for a valid ISBN, never for a text query
- when the API is rate limited and the HTML source finds a title, no error is shown and the candidate is
  marked as metadata only

Run `npx vitest run` and confirm the count is at least 196, then `npm run gate`. Report the numbers.
