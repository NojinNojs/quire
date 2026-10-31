# Finish the open-book sign-in on desktop and phone (#62)

Below 760px, the reading record now prints inside the form's page, directly after the demo link and before the foot. It has the requested hairline, 10px mono FROM YOUR SHELF label, 64px published cover, italic title, small-cap author, seven streak marks, and today's page count. The bookmark and recto folio are gone on phones.

Desktop keeps one spread with matching 40px top and bottom page margins, a continuous gutter fold, one-pixel outer edges, aligned folios, and an 8px vertical rhythm. The flat cover measures 180px wide in a 272px frame; object-fit preserves the artwork while the frame keeps the record on the grid. Controls use accent outlines or underlines for interaction feedback while retaining high-contrast text.

**Acceptance status: blocked.** The implementation and evidence are committed locally. `npm run gate` exits 1: 222 unit tests pass and 20 of 21 e2e tests pass. The sole failure explicitly asserts the previous phone sliver. This PR is not represented as gate-green.

## Design Read

Reading this as: sign-in for readers, in Quire's paper-and-ink open-book style, dial ENERGY 1 / RHYTHM 2 / MOTION 1.

Root `DESIGN.md` was read first, before skills or source edits. Its existing semantic theme colors, Plus Jakarta Sans, Newsreader, mono metadata, and real published artwork remain the design source. The owner's #62 brief supplies the current open-book layout and supersedes the document's older auth photograph description. DESIGN.md and PRODUCT.md were left unchanged.

- Color: existing paper, ink, rule, and accent roles keep the sign-in consistent with all six reader themes.
- Layout: a single reading record follows the demo link in DOM order; desktop CSS places it on the facing page and phone CSS returns it to normal flow.
- Type: Newsreader italic identifies the book and introduction; sans supports the form; small mono identifies printed metadata and counts.
- Spacing: desktop blocks land on an 8px grid; 48px control heights and at least 8px vertical gaps protect phone interaction without hiding the primary action.
- Material: the sole gradient represents the gutter fold; outer hairlines describe the page edges; the cover has neither shadow nor tilt.
- Motif: printed running head, inset label, cover, streak marks, and folios identify a reader's book rather than a generic sign-in card.
- Motion: existing request/strength feedback is retained, with reduced-motion overrides; no entrance animation was added.

## Delivery Gate

**Overall FAIL: repository acceptance remains blocked by a protected e2e assertion that contradicts #62.** No test was disabled, edited, or bypassed. No merge or push was performed.

| Block | Result | Evidence |
| --- | --- | --- |
| Hard Gate, UI audit | PASS | No overflow in 16 captured layouts and six intermediate widths; 144 contrast groups have a minimum of 9.109:1; existing form, state, storage and artwork checks pass. |
| Purpose-Gate | PASS | Reasons above; one existing fold gradient, no new colors, icons, badges, arrows, illustrations, or decorative rules. |
| Liveliness | PASS | Explicit 1/2/1 dials, one primary action, structural margins, existing theme accent, and printed book furniture across phone and desktop. |
| Craftsmanship and quality locks, UI audit | PASS | All seven controls exercised with keyboard, hover and active; both auth modes and themes verified; existing auth/data behavior passes browser coverage. |
| Required repository acceptance | FAIL | `gate-output.txt`: 222 unit pass, 20 browser pass, one obsolete phone-sliver test fails at `tests/e2e/auth.spec.ts:231`. |

### Hard Gate evidence

- R-02 PASS: changed auth source, CSS, and new prose contain no em dash.
- R-03 PASS: `layout-checks.json` records both auth modes at 320, 390, 768 and 1280 in both requested themes; `breakpoint-checks.json` adds 360, 520, 600, 759, 760 and 1024. No horizontal clipping is used to conceal overflow.
- R-17 PASS: the existing demo state supplies book, streak and page count; the visible sample-activity attribution is preserved.
- R-18 PASS: no testimonials, identities or avatars were added.
- R-23 PASS: no visual asset was created; the existing published cover and shared CoverImage fallback remain.
- R-24 PASS: the unchanged demo link points to `?demo=1#/today`; the existing demo-navigation browser check passes.
- R-25 PASS: `contrast.txt` contains 144 groups across six themes and twelve states, including hover, pending and errors; minimum 9.109:1.
- R-26 PASS: `interaction-checks.json` records keyboard, hover and active on inputs, Show, primary, reset, account switch and demo link; existing e2e exercises the demo destination and real account lifecycle.
- R-27 PASS: passing auth tests cover native required fields, request pending, reset guidance/failure/success, sign-in failure/retry, strength, mismatch, confirmation, storage denial and missing-cover fallback.
- R-28 PASS: no FAQ exists on this surface.
- R-32 PASS: seven controls retain DOM Tab order and 2px accent focus; Show/Hide, mode heading focus, mismatch/recovery and demo keyboard navigation pass.
- R-33 PASS: changes are authored directly in TSX and CSS; the evidence script measures and captures the app without rewriting its source.
- R-34 PASS: both requested themes are captured; the existing six-theme contrast and settings persistence tests pass.
- R-35 PASS: app run in system Chromium; Biome, TypeScript, production build, 222 unit tests and database smoke pass. Browser checks run without skips. The one incompatible acceptance assertion is disclosed above.
- R-36 PASS: no new performance, security, compliance or customer claim was added.
- R-37 PASS: DESIGN.md and the explicit #62 direction were read before editing; Design Read was declared before generation.
- R-38 PASS: existing published artwork and explicitly labeled sample activity remain the only reading-record content.

