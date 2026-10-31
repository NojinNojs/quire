# The sign-in is an open book (#60)

Authentication now occupies the verso of an open book. The recto shows the published cover and saved demo reading record, using the shared CoverImage and existing demo data/functions. On phones it reduces to a 10px paper edge with the cover peeking out as a bookmark tab. Existing sign-in, registration, reset, strength, mismatch, demo, and URL behavior remain intact.

Design Read: Reading this as: authentication for readers, in a paper-and-ink open-book style, dial ENERGY 1 / RHYTHM 2 / MOTION 1.

Design source: `docs/DESIGN.md` is absent in this worktree. Root `DESIGN.md` was read before edits. Its theme, typography, paper, ink, and published-artwork direction applies; the owner's explicit #60 brief supersedes its previous auth presentation. R-37 is satisfied.

- One accent: the active theme's `--accent` ink, oxblood in Shelf light, applied to focus, the strength rule, and today's stamp outline. Primary actions use ink/paper.
- One motif: printed book furniture, expressed through the running head, ruled text block, paper leaves, and folio.
- One gradient: the asymmetric gutter shadow describes the book's spine fold, extending further onto the verso. It serves no other purpose.

## Delivery Gate

| Block | Result | Evidence |
| --- | --- | --- |
| Hard Gate | PASS | 222 unit tests, 21 browser tests, build/type checks, database smoke, 144 contrast groups, responsive and keyboard checks, recorded click-through below. |
| Purpose-Gate | PASS | Each material/type/motion choice has the written purpose below. Only the spine uses a gradient. |
| Liveliness | PASS | ENERGY 1 / RHYTHM 2 / MOTION 1, a single form action, contrasting form/reading-record measures, printed book furniture, restrained theme accent. |
| Craftsmanship | PASS | Working auth and demo data, shared artwork/fallback, six themes, all requested widths, reduced motion, empty/error/pending handling, independent review disposition `ship`. |

### Hard Gate: individual checks

- R-02 PASS: source scan of auth files, auth CSS, and auth e2e contains no em or en dashes; new English copy has no marketing claims.
- R-03 PASS: both modes have zero horizontal overflow at 320, 390, 768, 960, 1024, and 1440px; 48px primary and at least 44px auxiliary controls are asserted.
- R-17 PASS: page counts and seven-day activity come from saved demo state and existing demo functions, explicitly labeled sample activity; folio 17 is the owner's requested page number.
- R-18 PASS: no testimonials, avatars, or invented identities exist.
- R-23 PASS: no new visual asset was created; the shared CoverImage renders the existing sourced published cover. The owner specified the layout and book furniture.
- R-24 PASS: no navigation links were added; the demo link retains its working `?demo=1#/today` destination.
- R-25 PASS: all rendered text nodes, input text, and placeholders are sampled in both responsive presentations across six themes and twelve states. The final minimum is 9.063:1, above the requested 7:1. See `contrast.txt`.
- R-26 PASS: every control was exercised in the running app; results and simulated-response distinctions are in `CLICK_THROUGH.md`.
- R-27 PASS: empty/native validation, reset guidance, strength/mismatch, request failure/retry, pending/disabled, confirmation, denied storage, and failed-cover fallback were exercised.
- R-28 PASS: no FAQ exists.
- R-32 PASS: Tab follows email, password, show, submit, reset, create, demo; Enter operates the controls. Every control's 2px focus outline is asserted to match the theme accent. Mode switching focuses its new heading; tour Escape closes it.
- R-33 PASS: components and CSS were authored directly; no runtime/source-rewriting feature script was introduced.
- R-34 PASS: the active six-theme system is preserved; light/dark captures and six-theme contrast checks pass.
- R-35 PASS: the running app was exercised in system Chromium against local Supabase; repository gate completed successfully. Fourteen captures and a control-by-control record are included.
- R-36 PASS: no new security, performance, customer, or compliance claim was added; existing privacy small print was preserved.
- R-37 PASS: root DESIGN.md and the owner's exact book-spread direction were read before implementation; Design Read was declared before edits.
- R-38 PASS: actual published artwork and explicitly labeled demo activity are the only content on the recto; no fabricated proof, team, testimonial, or destination was added.

### Purpose-Gate: individual checks

