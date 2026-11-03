# Reading companion verification

Base: `28950059972e7eb54512e40adcc6c3b98f467a11` (`origin/main`). Branch: `feat/dashboard-reading-companion`. Worktree: `/tmp/quire-dashboard-reading-companion`; primary checkout not used for implementation.

## Browser evidence

- `account-today-desktop.png`, `account-today-mobile.png`: real disposable local account, saved display name and goal 12, manually added 100-page book, 10 pages committed through `log_pages`, then reloaded before capture. Account removed after capture.
- `today-desktop.png`, `today-mobile.png`: explicitly labeled local demo after saving profile/goal and private review through the UI. Profile/goal/review survived reload.
- `year-mobile.png`: demo Reading year, native keyboard/touch date details.
- Demo route matrix: Today, Collection, Add book, Settings, Journal, Reading year at 320/390/768/1024/1440px. Each had one main landmark and no horizontal overflow.
- Calendar measured minimum date widths above 44px at all five widths, height 44px. Enter opened a date detail and retained focus. Detail skip link focused main.
- Dashboard at 200% CSS zoom had no horizontal overflow. Reduced-motion bookmark transition computed `0s`.

## Static and unit checks

- `npm run check`: passed.
- `npm test` after review fix: 43 files, 287 tests passed.
- Independent static review: no additional P1/P2 findings in callback/session, profile/review/status/history APIs, policy migration, or demo persistence. Changed frontend secret-pattern scan found no credential values.

## Final complete gate

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