### Purpose-Gate evidence

- R-01 PASS: only the gutter uses a gradient; its top and bottom are both zero and span the whole object.
- R-04 PASS: no icons were added.
- R-06 PASS: type roles and the 10px printed label are explained in the Design Read; no new family was added.
- R-07 PASS: no background pattern or grid was added.
- R-08 PASS: no arrows were added.
- R-09 PASS: no badges or pills were added.
- R-10 PASS: no glass or blur was added.
- R-12 PASS: cover shadow and exposed-leaf shadows were removed; the fold alone supplies depth.
- R-13 PASS: no glow exists.
- R-14 PASS: no feature-card layout exists.
- R-19 PASS: existing request/strength feedback communicates state; reduced motion still removes it, as verified by the passing e2e state tests.
- R-22 PASS: no illustration was added; real published artwork remains.

### Liveliness evidence

- Dials PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 are explicit and match the quiet form, distinct reading inset and restrained state feedback.
- Focal point PASS: the ink primary anchors the sign-in task.
- Whitespace PASS: margins distinguish the running head, introduction, fields, sample record and foot; above-headline spacing exceeds below-headline spacing.
- Accent PASS: the active theme accent supplies focus, hover and active cues, plus the existing today mark and strength feedback.
- Motif PASS: printed page furniture repeats in both responsive presentations.
- Design Read PASS: declared before edits and recorded above.

### Craftsmanship and quality locks evidence

- C-1 / R-31 PASS: material, type, color, spacing and layout reasons are recorded above.
- C-2 PASS: existing handlers remain intact; interaction checks and passing browser auth flows exercise the controls.
- C-3 / R-05 PASS: every region serves the requested form, sample reading record or book furniture; no template filler was added.
- C-4 PASS: both auth modes, phone and desktop, six theme contrast checks, keyboard, pending/error states, denied storage and failed artwork are exercised.
- C-5 PASS: sample provenance and saved demo activity remain explicit and data-backed.
- R-11 PASS: square page/cover geometry and the existing input radius are retained; no pills.
- R-15 / R-16 PASS: existing action copy remains specific; no marketing copy or claims were introduced.
- R-20 / R-30 PASS: the requested book spread and published Bumi Manusia cover retain Quire's reading identity.
- R-21 / R-29 PASS: the six existing themes and semantic palette remain; no new theme switch or colors were introduced.

## Verification and evidence

`node docs/evidence/auth-polish2/verify.mjs` passes: 16 mode/theme/viewport layouts, 20 captures, 48px controls, at least 8px vertical gaps, and primary action visible without scrolling at 320x640 in both modes. Sign in occupies y408-456; Create account occupies y560-608. The full phone page can scroll to reveal the reading inset and foot.

Desktop checks assert equal page widths and heights, matching 40px vertical padding, folio text bottoms, one-pixel outer edges, continuous fold bounds, 180px flat cover, and 8px block offsets. The extra breakpoint check confirms the phone layout through 759px and desktop from 760px.

The mechanical detector reports only two advisories: 10px phone count copy and 16px phone numerals sit outside DESIGN.md's older type ramp. They intentionally match the compact printed inset and remain above the measured contrast target. `design-detector.json` preserves the scan. The source does not introduce a new type family or palette role.

The capture script excludes only the existing `/favicon.ico` 404 from console errors; it fails on other console errors or page exceptions. This pre-existing missing favicon is outside the owned auth files.

The sole repository-gate failure is the old `the open book reflows to a verso and paper sliver without overflow` test. It requires the recto to sit beside the verso, have width 10px below 768px, and hide `.auth-reading-record`. Its later assertions also require the old corner fold. #62 instead requires a visible inset inside the page below 760px. These requirements cannot both hold. The protected test needs a separate authorized update to the new layout contract before the required 21/21 result is possible.

Gate-generated older auth-book captures were backed up and restored byte-for-byte to their pre-session state. Protected `src/features/demo/**` and `tests/e2e/**` files were verified unchanged against pre-gate checksums, including the user's existing edits. Only the three owned auth files and this new evidence directory are included in the commit.

Evidence index: [README.md](README.md). Branch: `feat/auth-polish2`. Local commit only; no merge, push, or remote PR.
