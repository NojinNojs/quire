# Reading companion verification

Base: `28950059972e7eb54512e40adcc6c3b98f467a11` (`origin/main`). Branch: `feat/dashboard-reading-companion`. Deliverable worktree: `/tmp/quire-dashboard-reading-companion`. During the final polish two workers mistakenly edited the primary checkout; their exact deltas were reverted from pre-edit transcript captures before porting to this worktree. A separate read-only recovery audit checked the affected paths and confirmed the outstanding AppShell test content matched the captured original. No reset/checkout was used on user changes.

## Today workspace and widgets

Book identity, progress, logging and the week streak now share one reading-desk surface. The desk splits only when its own container reaches 640px; otherwise book, logger and streak stack in reading order. Cover aspect ratio is retained, controls remain at least 44px, and the preview uses a real arrow. Annual totals use value/label metric cells with restrained icons and a clear goal CTA; phone activity rows place the wrapping title below date and page count. The main/support page layout responds to its container at 52rem rather than assuming a viewport equals usable width.

Final gate passed: 327 unit tests, 40 browser tests, typecheck, build and all database smoke checks. Actual Chromium measurements at 320, 390, 768, 1024 and 1440px showed no horizontal overflow. Inspected desktop and full-page phone screenshots; entered and logged 10 pages on mobile, observed the disabled pending state, then the updated progress, streak, totals and activity after persistence. Undo remains covered by the passing browser regression; the manual attempt occurred after its time window expired. Two existing reading.css specificity warnings and the bundle-size advisory remain. Real-device touch and software keyboard were not exercised.

## Field visibility and accessible close controls

Fixed the demo search input missing the shared control class. Added meaningful examples to writable catalogue, manual-entry, metadata, profile, recovery and review fields while retaining labels. Native selects, file controls and already-valued reading counters retain their supported semantics instead of ineffective placeholders. Scanner and navigation-search close controls now use labelled X icons; scanner tooltip stays within the native dialog top layer. Scan has visible text at every breakpoint: Scan on phones, Scan ISBN on desktop.

Final gate: 327 unit tests and 40 browser tests passed, plus typecheck, production build and all database smoke checks. New browser coverage checks demo and account search geometry, filtering, placeholder visibility and phone fit. Two existing reading.css specificity warnings and the bundle-size advisory remain.

Fresh Chromium smoke at 320px confirmed a 44px search input with placeholder, no horizontal overflow, a focused X-icon Close control and a 44px ISBN fallback input. One Escape removed the scanner and restored focus to Scan ISBN. Earlier manual-entry inspection measured every editable field at 44px with meaningful placeholders; filtering Walden produced one result. Preview required a forced Vite restart after the scanner callback/import edit; the final fresh module graph opens and closes the scanner successfully. Physical-camera recognition and a real-device software keyboard were not exercised.

## Precise chrome and book capture

Moved the collapse control from the logo area into the content header. Header and brand cells share a 56px mobile / 64px desktop baseline; compact rail glyphs remain centred. The plus/scan pair uses a shared segmented frame, barcode-viewfinder glyph, accessible names and tooltips. Account and demo each conditionally mount one scanner; typed ISBN requests replace the previous catalogue DOM-submit handoff. Repeated ISBN captures remain distinct requests. Demo results remain sample-only, with manual entry preserving an unmatched ISBN.

Buttons and fields share 44px targets, 8px corners, visible focus and disabled/busy states. Action icons supplement accessible names; password reveal uses labelled eye controls. Reading presets explicitly remove native button appearance.

Actual Chromium demo smoke: opened the navbar scanner from Today; camera-unavailable fallback accepted `9780140328721`, navigated to search and showed the honest sample-catalogue empty state. Manual entry retained the ISBN. Reopening and pressing Escape removed the dialog and restored focus to the scan trigger. Measured 320, 390, 768, 1024 and 1440px: no horizontal overflow; every header action at least 44px high and wide. Inspected Today, manual entry and compact-rail Settings visually. Physical-camera barcode recognition was not exercised.

Final `npm run gate`: 55 unit files / 327 tests, typecheck, production build, all database smoke checks and 37/37 browser tests passed without skips. Browser coverage includes capture at 320px, focus restoration, responsive rail/header geometry and existing account/book/authentication flows. Two CSS specificity warnings in `reading.css` and the bundle-size advisory remain non-blocking.

## Richer shell and navigation search

Compared shadcn Sidebar composition with Aceternity Sidebar/Floating Dock; retained explicit collapse and fixed touch targets instead of hover expansion or icon magnification. Desktop now exposes Library and Insights destinations with independent Journal/Reading-year active states; a consistent 56px header carries breadcrumbs and navigation search. Mobile keeps three dock destinations and adds More for Journal, Reading year, Settings and Guide.

Actual Chromium smoke: header search opened the modal; filtering “journal” then Enter changed only the hash, preserved `?demo=1`, and focused the destination main. Ctrl+K opened the palette; an unmatched query did not navigate on Enter. Mobile More navigated to Reading year, closed its menu and left the dock indicator at `none`. Guide launched only after More closed; Ctrl+K did not open a second modal over it; Skip tour restored focus to More. Desktop and mobile screenshots were captured. Preview required a forced Vite restart after newly-created CSS imports; final palette styles import directly from the component.

