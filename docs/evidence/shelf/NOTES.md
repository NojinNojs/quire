# Shelf screen evidence

Implemented on `feat/shelf-screen` for task #4. The route is left for the integration worker.
All changes are inside the three owned paths. The pre-existing untracked `BRIEF.md` is excluded.

## Integration

Import `ShelfScreen` and `ShelfScreenProps` from `src/features/shelf`.
Pass `books: Book[]`, `onAddBook()` and `onSelectBook(book)`.
Optional props are `loading`, `error` and `onRetry()`.
The component imports its own stylesheet and expects the existing global fonts, tokens, themes and
app styles. It performs no data access. The route should load books with `listBooks` from
`src/data/books.ts`, then pass the results and loading/error state into the component.

Grouping reuses `groupByClass` and `classify`, preserving the incoming order of groups and editions.
All valid DDC classes work; classes without a shipped colour token fall back to `--class-000`.
Status, language and text filters intersect. Text searches title, author, publisher, ISBN and year;
leading/trailing whitespace is ignored. The count reports visible editions, and each nonempty filter
contributes one to the active filter count. Null or empty languages can be filtered as Unknown.
Unknown page counts render `Pages unknown`, with no numeric denominator or percentage.

The shared states directory supplies `SkeletonRows` and `ErrorPanel`, both reused here. It has no
empty-state component, so the shelf implements the existing one-sentence, one-action empty pattern
locally. An empty library offers Add a book; no filter matches offers Clear filters. Loading hides
stale book rows and the empty state. Errors suppress the empty state and offer retry when supplied.

## Styling

Row covers use `clothFor(editionKey(book))`, independent of classification. There are no jacket
colour tokens in the current design system. The five cloth results therefore map to existing
semantic surface/ink/accent pairs in shelf CSS; no new raw colours or class colours are used for
jackets. `--shelf-cloth` and `--shelf-jacket-ink` are local aliases for the edition-selected jacket
background and foreground.

Bands use the existing 22px type token at weight 700, consistently across themes. This qualifies
as large text and keeps the existing class palettes accessible at their measured contrast ratios
(3.49:1 minimum, Oxford light philosophy). Bands remain exactly 44px high. The existing 15px band
text would fail normal-text contrast on that palette and on dark literature bands.
Inputs use `--ink-muted` borders for visible boundaries and a token-based 2px focus outline.
Radii use `--radius-input` (2px); all dimensions and colours reference existing tokens.

## Reproduce

The root package files were not changed. Install the feature-local test dependencies once after
checkout, using the committed lockfile:

```sh
npm ci --prefix src/features/shelf --ignore-scripts
npm run gate
```

The local `.npmrc` disables automatic peer installation so React and React DOM resolve to the app's
existing copies. Testing Library, its DOM peer and jsdom are isolated under the owned shelf folder.
Seven Testing Library tests exercise grouping, intersecting filters and reset, empty library,
unknown page counts, loading, edition selection/error recovery and unknown language filtering.

For the isolated screenshot preview:

```sh
npm run dev -- --host 127.0.0.1 --port 5184
```

Open `http://127.0.0.1:5184/src/features/shelf/evidence/preview.html` at 390px wide.
The preview uses clearly marked illustrative edition fixtures, not a signed-in reader's data.
It invokes visible alert callbacks so its book and add controls can be checked without route wiring.

## Evidence and validation

- [390px screenshot](../../../src/features/shelf/evidence/shelf-390.png): shelf light, 390 by 1250,
  four groups including Unclassified and five editions.
- [Gate output](../../../src/features/shelf/evidence/gate-output.txt): `gate ok`; 80 unit tests,
  database smoke checks and four browser smoke tests passed.
- Browser measurements: viewport/document width 390/390; every band and select 44px high;
  covers 48 by 72. No horizontal overflow across all six themes. Keyboard begins at Add book;
  focused search input has a 2px outline. The browser combined-filter check yielded one book and
  three active filters. No browser runtime errors.
- Checked the screenshot against the existing design system: serif italic book titles, edition
  jackets, classification colour bands, hairlines, English copy, no em dashes or elevated cards.
- Impeccable's mechanical detector returned no findings for the component and stylesheet.
- The consistency/verify Python scripts referenced by `docs/DESIGN_SYSTEM.md` are not present in
  this checkout. The required repository gate ran successfully instead.

The repository's four browser smoke tests cover existing routes. Shelf interaction coverage comes
from the seven new Testing Library tests and the isolated browser preview, pending route wiring.
