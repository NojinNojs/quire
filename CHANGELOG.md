# Changelog

Generated from conventional commits by `scripts/changelog.sh`.

## Unreleased

### Added

- add account and demo book details, metadata editing and confirmed deletion with persistent collection updates; support account reading activation and uploaded covers, reject duplicate editions, and retry failed progress loads
- rebuild reading streak from remaining entries when a book is deleted
- add theme screen and header navigation
- resolve and persist device theme preferences
- add timeouts retries ISBN lookup and cached fallback
- show honest loading empty and retry states (#17)
- isolate typed book queries and error mappings (#16)
- add search and manual edition saves
- normalize catalogue editions and validate ISBNs
- local supabase, schema with streak function, auth screen, database smoke test
- pure rules layer with unit tests, local CI and release scripts

### Fixed

- keep the page rail beside cover artwork instead of painting over it
- clear the fixed navigation from the book detail page and label the page with the book title
- animate the first-visit cover around the book spine with distinct faces and a reduced-motion alternative
- remove the blank left-card silhouette before opening and place the desktop introduction directly on the desk
- keep the cover's inside face paper-colored and align the login reveal with the opening hinge
- normalise catalogue language codes and name rate limits honestly

### Changed

- make the collection the landing screen with a cover-forward dashboard, a dominant add action, and filters in the paper and ink theme
- split authentication state and card sections into focused modules without changing the book or form behavior
- use shelf light as the sole theme and give authentication a physical book on a warm light desk
- keep the default authentication URL clean while preserving explicit shelf deep links and signup state
- fit the sign-in and account creation pages to typical phone and desktop viewports, with reduced-motion-aware transitions
- split search screen into atomic modules (#15)

### Documentation

- group documents into product, design, engineering, and briefs folders with navigation indexes
- record six-theme browser and gate evidence
- record browser evidence and passing gate
- milestone brief for catalogue entry

### Maintenance

- pull request template with the evidence checklist
- scope vitest to src so worktree copies and e2e specs are ignored
- add local Playwright smoke to gate
- add retryable root error boundary (#18)
- allow preview tunnels and add quality brief
- migrate biome config
- biome formatting, guard root element
- repo scaffold, design system tokens, seven documents