Final richer-shell `npm run gate`: 50 unit files / 309 tests, typecheck, production build, every database smoke check and 36/36 browser tests passed without skips. Responsive coverage includes 320, 390, 767, 768, 1023, 1024, 1280 and 1440px, main-region skip-link focus, expanded/compact persistence, correct Insights active states and mobile More navigation. Three existing cascade warnings and the bundle-size advisory remain non-blocking.

## Component and page refinement

References: Base UI popup animation lifecycle, Select, Tooltip and Toast; shadcn Base UI button variants and tooltip composition. Implemented with `@base-ui/react` and Quire CSS rather than Tailwind or copied demo components.

Actual Chromium demo Settings smoke: saving display name showed “Saved on this device.”; reload retained the value. Temporarily making `Storage.prototype.setItem` throw produced only an error toast plus the inline storage error; reload retained the previously saved value. The original storage implementation was restored after the scenario. Dismiss removed the notification. Desktop toast measured 360×62 at x=1040.8, y=814 in a 1440×900 viewport. Dropdown was portalled outside main; Escape restored focus to its combobox trigger.

Real-browser component smoke also covered compact-rail hover and keyboard-focus tooltips, Escape dismissal, select typeahead (`r` selected Reading) and focus restoration. Explicit normal-motion media computed popup opacity/transform transitions of 110ms; reduced motion computed popup/toast transition `none`, rail `0s` and route animation `none`. A rapid sidebar reversal sampled widths 216→214.66→209.81→199.5→212.86→216 without resetting to the opposite endpoint.

All seven demo routes were measured at 320, 390, 768, 1024 and 1440px: no horizontal overflow or Vite error overlay; each main had one h1. Final detail screenshots show restored status/review sections, compact secondary editing, and Continue reading as primary. Mobile signup fit 390×844 without page overflow. Manual add produced its saved toast and a real collection entry; review text survived reload; confirmed deletion returned to Collection with its toast. Reading logging and immediate Undo remained usable. Reading-year language filtering changed the totals and calendar together.

Toast stack regression: Chromium reproduced ResizeObserver loop errors when stretched toast content fed its measured height back into the animated card. Removing `height: 100%` from `.toast-content` decoupled intrinsic content measurement; animation remained enabled. The regression failed against the old CSS and passed after the fix. Rapid insertion, hover churn, insertion while expanded, dismissal and resizing produced zero observer errors at 360, 390 and 1440px. A five-second toast remained visible for 6.5 seconds hovered and dismissed after leaving. Duplicate-edition errors now announce once inline and do not produce an error toast; other failed writes announce through the toast while retaining a non-live inline error.

Final component/page gate: `npm run gate` passed with 49 unit files / 301 tests, typecheck, production build, all database smoke checks and 35/35 browser tests. No database/browser skips. Three non-blocking CSS cascade warnings and Vite's bundle-size advisory remain. Modified source modules stayed at or below 200 lines. Recovery assertions retain their inline-status contract; account/profile/review notifications use the Notifications region.


## Professional shell and shared motion

Current `today-desktop.png` and `today-mobile.png` show the grouped reading rail and inset mobile dock. At 390×844 the dock bounds are x=12, width=366, y=770, height=66; logging ends at y=724, above it. Desktop main begins at x=228, beyond the 216px rail. The route order, 1024px breakpoint and persisted 216/80px preference remain unchanged.

A dedicated Chromium context with normal motion confirmed `screen-enter` on route changes, 110ms button/form/tab transitions, `item-enter` on shelf rows, 160ms dock-glider motion and 260ms rail/content motion. Reduced motion computed route animation `none`, glider transition `0s` and control transitions `0s`. Live logging changed progress 48→49 and Undo returned it to 48 while the new motion was active. Motion has no scroll hijacking or perpetual decorative loops. Native calendar and text-only feedback have the limits documented in DESIGN.md.

Final full gate for the custom shell/motion pass passed: 45 unit files / 292 tests, typecheck, production build, all database smoke checks and all 34 browser tests, with no skips. Three pre-existing cascade warnings and Vite's bundle-size advisory remain non-blocking. Responsive tests sample the rail animation midpoint, assert settled rail/content alignment and persistence, check bounded dock geometry, and verify reduced-motion shutdown. Crossing the desktop breakpoint is immediate; only explicit rail toggles animate.

## Authentication and shell enhancement

Login/signup now use the application canvas `#f5f7f6`, white pages and green `#205b48` actions/cloth. The authentication-only browser suite passed all 14 tests, including contrast, error/pending states, keyboard, first-open cover and account forms.

