# Quire documentation

The product and engineering record. [The root README](../README.md) covers running the app.

## Product

| Document | What it decides |
|---|---|
| [PRD](product/PRD.md) | what the product is, and what it refuses to be |
| [App Flow](product/APP_FLOW.md) | the journeys, including the awkward states |
| [Demo](product/DEMO.md) | the demo walkthrough and its screen direction |
| [PRODUCT.md](../PRODUCT.md) | platform, users, and current constraints |

## Design

| Document | What it decides |
|---|---|
| [Design Brief](design/DESIGN_BRIEF.md) | the visual direction |
| [Design System](design/DESIGN_SYSTEM.md) | tokens, themes, component contracts |
| [Shelf Direction](design/DIRECTION_BOOKSHELF.md) | the shelf, bookmark, and stamp treatment |
| [DESIGN.md](../DESIGN.md) | the implemented system and its local exceptions |

`PRODUCT.md` and `DESIGN.md` stay at the repository root because the design workflow reads them
from there. Every other product and design document lives under `docs/`.

## Engineering

| Document | What it decides |
|---|---|
| [Engineering](engineering/ENGINEERING.md) | branches, commits, the gate, and review |
| [TRD](engineering/TRD.md) | stack, hosting, and the reasons |
| [Schema](engineering/SCHEMA.md) | tables, policies, streak rules |
| [Implementation Plan](engineering/IMPLEMENTATION_PLAN.md) | the staged milestones |

## Decisions

Architecture decisions live in `adr/`, one file per decision.

- [0001: paper and editorial, not glass](adr/0001-paper-editorial-not-glass.md)
- [0002: the shelf as furniture](adr/0002-shelf-as-furniture.md)

## Briefs

Task briefs record what a milestone asked for. New briefs go in `briefs/`.

- [Catalogue entry](briefs/catalog-add.md), issue #3
- [Quality pass](briefs/quality-pass.md), issues #15 to #18
- [Authentication and tour](briefs/auth-onboarding.md)
- [Sign-in desktop and phone](briefs/auth-polish2.md), issue #62
- [Opening cover](briefs/auth-cover-open.md), issue #63
- [Catalogue test restore](briefs/catalog-test-restore.md)

## Evidence

Screenshots, gate output, and verification notes live in [evidence/](evidence/README.md), grouped
by milestone.

## Moving documents

`scripts/gate.sh` checks that these files exist:

- `docs/product/PRD.md`
- `docs/product/APP_FLOW.md`
- `docs/design/DESIGN_BRIEF.md`
- `docs/design/DESIGN_SYSTEM.md`
- `docs/engineering/TRD.md`
- `docs/engineering/SCHEMA.md`
- `docs/engineering/IMPLEMENTATION_PLAN.md`

Update the gate and every markdown link when one of them moves. Two evidence directories are
written or read by the end-to-end tests: `evidence/auth-cover` and `evidence/catalogue-resilience`.
