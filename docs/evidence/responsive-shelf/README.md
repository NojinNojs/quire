# Responsive shelf evidence

Branch: `feat/responsive-shelf`, issue #47.

These captures render the production `ShelfScreen` with six illustrative literature editions and a single philosophy edition. The first book uses an actual Open Library image; its edition metadata is test fixture data. The other books use the production printed-jacket fallback. No database or user account is required.

The preview uses the production `AppShell` with a local `--shell-width: 100%` override. On this base, `src/styles/integration.css` still limits routed screens to `--shell-width: 390px`. Expanding that shared shell and implementing its tablet rail belong to `feat/responsive-shell`. No shared shell, navigation, cover, App, or package files were changed here. The automated checks also reserve 64px beside the shelf to simulate the tablet rail's occupied width, then verify four columns fit. This is a component check, not a capture of the future rail implementation.

## Captures

- `grid-{shelf-light,oxford-dark}-{390,768,1280}.png`: real-cover caption, printed jackets, six-book group and single-book group at every requested evidence width.
- `list-{shelf-light,oxford-dark}-{768,1280}.png`: aligned title and author, then publisher, year, pages and status in mono, aligned right.
- `{empty,loading,error,error-no-retry}-{shelf-light,oxford-dark}-1280.png`: full-width state treatments, including errors with and without a retry callback.
- `checks.json`: measured browser results and interaction checks.
- `gate-output.txt`: complete `npm run gate` output.

Screenshots use system Brave (Chromium) with emulated viewport widths. Before each capture the viewport height expands to fit the full screen, so the fixed navigation remains below all content. Navigation clearance is separately checked at a normal 844px viewport height after scrolling to the last row. These are browser screenshots without compositing. Physical touch devices and Safari were not tested.

## Verification

The capture checks all six themes at 320, 390, 479, 480, 767, 768, 1023, 1024, 1279, 1280 and 1600px. It verifies exact column counts, no horizontal overflow, a 180px jacket maximum, equal jacket widths in populated and single-book groups, rotated phone labels and flat desktop labels, captions below real covers and hidden for printed jackets, 4px bookmarks and bottom navigation clearance.

At 768 and 1280 it measures each list field's position, font and alignment across every record. Canvas resolves the actual theme colors before WCAG luminance calculations: text on paper, all ten class-label inks, and every printed cloth color present in the fixture exceed 7:1 in each theme. The lowest measured ratio is 9.10:1. The unchanged source artwork has its own printed text and is not included in that UI-text measurement.

Browser interactions exercised:

1. Add book invokes the add callback.
2. A printed jacket selects its exact edition.
3. A real-cover caption selects its exact edition.
4. Status, language and search combine; Clear filters restores seven books.
5. The view toggle works by keyboard, has visible focus and persists after reload.
6. A failed cover image becomes a printed jacket and hides its caption.
7. Empty-shelf Add a book invokes the add callback.
8. Load-error Try again invokes the retry callback.
9. Empty Today fills the available width and Browse catalogue invokes its callback.

All 85 layout, contrast and list checks, 12 state checks and nine interaction checks passed without page errors. The gate includes 185 passing unit tests, database smoke checks and eight passing browser smoke tests. Biome reports five existing CSS specificity warnings. The Impeccable mechanical detector returned no findings for the changed production component and styles.

## Design decisions

- Fixed column counts preserve scanning rhythm and keep sparse groups aligned; the jacket width token caps editions at 180px.
- Phone labels use the existing page gutter to return width to jackets; flat labels from 768px make groups easier to scan across a broad shelf.
- Class number in mono and class name in Newsreader italic retain the catalogue identity. The class ink mixes toward the existing theme ink for contrast.
- Each jacket row shares grid tracks for jackets, shelf rules and captions. Images and printed jackets stand on the same rule; only real covers need a separate title and publication caption.
- Desktop list metadata shares columns through CSS subgrid; visible underlined title buttons work without hover.
- Bottom padding reserves the navigation height, spacing token and safe-area inset. State regions span the available shelf width; loading follows the same column counts as real jackets.
- Today changes cover only bottom safe-area spacing and the empty state. Its active-book layout remains owned by the shell branch.

## Reproduce

From the repository root, start Vite in one terminal:

```sh
npm run dev -- --host 127.0.0.1 --port 5197 --strictPort
```

Then run:

```sh
curl -L --fail 'https://covers.openlibrary.org/b/id/12645114-L.jpg?default=false' -o /tmp/quire-responsive-cover.jpg
node src/features/shelf/evidence/capture-responsive.mjs
npm run gate > docs/evidence/responsive-shelf/gate-output.txt 2>&1
```

`SHELF_PREVIEW_ORIGIN` and `SHELF_COVER_FILE` can override the preview origin and downloaded cover path.