`today-desktop.png` now shows the expanded 216px shell; `shell-compact-desktop.png` shows the 80px mode; `today-mobile.png` shows the enhanced header and bottom bar. Real browser verified collapse/expand, compact persistence after reload, route context/current destination, and Guide close returning focus to a visible compact-rail trigger. Width sweep 320/390/768/1023/1024/1440 had no horizontal overflow; each primary destination measured 48px high. The desktop toggle is absent from layout below 1024px. At 390×844 the logging action ends at y=715, before navigation begins at y=780.

Final enhancement `npm run gate`: Biome checked 250 files with three existing non-blocking cascade warnings; typecheck passed; 45 unit files / 292 tests passed; production build passed; all database smoke checks passed; all 34 browser tests passed. No backend/browser skips. The disposable verification config was restored to the product config after the gate. Vite still reports its bundle-size advisory. A catalogue fixture was isolated from unmocked HTML/provider network requests rather than extending timeouts. Sidebar toggling also worked in a real browser while localStorage writes threw, and skip-link focus preserved the Today route.

## Neutral redesign verification

Final neutral-redesign `npm run gate` passed on the disposable `quire-dashboard-verify` stack, with no skipped database or browser checks: Biome checked 245 files (three non-blocking cascade warnings); typecheck passed; 44 unit files / 289 tests passed; production build passed; every database smoke check passed; all 33 browser tests passed. Product Supabase configuration was restored afterward. Vite retains its bundle-size advisory. Independent review found no concrete consumer-visible regressions in the reviewed changes; added-line security scan found no credential assignments, eval or unsafe HTML sinks.

Current `today-desktop.png` (1440×900), `today-mobile.png` (390×844) and `year-mobile.png` show the neutral demo redesign. Real browser actions verified five-page logging persisted after reload, immediate Undo restored the previous position, journal navigation and native month expansion, collection/detail/settings reachability, and skip-link focus on main. No horizontal overflow at 320, 390 or 1440 CSS pixels. At 390px the Log action measured y=667–715, above fixed navigation. Existing `account-today-*` captures remain pre-redesign evidence, not current screenshots.

Storage failure smoke: real browser `Storage.setItem` was temporarily made to throw. Manual add retained the draft and showed a storage error; restoring storage and retrying persisted the book. Delete retained the detail route and book while storage failed; restoring storage and confirming again returned to Collection. The throw hook was removed after each scenario. Enter expanded a calendar month and retained focus on its summary. Journal headings now expose human dates with date-only `datetime` attributes.

The first browser pass exposed stale wording/focus selectors, a catalogue contrast failure, and use of the wrong local stack/mail endpoint. The final pass fixes those selectors, discovers Mailpit from stack status, applies all migrations on an isolated stack, and retains the 7:1 catalogue contrast contract. Final application supporting ink is `#414e48`; accent is `#205b48` so links on the canvas also meet that contract.

## Earlier companion browser evidence (pre-redesign)

- `account-today-desktop.png`, `account-today-mobile.png`: real disposable local account, saved display name and goal 12, manually added 100-page book, 10 pages committed through `log_pages`, then reloaded before capture. Account removed after capture.
- `today-desktop.png`, `today-mobile.png`: explicitly labeled local demo after saving profile/goal and private review through the UI. Profile/goal/review survived reload.
- `year-mobile.png`: demo Reading year, native keyboard/touch date details.
- Demo route matrix: Today, Collection, Add book, Settings, Journal, Reading year at 320/390/768/1024/1440px. Each had one main landmark and no horizontal overflow.
- Calendar measured minimum date widths above 44px at all five widths, height 44px. Enter opened a date detail and retained focus. Detail skip link focused main.
- Dashboard at 200% CSS zoom had no horizontal overflow. Reduced-motion bookmark transition computed `0s`.

## Earlier companion static and unit checks

- `npm run check`: passed.
- `npm test` after review fix: 43 files, 287 tests passed.
- Independent static review: no additional P1/P2 findings in callback/session, profile/review/status/history APIs, policy migration, or demo persistence. Changed frontend secret-pattern scan found no credential values.

## Earlier companion complete gate

`npm run gate` completed successfully, no database or browser skips:

```text
Checked 212 files. No fixes applied. Found 4 warnings.
Test Files  43 passed (43)
Tests       287 passed (287)
all database checks passed
33 passed (2.0m)
gate ok
```

Typecheck and production build passed. Remaining non-blocking warnings: two reduced-motion `!important` declarations, two legacy cover-control cascade warnings, and Vite chunk-size advisory. Full browser suite exercised real Mailpit password recovery/reload/used-link handling, password replacement, cross-account RLS/direct-progress protection, review/status persistence, undo, offline retry, search/manual recovery, edit/delete, guide, contrast, responsive navigation and reduced motion.

Final review found and fixed midnight daily-count reconciliation. New-day server baseline now syncs once without remounting pending undo/in-flight writes; two regression tests cover both states. Post-fix full gate repeated successfully.

## Local verification environment

Disposable Supabase project `quire-dashboard-verify`, API 55321, DB 55322. Runtime credentials generated from its status, never copied from the primary checkout. Test-only service role remained outside the application bundle. Product config restored after verification; hosted recovery redirect allowlist remains a deployment prerequisite.