- R-01 PASS: one asymmetric spine gradient shows the fold; no other gradient or glow appears.
- R-04 PASS: no new icons or generic symbol set was introduced.
- R-06 PASS: Newsreader ties the introduction and italic title to the books; Plus Jakarta Sans serves inputs/UI; small tracked mono serves the running head, labels, weekday letters, counts, and folio. No fourth family.
- R-07 PASS: no background grid, graph paper, or dot pattern exists; the field rules locate editable lines within the text block.
- R-08 PASS: no decorative arrows exist.
- R-09 PASS: no badges or pills exist.
- R-10 PASS: no glass or backdrop blur exists.
- R-12 PASS: the actual cover has a thin physical shadow; the spread has no floating-card shadow. Three-pixel impressions represent exposed leaves.
- R-13 PASS: no glow exists.
- R-14 PASS: no feature cards exist; verso and recto have different content measures because one is a form and one is a reading record.
- R-19 PASS: the pending rule communicates an active request; the strength rule changes length as feedback. Reduced motion removes animations and transitions. There is no entrance choreography.
- R-22 PASS: no generic illustration exists; the owner requested the CSS book geometry and existing published artwork.

### Liveliness: individual checks

- Dials PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 are explicit and reflected in the restrained spread and limited feedback motion.
- Focal point PASS: the ink primary anchors the form; the published cover carries the color on the facing page.
- Whitespace PASS: margins distinguish the running head, introductory line, editable text block, reading record, and page foot.
- Accent PASS: only the existing active accent supplies UI color; cover artwork remains intact.
- Motif PASS: printed book furniture repeats in the running head, rules, paper edges, and folio.
- Design Read PASS: declared before implementation and recorded above.

### Craftsmanship and quality locks: individual checks

- C-1 PASS: colors inherit theme roles; two pages separate the task from its live product example; typography distinguishes book voice, controls, and printed metadata; margins protect the text from the fold.
- C-2 PASS: existing auth handlers and demo link remain wired and browser-exercised; pending disables repeat submissions and the visibility toggle.
- C-3 PASS: every region is requested form, reading record, or physical book furniture; no filler sections exist.
- C-4 PASS: both modes reflow, every theme passes contrast, browser keyboard checks pass, unavailable storage falls back safely, failed artwork uses the shared placeholder, and an absent fallback book has an empty recto.
- C-5 PASS: the demo's sample provenance is explicit; saved page counts persist from the actual running demo.
- R-05 PASS: an open-book spread is the owner's requested composition; no hero/cards template is present.
- R-11 PASS: radii are 0 or the existing 2px input token; there are no pills.
- R-15 PASS: actions remain Sign in, Create account, Forgot your password, and the interactive demo.
- R-16 PASS: new copy is specific and descriptive; no marketing buzzwords were added.
- R-20 PASS: the spread, printed furniture, folio, and real published cover identify a reading product without depending on its logo.
- R-21 PASS: all six reader-selectable themes remain usable; no new fixed theme or auth-only theme picker was introduced.
- R-29 PASS: paper and ink plus one active accent; published artwork carries its own colors.
- R-30 PASS: the references contributed quiet controls, ruled fields, artwork-led color, and bookish typography. None supplied the overall layout.
- R-31 PASS: material/layout/type/spacing reasons are written above; no visual decision depends on a template default.

## Validation and review

`npm run gate` PASS: Biome, TypeScript, 25 test files / 222 tests, production build, local database smoke including RLS, and 21 browser tests. No browser or database checks were skipped. The auth suite accounts for 13 browser tests.

The gate retains three existing CSS specificity warnings in reading/shelf and a bundle-size advisory. The authorized change does not modify those files or build settings.

The mechanical design detector returned advisories only. Its two 1px-radius advisories were resolved with the documented 2px token before the final captures. The remaining black cover-shadow advisory is the thin physical shadow explicitly requested by the owner.

Independent Impeccable finish review: `ship`, all 14 required captures validated, no material fixes requested. The documentation handoff checked the final source and evidence. Root DESIGN.md and PRODUCT.md still describe the preceding auth photograph/shape treatment; this existing drift is recorded without editing those out-of-scope files.

Evidence: `gate-output.txt`, `contrast.txt`, `CLICK_THROUGH.md`, and the linked captures in `README.md` in this directory.

Branch: `feat/auth-book`. Local commit only; no push, merge, or remote PR creation. This file is the prepared PR body.
