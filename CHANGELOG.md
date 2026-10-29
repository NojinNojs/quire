# Changelog

Generated from conventional commits by `scripts/changelog.sh`.

## Unreleased

### Added

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

- normalise catalogue language codes and name rate limits honestly

### Changed

- split search screen into atomic modules (#15)

### Documentation

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
