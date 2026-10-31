# Antislop delivery gate

PASS. Reviewed 2026-10-31 against the user's explicit auth direction. Evidence is the nine adjacent screenshots, `gate.txt`, and `tests/e2e/auth.spec.ts`. Independent finish review: ship, no material fixes.

## Hard gate

- R-02 PASS: rendered auth copy contains no em dash.
- R-03 PASS: browser assertions find no horizontal scroll at 320, 390, 768, 960, 1024 and 1440, in both auth modes. Mobile submit buttons remain above the fold.
- R-17 PASS: no statistics are rendered.
- R-18 PASS: no testimonials or fictional people are rendered.
- R-23 PASS: only the requested bundled covers are reused; no new visual assets or navigation are invented.
- R-24 PASS: the sole auth link opens the existing interactive demo at `?demo=1#/today`.
- R-25 PASS: the browser samples every visible text node in the entire form column, including nested link text, strength, errors, statuses, input text, placeholders and the foot line. Every sample passes 7:1 in all six themes.
- R-26 PASS: live signup, sign in and sign out pass; reset, reveal, mode switch, retry and demo have tested actions.
- R-27 PASS: empty required fields retain browser validation; pending labels and moving rule, inline errors, reset success and email confirmation are exercised.
- R-28 PASS: no FAQ is rendered.
- R-32 PASS: browser tests traverse every sign-in control with Tab, operate controls with Enter, check focus indicators and close the guide with Escape.
- R-33 PASS: changes are authored React and CSS source, with no runtime patching.
- R-34 PASS: all six palettes pass the text sampler. Shelf light and Oxford dark have sign-in and signup captures at phone and desktop sizes.
- R-35 PASS: the running app passes all eight auth browser tests and the full gate. Screenshots wait for fonts and image decoding, and all nine files were opened for visual inspection.
- R-36 PASS: copy comes from the supplied brief or preserved auth feedback. No security certification, customer or performance claim was added.
- R-37 PASS: the user's precise references, composition, measures and copy replace the old photo direction.
- R-38 PASS: published jackets are bundled product content; no fabricated proof is rendered.

## Purpose gate

- R-01 PASS: no gradients or glows.
- R-04 PASS: no decorative icons.
- R-06 PASS: Newsreader gives the requested literary introduction; sans keeps the task legible; small mono labels borrow the supplied borrower-card identity.
- R-07 PASS: the cover grid organizes real jackets; continuous rules give each row a shelf. There is no background pattern.
- R-08 PASS: no decorative arrows.
- R-09 PASS: no capsule badges.
- R-10 PASS: no glass treatment.
- R-12 PASS: no shadows or floating containers.
- R-13 PASS: no glow effects.
- R-14 PASS: there are no feature cards. Jackets retain natural aspect ratios and varied widths.
- R-19 PASS: motion only communicates pending work and password strength. The pending rule and strength transition stop under reduced motion.
- R-22 PASS: actual product jackets supply imagery; there are no generic illustrations.

## Liveliness

- Dials PASS: ENERGY 2 / RHYTHM 2 / MOTION 1. Restrained paper and type, varying jacket heights, one functional moving rule.
- Consistency PASS: screenshots show the quiet form and denser cover wall; motion does not animate the composition.
- Focus PASS: the serif introduction establishes identity and the filled submit button identifies the task.
- Space PASS: intro, form, account actions, demo and foot are distinct groups; desktop tracks use the requested 46/54 split.
- Accent PASS: class color marks the jacket feet, focused field and password feedback; primary text remains ink.
- Identity PASS: real book jackets, mono borrower labels, serif introduction and thin shelf rules form a reading-specific vocabulary.
- Design read PASS: the supplied brief fixed the visual direction before implementation; no independent concept selection was needed.

## Craftsmanship and quality locks

- C-1 PASS: jackets show the actual library; rules connect the form to the shelf; typography separates identity, action and labels.
- C-2 PASS: every interactive auth element has an exercised action in the unit or browser suite.
- C-3 PASS: only the requested introduction, form, recovery/account actions, demo, privacy foot and cover wall remain.
- C-4 PASS: empty, pending, error, mismatch, success and confirmation states pass, along with keyboard, reduced motion, all six themes and the specified widths.
- C-5 PASS: covers are existing published artwork, copy is supplied or preserved, and no social proof is invented.
- R-05 PASS: narrow form and dense wall follow the explicit composition; mobile reorders the wall below the complete form.
- R-11 PASS: inputs are square, the primary uses the existing 3px radius token, and no pills are introduced.
- R-15 PASS: controls name sign in, account creation, password recovery, password visibility and demo entry.
- R-16 PASS: no marketing buzzwords were added.
- R-20 PASS: the actual bundled jackets and classification strips identify Quire's reading library beyond its name.
- R-21 PASS: authentication follows the saved palette rather than forcing a light or dark theme.
- R-29 PASS: surfaces and controls use theme tokens; published artwork remains intact and classification colors retain their established meaning.
- R-30 PASS: the named references contribute quiet, split composition and restraint; their branding and components are not copied.
- R-31 PASS: visual decisions map directly to the supplied form, wall and responsive requirements, documented in README.md.

The requested 55% ink foot treatment would fall below 7:1. The existing accessible secondary-ink token is used instead. The foot remains 10px mono. Global DESIGN.md and the earlier auth brief still describe the superseded photograph; those documents are outside the authorized write scope.
