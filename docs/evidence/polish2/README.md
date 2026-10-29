# Shelf line, Today panes, and shelf filters

Branch: `feat/shelf-line-two-pane`.

The implementation follows [the bookshelf direction](../../DIRECTION_BOOKSHELF.md).
Design dials: ENERGY 1, RHYTHM 2, MOTION 1. Jackets and their class inks remain the
focal point; full shelf rules and the stamped reading record carry the furniture identity.

- A DOM shelf line starts each occupied grid row and uses the group's container width,
  so unoccupied tracks still have a shelf. List jackets stand 8px above the same rule.
- At 1024px, Today puts the jacket and upload control beside the reading controls and
  record, with a 32px gutter and a bounded reading measure. The phone record stays beside
  its jacket; CSS exposes exactly one record at each width, including to assistive technology.
- Filters use the existing mono face for catalogue labels and values. A 40px control,
  1px ink border, 10px CSS chevron, and 44px option rows replace the platform dropdown.
  The listbox uses the ink and paper tokens for both normal and active options.
- Class labels mix more ink into their existing class colour, and bookmark numbers and
  weekday letters use the ink token, preserving at least 7:1 text contrast in every theme.

## Screenshots

Both class groups are visible in the full shelf captures. Separate crops make the one-book
and six-book cases easy to compare. Full-page captures extend viewport height to keep the
fixed navigation from covering the middle of the evidence; widths remain 390 and 1280.

| Surface | 390 | 1280 |
| --- | --- | --- |
| Grid | [Full shelf](shelf-grid-390.png) | [Full shelf](shelf-grid-1280.png) |
| One book | [Group](one-book-390.png) | [Group](one-book-1280.png) |
| Six books | [Group](six-books-390.png) | [Group](six-books-1280.png) |
| List | [Full shelf](shelf-list-390.png) | [Full shelf](shelf-list-1280.png) |
| Today | [One column](today-390.png) | [Two panes](today-1280.png) |

[Dropdown open at 390](dropdown-open-390.png), [Today at 768](today-768.png).

## Verification

- [Gate output](gate-output.txt): Biome, TypeScript, 192 unit tests, production build,
  live local database checks, and all 12 end-to-end tests pass. Biome reports existing
  specificity warnings and two additional warnings for the separate grid/list selectors.
- [Browser checks](browser-checks.json): 54 layouts and 72 visible-text contrast scans
  across all six themes at 390, 768, and 1280. The minimum measured text contrast exceeds
  9:1. Additional widths verify the Today switch at 1023/1024.
- Geometry assertions verify each visible shelf line spans its group, jackets retain the
  same width in a one-book group, the gap above the rule is 8px, Today panes share their
  top edge, and the pane gutter is 32px. No horizontal overflow or console errors.
- Status: pointer opens the listbox; Arrow/Home/End navigate; Enter commits and filters;
  Escape cancels; Tab, blur, and outside press dismiss. Unit tests inject the change handler
  and verify it fires once with the selected value while focus stays on the control.
- Language: pointer selection filters to the exact language. Search with no matches offers
  Clear filters, restoring all editions. Grid/List switch and persist. Add book, jacket,
  and retry buttons delegate their exact actions. Loading/empty/error states suppress stale groups.
- Today: +10 changes the preview, Log disables pending controls, and Undo restores progress.
  The native upload input is enabled after mocked metadata loads; no file is uploaded.
  The gate also verifies keyboard focus, reduced motion, and long titles in the real shell.
- The Impeccable mechanical detector reported no findings for the changed UI.

The isolated preview uses illustrative editions and reading history, injected logging,
and intercepted cover metadata/progress requests. The gate uses the live local Supabase
stack. Screenshot fixtures do not represent a production library.

To reproduce the component evidence, start Vite on port 5197, then run:

```sh
npm run dev -- --host 127.0.0.1 --port 5197 --strictPort
node src/features/shelf/evidence/capture-polish2.mjs
```
