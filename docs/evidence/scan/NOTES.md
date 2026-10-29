# Barcode scan evidence

Branch: `feat/scan`. Date: 2026-10-29.

## Integration

Import `ScanSheet` from `src/features/scan` and supply `onDetected(isbn13)` and `onClose`.
The sheet imports its CSS. The host must load the existing fonts, tokens and theme CSS.
The host decides how to search and should unmount the sheet on close. The sheet stops the
camera before invoking either callback. No route wiring is included.

`useBarcodeScanner` accepts `apis: { Detector, mediaDevices }` and optional `throttleMs`
(default 250 ms, minimum 100 ms). Omit `apis` to use browser APIs. An explicit empty object
selects the manual fallback without requesting camera permission. Keep injected `apis`
stable across renders; changing them starts a new session. A session reports only its first
valid ISBN. Camera detections and the numeric ISBN-13 field both use `isbnTo13` from the
existing ISBN helper and require a valid 13-digit book ISBN.

## Fake detector tests

`npx vitest run src/features/scan`: 2 files, 19 tests passed, using Testing Library, jsdom,
fake timers, a fake detector, injected media APIs and fake tracks. Covered:

- Rear camera request and `ean_13` constructor format.
- First valid code reported once; duplicates and subsequent codes ignored.
- Bad checksum and valid non-book EAN rejected; scanning continues to a valid book ISBN.
- Throttle, no overlapping async detection, and waiting for video frames.
- No callback from a detection resolving after unmount.
- Camera resolving after unmount is stopped, including React StrictMode cleanup.
- Asking permission, permission denied, missing camera, scanning, bad checksum and found copy.
- Missing detector, detector construction failure and frame detection failure offer manual entry.
- No camera permission request when the detector is absent.
- Manual validation rejects empty, alphabetic, bad-checksum and non-book values; correction succeeds;
  duplicate form submissions report once.
- Torch appears only with capability support; toggles constraints and reports a failed operation honestly.
- Close, unmount and a torch operation completing after unmount stop the track.
- An ended camera track offers fallback; cancel closes; initial focus and focus restoration work.
- A track ending during pending playback cannot restore scanning; manual submission still works.
- A pending detector result is ignored after the track ends.

The checkout did not declare Testing Library or a DOM test environment. Under the path ownership
constraint, neither `package.json` nor `package-lock.json` was changed. Test-only packages were
installed locally with:

```sh
npm install --no-save --package-lock=false @testing-library/react@16.3.3 jsdom@30.1.3
```

A fresh checkout needs that command before running the new tests or the gate. There are no new
runtime dependencies. A later integration can declare these as development dependencies.

## Browser verification

Used the system Brave/Chromium through Playwright with a temporary preview under the owned scan
folder, removed after verification. The preview supplied a synthetic canvas stream and fake
detector. It did not use a physical camera or exercise native barcode recognition.

Checked 48 combinations: 390px and 1280px widths, 844px height, all six shipped themes, and
unsupported fallback, permission denied, scanning and invalid barcode states. Checked full panel
height, no horizontal overflow and initial Close focus in each combination. Browser form checks
covered bad checksum, correction, callback delivery and native Escape closing. No page errors.
Inspected mobile fallback/scanning and desktop dark fallback screenshots. The final framing guide
is a horizontal double rule so it remains visible over light or dark camera imagery. The guide
and video occupy the flexible space; controls and live status stay on the themed surface.

Physical camera: unavailable in this execution environment. Real camera permission prompts,
rear lens selection, native EAN recognition and hardware torch behavior remain unverified.
Stopping tracks is tested, including pending operations, but hardware light shutdown was not observed.

Impeccable mechanical detector: `[]` (no findings). The design-system documentation references
`scripts/quire_consistency.py` and `scripts/quire_verify.py`; these scripts are absent in this checkout.

## Repository gate

`npm run gate` exited 0. All 92 unit tests, database smoke checks, build and four existing browser
smoke tests passed. Existing browser smoke tests cover the wired app; the scan route is not wired.
Biome printed an informational schema-version mismatch (installed CLI 2.6.4, config 2.6.3).
The browser runner also printed environment warnings. Gate output follows (trailing spaces trimmed):

```text

> quire@0.1.0 gate
> bash scripts/gate.sh

== biome
/home/nojin/works/quire/.worktrees/feat-scan/biome.json:2:14 deserialize ━━━━━━━━━━━━━━━━━━━━━━━━━━━

  i The configuration schema version does not match the CLI version 2.6.4

    1 │ {
  > 2 │   "$schema": "https://biomejs.dev/schemas/2.6.3/schema.json",
      │              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    3 │   "files": {
    4 │     "includes": ["src/**", "*.ts", "*.json", "!**/.worktrees"]

  i   Expected:                     2.6.4
      Found:                        2.6.3


  i Run the command biome migrate to migrate the configuration file.


biome.json:2:14 deserialize ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  i The configuration schema version does not match the CLI version 2.6.4

    1 │ {
  > 2 │   "$schema": "https://biomejs.dev/schemas/2.6.3/schema.json",
      │              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    3 │   "files": {
    4 │     "includes": ["src/**", "*.ts", "*.json", "!**/.worktrees"]

  i   Expected:                     2.6.4
      Found:                        2.6.3


  i Run the command biome migrate to migrate the configuration file.


Checked 57 files in 15ms. No fixes applied.
Found 1 info.
== typecheck
== tests

> quire@0.1.0 test
> vitest run src --passWithNoTests


 RUN  v5.0.5 /home/nojin/works/quire/.worktrees/feat-scan


 Test Files  11 passed (11)
      Tests  92 passed (92)
   Start at  10:42:44
   Duration  1.05s (environment 48%, tests 25%, import 16%, transform 8%, worker 4%)

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
== end to end smoke (skipped when supabase or system Chromium is unavailable)

> quire@0.1.0 test:e2e
> playwright test

[WebServer] (node:379733) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 4 tests using 1 worker

(node:379776) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  1 tests/e2e/auth.spec.ts:3:1 › sign up, open the catalogue, and sign out (876ms)
  ✓  2 tests/e2e/catalog.spec.ts:3:1 › search, save a candidate, and refuse a persisted duplicate (1.2s)
  ✓  3 tests/e2e/catalog.spec.ts:60:1 › empty query shows guidance and prevents provider searches (636ms)
  ✓  4 tests/e2e/settings.spec.ts:3:1 › theme chosen in settings is applied and survives a reload (767ms)

  4 passed (4.6s)
gate ok
```
