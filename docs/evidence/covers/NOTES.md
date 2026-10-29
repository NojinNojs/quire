# Uploaded covers, issue #33

Branch: `feat/covers`, based on `main`. No merge or push.

## Implementation

- `20261029000001_covers.sql` creates the private `covers` bucket. Its authenticated policy checks both the owning book and the exact `{owner}/{book_id}/cover.webp` name for every storage operation. Only WebP uploads are accepted. Legacy inline `data:` cover URLs are cleared.
- `src/data/covers.ts` accepts an injected client. Browser bitmap decoding respects image orientation, canvas scaling preserves proportions, images never grow, and output width is at most 600px. Canvas produces a WebP Blob directly, without base64 or data URLs. Upload then persists `cover_path` on the matching owner/book row.
- Signed URLs last one hour, are cached per client/path until one minute before expiry, and mounted images check for renewal each minute. Replacement/removal invalidates the cache. Replacement URLs carry a revision to bypass stale image bytes.
- `CoverImage` tries signed storage, then an HTTP(S) `cover_url`, then a drawn cloth jacket labelled “No cover”. Image/signing failures advance the same fallback chain. The fixed 2:3 box and `object-fit: cover` preserve layout.
- Today offers a labelled file input with `accept="image/*"` and `capture="environment"`, an indeterminate progress bar with named preparation/upload/save stages, recoverable errors, and removal of the uploaded cover. Removing an upload restores the remote cover or drawn jacket.

## Minimal existing-screen edits

- `ShelfScreen.tsx`: replace the jacket-only edition import with `CoverImage`, and replace only the jacket markup with its path, URL, title and existing sizing class.
- `TodayScreen.tsx`: import `TodayCover`, remove the local image-failure state, and replace only the jacket markup. The component is keyed by book ID. The existing reading adapter omits `cover_path` and owner, so `TodayCover` loads those two fields by book ID under book RLS. This avoids changes to the adapter, route, app or shared libraries.
- No changes to `App.tsx`, `src/lib`, catalogue, gate script, dependencies, or other features.

## Design verification

Existing typography, palette and spacing tokens remain the design source. All radii use `--radius-input` (2px). Local `--cover-cloth` and `--cover-ink` aliases select the drawn jacket's existing cloth/ink token pair. The publisher rule identifies the drawn jacket without pretending it is the real cover. Input, remove, progress, error and retry controls wrap within the available width. Uploaded covers fill both existing jacket boxes.

Both screenshots are from the running authenticated app at **390 × 844 CSS pixels**, with a real browser upload into local Supabase:

- [Today with uploaded cover](today-390.png)
- [Shelf with the same uploaded cover](shelf-390.png)

The fixture is Jane Austen's *Pride and Prejudice*, using [Open Library's ISBN cover](https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg). It was enlarged locally to 1200px solely to exercise browser downscaling. The stored WebP decodes to **600 × 938px**. Screenshot accounts and uploaded objects were removed after verification.

## Validation and reproduction

- Unit suite: **139 passing tests**, including portrait/landscape/no-upscale dimensions, real File input to mocked browser decoding, WebP upload and owner path, rejected input/upload failure, cache expiry and client isolation, mounted URL renewal, image fallback chain, removal/cache invalidation, and a recoverable UI removal error.
- [Browser output](browser-output.txt): real upload, persistence after reload, shelf display, no horizontal overflow, second-owner signing/overwrite/delete denied, anonymous signing denied, public download denied, and removal confirmed in both database and storage after reload.
- Mechanical UI detector: no findings on the changed UI.
- [Full gate output](gate-output.txt): formatting/lint, TypeScript, unit suite, production build, live database smoke, and four Playwright smoke tests. An existing descending-specificity warning in `shelf.css` is outside this change's ownership.

Run from the worktree with local Supabase running and `.env` configured:

```sh
supabase migration up --local
npm run dev -- --host ::1 --port 5175 --strictPort
```

In a second terminal:

```sh
curl -L --fail 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg' -o /tmp/quire-cover.jpg
magick /tmp/quire-cover.jpg -resize 1200x /tmp/quire-large-cover.jpg
node src/features/covers/evidence/verify.mjs /tmp/quire-large-cover.jpg > docs/evidence/covers/browser-output.txt 2>&1
npm run gate > docs/evidence/covers/gate-output.txt 2>&1
```

## Boundaries

Storage upload and the book update are separate requests. If saving the path fails after upload, an object can remain at the deterministic path; retrying overwrites it. If clearing the path fails after storage removal, the UI reports failure and the image falls back; retrying removal clears the row. Progress is indeterminate because the storage SDK does not expose upload byte progress. Signed URLs are bearer URLs until they expire, as expected for private signed storage.

No runtime base64 image usage was found. The regression test supplies a legacy inline URL only to verify that it is rejected.
